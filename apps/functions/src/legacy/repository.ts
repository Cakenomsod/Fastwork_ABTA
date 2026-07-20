/**
 * Firestore access for legacy members (import + future bind lookup).
 */

import { getFirestore, type Firestore } from "firebase-admin/firestore";
import {
  LEGACY_MEMBERS_COLLECTION,
  LEGACY_PAYMENTS_COLLECTION,
  type LegacyMemberDoc,
  type LegacyPaymentDoc,
} from "./types";

function db(): Firestore {
  return getFirestore();
}

export async function findLegacyMemberById(
  legacyMemberId: string,
): Promise<LegacyMemberDoc | undefined> {
  const snap = await db()
    .collection(LEGACY_MEMBERS_COLLECTION)
    .doc(legacyMemberId)
    .get();
  return snap.exists ? (snap.data() as LegacyMemberDoc) : undefined;
}

/** Identity match for LINE bind — primary fields must all match when provided. */
export async function findLegacyMembersByIdentity(opts: {
  firstName: string;
  lastName: string;
  legalEntityName?: string;
  buildingName?: string;
  limit?: number;
}): Promise<LegacyMemberDoc[]> {
  const firstName = opts.firstName.trim();
  const lastName = opts.lastName.trim();
  if (!firstName || !lastName) return [];

  let query = db()
    .collection(LEGACY_MEMBERS_COLLECTION)
    .where("firstName", "==", firstName)
    .where("lastName", "==", lastName)
    .limit(opts.limit ?? 20);

  const snap = await query.get();
  let rows = snap.docs.map((d) => d.data() as LegacyMemberDoc);

  const legal = opts.legalEntityName?.trim();
  const building = opts.buildingName?.trim();
  if (legal) {
    rows = rows.filter(
      (r) => (r.legalEntityName ?? "").trim() === legal,
    );
  }
  if (building) {
    rows = rows.filter(
      (r) =>
        (r.buildingName ?? "").trim() === building ||
        (r.organization ?? "").trim() === building,
    );
  }
  return rows;
}

export async function upsertLegacyMember(
  doc: LegacyMemberDoc,
): Promise<void> {
  await db()
    .collection(LEGACY_MEMBERS_COLLECTION)
    .doc(doc.legacyMemberId)
    .set(doc, { merge: true });
}

export async function upsertLegacyPayment(
  doc: LegacyPaymentDoc,
): Promise<void> {
  await db()
    .collection(LEGACY_PAYMENTS_COLLECTION)
    .doc(doc.legacyPaymentId)
    .set(doc, { merge: true });
}

export async function findLegacyPaymentsByMemberId(
  legacyMemberId: string,
): Promise<LegacyPaymentDoc[]> {
  const snap = await db()
    .collection(LEGACY_PAYMENTS_COLLECTION)
    .where("legacyMemberId", "==", legacyMemberId)
    .get();
  return snap.docs
    .map((d) => d.data() as LegacyPaymentDoc)
    .sort((a, b) => {
      const am = a.transferredAt?.toMillis?.() ?? 0;
      const bm = b.transferredAt?.toMillis?.() ?? 0;
      return bm - am;
    });
}

/** True if a live member already references this legacy ID. */
export async function isLegacyMemberBound(
  legacyMemberId: string,
): Promise<boolean> {
  const snap = await db()
    .collection("members")
    .where("legacyMemberId", "==", legacyMemberId)
    .limit(1)
    .get();
  return !snap.empty;
}
