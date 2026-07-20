/**
 * New member registration: verify LINE ID token, store slip, create member + payment.
 * Rejected applicants may edit and resubmit on the same temporary member record.
 */

import { randomBytes } from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { MEMBERSHIP_FEE_THB, WEB_ORIGIN, getLoginChannelId } from "../config";
import { verifyLineIdToken } from "../line/verify-id-token";
import { pushMessages } from "../line/client";
import { registrationConfirmFlex, staffNewRegistrationText } from "../line/messages";
import { allocateTempMemberId } from "./ids";
import {
  MEMBERS_COLLECTION,
  PAYMENTS_COLLECTION,
  findLatestPayment,
  findMemberByLineUserId,
} from "./repository";
import type { MemberDoc, PaymentDoc } from "./types";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED_SLIP_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

export interface RegisterInput {
  idToken: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  legalEntityName?: string;
  buildingName?: string;
  slipContentType: string;
  slipBase64: string;
}

export type RegisterResult =
  | {
      ok: true;
      memberId: string;
      publicToken: string;
      statusUrl: string;
      memberCardUrl: string;
      feeThb: number;
      expiryDate: string;
      resubmitted?: boolean;
    }
  | { ok: false; error: string; status: number };

export type RegisterDraftResult =
  | { ok: true; mode: "new" }
  | {
      ok: true;
      mode: "resubmit";
      memberId: string;
      rejectReason?: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      legalEntityName?: string;
      buildingName?: string;
    }
  | { ok: false; error: string; status: number };

function publicToken(): string {
  return randomBytes(6).toString("hex");
}

