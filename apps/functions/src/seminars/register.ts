/**
 * Public seminar registration + admin approve/reject.
 */

import { randomBytes } from "node:crypto";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { WEB_ORIGIN, getLoginChannelId } from "../config";
import { verifyLineIdToken } from "../line/verify-id-token";
import { pushMessages } from "../line/client";
import { textMessage } from "../line/messages";
import {
  MEMBERS_COLLECTION,
  findMemberByLineUserId,
} from "../members/repository";
import {
  getRegistration,
  getSeminar,
  listActiveSeminars,
  listAllSeminars,
  listRegistrations,
  saveRegistration,
  upsertSeminar,
} from "./repository";
import {
  SEMINAR_PRICING_LABEL,
  type SeminarDoc,
  type SeminarPricingType,
  type SeminarRegistrationDoc,
} from "./types";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png"]);

async function optionalLineUser(
  idToken?: string,
): Promise<string | undefined> {
  if (!idToken?.trim()) return undefined;
  const channelId = getLoginChannelId();
  if (!channelId) return undefined;
  try {
    const v = await verifyLineIdToken(idToken.trim(), channelId);
    return v.userId;
  } catch {
    return undefined;
  }
}

function decodeSlip(base64: string): Buffer {
  const cleaned = base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  return Buffer.from(cleaned, "base64");
}

async function uploadSlip(
  registrationId: string,
  contentType: string,
  slipBuf: Buffer,
): Promise<string> {
  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `seminar-slips/${registrationId}/${Date.now()}.${ext}`;
  const bucket = getStorage().bucket();
  await bucket.file(path).save(slipBuf, {
    contentType,
    metadata: { cacheControl: "private, max-age=0" },
    resumable: false,
  });
  return `gs://${bucket.name}/${path}`;
}

function resolveApplicantType(
  seminar: SeminarDoc,
  isMember: boolean,
  requested?: string,
): SeminarPricingType {
  const raw = (requested ?? "").trim() as SeminarPricingType;
  if (raw === "public_paid" || raw === "member_free" || raw === "member_paid") {
    if (seminar.pricing[raw] !== undefined) return raw;
  }
  if (isMember && seminar.pricing.member_free !== undefined) return "member_free";
  if (isMember && seminar.pricing.member_paid !== undefined) return "member_paid";
  return "public_paid";
}

