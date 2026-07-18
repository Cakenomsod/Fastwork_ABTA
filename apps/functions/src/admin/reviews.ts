/**
 * Registrar (data review) + Treasurer (slip review) workflows.
 */

import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { WEB_ORIGIN } from "../config";
import { pushMessages } from "../line/client";
import {
  dataReviewApprovedText,
  dataReviewRejectedText,
  slipReviewApprovedText,
  slipReviewRejectedText,
} from "../line/messages";
import { allocatePermanentMemberId } from "../members/ids";
import {
  MEMBERS_COLLECTION,
  PAYMENTS_COLLECTION,
  findLatestPayment,
  findMemberById,
} from "../members/repository";
import type { MemberDoc, PaymentDoc } from "../members/types";
import {
  allocateOfficialReceiptNumber,
  allocateTempReceiptNumber,
} from "./receipts";

export interface QueueMemberItem {
  memberId: string;
  tempMemberId?: string;
  fullName: string;
  phone?: string;
  email?: string;
  legalEntityName?: string;
  buildingName?: string;
  linkType?: string;
  status: string;
  dataReviewStatus?: string;
  createdAt?: string;
  paymentId?: string;
  amount?: number;
  receiptNumber?: string;
  receiptStatus?: string;
  paymentStatus?: string;
  hasSlip: boolean;
}

export interface MemberDetail extends QueueMemberItem {
  organization?: string;
  lineUserId?: string;
  expiryDate?: string;
  slipUrl?: string;
  slipViewUrl?: string;
  memberCardUrl?: string;
  rejectReason?: string;
}

function isoFromTs(ts?: Timestamp | { toDate?: () => Date }): string | undefined {
  if (!ts) return undefined;
  if (typeof (ts as Timestamp).toDate === "function") {
    return (ts as Timestamp).toDate().toISOString();
  }
  return undefined;
}

function toQueueItem(member: MemberDoc, payment?: PaymentDoc): QueueMemberItem {
  return {
    memberId: member.memberId,
    tempMemberId: member.tempMemberId,
    fullName: `${member.firstName} ${member.lastName}`.trim(),
    phone: member.phone,
    email: member.email,
    legalEntityName: member.legalEntityName,
    buildingName: member.buildingName,
    linkType: member.linkType,
    status: member.status,
    dataReviewStatus: member.dataReviewStatus,
    createdAt: isoFromTs(member.createdAt),
    paymentId: payment?.paymentId,
    amount: payment?.amount,
    receiptNumber: payment?.receiptNumber,
    receiptStatus: payment?.receiptStatus,
    paymentStatus: payment?.status,
    hasSlip: Boolean(payment?.slipUrl),
  };
}

/** Resolve gs:// or path slip storage into bucket + object path. */
export function slipObjectRef(
  slipUrl: string | undefined,
): { bucketName?: string; objectPath: string } | undefined {
  if (!slipUrl) return undefined;
  if (slipUrl.startsWith("http://") || slipUrl.startsWith("https://")) {
    return undefined;
  }
  if (slipUrl.startsWith("gs://")) {
    const without = slipUrl.slice("gs://".length);
    const slash = without.indexOf("/");
    if (slash > 0) {
      return {
        bucketName: without.slice(0, slash),
        objectPath: without.slice(slash + 1),
      };
    }
    return undefined;
  }
  return { objectPath: slipUrl };
}

export async function listPendingDataReviews(): Promise<QueueMemberItem[]> {
  const snap = await getFirestore()
    .collection(MEMBERS_COLLECTION)
    .where("dataReviewStatus", "==", "pending")
    .get();

  const items: QueueMemberItem[] = [];
  for (const doc of snap.docs) {
    const member = doc.data() as MemberDoc;
    const payment = await findLatestPayment(member.memberId);
    items.push(toQueueItem(member, payment));
  }
  items.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  return items;
}