function addOneCalendarYear(from: Date): Date {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function staffIds(): string[] {
  const raw = process.env.STAFF_LINE_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function decodeSlip(base64: string): Buffer {
  const cleaned = base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  return Buffer.from(cleaned, "base64");
}

function optionalTrim(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

async function verifyLineUser(idToken: string): Promise<
  | { ok: true; lineUserId: string }
  | { ok: false; error: string; status: number }
> {
  if (!idToken?.trim()) {
    return { ok: false, error: "id_token_required", status: 400 };
  }
  const loginChannelId = getLoginChannelId();
  if (!loginChannelId) {
    console.error("LINE_LOGIN_CHANNEL_ID is not set");
    return { ok: false, error: "server_misconfigured", status: 500 };
  }
  try {
    const verified = await verifyLineIdToken(idToken.trim(), loginChannelId);
    return { ok: true, lineUserId: verified.userId };
  } catch (err) {
    console.warn("LINE id token verify failed", err);
    return { ok: false, error: "invalid_id_token", status: 401 };
  }
}

function validateSlip(
  contentTypeRaw: string,
  slipBase64: string,
):
  | { ok: true; contentType: string; slipBuf: Buffer }
  | { ok: false; error: string; status: number } {
  const contentType = (contentTypeRaw || "").toLowerCase();
  if (!ALLOWED_SLIP_TYPES.has(contentType)) {
    return { ok: false, error: "invalid_slip_type", status: 400 };
  }

  let slipBuf: Buffer;
  try {
    slipBuf = decodeSlip(slipBase64 || "");
  } catch {
    return { ok: false, error: "invalid_slip_data", status: 400 };
  }
  if (!slipBuf.length) {
    return { ok: false, error: "slip_required", status: 400 };
  }
  if (slipBuf.length > MAX_SLIP_BYTES) {
    return { ok: false, error: "slip_too_large", status: 400 };
  }
  return { ok: true, contentType, slipBuf };
}

async function uploadSlip(
  memberId: string,
  contentType: string,
  slipBuf: Buffer,
): Promise<{ ok: true; slipUrl: string } | { ok: false; error: string; status: number }> {
  const ext = contentType.includes("png") ? "png" : "jpg";
  const slipPath = `slips/${memberId}/${Date.now()}.${ext}`;
  const bucket = getStorage().bucket();
  const file = bucket.file(slipPath);
  try {
    await file.save(slipBuf, {
      contentType,
      metadata: { cacheControl: "private, max-age=0" },
      resumable: false,
    });
  } catch (err) {
    console.error("slip upload failed", err);
    return { ok: false, error: "slip_upload_failed", status: 500 };
  }
  return { ok: true, slipUrl: `gs://${bucket.name}/${slipPath}` };
}

async function notifyAfterRegister(opts: {
  lineUserId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  phone: string;
  statusUrl: string;
  resubmitted: boolean;
}): Promise<void> {
  try {
    await pushMessages(opts.lineUserId, [
      registrationConfirmFlex({
        memberId: opts.memberId,
        fullName: `${opts.firstName} ${opts.lastName}`.trim(),
        statusUrl: opts.statusUrl,
        feeThb: MEMBERSHIP_FEE_THB,
      }),
    ]);
  } catch (err) {
    console.error("Failed to push registration confirm", err);
  }

  const staff = staffIds();
  if (staff.length) {
    const text = staffNewRegistrationText({
      memberId: opts.memberId,
      fullName: `${opts.firstName} ${opts.lastName}`.trim(),
      phone: opts.phone,
    });
    await Promise.allSettled(staff.map((id) => pushMessages(id, [text])));
  }
}

/** Prefill payload for LIFF register page (rejected members only). */
export async function getRegisterDraft(idToken: string): Promise<RegisterDraftResult> {
  const verified = await verifyLineUser(idToken);
  if (!verified.ok) return verified;

  const existing = await findMemberByLineUserId(verified.lineUserId);
  if (!existing) return { ok: true, mode: "new" };

  if (existing.dataReviewStatus === "rejected") {
    return {
      ok: true,
      mode: "resubmit",
      memberId: existing.memberId,
      rejectReason: existing.rejectReason,
      firstName: existing.firstName ?? "",
      lastName: existing.lastName ?? "",
      phone: existing.phone ?? "",
      email: existing.email,
      legalEntityName: existing.legalEntityName,
      buildingName: existing.buildingName,
    };
  }

  return { ok: false, error: "already_registered", status: 409 };
}

async function resubmitRejectedMember(
  existing: MemberDoc,
  input: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    legalEntityName?: string;
    buildingName?: string;
    contentType: string;
    slipBuf: Buffer;
  },
): Promise<RegisterResult> {
  const memberId = existing.memberId;
  const token = existing.publicToken ?? publicToken();
  const memberCardUrl =
    existing.memberCardUrl ??
    `${WEB_ORIGIN}/card?m=${encodeURIComponent(memberId)}&t=${token}`;
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(memberId)}&t=${token}`;

  const uploaded = await uploadSlip(memberId, input.contentType, input.slipBuf);
  if (!uploaded.ok) return uploaded;

  const now = new Date();
  const ts = Timestamp.fromDate(now);
  const buildingName = optionalTrim(input.buildingName);
  const legalEntityName = optionalTrim(input.legalEntityName);
  const email = optionalTrim(input.email);

  const payment = await findLatestPayment(memberId);
  const db = getFirestore();
  const batch = db.batch();

  batch.set(
    db.collection(MEMBERS_COLLECTION).doc(memberId),
    omitUndefined({
      firstName: input.firstName,
      lastName: input.lastName,
      legalEntityName,
      buildingName,
      organization: buildingName,
      phone: input.phone,
      email,
      status: "temporary" as const,
      memberCardUrl,
      publicToken: token,
      dataReviewStatus: "pending" as const,
      rejectReason: FieldValue.delete(),
      rejectedBy: FieldValue.delete(),
      updatedAt: ts,
    }),
    { merge: true },
  );

  if (payment) {
    batch.set(
      db.collection(PAYMENTS_COLLECTION).doc(payment.paymentId),
      omitUndefined({
        slipUrl: uploaded.slipUrl,
        amount: MEMBERSHIP_FEE_THB,
        status: "data_review" as const,
        receiptStatus: "none" as const,
        receiptNumber: FieldValue.delete(),
        rejectReason: FieldValue.delete(),
        updatedAt: ts,
      }),
      { merge: true },
    );
  } else {
    const paymentId = `pay_${memberId}_${Date.now()}`;
    const paymentDoc = omitUndefined({
      paymentId,
      memberId,
      receiptStatus: "none",
      slipUrl: uploaded.slipUrl,
      amount: MEMBERSHIP_FEE_THB,
      status: "data_review",
      createdAt: ts,
      updatedAt: ts,
    }) as PaymentDoc;
    batch.set(db.collection(PAYMENTS_COLLECTION).doc(paymentId), paymentDoc);
  }

  await batch.commit();

  if (existing.lineUserId) {
    await notifyAfterRegister({
      lineUserId: existing.lineUserId,
      memberId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      statusUrl,
      resubmitted: true,
    });
  }

  const expiry = existing.expiryDate?.toDate?.() ?? addOneCalendarYear(now);
  return {
    ok: true,
    memberId,
    publicToken: token,
    statusUrl,
    memberCardUrl,
    feeThb: MEMBERSHIP_FEE_THB,
    expiryDate: expiry.toISOString().slice(0, 10),
    resubmitted: true,
  };
}

export async function registerNewMember(input: RegisterInput): Promise<RegisterResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone.trim();

  if (!firstName || !lastName || !phone) {
    return { ok: false, error: "required_fields_missing", status: 400 };
  }

  const slip = validateSlip(input.slipContentType, input.slipBase64);
  if (!slip.ok) return slip;

  const verified = await verifyLineUser(input.idToken);
  if (!verified.ok) return verified;
  const { lineUserId } = verified;

  const existing = await findMemberByLineUserId(lineUserId);
  if (existing) {
    if (existing.dataReviewStatus === "rejected") {
      return resubmitRejectedMember(existing, {
        firstName,
        lastName,
        phone,
        email: input.email,
        legalEntityName: input.legalEntityName,
        buildingName: input.buildingName,
        contentType: slip.contentType,
        slipBuf: slip.slipBuf,
      });
    }
    return { ok: false, error: "already_registered", status: 409 };
  }

  const now = new Date();
  const memberId = await allocateTempMemberId(now);
  const token = publicToken();
  const expiry = addOneCalendarYear(now);
  const memberCardUrl = `${WEB_ORIGIN}/card?m=${encodeURIComponent(memberId)}&t=${token}`;
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(memberId)}&t=${token}`;

  const uploaded = await uploadSlip(memberId, slip.contentType, slip.slipBuf);
  if (!uploaded.ok) return uploaded;

  const paymentId = `pay_${memberId}_${Date.now()}`;
  const ts = Timestamp.fromDate(now);
  const expiryTs = Timestamp.fromDate(expiry);

  const buildingName = optionalTrim(input.buildingName);
  const legalEntityName = optionalTrim(input.legalEntityName);
  const email = optionalTrim(input.email);

  const member = omitUndefined({
    memberId,
    tempMemberId: memberId,
    firstName,
    lastName,
    legalEntityName,
    buildingName,
    organization: buildingName,
    phone,
    email,
    lineUserId,
    lineLinkedAt: ts,
    linkType: "new_registration",
    status: "temporary",
    memberCardUrl,
    expiryDate: expiryTs,
    dataReviewStatus: "pending",
    seminarStatus: "none",
    publicToken: token,
    createdAt: ts,
    updatedAt: ts,
  }) as MemberDoc;

  const payment = omitUndefined({
    paymentId,
    memberId,
    receiptStatus: "none",
    slipUrl: uploaded.slipUrl,
    amount: MEMBERSHIP_FEE_THB,
    status: "data_review",
    createdAt: ts,
    updatedAt: ts,
  }) as PaymentDoc;

  const db = getFirestore();
  const memberRef = db.collection(MEMBERS_COLLECTION).doc(memberId);
  const idClash = await memberRef.get();
  if (idClash.exists) {
    return { ok: false, error: "member_id_taken", status: 409 };
  }

  const batch = db.batch();
  batch.create(memberRef, member);
  batch.set(db.collection(PAYMENTS_COLLECTION).doc(paymentId), payment);
  await batch.commit();

  await notifyAfterRegister({
    lineUserId,
    memberId,
    firstName,
    lastName,
    phone,
    statusUrl,
    resubmitted: false,
  });

  return {
    ok: true,
    memberId,
    publicToken: token,
    statusUrl,
    memberCardUrl,
    feeThb: MEMBERSHIP_FEE_THB,
    expiryDate: expiry.toISOString().slice(0, 10),
  };
}
