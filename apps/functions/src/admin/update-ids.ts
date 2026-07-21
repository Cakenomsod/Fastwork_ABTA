/**
 * Admin correction of member / receipt numbers during review.
 *
 * Changing a number does NOT rename anything immediately. Instead the new
 * number is validated against real (permanent/official) numbers and staged
 * on the document (`pendingMemberId` / `pendingReceiptNumber`). It is applied
 * when the reviewer confirms:
 *   - data review approve  → pendingMemberId becomes the permanent member ID
 *   - slip review approve  → pendingReceiptNumber becomes the official receipt
 * The temporary number itself stays untouched until then.
 */

import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { WEB_ORIGIN } from "../config";
import { pushMessages } from "../line/client";
import { memberIdsUpdatedText } from "../line/messages";
import {
  isValidMemberIdFormat,
  isValidReceiptNumberFormat,
  memberRegistryRef,
  parseMemberId,
  parseReceiptNumber,
  peekNextMemberId,
  peekNextReceiptNumber,
  receiptRegistryRef,
} from "../members/id-registry";
import {
  MEMBERS_COLLECTION,
  PAYMENTS_COLLECTION,
  findLatestPayment,
  findMemberById,
} from "../members/repository";
import type { MemberDoc, PaymentDoc } from "../members/types";
import { getAdminMemberDetail, type MemberDetail } from "./reviews";

export type UpdateIdsResult =
  | { ok: true; member: MemberDetail; memberId: string; receiptNumber?: string }
  | { ok: false; error: string; status: number };

export { isValidMemberIdFormat, isValidReceiptNumberFormat };

/**
 * Stage a new member ID and/or receipt number for the current review.
 * Numbers must be in permanent/official (no-T) format; uniqueness is checked
 * against real numbers and other staged numbers, then re-checked when applied.
 */
export async function updateMemberIds(opts: {
  memberId: string;
  newMemberId?: string;
  newReceiptNumber?: string;
  actorEmail: string;
  allowMemberId: boolean;
  allowReceiptNumber: boolean;
}): Promise<UpdateIdsResult> {
  const currentId = opts.memberId.trim();
  if (!currentId) {
    return { ok: false, error: "member_id_required", status: 400 };
  }

  const nextMemberId = opts.newMemberId?.trim().toUpperCase();
  const nextReceipt = opts.newReceiptNumber?.trim().toUpperCase();

  const changingMember = Boolean(nextMemberId);
  const changingReceipt = Boolean(nextReceipt);

  if (!changingMember && !changingReceipt) {
    return { ok: false, error: "nothing_to_update", status: 400 };
  }
  if (nextMemberId && !opts.allowMemberId) {
    return { ok: false, error: "forbidden_role", status: 403 };
  }
  if (nextReceipt && !opts.allowReceiptNumber) {
    return { ok: false, error: "forbidden_role", status: 403 };
  }

  const member = await findMemberById(currentId);
  if (!member) {
    return { ok: false, error: "not_found", status: 404 };
  }
  const payment = await findLatestPayment(member.memberId);

  if (changingMember) {
    // Staged member IDs are always permanent format (no T).
    if (parseMemberId(nextMemberId!)?.kind !== "permanent") {
      return { ok: false, error: "invalid_member_id_format", status: 400 };
    }
  }
  if (changingReceipt) {
    if (!payment) {
      return { ok: false, error: "payment_not_found", status: 404 };
    }
    // Staged receipt numbers are always official format (no T).
    if (parseReceiptNumber(nextReceipt!)?.kind !== "official") {
      return { ok: false, error: "invalid_receipt_number_format", status: 400 };
    }
  }

  const availability = await checkMemberIds({
    memberId: changingMember ? nextMemberId : undefined,
    exceptMemberId: member.memberId,
    receiptNumber: changingReceipt ? nextReceipt : undefined,
    exceptPaymentId: payment?.paymentId,
  });
  if (changingMember && !availability.memberId?.available) {
    return { ok: false, error: "member_id_taken", status: 409 };
  }
  if (changingReceipt && !availability.receiptNumber?.available) {
    return { ok: false, error: "receipt_number_taken", status: 409 };
  }

  const db = getFirestore();
  const now = Timestamp.now();
  const batch = db.batch();
  const memberRef = db.collection(MEMBERS_COLLECTION).doc(member.memberId);

  if (changingMember) {
    batch.set(
      memberRef,
      {
        pendingMemberId: nextMemberId,
        updatedAt: now,
        updatedBy: opts.actorEmail,
      },
      { merge: true },
    );
  }
  if (changingReceipt && payment) {
    batch.set(
      db.collection(PAYMENTS_COLLECTION).doc(payment.paymentId),
      {
        pendingReceiptNumber: nextReceipt,
        updatedAt: now,
        updatedBy: opts.actorEmail,
      },
      { merge: true },
    );
    batch.set(memberRef, { updatedAt: now }, { merge: true });
  }
  await batch.commit();

  const detail = await getAdminMemberDetail(member.memberId);
  if (!detail) {
    return { ok: false, error: "not_found", status: 404 };
  }

  if (member.lineUserId) {
    const token = member.publicToken ?? "";
    const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;
    try {
      await pushMessages(member.lineUserId, [
        memberIdsUpdatedText({
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          memberIdChange:
            changingMember && nextMemberId
              ? { from: member.memberId, to: nextMemberId }
              : undefined,
          receiptNumberChange:
            changingReceipt && nextReceipt
              ? {
                  from: payment?.receiptNumber ?? "—",
                  to: nextReceipt,
                }
              : undefined,
          statusUrl,
          cardUrl: member.memberCardUrl,
          receiptUrl: payment?.receiptUrl,
        }),
      ]);
    } catch (err) {
      console.error("notify memberIdsUpdated failed", err);
    }
  }

  return {
    ok: true,
    memberId: detail.memberId,
    receiptNumber: detail.receiptNumber,
    member: detail,
  };
}

