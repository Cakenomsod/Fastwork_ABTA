/**
 * ID uniqueness registry + counter helpers.
 *
 * Collections:
 *   idRegistry/members/{memberId}
 *   idRegistry/receipts/{receiptNumber}
 *
 * Used with Firestore transactions so allocate / rename / promote cannot race.
 */

import {
  FieldValue,
  Timestamp,
  type Transaction,
  getFirestore,
  type DocumentReference,
} from "firebase-admin/firestore";

export const ID_REGISTRY = "idRegistry";
export const COUNTERS = "counters";

export type MemberIdKind = "temp" | "permanent";
export type ReceiptIdKind = "temp" | "official";

export type ParsedMemberId = {
  kind: MemberIdKind;
  year: number;
  seq: number;
  raw: string;
};

export type ParsedReceiptNumber = {
  kind: ReceiptIdKind;
  year: number;
  seq: number;
  raw: string;
};

const MEMBER_ID_RE = /^ABTA(-T)?-(\d{4})-(\d{4})$/;
const RECEIPT_NUMBER_RE = /^RC(-T)?-(\d{4})-(\d{4})$/;

export function parseMemberId(value: string): ParsedMemberId | null {
  const m = MEMBER_ID_RE.exec(value.trim().toUpperCase());
  if (!m) return null;
  return {
    kind: m[1] ? "temp" : "permanent",
    year: Number(m[2]),
    seq: Number(m[3]),
    raw: m[0],
  };
}

export function parseReceiptNumber(value: string): ParsedReceiptNumber | null {
  const m = RECEIPT_NUMBER_RE.exec(value.trim().toUpperCase());
  if (!m) return null;
  return {
    kind: m[1] ? "temp" : "official",
    year: Number(m[2]),
    seq: Number(m[3]),
    raw: m[0],
  };
}

export function isValidMemberIdFormat(value: string): boolean {
  return parseMemberId(value) !== null;
}

export function isValidReceiptNumberFormat(value: string): boolean {
  return parseReceiptNumber(value) !== null;
}

export function memberRegistryRef(memberId: string): DocumentReference {
  return getFirestore().collection(ID_REGISTRY).doc(`members_${memberId}`);
}

export function receiptRegistryRef(receiptNumber: string): DocumentReference {
  return getFirestore().collection(ID_REGISTRY).doc(`receipts_${receiptNumber}`);
}

function counterDocIdForMember(parsed: ParsedMemberId): string {
  return parsed.kind === "temp"
    ? `tempMembers-${parsed.year}`
    : `members-${parsed.year}`;
}

function counterDocIdForReceipt(parsed: ParsedReceiptNumber): string {
  return parsed.kind === "temp"
    ? `tempReceipts-${parsed.year}`
    : `receipts-${parsed.year}`;
}

/**
 * Read counter and bump to max(current, seq). Must be called inside a transaction.
 */
export async function ensureCounterAtLeastInTx(
  tx: Transaction,
  counterDocId: string,
  year: number,
  seq: number,
): Promise<void> {
  const ref = getFirestore().collection(COUNTERS).doc(counterDocId);
  const snap = await tx.get(ref);
  const current = snap.exists ? Number(snap.data()?.seq ?? 0) : 0;
  const next = Math.max(current, seq);
  if (next !== current || !snap.exists) {
    tx.set(
      ref,
      { seq: next, year, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
}

export async function ensureMemberCounterForIdInTx(
  tx: Transaction,
  memberId: string,
): Promise<void> {
  const parsed = parseMemberId(memberId);
  if (!parsed) return;
  await ensureCounterAtLeastInTx(
    tx,
    counterDocIdForMember(parsed),
    parsed.year,
    parsed.seq,
  );
}

export async function ensureReceiptCounterForNumberInTx(
  tx: Transaction,
  receiptNumber: string,
): Promise<void> {
  const parsed = parseReceiptNumber(receiptNumber);
  if (!parsed) return;
  await ensureCounterAtLeastInTx(
    tx,
    counterDocIdForReceipt(parsed),
    parsed.year,
    parsed.seq,
  );
}

export type MemberRegistryDoc = {
  memberId: string;
  kind: MemberIdKind;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  source?: string;
};

export type ReceiptRegistryDoc = {
  receiptNumber: string;
  paymentId: string;
  kind: ReceiptIdKind;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  source?: string;
};

/** Reserve member ID in registry; throws if already reserved. */
export async function assertMemberIdAvailableInTx(
  tx: Transaction,
  memberId: string,
): Promise<void> {
  const snap = await tx.get(memberRegistryRef(memberId));
  if (snap.exists) {
    const err = new Error("member_id_taken");
    (err as Error & { code: string }).code = "member_id_taken";
    throw err;
  }
}

export async function assertReceiptNumberAvailableInTx(
  tx: Transaction,
  receiptNumber: string,
): Promise<void> {
  const snap = await tx.get(receiptRegistryRef(receiptNumber));
  if (snap.exists) {
    const err = new Error("receipt_number_taken");
    (err as Error & { code: string }).code = "receipt_number_taken";
    throw err;
  }
}

export function writeMemberRegistryInTx(
  tx: Transaction,
  memberId: string,
  source = "allocate",
): void {
  const parsed = parseMemberId(memberId);
  if (!parsed) return;
  tx.set(memberRegistryRef(memberId), {
    memberId,
    kind: parsed.kind,
    source,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export function writeReceiptRegistryInTx(
  tx: Transaction,
  receiptNumber: string,
  paymentId: string,
  source = "allocate",
): void {
  const parsed = parseReceiptNumber(receiptNumber);
  if (!parsed) return;
  tx.set(receiptRegistryRef(receiptNumber), {
    receiptNumber,
    paymentId,
    kind: parsed.kind,
    source,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export function deleteMemberRegistryInTx(tx: Transaction, memberId: string): void {
  tx.delete(memberRegistryRef(memberId));
}

export function deleteReceiptRegistryInTx(
  tx: Transaction,
  receiptNumber: string,
): void {
  tx.delete(receiptRegistryRef(receiptNumber));
}

/** Peek next auto number without allocating (for admin UI hints). */
export async function peekNextMemberId(
  kind: MemberIdKind,
  now = new Date(),
): Promise<string> {
  const year = now.getFullYear();
  const docId =
    kind === "temp" ? `tempMembers-${year}` : `members-${year}`;
  const snap = await getFirestore().collection(COUNTERS).doc(docId).get();
  const seq = (snap.exists ? Number(snap.data()?.seq ?? 0) : 0) + 1;
  const pad = String(seq).padStart(4, "0");
  return kind === "temp" ? `ABTA-T-${year}-${pad}` : `ABTA-${year}-${pad}`;
}

export async function peekNextReceiptNumber(
  kind: ReceiptIdKind,
  now = new Date(),
): Promise<string> {
  const year = now.getFullYear();
  const docId =
    kind === "temp" ? `tempReceipts-${year}` : `receipts-${year}`;
  const snap = await getFirestore().collection(COUNTERS).doc(docId).get();
  const seq = (snap.exists ? Number(snap.data()?.seq ?? 0) : 0) + 1;
  const pad = String(seq).padStart(4, "0");
  return kind === "temp" ? `RC-T-${year}-${pad}` : `RC-${year}-${pad}`;
}
