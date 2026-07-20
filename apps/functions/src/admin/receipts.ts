/**
 * Sequential receipt numbers.
 * Temp: RC-T-{YYYY}-{####}
 * Official: RC-{YYYY}-{####}
 *
 * Allocation bumps `counters` and reserves a slot in `idRegistry` atomically.
 */

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  COUNTERS,
  receiptRegistryRef,
  writeReceiptRegistryInTx,
} from "../members/id-registry";

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

async function allocateReceiptNumber(
  kind: "temp" | "official",
  paymentId: string | undefined,
  now = new Date(),
): Promise<string> {
  const year = now.getFullYear();
  const counterId =
    kind === "temp" ? `tempReceipts-${year}` : `receipts-${year}`;
  const ref = getFirestore().collection(COUNTERS).doc(counterId);

  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let seq = (snap.exists ? Number(snap.data()?.seq ?? 0) : 0) + 1;
    let candidate =
      kind === "temp"
        ? `RC-T-${year}-${pad4(seq)}`
        : `RC-${year}-${pad4(seq)}`;

    for (let i = 0; i < 20; i++) {
      const regSnap = await tx.get(receiptRegistryRef(candidate));
      if (!regSnap.exists) break;
      seq += 1;
      candidate =
        kind === "temp"
          ? `RC-T-${year}-${pad4(seq)}`
          : `RC-${year}-${pad4(seq)}`;
    }

    tx.set(
      ref,
      { seq, year, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    writeReceiptRegistryInTx(
      tx,
      candidate,
      paymentId ?? "pending",
      "allocate",
    );
    return candidate;
  });
}

export async function allocateTempReceiptNumber(
  now = new Date(),
  paymentId?: string,
): Promise<string> {
  return allocateReceiptNumber("temp", paymentId, now);
}

export async function allocateOfficialReceiptNumber(
  now = new Date(),
  paymentId?: string,
): Promise<string> {
  return allocateReceiptNumber("official", paymentId, now);
}