/** Pre-check uniqueness + suggest next sequential numbers for admin UI. */
export async function checkMemberIds(opts: {
  memberId?: string;
  exceptMemberId?: string;
  receiptNumber?: string;
  exceptPaymentId?: string;
}): Promise<{
  ok: true;
  memberId?: {
    value: string;
    validFormat: boolean;
    available: boolean;
  };
  receiptNumber?: {
    value: string;
    validFormat: boolean;
    available: boolean;
  };
  suggest: {
    nextTempMemberId: string;
    nextPermanentMemberId: string;
    nextTempReceiptNumber: string;
    nextOfficialReceiptNumber: string;
  };
}> {
  const suggest = {
    nextTempMemberId: await peekNextMemberId("temp"),
    nextPermanentMemberId: await findNextAvailablePermanentMemberId(
      opts.exceptMemberId,
    ),
    nextTempReceiptNumber: await peekNextReceiptNumber("temp"),
    nextOfficialReceiptNumber: await findNextAvailableOfficialReceiptNumber(
      opts.exceptPaymentId,
    ),
  };

  let memberResult:
    | { value: string; validFormat: boolean; available: boolean }
    | undefined;
  let receiptResult:
    | { value: string; validFormat: boolean; available: boolean }
    | undefined;

  if (opts.memberId) {
    const value = opts.memberId.trim().toUpperCase();
    const parsed = parseMemberId(value);
    const validFormat = parsed !== null;
    let available = false;
    if (validFormat && parsed) {
      if (opts.exceptMemberId && value === opts.exceptMemberId) {
        available = true;
      } else if (parsed.kind === "permanent") {
        available = await isPermanentMemberIdAvailable(
          value,
          opts.exceptMemberId,
        );
      } else {
        available = await isTempMemberIdAvailable(value, opts.exceptMemberId);
      }
    }
    memberResult = { value, validFormat, available };
  }

  if (opts.receiptNumber) {
    const value = opts.receiptNumber.trim().toUpperCase();
    const validFormat = isValidReceiptNumberFormat(value);
    let available = false;
    if (validFormat) {
      available = await isReceiptNumberAvailable(value, opts.exceptPaymentId);
    }
    receiptResult = { value, validFormat, available };
  }

  return {
    ok: true,
    memberId: memberResult,
    receiptNumber: receiptResult,
    suggest,
  };
}

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

