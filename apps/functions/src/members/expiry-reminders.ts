/**
 * Daily job: refresh near_expiry/expired status + LINE reminders at 45 and 15 days.
 */

import {
  FieldValue,
  Timestamp,
  getFirestore,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { liffPageUri } from "../config";
import { pushMessages } from "../line/client";
import { expiryReminderText } from "../line/messages";
import {
  EXPIRY_REMINDER_DAYS,
  applyExpiryToMemberStatus,
  daysUntilExpiry,
  type ExpiryReminderOffset,
} from "./membership";
import {
  memberCardUrls,
  resolvePublicToken,
} from "./public-token";
import { MEMBERS_COLLECTION } from "./repository";
import type { MemberDoc } from "./types";

function renewUrl(): string {
  return liffPageUri("/renew");
}

function formatExpiryTh(d: Date): string {
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shouldRemindMember(m: MemberDoc): boolean {
  if (!m.lineUserId || !m.expiryDate) return false;
  if (
    m.status !== "active" &&
    m.status !== "near_expiry" &&
    m.status !== "temporary"
  ) {
    return false;
  }
  const t = m.memberType ?? "ordinary";
  return t === "ordinary" || t === "extraordinary";
}

export type ExpiryReminderRunResult = {
  scanned: number;
  statusUpdated: number;
  reminded: number;
  tokensBackfilled: number;
  errors: number;
};

export async function runExpiryReminderJob(
  now: Date = new Date(),
): Promise<ExpiryReminderRunResult> {
  const db = getFirestore();
  let scanned = 0;
  let statusUpdated = 0;
  let reminded = 0;
  let tokensBackfilled = 0;
  let errors = 0;

  let lastDoc: QueryDocumentSnapshot | undefined;
  const pageSize = 200;

  for (;;) {
    let query = db
      .collection(MEMBERS_COLLECTION)
      .orderBy("__name__")
      .limit(pageSize);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snap = await query.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      scanned += 1;
      const m = doc.data() as MemberDoc;
      const updates: Record<string, unknown> = {
        updatedAt: Timestamp.fromDate(now),
      };
      let dirty = false;

      // Harden card URLs: every member must have a non-empty publicToken.
      const existingToken = (m.publicToken ?? "").trim();
      if (!existingToken) {
        const token = resolvePublicToken(m.publicToken);
        const urls = memberCardUrls(m.memberId, token);
        updates.publicToken = token;
        updates.memberCardUrl = urls.memberCardUrl;
        dirty = true;
        tokensBackfilled += 1;
      }

      const expiry = m.expiryDate?.toDate?.();
      if (!expiry) {
        if (dirty) {
          try {
            await doc.ref.set(updates, { merge: true });
          } catch (err) {
            errors += 1;
            console.error("token backfill update failed", m.memberId, err);
          }
        }
        continue;
      }

      const nextStatus = applyExpiryToMemberStatus(m.status, expiry, now);
      if (nextStatus !== m.status) {
        updates.status = nextStatus;
        dirty = true;
        statusUpdated += 1;
      }

      const daysLeft = daysUntilExpiry(expiry, now);
      let sent = [...(m.expiryRemindersSent ?? [])];

      if (daysLeft > 45 && sent.length > 0) {
        updates.expiryRemindersSent = FieldValue.delete();
        sent = [];
        dirty = true;
      }

      const liveStatus = (updates.status as MemberDoc["status"]) ?? m.status;
      const canRemind =
        shouldRemindMember({ ...m, status: liveStatus }) &&
        Boolean(m.lineUserId);

      if (canRemind) {
        for (const offset of EXPIRY_REMINDER_DAYS) {
          if (daysLeft !== offset) continue;
          if (sent.includes(offset)) continue;

          try {
            await pushMessages(m.lineUserId!, [
              expiryReminderText({
                firstName: m.firstName,
                daysLeft: offset as ExpiryReminderOffset,
                expiryLabel: formatExpiryTh(expiry),
                renewUrl: renewUrl(),
              }),
            ]);
            sent.push(offset);
            updates.expiryRemindersSent = sent;
            dirty = true;
            reminded += 1;
          } catch (err) {
            errors += 1;
            console.error("expiry reminder push failed", m.memberId, err);
          }
        }
      }

      if (dirty) {
        try {
          await doc.ref.set(updates, { merge: true });
        } catch (err) {
          errors += 1;
          console.error("expiry reminder update failed", m.memberId, err);
        }
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) break;
  }

  return { scanned, statusUpdated, reminded, tokensBackfilled, errors };
}
