/**
 * Mid-March LINE reminder for board / committee members to renew
 * before the annual general meeting (April).
 */

import {
  Timestamp,
  getFirestore,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { liffPageUri } from "../config";
import { pushMessages } from "../line/client";
import { boardRenewalReminderText } from "../line/messages";
import { MEMBERS_COLLECTION } from "./repository";
import type { MemberDoc } from "./types";

const PAGE_SIZE = 200;

function renewUrl(): string {
  return liffPageUri("/renew");
}

export type BoardReminderRunResult = {
  scanned: number;
  reminded: number;
  skipped: number;
  errors: number;
  year: number;
};

/**
 * Send once per calendar year (tracked on member.boardRenewalReminderYear).
 * Intended to run on ~15 March Asia/Bangkok.
 */
export async function runBoardRenewalReminderJob(
  now: Date = new Date(),
): Promise<BoardReminderRunResult> {
  const year = now.getFullYear();
  const db = getFirestore();
  let scanned = 0;
  let reminded = 0;
  let skipped = 0;
  let errors = 0;

  let lastDoc: QueryDocumentSnapshot | undefined;

  for (;;) {
    let query = db
      .collection(MEMBERS_COLLECTION)
      .orderBy("__name__")
      .limit(PAGE_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snap = await query.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      scanned += 1;
      const m = doc.data() as MemberDoc;
      if (m.isBoardMember !== true) continue;

      const lineUserId = m.lineUserId?.trim();
      if (!lineUserId) {
        skipped += 1;
        continue;
      }

      if (m.boardRenewalReminderYear === year) {
        skipped += 1;
        continue;
      }

      if (
        m.status === "expired" ||
        m.status === "registered" ||
        m.status === "pending_review"
      ) {
        skipped += 1;
        continue;
      }

      try {
        await pushMessages(lineUserId, [
          boardRenewalReminderText({
            firstName: m.firstName,
            renewUrl: renewUrl(),
            year,
          }),
        ]);
        await doc.ref.set(
          {
            boardRenewalReminderYear: year,
            updatedAt: Timestamp.fromDate(now),
          },
          { merge: true },
        );
        reminded += 1;
      } catch (err) {
        errors += 1;
        console.error("board renewal reminder failed", m.memberId, err);
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;
  }

  return { scanned, reminded, skipped, errors, year };
}
