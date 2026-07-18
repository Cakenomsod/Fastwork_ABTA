/**
 * Sequential receipt numbers.
 * Temp: RC-T-{YYYY}-{####}
 * Official: RC-{YYYY}-{####}
 */

import { FieldValue, getFirestore } from "firebase-admin/firestore";

const COUNTERS = "counters";

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

async function nextSeq(docId: string, year: number): Promise<number> {
  const ref = getFirestore().collection(COUNTERS).doc(docId);
  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data()?.seq ?? 0) : 0) + 1;
    tx.set(
      ref,
      { seq: next, year, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return next;
  });
}

export async function allocateTempReceiptNumber(now = new Date()): Promise<string> {
  const year = now.getFullYear();
  const seq = await nextSeq(`tempReceipts-${year}`, year);
  return `RC-T-${year}-${pad4(seq)}`;
}

export async function allocateOfficialReceiptNumber(
  now = new Date(),
): Promise<string> {
  const year = now.getFullYear();
  const seq = await nextSeq(`receipts-${year}`, year);
  return `RC-${year}-${pad4(seq)}`;
}
