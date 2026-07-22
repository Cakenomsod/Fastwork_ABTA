/**
 * Membership renewal for LINE-linked members (slip → treasurer queue).
 */

import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { MEMBERSHIP_FEE_THB, WEB_ORIGIN, getLoginChannelId } from "../config";
import { verifyLineIdToken } from "../line/verify-id-token";
import { pushMessages } from "../line/client";
import { textMessage } from "../line/messages";
import { allocateTempReceiptNumber } from "../admin/receipts";
import {
  applyExpiryToMemberStatus,
  nextMembershipExpiryDec31,
} from "./membership";
import { resolvePublicToken } from "./public-token";
import {
  MEMBERS_COLLECTION,
  PAYMENTS_COLLECTION,
  findLatestPayment,
  findMemberByLineUserId,
} from "./repository";
import { notifyStaff } from "./staff-notify";
import type { MemberDoc, PaymentDoc } from "./types";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED_SLIP_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

export type RenewDraftResult =
  | {
      ok: true;
      memberId: string;
      firstName: string;
      lastName: string;
      status: string;
      expiryDate?: string;
      feeThb: number;
      pendingRenewal: boolean;
    }
  | { ok: false; error: string; status: number };

export type RenewResult =
  | {
      ok: true;
      memberId: string;
      statusUrl: string;
      receiptNumber: string;
      feeThb: number;
      expiryDate?: string;
    }
  | { ok: false; error: string; status: number };

async function verifyLineUser(idToken: string): Promise<
  | { ok: true; lineUserId: string }
  | { ok: false; error: string; status: number }
> {
  if (!idToken?.trim()) {
    return { ok: false, error: "id_token_required", status: 400 };
  }
  const loginChannelId = getLoginChannelId();
  if (!loginChannelId) {
    return { ok: false, error: "server_misconfigured", status: 500 };
  }
  try {
    const verified = await verifyLineIdToken(idToken.trim(), loginChannelId);
    return { ok: true, lineUserId: verified.userId };
  } catch {
    return { ok: false, error: "invalid_id_token", status: 401 };
  }
}

function decodeSlip(base64: string): Buffer {
  const cleaned = base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  return Buffer.from(cleaned, "base64");
}

async function uploadSlip(
  memberId: string,
  contentType: string,
  slipBuf: Buffer,
): Promise<{ ok: true; slipUrl: string } | { ok: false; error: string; status: number }> {
  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `slips/${memberId}/renew_${Date.now()}.${ext}`;
  const bucket = getStorage().bucket();
  try {
    await bucket.file(path).save(slipBuf, {
      contentType,
      metadata: { cacheControl: "private, max-age=0" },
      resumable: false,
    });
  } catch (err) {
    console.error("renew slip upload failed", err);
    return { ok: false, error: "slip_upload_failed", status: 500 };
  }
  return { ok: true, slipUrl: `gs://${bucket.name}/${path}` };
}

function hasPendingRenewal(payment: PaymentDoc | undefined): boolean {
  if (!payment || payment.paymentKind !== "renewal") return false;
  if (payment.receiptStatus === "official") return false;
  return (
    payment.status === "slip_review" ||
    payment.receiptStatus === "temp" ||
    payment.receiptStatus === "pending_review" ||
    payment.receiptStatus === "rejected"
  );
}

export async function getRenewDraft(idToken: string): Promise<RenewDraftResult> {
  const verified = await verifyLineUser(idToken);
  if (!verified.ok) return verified;

  const member = await findMemberByLineUserId(verified.lineUserId);
  if (!member) return { ok: false, error: "not_linked", status: 404 };
  if (member.dataReviewStatus === "rejected") {
    return { ok: false, error: "data_rejected", status: 409 };
  }

  const payment = await findLatestPayment(member.memberId);
  return {
    ok: true,
    memberId: member.memberId,
    firstName: member.firstName,
    lastName: member.lastName,
    status: member.status,
    expiryDate: member.expiryDate?.toDate?.()?.toISOString?.()?.slice(0, 10),
    feeThb: MEMBERSHIP_FEE_THB,
    pendingRenewal: hasPendingRenewal(payment),
  };
}

