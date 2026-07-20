/**
 * Sequential temporary / permanent member IDs.
 * Temp: ABTA-T-{YYYY}-{####}
 * Permanent (promote later): ABTA-{YYYY}-{####}
 *
 * Allocation bumps `counters` and reserves a slot in `idRegistry` atomically.
 */

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  COUNTERS,
  memberRegistryRef,
  writeMemberRegistryInTx,
} from "./id-registry";

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

async function allocateMemberId(
  kind: "temp" | "permanent",
  now = new Date(),
): Promise<string> {
  const year = now.getFullYear();
  const counterId =
    kind === "temp" ? `tempMembers-${year}` : `members-${year}`;
  const ref = getFirestore().collection(COUNTERS).doc(counterId);

  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let seq = (snap.exists ? Number(snap.data()?.seq ?? 0) : 0) + 1;
    let candidate =
      kind === "temp"
        ? `ABTA-T-${year}-${pad4(seq)}`
        : `ABTA-${year}-${pad4(seq)}`;

    for (let i = 0; i < 20; i++) {
      const regSnap = await tx.get(memberRegistryRef(candidate));
      if (!regSnap.exists) break;
      seq += 1;
      candidate =
        kind === "temp"
          ? `ABTA-T-${year}-${pad4(seq)}`
          : `ABTA-${year}-${pad4(seq)}`;
    }

    tx.set(
      ref,
      { seq, year, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    writeMemberRegistryInTx(tx, candidate, "allocate");
    return candidate;
  });
}

export async function allocateTempMemberId(now = new Date()): Promise<string> {
  return allocateMemberId("temp", now);
}

export async function allocatePermanentMemberId(
  now = new Date(),
): Promise<string> {
  return allocateMemberId("permanent", now);
}
