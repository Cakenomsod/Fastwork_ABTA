/**
 * Admin update / delete member profile (not ID renumbering).
 */

import { Timestamp, getFirestore } from "firebase-admin/firestore";
import {
  deleteMemberRegistryInTx,
  deleteReceiptRegistryInTx,
  memberRegistryRef,
} from "../members/id-registry";
import {
  MEMBERS_COLLECTION,
  PAYMENTS_COLLECTION,
  findMemberById,
} from "../members/repository";
import type { MemberDoc, PaymentDoc } from "../members/types";
import { getAdminMemberDetail, type MemberDetail } from "./reviews";

export type ProfileUpdateResult =
  | { ok: true; member: MemberDetail }
  | { ok: false; error: string; status: number };

export type ProfileDeleteResult =
  | { ok: true; memberId: string }
  | { ok: false; error: string; status: number };

const EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "legalEntityName",
  "buildingName",
  "organization",
] as const;

export async function updateMemberProfile(opts: {
  memberId: string;
  patch: Partial<
    Pick<
      MemberDoc,
      | "firstName"
      | "lastName"
      | "phone"
      | "email"
      | "legalEntityName"
      | "buildingName"
      | "organization"
      | "isBoardMember"
    >
  > & { expiryDate?: string };
  actorEmail: string;
}): Promise<ProfileUpdateResult> {
  const member = await findMemberById(opts.memberId.trim());
  if (!member) return { ok: false, error: "not_found", status: 404 };

  const updates: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
    updatedBy: opts.actorEmail,
  };

  for (const key of EDITABLE_FIELDS) {
    const v = opts.patch[key];
    if (v !== undefined) {
      const trimmed = String(v).trim();
      if (key === "firstName" || key === "lastName") {
        if (!trimmed) {
          return { ok: false, error: "required_fields_missing", status: 400 };
        }
      }
      updates[key] = trimmed || null;
    }
  }

  if (opts.patch.expiryDate !== undefined) {
    const raw = opts.patch.expiryDate.trim();
    if (!raw) {
      updates.expiryDate = null;
    } else {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        return { ok: false, error: "invalid_expiry_date", status: 400 };
      }
      updates.expiryDate = Timestamp.fromDate(d);
    }
  }

  if (opts.patch.isBoardMember !== undefined) {
    updates.isBoardMember = Boolean(opts.patch.isBoardMember);
  }

  const hasFieldChange = EDITABLE_FIELDS.some((k) => opts.patch[k] !== undefined);
  if (
    !hasFieldChange &&
    opts.patch.expiryDate === undefined &&
    opts.patch.isBoardMember === undefined
  ) {
    return { ok: false, error: "nothing_to_update", status: 400 };
  }

  await getFirestore()
    .collection(MEMBERS_COLLECTION)
    .doc(member.memberId)
    .set(updates, { merge: true });

  const detail = await getAdminMemberDetail(member.memberId);
  if (!detail) return { ok: false, error: "not_found", status: 404 };
  return { ok: true, member: detail };
}

export async function deleteMemberRecord(opts: {
  memberId: string;
  confirmMemberId: string;
  actorEmail: string;
}): Promise<ProfileDeleteResult> {
  const memberId = opts.memberId.trim();
  const confirm = opts.confirmMemberId.trim();
  if (!memberId) return { ok: false, error: "member_id_required", status: 400 };
  if (memberId !== confirm) {
    return { ok: false, error: "confirm_mismatch", status: 400 };
  }

  const member = await findMemberById(memberId);
  if (!member) return { ok: false, error: "not_found", status: 404 };

  const db = getFirestore();
  const paymentsSnap = await db
    .collection(PAYMENTS_COLLECTION)
    .where("memberId", "==", memberId)
    .get();

  await db.runTransaction(async (tx) => {
    const memberRef = db.collection(MEMBERS_COLLECTION).doc(memberId);
    const memberSnap = await tx.get(memberRef);
    if (!memberSnap.exists) {
      const err = new Error("not_found");
      (err as Error & { code: string }).code = "not_found";
      throw err;
    }

    tx.delete(memberRef);
    deleteMemberRegistryInTx(tx, memberId);
    if (member.tempMemberId && member.tempMemberId !== memberId) {
      deleteMemberRegistryInTx(tx, member.tempMemberId);
    }

    for (const doc of paymentsSnap.docs) {
      const pay = doc.data() as PaymentDoc;
      if (pay.receiptNumber) {
        deleteReceiptRegistryInTx(tx, pay.receiptNumber);
      }
      tx.delete(doc.ref);
    }

    // Ensure registry doc for memberId is gone even if only in registry
    const regRef = memberRegistryRef(memberId);
    tx.delete(regRef);
  });

  console.info(
    `Member deleted by ${opts.actorEmail}: ${memberId} (${member.firstName} ${member.lastName})`,
  );
  return { ok: true, memberId };
}
