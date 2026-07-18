/**
 * New member registration: verify LINE ID token, store slip, create member + payment.
 */

import { randomBytes } from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { MEMBERSHIP_FEE_THB, WEB_ORIGIN, getLoginChannelId } from "../config";
import { verifyLineIdToken } from "../line/verify-id-token";
import { pushMessages } from "../line/client";
import { registrationConfirmFlex, staffNewRegistrationText } from "../line/messages";
import { allocateTempMemberId } from "./ids";
import {
  MEMBERS_COLLECTION,
  PAYMENTS_COLLECTION,
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

export async function registerNewMember(input: RegisterInput): Promise<RegisterResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone.trim();

  if (!input.idToken?.trim()) {
    return { ok: false, error: "id_token_required", status: 400 };
  }
  if (!firstName || !lastName || !phone) {
    return { ok: false, error: "required_fields_missing", status: 400 };
  }

  const contentType = (input.slipContentType || "").toLowerCase();
  if (!ALLOWED_SLIP_TYPES.has(contentType)) {
    return { ok: false, error: "invalid_slip_type", status: 400 };
  }

  let slipBuf: Buffer;
  try {
    slipBuf = decodeSlip(input.slipBase64 || "");
  } catch {
    return { ok: false, error: "invalid_slip_data", status: 400 };
  }
  if (!slipBuf.length) {
    return { ok: false, error: "slip_required", status: 400 };
  }
  if (slipBuf.length > MAX_SLIP_BYTES) {
    return { ok: false, error: "slip_too_large", status: 400 };
  }

  const loginChannelId = getLoginChannelId();
  if (!loginChannelId) {
    console.error("LINE_LOGIN_CHANNEL_ID is not set");
    return { ok: false, error: "server_misconfigured", status: 500 };
  }

  let lineUserId: string;
  try {
    const verified = await verifyLineIdToken(input.idToken.trim(), loginChannelId);
    lineUserId = verified.userId;
  } catch (err) {
    console.warn("LINE id token verify failed", err);
    return { ok: false, error: "invalid_id_token", status: 401 };
  }

  const existing = await findMemberByLineUserId(lineUserId);
  if (existing) {
    return { ok: false, error: "already_registered", status: 409 };
  }

  const now = new Date();
  const memberId = await allocateTempMemberId(now);
  const token = publicToken();
  const expiry = addOneCalendarYear(now);
  const memberCardUrl = `${WEB_ORIGIN}/card?m=${encodeURIComponent(memberId)}&t=${token}`;
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(memberId)}&t=${token}`;

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

  // Store object path (not a signed URL) — avoids requiring iam.serviceAccounts.signBlob
  // on the Functions runtime SA. Back Office can mint signed URLs later when needed.
  const slipUrl = `gs://${bucket.name}/${slipPath}`;

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
    slipUrl,
    amount: MEMBERSHIP_FEE_THB,
    status: "data_review",
    createdAt: ts,
    updatedAt: ts,
  }) as PaymentDoc;

  const db = getFirestore();
  const batch = db.batch();
  batch.set(db.collection(MEMBERS_COLLECTION).doc(memberId), member);
  batch.set(db.collection(PAYMENTS_COLLECTION).doc(paymentId), payment);
  await batch.commit();

  try {
    await pushMessages(lineUserId, [
      registrationConfirmFlex({
        memberId,
        fullName: `${firstName} ${lastName}`.trim(),
        statusUrl,
        feeThb: MEMBERSHIP_FEE_THB,
      }),
    ]);
  } catch (err) {
    console.error("Failed to push registration confirm", err);
  }

  const staff = staffIds();
  if (staff.length) {
    const text = staffNewRegistrationText({
      memberId,
      fullName: `${firstName} ${lastName}`.trim(),
      phone,
    });
    await Promise.allSettled(staff.map((id) => pushMessages(id, [text])));
  }

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