export async function listPendingSlipReviews(): Promise<QueueMemberItem[]> {
  // Prefer single-field equality to avoid composite index requirements.
  // Include temp receipts waiting for treasurer + rejected awaiting new slip.
  const db = getFirestore();
  const [tempSnap, pendingSnap, rejectedSnap] = await Promise.all([
    db.collection(PAYMENTS_COLLECTION).where("receiptStatus", "==", "temp").get(),
    db
      .collection(PAYMENTS_COLLECTION)
      .where("receiptStatus", "==", "pending_review")
      .get(),
    db.collection(PAYMENTS_COLLECTION).where("receiptStatus", "==", "rejected").get(),
  ]);

  const paymentDocs = [
    ...tempSnap.docs,
    ...pendingSnap.docs,
    ...rejectedSnap.docs,
  ];
  const seen = new Set<string>();
  const items: QueueMemberItem[] = [];

  for (const doc of paymentDocs) {
    const payment = doc.data() as PaymentDoc;
    if (seen.has(payment.paymentId)) continue;
    seen.add(payment.paymentId);
    if (payment.status === "official_receipt_issued") continue;
    const member = await findMemberById(payment.memberId);
    if (!member || member.dataReviewStatus !== "approved") continue;
    items.push(toQueueItem(member, payment));
  }

  items.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  return items;
}

export async function getAdminMemberDetail(
  memberId: string,
): Promise<MemberDetail | undefined> {
  const member = await findMemberById(memberId);
  if (!member) return undefined;
  const payment = await findLatestPayment(member.memberId);
  const base = toQueueItem(member, payment);
  const hasStoredSlip = Boolean(payment?.slipUrl);
  const httpSlip =
    payment?.slipUrl?.startsWith("http://") || payment?.slipUrl?.startsWith("https://")
      ? payment.slipUrl
      : undefined;
  return {
    ...base,
    organization: member.organization,
    lineUserId: member.lineUserId,
    expiryDate: isoFromTs(member.expiryDate),
    slipUrl: payment?.slipUrl,
    // Frontend appends auth via blob fetch — path relative to /api
    slipViewUrl: httpSlip
      ? httpSlip
      : hasStoredSlip
        ? `/admin/members/slip?memberId=${encodeURIComponent(member.memberId)}`
        : undefined,
    memberCardUrl: member.memberCardUrl,
    rejectReason: (member as MemberDoc & { rejectReason?: string }).rejectReason,
  };
}

export async function getDashboardStats(): Promise<{
  totalMembers: number;
  pendingDataReviews: number;
  pendingSlipReviews: number;
  activeMembers: number;
  temporaryMembers: number;
  recent: QueueMemberItem[];
}> {
  const db = getFirestore();
  const [membersSnap, pendingData, pendingSlips] = await Promise.all([
    db.collection(MEMBERS_COLLECTION).get(),
    listPendingDataReviews(),
    listPendingSlipReviews(),
  ]);

  let activeMembers = 0;
  let temporaryMembers = 0;
  const recentCandidates: { item: QueueMemberItem; ms: number }[] = [];

  for (const doc of membersSnap.docs) {
    const member = doc.data() as MemberDoc;
    if (member.status === "active") activeMembers += 1;
    if (member.status === "temporary") temporaryMembers += 1;
    const payment = await findLatestPayment(member.memberId);
    const item = toQueueItem(member, payment);
    recentCandidates.push({
      item,
      ms: member.updatedAt?.toMillis?.() ?? member.createdAt?.toMillis?.() ?? 0,
    });
  }

  recentCandidates.sort((a, b) => b.ms - a.ms);

  return {
    totalMembers: membersSnap.size,
    pendingDataReviews: pendingData.length,
    pendingSlipReviews: pendingSlips.length,
    activeMembers,
    temporaryMembers,
    recent: recentCandidates.slice(0, 10).map((r) => r.item),
  };
}