export async function publicListSeminars() {
  let items = await listActiveSeminars();
  if (items.length === 0) {
    // Seed one demo event so Phase 1 UI is testable out of the box.
    const seminarId = `SEM-${new Date().getFullYear()}-DEMO`;
    const demo: SeminarDoc = {
      seminarId,
      title: "สัมมนาตัวอย่าง ABTA",
      description: "งานตัวอย่างสำหรับทดสอบระบบ — แก้ไข/ปิดได้จาก Back Office",
      eventDate: `${new Date().getFullYear()}-09-15`,
      location: "กรุงเทพฯ",
      pricing: { public_paid: 500, member_free: 0, member_paid: 300 },
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await upsertSeminar(demo);
    items = [demo];
  }
  return items.map(publicSeminar);
}

function publicSeminar(s: SeminarDoc) {
  return {
    seminarId: s.seminarId,
    title: s.title,
    description: s.description,
    eventDate: s.eventDate,
    location: s.location,
    pricing: s.pricing,
    pricingLabels: SEMINAR_PRICING_LABEL,
  };
}

export async function registerForSeminar(input: {
  idToken?: string;
  seminarId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  applicantType?: string;
  shirtSize?: string;
  foodType?: string;
  notes?: string;
  slipContentType?: string;
  slipBase64?: string;
}): Promise<
  | { ok: true; registrationId: string; feeThb: number; status: string }
  | { ok: false; error: string; status: number }
> {
  const seminarId = input.seminarId.trim();
  const seminar = await getSeminar(seminarId);
  if (!seminar || !seminar.active) {
    return { ok: false, error: "seminar_not_found", status: 404 };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone.trim();
  if (!firstName || !lastName || !phone) {
    return { ok: false, error: "required_fields_missing", status: 400 };
  }

  const lineUserId = await optionalLineUser(input.idToken);
  const member = lineUserId
    ? await findMemberByLineUserId(lineUserId)
    : undefined;
  const isMember = Boolean(
    member &&
      member.status !== "expired" &&
      member.dataReviewStatus !== "rejected",
  );

  const applicantType = resolveApplicantType(
    seminar,
    isMember,
    input.applicantType,
  );
  if (!isMember && applicantType !== "public_paid") {
    return { ok: false, error: "member_required", status: 403 };
  }

  const feeThb = Number(seminar.pricing[applicantType] ?? 0) || 0;
  const needsSlip = feeThb > 0;
  let slipUrl: string | undefined;

  const registrationId = `SR-${seminarId}-${Date.now()}-${randomBytes(2).toString("hex")}`;

  if (needsSlip) {
    const contentType = (input.slipContentType || "").toLowerCase();
    if (!ALLOWED.has(contentType) || !input.slipBase64) {
      return { ok: false, error: "slip_required", status: 400 };
    }
    let buf: Buffer;
    try {
      buf = decodeSlip(input.slipBase64);
    } catch {
      return { ok: false, error: "invalid_slip_data", status: 400 };
    }
    if (!buf.length || buf.length > MAX_SLIP_BYTES) {
      return { ok: false, error: "invalid_slip_data", status: 400 };
    }
    try {
      slipUrl = await uploadSlip(registrationId, contentType, buf);
    } catch (err) {
      console.error("seminar slip upload failed", err);
      return { ok: false, error: "slip_upload_failed", status: 500 };
    }
  }

  const now = Timestamp.now();
  const reg: SeminarRegistrationDoc = {
    registrationId,
    seminarId,
    memberId: member?.memberId,
    lineUserId,
    firstName: member?.firstName ?? firstName,
    lastName: member?.lastName ?? lastName,
    phone: member?.phone ?? phone,
    email: input.email?.trim() || member?.email,
    applicantType,
    feeThb,
    shirtSize: input.shirtSize?.trim() || undefined,
    foodType: input.foodType?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    slipUrl,
    status: needsSlip ? "paid" : "registered",
    createdAt: now,
    updatedAt: now,
  };
  await saveRegistration(reg);

  if (lineUserId) {
    try {
      await pushMessages(lineUserId, [
        textMessage(
          [
            "✅ รับสมัครสัมมนาแล้ว",
            seminar.title,
            `ประเภท: ${SEMINAR_PRICING_LABEL[applicantType]}`,
            feeThb > 0 ? `ค่าลงทะเบียน: ${feeThb} บาท` : "ไม่เสียค่าลงทะเบียน",
            "",
            "รอเจ้าหน้าที่ยืนยันสิทธิ์ครับ",
          ].join("\n"),
        ),
      ]);
    } catch (err) {
      console.error("seminar register notify failed", err);
    }
  }

  return {
    ok: true,
    registrationId,
    feeThb,
    status: reg.status,
  };
}

export async function adminListSeminars() {
  return listAllSeminars();
}

export async function adminCreateSeminar(input: {
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  publicPaid?: number;
  memberFree?: number;
  memberPaid?: number;
}): Promise<SeminarDoc> {
  const title = input.title.trim();
  if (!title) throw Object.assign(new Error("title_required"), { status: 400 });
  const seminarId = `SEM-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const pricing: SeminarDoc["pricing"] = {};
  if (input.publicPaid != null) pricing.public_paid = Number(input.publicPaid) || 0;
  if (input.memberFree != null) pricing.member_free = Number(input.memberFree) || 0;
  if (input.memberPaid != null) pricing.member_paid = Number(input.memberPaid) || 0;
  if (Object.keys(pricing).length === 0) {
    pricing.public_paid = 500;
    pricing.member_free = 0;
  }
  const doc: SeminarDoc = {
    seminarId,
    title,
    description: input.description?.trim() || undefined,
    eventDate: input.eventDate?.trim() || undefined,
    location: input.location?.trim() || undefined,
    pricing,
    active: true,
  };
  await upsertSeminar(doc);
  return doc;
}

export async function adminListRegistrations(seminarId?: string) {
  return listRegistrations(seminarId);
}

export async function adminDecideRegistration(input: {
  registrationId: string;
  approve: boolean;
  reason?: string;
}): Promise<
  | { ok: true; registrationId: string; status: string }
  | { ok: false; error: string; status: number }
> {
  const reg = await getRegistration(input.registrationId);
  if (!reg) return { ok: false, error: "not_found", status: 404 };
  const seminar = await getSeminar(reg.seminarId);
  const now = Timestamp.now();

  if (input.approve) {
    reg.status = "confirmed";
    reg.rejectReason = undefined;
    reg.updatedAt = now;
    await saveRegistration(reg);

    if (reg.memberId) {
      await getFirestore()
        .collection(MEMBERS_COLLECTION)
        .doc(reg.memberId)
        .set(
          {
            seminarStatus: "confirmed",
            seminarTitle: seminar?.title ?? reg.seminarId,
            updatedAt: now,
          },
          { merge: true },
        );
    }

    if (reg.lineUserId) {
      try {
        await pushMessages(reg.lineUserId, [
          textMessage(
            [
              "✅ ยืนยันสิทธิ์สัมมนาแล้ว",
              seminar?.title ?? reg.seminarId,
              `ดูสถานะสมาชิก: ${WEB_ORIGIN}/status`,
            ].join("\n"),
          ),
        ]);
      } catch (err) {
        console.error("seminar confirm notify failed", err);
      }
    }
  } else {
    const reason = (input.reason ?? "").trim();
    if (!reason) return { ok: false, error: "reason_required", status: 400 };
    reg.status = "rejected";
    reg.rejectReason = reason;
    reg.updatedAt = now;
    await saveRegistration(reg);
    if (reg.lineUserId) {
      try {
        await pushMessages(reg.lineUserId, [
          textMessage(
            [
              "❌ สมัครสัมมนาไม่ผ่าน",
              seminar?.title ?? reg.seminarId,
              `เหตุผล: ${reason}`,
            ].join("\n"),
          ),
        ]);
      } catch (err) {
        console.error("seminar reject notify failed", err);
      }
    }
  }

  return { ok: true, registrationId: reg.registrationId, status: reg.status };
}