export async function renewMembership(input: {
  idToken: string;
  slipContentType: string;
  slipBase64: string;
}): Promise<RenewResult> {
  const verified = await verifyLineUser(input.idToken);
  if (!verified.ok) return verified;

  const member = await findMemberByLineUserId(verified.lineUserId);
  if (!member) return { ok: false, error: "not_linked", status: 404 };
  if (member.dataReviewStatus === "rejected") {
    return { ok: false, error: "data_rejected", status: 409 };
  }

  const latest = await findLatestPayment(member.memberId);
  if (hasPendingRenewal(latest) && latest?.receiptStatus !== "rejected") {
    return { ok: false, error: "renewal_pending", status: 409 };
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
  if (!slipBuf.length) return { ok: false, error: "slip_required", status: 400 };
  if (slipBuf.length > MAX_SLIP_BYTES) {
    return { ok: false, error: "slip_too_large", status: 400 };
  }

  const uploaded = await uploadSlip(member.memberId, contentType, slipBuf);
  if (!uploaded.ok) return uploaded;

  const paymentId = `pay_renew_${member.memberId}_${Date.now()}`;
  const receiptNumber = await allocateTempReceiptNumber(new Date(), paymentId);
  const token = resolvePublicToken(member.publicToken);
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;
  const now = Timestamp.now();
  const receiptUrl = `${WEB_ORIGIN}/receipt?m=${encodeURIComponent(member.memberId)}&t=${token}`;

  const payment: PaymentDoc = {
    paymentId,
    memberId: member.memberId,
    receiptNumber,
    receiptStatus: "temp",
    receiptUrl,
    slipUrl: uploaded.slipUrl,
    amount: MEMBERSHIP_FEE_THB,
    paymentKind: "renewal",
    status: "slip_review",
    createdAt: now,
    updatedAt: now,
  };

  const db = getFirestore();
  const batch = db.batch();
  batch.set(db.collection(PAYMENTS_COLLECTION).doc(paymentId), payment);
  batch.set(
    db.collection(MEMBERS_COLLECTION).doc(member.memberId),
    {
      publicToken: token,
      linkType: "renewal",
      updatedAt: now,
    },
    { merge: true },
  );
  await batch.commit();

  try {
    await pushMessages(verified.lineUserId, [
      textMessage(
        [
          "✅ รับคำขอต่ออายุแล้ว",
          `เลขสมาชิก: ${member.memberId}`,
          `เลขใบเสร็จชั่วคราว: ${receiptNumber}`,
          `ค่าธรรมเนียม: ${MEMBERSHIP_FEE_THB} บาท`,
          "",
          "รอเหรัญญิกตรวจสอบสลิปครับ",
          `ดูสถานะ: ${statusUrl}`,
        ].join("\n"),
      ),
    ]);
  } catch (err) {
    console.error("renew notify failed", err);
  }

  void notifyStaff([
    "🔄 คำขอต่ออายุสมาชิก",
    `เลขสมาชิก: ${member.memberId}`,
    `ชื่อ: ${member.firstName} ${member.lastName}`,
    `เลขใบเสร็จชั่วคราว: ${receiptNumber}`,
    "รอคิวเหรัญญิกตรวจสลิป",
  ]);

  return {
    ok: true,
    memberId: member.memberId,
    statusUrl,
    receiptNumber,
    feeThb: MEMBERSHIP_FEE_THB,
    expiryDate: member.expiryDate?.toDate?.()?.toISOString?.()?.slice(0, 10),
  };
}

/** Member field patch when a renewal slip is approved. */
export function renewalExpiryUpdates(member: MemberDoc): Record<string, unknown> {
  const current = member.expiryDate?.toDate?.() ?? new Date();
  const next = nextMembershipExpiryDec31(current);
  const status = applyExpiryToMemberStatus("active", next);
  return {
    expiryDate: Timestamp.fromDate(next),
    status,
    expiryRemindersSent: FieldValue.delete(),
    linkType: "renewal",
  };
}