export async function searchMembers(query: string): Promise<QueueMemberItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const snap = await getFirestore().collection(MEMBERS_COLLECTION).get();
  const results: QueueMemberItem[] = [];

  for (const doc of snap.docs) {
    const m = doc.data() as MemberDoc;
    const hay = [
      m.memberId,
      m.tempMemberId,
      m.firstName,
      m.lastName,
      m.email,
      m.phone,
      m.legalEntityName,
      m.buildingName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    const payment = await findLatestPayment(m.memberId);
    results.push(toQueueItem(m, payment));
    if (results.length >= 30) break;
  }
  return results;
}

type ActionResult =
  | { ok: true; memberId: string; receiptNumber?: string; permanentMemberId?: string }
  | { ok: false; error: string; status: number };

export async function approveDataReview(
  memberId: string,
  actorEmail: string,
): Promise<ActionResult> {
  const member = await findMemberById(memberId);
  if (!member) return { ok: false, error: "not_found", status: 404 };
  if (member.dataReviewStatus !== "pending") {
    return { ok: false, error: "not_pending", status: 409 };
  }

  const payment = await findLatestPayment(member.memberId);
  if (!payment) return { ok: false, error: "payment_not_found", status: 404 };

  const permanentId = await allocatePermanentMemberId();
  const receiptNumber = await allocateTempReceiptNumber();
  const now = Timestamp.now();
  const token = member.publicToken ?? "";
  const memberCardUrl = `${WEB_ORIGIN}/card?m=${encodeURIComponent(permanentId)}&t=${token}`;
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(permanentId)}&t=${token}`;
  const receiptUrl = `${WEB_ORIGIN}/receipt?m=${encodeURIComponent(permanentId)}&t=${token}`;

  const db = getFirestore();
  const batch = db.batch();
  const oldRef = db.collection(MEMBERS_COLLECTION).doc(member.memberId);
  const newRef = db.collection(MEMBERS_COLLECTION).doc(permanentId);

  const updatedMember: MemberDoc = {
    ...member,
    memberId: permanentId,
    tempMemberId: member.tempMemberId ?? member.memberId,
    status: "active",
    dataReviewStatus: "approved",
    memberCardUrl,
    updatedAt: now,
  };
  // Clear reject reason if present
  delete (updatedMember as MemberDoc & { rejectReason?: string }).rejectReason;

  batch.set(newRef, updatedMember);
  if (oldRef.path !== newRef.path) {
    batch.delete(oldRef);
  }

  batch.set(
    db.collection(PAYMENTS_COLLECTION).doc(payment.paymentId),
    {
      memberId: permanentId,
      receiptNumber,
      receiptStatus: "temp",
      receiptUrl,
      status: "slip_review",
      verifiedBy: actorEmail,
      verifiedAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  await batch.commit();

  if (member.lineUserId) {
    try {
      await pushMessages(member.lineUserId, [
        dataReviewApprovedText({
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          permanentMemberId: permanentId,
          receiptNumber,
          statusUrl,
        }),
      ]);
    } catch (err) {
      console.error("LINE notify data approve failed", err);
    }
  }

  return {
    ok: true,
    memberId: permanentId,
    permanentMemberId: permanentId,
    receiptNumber,
  };
}

export async function rejectDataReview(
  memberId: string,
  actorEmail: string,
  reason: string,
): Promise<ActionResult> {
  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, error: "reason_required", status: 400 };

  const member = await findMemberById(memberId);
  if (!member) return { ok: false, error: "not_found", status: 404 };
  if (member.dataReviewStatus !== "pending") {
    return { ok: false, error: "not_pending", status: 409 };
  }

  // Keep memberId for now — a fresh temp ID is allocated when the member resubmits.
  const now = Timestamp.now();
  const token = member.publicToken ?? "";
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;

  const payment = await findLatestPayment(member.memberId);
  const db = getFirestore();
  const batch = db.batch();

  batch.set(
    db.collection(MEMBERS_COLLECTION).doc(member.memberId),
    {
      dataReviewStatus: "rejected",
      status: "temporary",
      rejectReason: trimmed,
      rejectedBy: actorEmail,
      updatedAt: now,
    },
    { merge: true },
  );

  if (payment) {
    batch.set(
      db.collection(PAYMENTS_COLLECTION).doc(payment.paymentId),
      {
        updatedAt: now,
        status: "data_review",
        receiptStatus: "none",
        receiptNumber: FieldValue.delete(),
      },
      { merge: true },
    );
  }

  await batch.commit();

  if (member.lineUserId) {
    try {
      await pushMessages(member.lineUserId, [
        dataReviewRejectedText({
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          memberId: member.memberId,
          reason: trimmed,
          statusUrl,
        }),
      ]);
    } catch (err) {
      console.error("LINE notify data reject failed", err);
    }
  }

  return { ok: true, memberId: member.memberId };
}

export async function approveSlipReview(
  memberId: string,
  actorEmail: string,
): Promise<ActionResult> {
  const member = await findMemberById(memberId);
  if (!member) return { ok: false, error: "not_found", status: 404 };
  if (member.dataReviewStatus !== "approved") {
    return { ok: false, error: "data_not_approved", status: 409 };
  }

  const payment = await findLatestPayment(member.memberId);
  if (!payment) return { ok: false, error: "payment_not_found", status: 404 };
  if (
    payment.receiptStatus === "official" ||
    payment.status === "official_receipt_issued"
  ) {
    return { ok: false, error: "already_official", status: 409 };
  }

  const receiptNumber = await allocateOfficialReceiptNumber();
  const now = Timestamp.now();
  const token = member.publicToken ?? "";
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;
  const receiptUrl = `${WEB_ORIGIN}/receipt?m=${encodeURIComponent(member.memberId)}&t=${token}`;

  await getFirestore()
    .collection(PAYMENTS_COLLECTION)
    .doc(payment.paymentId)
    .set(
      {
        receiptNumber,
        receiptStatus: "official",
        receiptUrl,
        status: "official_receipt_issued",
        verifiedBy: actorEmail,
        verifiedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

  await getFirestore()
    .collection(MEMBERS_COLLECTION)
    .doc(member.memberId)
    .set({ updatedAt: now }, { merge: true });

  if (member.lineUserId) {
    try {
      await pushMessages(member.lineUserId, [
        slipReviewApprovedText({
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          memberId: member.memberId,
          receiptNumber,
          statusUrl,
        }),
      ]);
    } catch (err) {
      console.error("LINE notify slip approve failed", err);
    }
  }

  return { ok: true, memberId: member.memberId, receiptNumber };
}

export async function rejectSlipReview(
  memberId: string,
  actorEmail: string,
  reason: string,
): Promise<ActionResult> {
  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, error: "reason_required", status: 400 };

  const member = await findMemberById(memberId);
  if (!member) return { ok: false, error: "not_found", status: 404 };
  if (member.dataReviewStatus !== "approved") {
    return { ok: false, error: "data_not_approved", status: 409 };
  }

  const payment = await findLatestPayment(member.memberId);
  if (!payment) return { ok: false, error: "payment_not_found", status: 404 };

  // New receipt number reserved for next approval (docs: ออกเลขใบเสร็จใหม่)
  const nextReceiptNumber = await allocateTempReceiptNumber();
  const now = Timestamp.now();
  const token = member.publicToken ?? "";
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;

  await getFirestore()
    .collection(PAYMENTS_COLLECTION)
    .doc(payment.paymentId)
    .set(
      {
        receiptStatus: "rejected",
        // Keep previous number visible; store next reserved number
        receiptNumber: nextReceiptNumber,
        status: "slip_review",
        rejectReason: trimmed,
        verifiedBy: actorEmail,
        verifiedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

  if (member.lineUserId) {
    try {
      await pushMessages(member.lineUserId, [
        slipReviewRejectedText({
          fullName: `${member.firstName} ${member.lastName}`.trim(),
          memberId: member.memberId,
          reason: trimmed,
          nextReceiptNumber,
          statusUrl,
        }),
      ]);
    } catch (err) {
      console.error("LINE notify slip reject failed", err);
    }
  }

  return {
    ok: true,
    memberId: member.memberId,
    receiptNumber: nextReceiptNumber,
  };
}
