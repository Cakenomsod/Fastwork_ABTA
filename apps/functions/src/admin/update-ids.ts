/**
 * Admin correction of member / receipt numbers (manual override).
 * Does not bump counters — only renames existing allocated IDs.
 */

import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { WEB_ORIGIN } from "../config";
import {
  MEMBERS_COLLECTION,
  PAYMENTS_COLLECTION,
  findLatestPayment,
  findMemberById,
} from "../members/repository";
import type { MemberDoc, PaymentDoc } from "../members/types";
import { getAdminMemberDetail, type MemberDetail } from "./reviews";

const MEMBER_ID_RE = /^ABTA(?:-T)?-\d{4}-\d{4}$/;
const RECEIPT_NUMBER_RE = /^RC(?:-T)?-\d{4}-\d{4}$/;

export type UpdateIdsResult =
  | { ok: true; member: MemberDetail; memberId: string; receiptNumber?: string }
  | { ok: false; error: string; status: number };

export function isValidMemberIdFormat(value: string): boolean {
  return MEMBER_ID_RE.test(value);
}

export function isValidReceiptNumberFormat(value: string): boolean {
  return RECEIPT_NUMBER_RE.test(value);
}

async function memberIdTaken(
  candidate: string,
  exceptMemberId: string,
): Promise<boolean> {
  const db = getFirestore();
  const [byId, byTemp] = await Promise.all([
    db
      .collection(MEMBERS_COLLECTION)
      .where("memberId", "==", candidate)
      .limit(1)
      .get(),
    db
      .collection(MEMBERS_COLLECTION)
      .where("tempMemberId", "==", candidate)
      .limit(1)
      .get(),
  ]);

  for (const snap of [byId, byTemp]) {
    for (const doc of snap.docs) {
      const data = doc.data() as MemberDoc;
      if (data.memberId !== exceptMemberId) return true;
    }
  }
  return false;
}

async function receiptNumberTaken(
  candidate: string,
  exceptPaymentId?: string,
): Promise<boolean> {
  const snap = await getFirestore()
    .collection(PAYMENTS_COLLECTION)
    .where("receiptNumber", "==", candidate)
    .limit(5)
    .get();
  for (const doc of snap.docs) {
    const payment = doc.data() as PaymentDoc;
    if (payment.paymentId !== exceptPaymentId) return true;
  }
  return false;
}

function rewriteMemberUrl(
  url: string | undefined,
  oldId: string,
  newId: string,
  token: string,
  kind: "card" | "status" | "receipt",
): string {
  if (!url) {
    const path =
      kind === "card" ? "card" : kind === "receipt" ? "receipt" : "status";
    return `${WEB_ORIGIN}/${path}?m=${encodeURIComponent(newId)}&t=${token}`;
  }
  try {
    const u = new URL(url);
    if (u.searchParams.get("m") === oldId) {
      u.searchParams.set("m", newId);
      return u.toString();
    }
  } catch {
    // fall through to string replace
  }
  return url.replaceAll(oldId, newId);
}

/**
 * Update the current displayed memberId and/or the latest payment receiptNumber.
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

  const nextMemberId = opts.newMemberId?.trim();
  const nextReceipt = opts.newReceiptNumber?.trim();

  const changingMember =
    Boolean(nextMemberId) && nextMemberId !== undefined;
  const changingReceipt =
    Boolean(nextReceipt) && nextReceipt !== undefined;

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
  const memberIdChanged =
    Boolean(nextMemberId) && nextMemberId !== member.memberId;
  const receiptChanged =
    Boolean(nextReceipt) && nextReceipt !== (payment?.receiptNumber ?? "");

  if (!memberIdChanged && !receiptChanged) {
    const detail = await getAdminMemberDetail(member.memberId);
    if (!detail) return { ok: false, error: "not_found", status: 404 };
    return {
      ok: true,
      memberId: detail.memberId,
      receiptNumber: detail.receiptNumber,
      member: detail,
    };
  }

  if (memberIdChanged) {
    if (!isValidMemberIdFormat(nextMemberId!)) {
      return { ok: false, error: "invalid_member_id_format", status: 400 };
    }
    if (await memberIdTaken(nextMemberId!, member.memberId)) {
      return { ok: false, error: "member_id_taken", status: 409 };
    }
  }

  if (receiptChanged) {
    if (!payment) {
      return { ok: false, error: "payment_not_found", status: 404 };
    }
    if (!isValidReceiptNumberFormat(nextReceipt!)) {
      return { ok: false, error: "invalid_receipt_number_format", status: 400 };
    }
    if (await receiptNumberTaken(nextReceipt!, payment.paymentId)) {
      return { ok: false, error: "receipt_number_taken", status: 409 };
    }
  }

  const now = Timestamp.now();
  const db = getFirestore();
  const batch = db.batch();
  let effectiveMemberId = member.memberId;

  if (memberIdChanged) {
    const newId = nextMemberId!;
    const token = member.publicToken ?? "";
    const oldRef = db.collection(MEMBERS_COLLECTION).doc(member.memberId);
    const newRef = db.collection(MEMBERS_COLLECTION).doc(newId);

    const stillTemporary =
      member.status === "temporary" ||
      !member.tempMemberId ||
      member.tempMemberId === member.memberId;

    batch.set(newRef, {
      ...member,
      memberId: newId,
      tempMemberId: stillTemporary ? newId : member.tempMemberId,
      memberCardUrl: rewriteMemberUrl(
        member.memberCardUrl,
        member.memberId,
        newId,
        token,
        "card",
      ),
      updatedAt: now,
      updatedBy: opts.actorEmail,
    });
    if (oldRef.path !== newRef.path) {
      batch.delete(oldRef);
    }

    const paymentsSnap = await db
      .collection(PAYMENTS_COLLECTION)
      .where("memberId", "==", member.memberId)
      .get();

    for (const doc of paymentsSnap.docs) {
      const pay = doc.data() as PaymentDoc;
      const patch: Record<string, unknown> = {
        memberId: newId,
        updatedAt: now,
        updatedBy: opts.actorEmail,
      };
      if (pay.receiptUrl) {
        patch.receiptUrl = rewriteMemberUrl(
          pay.receiptUrl,
          member.memberId,
          newId,
          token,
          "receipt",
        );
      }
      // Apply receipt change on the same payment doc when both change
      if (
        receiptChanged &&
        payment &&
        pay.paymentId === payment.paymentId
      ) {
        patch.receiptNumber = nextReceipt;
      }
      batch.set(doc.ref, patch, { merge: true });
    }

    effectiveMemberId = newId;
  } else if (receiptChanged && payment) {
    batch.set(
      db.collection(PAYMENTS_COLLECTION).doc(payment.paymentId),
      {
        receiptNumber: nextReceipt,
        updatedAt: now,
        updatedBy: opts.actorEmail,
      },
      { merge: true },
    );
    batch.set(
      db.collection(MEMBERS_COLLECTION).doc(member.memberId),
      {
        updatedAt: now,
        updatedBy: opts.actorEmail,
      },
      { merge: true },
    );
  }

  await batch.commit();

  const detail = await getAdminMemberDetail(effectiveMemberId);
  if (!detail) {
    return { ok: false, error: "not_found", status: 404 };
  }

  return {
    ok: true,
    memberId: detail.memberId,
    receiptNumber: detail.receiptNumber,
    member: detail,
  };
}
