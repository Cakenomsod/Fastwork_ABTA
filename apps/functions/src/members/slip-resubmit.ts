/**
 * Member re-uploads slip after treasurer reject (receiptStatus === rejected).
 */

import { randomBytes } from "node:crypto";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { WEB_ORIGIN, getLoginChannelId } from "../config";
import { verifyLineIdToken } from "../line/verify-id-token";
import { pushMessages } from "../line/client";
import { textMessage } from "../line/messages";
import {
  MEMBERS_COLLECTION,
  PAYMENTS_COLLECTION,
  findLatestPayment,
  findMemberByLineUserId,
} from "./repository";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED_SLIP_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

export type SlipResubmitResult =
  | {
      ok: true;
      memberId: string;
      statusUrl: string;
      receiptNumber?: string;
    }
  | { ok: false; error: string; status: number };

function decodeSlip(base64: string): Buffer {
  const cleaned = base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  return Buffer.from(cleaned, "base64");
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
    return { ok: false, error: "server_misconfigured", status: 500 };
  }
  try {
    const verified = await verifyLineIdToken(idToken.trim(), loginChannelId);
    return { ok: true, lineUserId: verified.userId };
  } catch {
    return { ok: false, error: "invalid_id_token", status: 401 };
  }
}

async function uploadSlip(
  memberId: string,
  contentType: string,
  slipBuf: Buffer,
): Promise<{ ok: true; slipUrl: string } | { ok: false; error: string; status: number }> {
  const ext = contentType.includes("png") ? "png" : "jpg";
  const slipPath = `slips/${memberId}/${Date.now()}.${ext}`;
  const bucket = getStorage().bucket();
  try {
    await bucket.file(slipPath).save(slipBuf, {
      contentType,
      metadata: { cacheControl: "private, max-age=0" },
      resumable: false,
    });
  } catch (err) {
    console.error("slip reupload failed", err);
    return { ok: false, error: "slip_upload_failed", status: 500 };
  }
  return { ok: true, slipUrl: `gs://${bucket.name}/${slipPath}` };
}

export async function resubmitSlip(input: {
  idToken: string;
  slipContentType: string;
  slipBase64: string;
}): Promise<SlipResubmitResult> {
  const verified = await verifyLineUser(input.idToken);
  if (!verified.ok) return verified;

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

  const member = await findMemberByLineUserId(verified.lineUserId);
  if (!member) return { ok: false, error: "not_linked", status: 404 };
  if (member.dataReviewStatus !== "approved") {
    return { ok: false, error: "data_not_approved", status: 409 };
  }

  const payment = await findLatestPayment(member.memberId);
  if (!payment) return { ok: false, error: "payment_not_found", status: 404 };
  if (payment.receiptStatus !== "rejected") {
    return { ok: false, error: "slip_not_rejected", status: 409 };
  }

  const uploaded = await uploadSlip(member.memberId, contentType, slipBuf);
  if (!uploaded.ok) return uploaded;

  const token = member.publicToken ?? randomBytes(6).toString("hex");
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;
  const now = Timestamp.now();
  const db = getFirestore();

  await db
    .collection(PAYMENTS_COLLECTION)
    .doc(payment.paymentId)
    .set(
      {
        slipUrl: uploaded.slipUrl,
        receiptStatus: "temp",
        status: "slip_review",
        rejectReason: FieldValue.delete(),
        updatedAt: now,
      },
      { merge: true },
    );

  await db.collection(MEMBERS_COLLECTION).doc(member.memberId).set(
    { publicToken: token, updatedAt: now },
    { merge: true },
  );

  if (member.lineUserId) {
    try {
      await pushMessages(member.lineUserId, [
        textMessage(
          [
            "✅ รับสลิปใหม่แล้ว",
            `เลขสมาชิก: ${member.memberId}`,
            payment.receiptNumber
              ? `เลขใบเสร็จ: ${payment.receiptNumber}`
              : "",
            "",
            "รอเหรัญญิกตรวจสอบครับ",
            `ดูสถานะ: ${statusUrl}`,
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      ]);
    } catch (err) {
      console.error("slip resubmit notify failed", err);
    }
  }

  return {
    ok: true,
    memberId: member.memberId,
    statusUrl,
    receiptNumber: payment.receiptNumber,
  };
}
