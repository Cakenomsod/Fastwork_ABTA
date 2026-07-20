/**
 * Registrar (data review) + Treasurer (slip review) workflows.
 */

import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { LIFF_URL, WEB_ORIGIN, isConfiguredLiffUrl } from "../config";
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
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  email?: string;
  legalEntityName?: string;
  buildingName?: string;
  linkType?: string;
  status: string;
  dataReviewStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  /** When treasurer confirmed payment / issued official receipt. */
  verifiedAt?: string;
  paymentId?: string;
  amount?: number;
  receiptNumber?: string;
  receiptStatus?: string;
  paymentStatus?: string;
  hasSlip: boolean;
}

/** Display-status filter aligned with admin StatusBadge labels. */
export type MemberListStatusFilter =
  | "pending_data"
  | "pending_slip"
  | "temporary"
  | "active";

export type MemberIdTFilter = "with_t" | "without_t";

export type MemberListSort =
  | "member_asc"
  | "member_desc"
  | "t_first"
  | "no_t_first"
  | "confirmed_desc"
  | "updated_desc";

export interface ListMembersOpts {
  q?: string;
  status?: MemberListStatusFilter | "";
  memberIdT?: MemberIdTFilter | "";
  sort?: MemberListSort;
  limit?: number;
}

export interface MemberDetail extends QueueMemberItem {
  legacyMemberId?: string;
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
  const firstName = member.firstName ?? "";
  const lastName = member.lastName ?? "";
  return {
    memberId: member.memberId,
    tempMemberId: member.tempMemberId,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    phone: member.phone,
    email: member.email,
    legalEntityName: member.legalEntityName,
    buildingName: member.buildingName,
    linkType: member.linkType,
    status: member.status,
    dataReviewStatus: member.dataReviewStatus,
    createdAt: isoFromTs(member.createdAt),
    updatedAt: isoFromTs(member.updatedAt),
    verifiedAt: isoFromTs(payment?.verifiedAt),
    paymentId: payment?.paymentId,
    amount: payment?.amount,
    receiptNumber: payment?.receiptNumber,
    receiptStatus: payment?.receiptStatus,
    paymentStatus: payment?.status,
    hasSlip: Boolean(payment?.slipUrl),
  };
}

/** Temp IDs use ABTA-T-{YYYY}-{####} (letter T in the id). */
export function memberIdHasT(memberId: string): boolean {
  return /T/i.test(memberId);
}

function isAwaitingSlipReview(item: {
  dataReviewStatus?: string;
  paymentStatus?: string;
  receiptStatus?: string;
}): boolean {
  if (item.dataReviewStatus === "pending" || item.dataReviewStatus === "rejected") {
    return false;
  }
  if (item.paymentStatus === "slip_review") return true;
  if (
    item.receiptStatus === "temp" ||
    item.receiptStatus === "pending_review" ||
    item.receiptStatus === "rejected"
  ) {
    return item.dataReviewStatus === "approved";
  }
  return false;
}

/** Display category used by admin badges / status filter. */
export function memberDisplayStatus(
  item: Pick<
    QueueMemberItem,
    "status" | "dataReviewStatus" | "paymentStatus" | "receiptStatus"
  >,
): MemberListStatusFilter | "other" {
  if (item.dataReviewStatus === "pending") return "pending_data";
  if (isAwaitingSlipReview(item)) return "pending_slip";
  if (item.status === "active") return "active";
  if (item.status === "temporary") return "temporary";
  return "other";
}

function memberIdSortParts(memberId: string): {
  hasT: boolean;
  year: number;
  seq: number;
  raw: string;
} {
  const nums = memberId.match(/\d+/g)?.map(Number) ?? [];
  const year = nums.find((n) => n >= 2000 && n <= 2100) ?? 0;
  const seq = nums.length > 0 ? (nums[nums.length - 1] ?? 0) : 0;
  return { hasT: memberIdHasT(memberId), year, seq, raw: memberId };
}

function compareMemberId(a: string, b: string): number {
  const pa = memberIdSortParts(a);
  const pb = memberIdSortParts(b);
  if (pa.year !== pb.year) return pa.year - pb.year;
  if (pa.seq !== pb.seq) return pa.seq - pb.seq;
  return pa.raw.localeCompare(pb.raw, "en");
}

function sortMemberItems(
  items: QueueMemberItem[],
  sort: MemberListSort,
): QueueMemberItem[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sort) {
      case "member_asc":
        return compareMemberId(a.memberId, b.memberId);
      case "member_desc":
        return compareMemberId(b.memberId, a.memberId);
      case "t_first": {
        const ta = memberIdHasT(a.memberId) ? 0 : 1;
        const tb = memberIdHasT(b.memberId) ? 0 : 1;
        if (ta !== tb) return ta - tb;
        return compareMemberId(a.memberId, b.memberId);
      }
      case "no_t_first": {
        const ta = memberIdHasT(a.memberId) ? 1 : 0;
        const tb = memberIdHasT(b.memberId) ? 1 : 0;
        if (ta !== tb) return ta - tb;
        return compareMemberId(a.memberId, b.memberId);
      }
      case "confirmed_desc": {
        const va = a.verifiedAt ?? "";
        const vb = b.verifiedAt ?? "";
        if (va !== vb) return vb.localeCompare(va);
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      }
      case "updated_desc":
      default:
        return (b.updatedAt ?? b.createdAt ?? "").localeCompare(
          a.updatedAt ?? a.createdAt ?? "",
        );
    }
  });
  return sorted;
}