async function isPermanentMemberIdAvailable(
  value: string,
  exceptMemberId?: string,
): Promise<boolean> {
  const db = getFirestore();
  const [docSnap, regSnap, pendingSnap] = await Promise.all([
    db.collection(MEMBERS_COLLECTION).doc(value).get(),
    memberRegistryRef(value).get(),
    db
      .collection(MEMBERS_COLLECTION)
      .where("pendingMemberId", "==", value)
      .limit(5)
      .get(),
  ]);
  let docTaken = false;
  if (docSnap.exists) {
    const live = docSnap.data() as MemberDoc;
    const isTemp =
      live.status === "temporary" ||
      Boolean(live.tempMemberId && live.tempMemberId === live.memberId);
    docTaken = !isTemp;
  }
  const pendingHit = pendingSnap.docs.some(
    (d) => (d.data() as MemberDoc).memberId !== exceptMemberId,
  );
  return !docTaken && !regSnap.exists && !pendingHit;
}

async function isTempMemberIdAvailable(
  value: string,
  exceptMemberId?: string,
): Promise<boolean> {
  const db = getFirestore();
  const [docSnap, regSnap, byTemp] = await Promise.all([
    db.collection(MEMBERS_COLLECTION).doc(value).get(),
    memberRegistryRef(value).get(),
    db
      .collection(MEMBERS_COLLECTION)
      .where("tempMemberId", "==", value)
      .limit(1)
      .get(),
  ]);
  const tempHit = byTemp.docs.some(
    (d) => (d.data() as MemberDoc).memberId !== exceptMemberId,
  );
  return !docSnap.exists && !regSnap.exists && !tempHit;
}

async function isReceiptNumberAvailable(
  value: string,
  exceptPaymentId?: string,
): Promise<boolean> {
  const db = getFirestore();
  const [regSnap, paySnap, pendingSnap] = await Promise.all([
    receiptRegistryRef(value).get(),
    db
      .collection(PAYMENTS_COLLECTION)
      .where("receiptNumber", "==", value)
      .limit(5)
      .get(),
    db
      .collection(PAYMENTS_COLLECTION)
      .where("pendingReceiptNumber", "==", value)
      .limit(5)
      .get(),
  ]);
  const payHit = paySnap.docs.some(
    (d) => (d.data() as PaymentDoc).paymentId !== exceptPaymentId,
  );
  const pendingHit = pendingSnap.docs.some(
    (d) => (d.data() as PaymentDoc).paymentId !== exceptPaymentId,
  );
  return !regSnap.exists && !payHit && !pendingHit;
}

/** Peek counter, then scan forward until a free permanent member ID is found. */
async function findNextAvailablePermanentMemberId(
  exceptMemberId?: string,
): Promise<string> {
  let candidate = await peekNextMemberId("permanent");
  for (let i = 0; i < 200; i++) {
    if (await isPermanentMemberIdAvailable(candidate, exceptMemberId)) {
      return candidate;
    }
    const parsed = parseMemberId(candidate);
    if (!parsed) return candidate;
    candidate = `ABTA-${parsed.year}-${pad4(parsed.seq + 1)}`;
  }
  return candidate;
}

/** Peek counter, then scan forward until a free official receipt number is found. */
async function findNextAvailableOfficialReceiptNumber(
  exceptPaymentId?: string,
): Promise<string> {
  let candidate = await peekNextReceiptNumber("official");
  for (let i = 0; i < 200; i++) {
    if (await isReceiptNumberAvailable(candidate, exceptPaymentId)) {
      return candidate;
    }
    const parsed = parseReceiptNumber(candidate);
    if (!parsed) return candidate;
    candidate = `RC-${parsed.year}-${pad4(parsed.seq + 1)}`;
  }
  return candidate;
}
