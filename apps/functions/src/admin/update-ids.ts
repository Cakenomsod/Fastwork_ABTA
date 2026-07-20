/**
 * Admin correction of member / receipt numbers (manual override).
 *
 * Safety:
 * - Format validation
 * - Uniqueness via member doc + idRegistry (transactional)
 * - Bumps year counters to max(seq) so auto-allocate cannot collide
 * - Never overwrite an existing member doc (create-or-abort)
 */

import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { WEB_ORIGIN } from "../config";
import { pushMessages } from "../line/client";
import { memberIdsUpdatedText } from "../line/messages";
import {
  assertMemberIdAvailableInTx,
  assertReceiptNumberAvailableInTx,
  deleteMemberRegistryInTx,
  deleteReceiptRegistryInTx,
  ensureMemberCounterForIdInTx,
  ensureReceiptCounterForNumberInTx,
  isValidMemberIdFormat,
  isValidReceiptNumberFormat,
  memberRegistryRef,
  peekNextMemberId,
  peekNextReceiptNumber,
  receiptRegistryRef,
  writeMemberRegistryInTx,
  writeReceiptRegistryInTx,
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

function mapTxError(err: unknown): UpdateIdsResult {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : err instanceof Error
        ? err.message
        : "";
  if (code === "member_id_taken" || code.includes("member_id_taken")) {
    return { ok: false, error: "member_id_taken", status: 409 };
  }
  if (code === "receipt_number_taken" || code.includes("receipt_number_taken")) {
    return { ok: false, error: "receipt_number_taken", status: 409 };
  }
  if (code === "not_found" || code.includes("not_found")) {
    return { ok: false, error: "not_found", status: 404 };
  }
  if (code === "payment_not_found" || code.includes("payment_not_found")) {
    return { ok: false, error: "payment_not_found", status: 404 };
  }
  console.error("updateMemberIds transaction failed", err);
  return { ok: false, error: "id_update_conflict", status: 409 };
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
  }

  if (receiptChanged) {
    if (!payment) {
      return { ok: false, error: "payment_not_found", status: 404 };
    }
    if (!isValidReceiptNumberFormat(nextReceipt!)) {
      return { ok: false, error: "invalid_receipt_number_format", status: 400 };
    }
  }

  // Load payment refs before the transaction (known set of docs).
  const db = getFirestore();
  const paymentsSnap = await db
    .collection(PAYMENTS_COLLECTION)
    .where("memberId", "==", member.memberId)
    .get();
  const paymentRefs = paymentsSnap.docs.map((d) => d.ref);

  const now = Timestamp.now();
  let effectiveMemberId = member.memberId;

  try {
    await db.runTransaction(async (tx) => {
      const oldRef = db.collection(MEMBERS_COLLECTION).doc(member.memberId);
      const oldSnap = await tx.get(oldRef);
      if (!oldSnap.exists) {
        const err = new Error("not_found");
        (err as Error & { code: string }).code = "not_found";
        throw err;
      }
      const live = oldSnap.data() as MemberDoc;

      if (memberIdChanged) {
        const newId = nextMemberId!;
        const newRef = db.collection(MEMBERS_COLLECTION).doc(newId);
        const newSnap = await tx.get(newRef);
        if (newSnap.exists) {
          const err = new Error("member_id_taken");
          (err as Error & { code: string }).code = "member_id_taken";
          throw err;
        }
        await assertMemberIdAvailableInTx(tx, newId);
        await ensureMemberCounterForIdInTx(tx, newId);

        const token = live.publicToken ?? "";
        const stillTemporary =
          live.status === "temporary" ||
          !live.tempMemberId ||
          live.tempMemberId === live.memberId;

        tx.set(newRef, {
          ...live,
          memberId: newId,
          tempMemberId: stillTemporary ? newId : live.tempMemberId,
          memberCardUrl: rewriteMemberUrl(
            live.memberCardUrl,
            live.memberId,
            newId,
            token,
            "card",
          ),
          updatedAt: now,
          updatedBy: opts.actorEmail,
        });
        writeMemberRegistryInTx(tx, newId, "admin_rename");
        if (oldRef.path !== newRef.path) {
          tx.delete(oldRef);
          deleteMemberRegistryInTx(tx, live.memberId);
        }
        effectiveMemberId = newId;

        for (const pref of paymentRefs) {
          const paySnap = await tx.get(pref);
          if (!paySnap.exists) continue;
          const pay = paySnap.data() as PaymentDoc;
          const patch: Record<string, unknown> = {
            memberId: newId,
            updatedAt: now,
            updatedBy: opts.actorEmail,
          };
          if (pay.receiptUrl) {
            patch.receiptUrl = rewriteMemberUrl(
              pay.receiptUrl,
              live.memberId,
              newId,
              token,
              "receipt",
            );
          }
          if (
            receiptChanged &&
            payment &&
            pay.paymentId === payment.paymentId
          ) {
            const oldReceipt = pay.receiptNumber;
            if (oldReceipt && oldReceipt !== nextReceipt) {
              deleteReceiptRegistryInTx(tx, oldReceipt);
            }
            await assertReceiptNumberAvailableInTx(tx, nextReceipt!);
            await ensureReceiptCounterForNumberInTx(tx, nextReceipt!);
            patch.receiptNumber = nextReceipt;
            writeReceiptRegistryInTx(
              tx,
              nextReceipt!,
              pay.paymentId,
              "admin_rename",
            );
          }
          tx.set(pref, patch, { merge: true });
        }
      } else if (receiptChanged && payment) {
        const payRef = db.collection(PAYMENTS_COLLECTION).doc(payment.paymentId);
        const paySnap = await tx.get(payRef);
        if (!paySnap.exists) {
          const err = new Error("payment_not_found");
          (err as Error & { code: string }).code = "payment_not_found";
          throw err;
        }
        const pay = paySnap.data() as PaymentDoc;
        const oldReceipt = pay.receiptNumber;
        if (oldReceipt && oldReceipt !== nextReceipt) {
          deleteReceiptRegistryInTx(tx, oldReceipt);
        }
        await assertReceiptNumberAvailableInTx(tx, nextReceipt!);
        await ensureReceiptCounterForNumberInTx(tx, nextReceipt!);
        writeReceiptRegistryInTx(
          tx,
          nextReceipt!,
          payment.paymentId,
          "admin_rename",
        );
        tx.set(
          payRef,
          {
            receiptNumber: nextReceipt,
            updatedAt: now,
            updatedBy: opts.actorEmail,
          },
          { merge: true },
        );
        tx.set(
          oldRef,
          { updatedAt: now, updatedBy: opts.actorEmail },
          { merge: true },
        );
      }
    });
  } catch (err) {
    return mapTxError(err);
  }

  const detail = await getAdminMemberDetail(effectiveMemberId);
  if (!detail) {
    return { ok: false, error: "not_found", status: 404 };
  }

  if (member.lineUserId && (memberIdChanged || receiptChanged)) {
    const token = member.publicToken ?? "";
    const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(effectiveMemberId)}&t=${token}`;
    const cardUrl = `${WEB_ORIGIN}/card?m=${encodeURIComponent(effectiveMemberId)}&t=${token}`;
    const receiptUrl = `${WEB_ORIGIN}/receipt?m=${encodeURIComponent(effectiveMemberId)}&t=${token}`;
    try {
      await pushMessages(member.lineUserId, [
        memberIdsUpdatedText({
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          memberIdChange: memberIdChanged
            ? { from: member.memberId, to: nextMemberId! }
            : undefined,
          receiptNumberChange: receiptChanged
            ? {
                from: payment?.receiptNumber ?? "—",
                to: nextReceipt!,
              }
            : undefined,
          statusUrl,
          cardUrl: memberIdChanged ? cardUrl : undefined,
          receiptUrl: receiptChanged ? receiptUrl : undefined,
        }),
      ]);
    } catch (err) {
      console.error("LINE notify member ids update failed", err);
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
  const db = getFirestore();
  const suggest = {
    nextTempMemberId: await peekNextMemberId("temp"),
    nextPermanentMemberId: await peekNextMemberId("permanent"),
    nextTempReceiptNumber: await peekNextReceiptNumber("temp"),
    nextOfficialReceiptNumber: await peekNextReceiptNumber("official"),
  };

  let memberResult:
    | { value: string; validFormat: boolean; available: boolean }
    | undefined;
  let receiptResult:
    | { value: string; validFormat: boolean; available: boolean }
    | undefined;

  if (opts.memberId) {
    const value = opts.memberId.trim().toUpperCase();
    const validFormat = isValidMemberIdFormat(value);
    let available = false;
    if (validFormat) {
      if (opts.exceptMemberId && value === opts.exceptMemberId) {
        available = true;
      } else {
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
          (d) => (d.data() as MemberDoc).memberId !== opts.exceptMemberId,
        );
        available = !docSnap.exists && !regSnap.exists && !tempHit;
      }
    }
    memberResult = { value, validFormat, available };
  }

  if (opts.receiptNumber) {
    const value = opts.receiptNumber.trim().toUpperCase();
    const validFormat = isValidReceiptNumberFormat(value);
    let available = false;
    if (validFormat) {
      const [regSnap, paySnap] = await Promise.all([
        receiptRegistryRef(value).get(),
        db
          .collection(PAYMENTS_COLLECTION)
          .where("receiptNumber", "==", value)
          .limit(5)
          .get(),
      ]);
      const payHit = paySnap.docs.some(
        (d) => (d.data() as PaymentDoc).paymentId !== opts.exceptPaymentId,
      );
      available = !regSnap.exists && !payHit;
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