function matchesStatusFilter(
  item: QueueMemberItem,
  status: MemberListStatusFilter,
): boolean {
  return memberDisplayStatus(item) === status;
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
    legacyMemberId: member.legacyMemberId,
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

/**
 * List / search members with optional status + T-in-id filters and sort.
 * Scans the members collection (same as prior search) then filters in memory.
 */
export async function listMembers(
  opts: ListMembersOpts = {},
): Promise<QueueMemberItem[]> {
  const q = (opts.q ?? "").trim().toLowerCase();
  const status = opts.status || undefined;
  const memberIdT = opts.memberIdT || undefined;
  const sort: MemberListSort = opts.sort ?? "updated_desc";
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);

  // Empty search with no filters/sort: return nothing (dashboard uses recent).
  // Empty search WITH filters or explicit sort: browse mode over all members.
  if (!q && !status && !memberIdT && !opts.sort) {
    return [];
  }

  const snap = await getFirestore().collection(MEMBERS_COLLECTION).get();
  const results: QueueMemberItem[] = [];

  for (const doc of snap.docs) {
    const m = doc.data() as MemberDoc;
    if (q) {
      const hay = [
        m.memberId,
        m.tempMemberId,
        m.legacyMemberId,
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
    }
    if (memberIdT === "with_t" && !memberIdHasT(m.memberId)) continue;
    if (memberIdT === "without_t" && memberIdHasT(m.memberId)) continue;

    const payment = await findLatestPayment(m.memberId);
    const item = toQueueItem(m, payment);
    if (status && !matchesStatusFilter(item, status)) continue;
    results.push(item);
  }

  return sortMemberItems(results, sort).slice(0, limit);
}

/** @deprecated Prefer listMembers — kept for call sites that only pass a query. */
export async function searchMembers(query: string): Promise<QueueMemberItem[]> {
  const q = query.trim();
  if (!q) return [];
  return listMembers({ q, sort: "updated_desc", limit: 30 });
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
  const receiptNumber = await allocateTempReceiptNumber(
    new Date(),
    payment.paymentId,
  );
  const now = Timestamp.now();
  const token = member.publicToken ?? "";
  const memberCardUrl = `${WEB_ORIGIN}/card?m=${encodeURIComponent(permanentId)}&t=${token}`;
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(permanentId)}&t=${token}`;
  const receiptUrl = `${WEB_ORIGIN}/receipt?m=${encodeURIComponent(permanentId)}&t=${token}`;

  const db = getFirestore();
  const oldRef = db.collection(MEMBERS_COLLECTION).doc(member.memberId);
  const newRef = db.collection(MEMBERS_COLLECTION).doc(permanentId);

  const existingTarget = await newRef.get();
  if (existingTarget.exists && oldRef.path !== newRef.path) {
    return { ok: false, error: "member_id_taken", status: 409 };
  }

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

  const batch = db.batch();
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

  // Keep temporary memberId — member edits & resubmits on the same record.
  const now = Timestamp.now();
  const token = member.publicToken ?? "";
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;
  const editUrl = isConfiguredLiffUrl() ? LIFF_URL : `${WEB_ORIGIN}/register`;

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
          editUrl,
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

  const receiptNumber = await allocateOfficialReceiptNumber(
    new Date(),
    payment.paymentId,
  );
  const now = Timestamp.now();
  const token = member.publicToken ?? "";
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;
  const receiptUrl = `${WEB_ORIGIN}/receipt?m=${encodeURIComponent(member.memberId)}&t=${token}`;

  const db = getFirestore();
  const batch = db.batch();
  if (payment.receiptNumber && payment.receiptNumber !== receiptNumber) {
    batch.delete(
      db.collection("idRegistry").doc(`receipts_${payment.receiptNumber}`),
    );
  }
  batch.set(
    db.collection(PAYMENTS_COLLECTION).doc(payment.paymentId),
    {
      previousReceiptNumber: payment.receiptNumber ?? null,
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
  batch.set(
    db.collection(MEMBERS_COLLECTION).doc(member.memberId),
    { updatedAt: now },
    { merge: true },
  );
  await batch.commit();

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
  const previousReceiptNumber = payment.receiptNumber;
  const nextReceiptNumber = await allocateTempReceiptNumber(
    new Date(),
    payment.paymentId,
  );
  const now = Timestamp.now();
  const token = member.publicToken ?? "";
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(member.memberId)}&t=${token}`;

  const db = getFirestore();
  const batch = db.batch();
  if (previousReceiptNumber && previousReceiptNumber !== nextReceiptNumber) {
    batch.delete(
      db.collection("idRegistry").doc(`receipts_${previousReceiptNumber}`),
    );
  }
  batch.set(
    db.collection(PAYMENTS_COLLECTION).doc(payment.paymentId),
    {
      previousReceiptNumber: previousReceiptNumber ?? null,
      receiptStatus: "rejected",
      receiptNumber: nextReceiptNumber,
      status: "slip_review",
      rejectReason: trimmed,
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
