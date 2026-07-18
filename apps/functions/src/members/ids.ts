/**
 * Sequential temporary / permanent member IDs.
 * Temp: ABTA-T-{YYYY}-{####}
 * Permanent (promote later): ABTA-{YYYY}-{####}
 */

import { FieldValue, getFirestore } from "firebase-admin/firestore";

const COUNTERS = "counters";

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

export async function allocateTempMemberId(now = new Date()): Promise<string> {
  const year = now.getFullYear();
  const ref = getFirestore().collection(COUNTERS).doc(`tempMembers-${year}`);

  const seq = await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data()?.seq ?? 0) : 0) + 1;
    tx.set(
      ref,
      { seq: next, year, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return next;
  });

  return `ABTA-T-${year}-${pad4(seq)}`;
}

/** Reserved for registrar promote flow (not used in this slice). */
export async function allocatePermanentMemberId(now = new Date()): Promise<string> {
  const year = now.getFullYear();
  const ref = getFirestore().collection(COUNTERS).doc(`members-${year}`);

  const seq = await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data()?.seq ?? 0) : 0) + 1;
    tx.set(
      ref,
      { seq: next, year, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return next;
  });

  return `ABTA-${year}-${pad4(seq)}`;
}
