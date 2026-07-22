/**
 * Firestore access for members + payments (Admin SDK only — Phase 1 rules
 * deny all client access).
 */

import { Timestamp, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { MemberDoc, PaymentDoc } from "./types";
import {
  memberCardUrls,
  resolvePublicToken,
} from "./public-token";
import { buildStatusView, type StatusView } from "./status-view";

export const MEMBERS_COLLECTION = "members";
export const PAYMENTS_COLLECTION = "payments";

function db(): Firestore {
  return getFirestore();
}

/** Mint + persist publicToken if missing; returns the live token. */
export async function ensureMemberPublicToken(
  member: MemberDoc,
): Promise<string> {
  const existing = (member.publicToken ?? "").trim();
  if (existing) return existing;

  const token = resolvePublicToken();
  const urls = memberCardUrls(member.memberId, token);
  await db()
    .collection(MEMBERS_COLLECTION)
    .doc(member.memberId)
    .set(
      {
        publicToken: token,
        memberCardUrl: urls.memberCardUrl,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  member.publicToken = token;
  member.memberCardUrl = urls.memberCardUrl;
  return token;
}

export async function findMemberByLineUserId(
  lineUserId: string,
): Promise<MemberDoc | undefined> {
  const snap = await db()
    .collection(MEMBERS_COLLECTION)
    .where("lineUserId", "==", lineUserId)
    .limit(1)
    .get();
  return snap.empty ? undefined : (snap.docs[0].data() as MemberDoc);
}

export async function findMemberById(memberId: string): Promise<MemberDoc | undefined> {
  const snap = await db()
    .collection(MEMBERS_COLLECTION)
    .where("memberId", "==", memberId)
    .limit(1)
    .get();
  return snap.empty ? undefined : (snap.docs[0].data() as MemberDoc);
}

/** Latest payment for a member (by createdAt desc, tolerant of missing field). */
export async function findLatestPayment(
  memberId: string,
): Promise<PaymentDoc | undefined> {
  const snap = await db()
    .collection(PAYMENTS_COLLECTION)
    .where("memberId", "==", memberId)
    .get();
  if (snap.empty) return undefined;
  const payments = snap.docs.map((d) => d.data() as PaymentDoc);
  payments.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? 0;
    return bt - at;
  });
  return payments[0];
}

export async function getStatusViewByLineUserId(
  lineUserId: string,
): Promise<{ view: StatusView; publicToken?: string } | undefined> {
  const member = await findMemberByLineUserId(lineUserId);
  if (!member) return undefined;
  const publicToken = await ensureMemberPublicToken(member);
  const payment = await findLatestPayment(member.memberId);
  return { view: buildStatusView(member, payment), publicToken };
}

export async function getStatusViewByMemberId(
  memberId: string,
): Promise<{ view: StatusView; publicToken?: string } | undefined> {
  const member = await findMemberById(memberId);
  if (!member) return undefined;
  // Do NOT mint here — public card API must not create tokens for strangers.
  const payment = await findLatestPayment(member.memberId);
  return { view: buildStatusView(member, payment), publicToken: member.publicToken };
}
