/**
 * Admin receipt search + payment-scoped receipt view for Back Office.
 */

import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { WEB_ORIGIN } from "../config";
import { parseReceiptNumber } from "../members/id-registry";
import { memberCardUrls } from "../members/public-token";
import {
  PAYMENTS_COLLECTION,
  ensureMemberPublicToken,
  findMemberById,
  findPaymentById,
} from "../members/repository";
import { buildStatusView, toPublicStatus } from "../members/status-view";
import {
  RECEIPT_STATUS_LABEL,
  type MemberDoc,
  type PaymentDoc,
} from "../members/types";

export type ReceiptKind = "official" | "temp";

export type ReceiptSearchItem = {
  paymentId: string;
  memberId: string;
  fullName: string;
  phone?: string;
  receiptNumber: string;
  amount?: number;
  receiptStatus: string;
  receiptStatusLabel: string;
  paymentKind?: PaymentDoc["paymentKind"];
  paymentKindLabel: string;
  createdAt?: string;
  verifiedAt?: string;
  /** Admin print route (payment-scoped). */
  printPath: string;
  /** Public member receipt link (latest payment on that page). */
  memberReceiptUrl?: string;
};

export type ReceiptSearchResult = {
  items: ReceiptSearchItem[];
  matched: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function isoFromTs(ts?: Timestamp | { toDate?: () => Date }): string | undefined {
  if (!ts) return undefined;
  if (typeof (ts as Timestamp).toDate === "function") {
    return (ts as Timestamp).toDate().toISOString();
  }
  return undefined;
}

function paymentKindLabel(kind?: PaymentDoc["paymentKind"]): string {
  if (kind === "renewal") return "ต่ออายุ";
  if (kind === "seminar") return "สัมมนา";
  if (kind === "registration") return "สมัครสมาชิก";
  return "—";
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function matchesReceiptByKindAndSeq(
  receiptNumber: string,
  kind: ReceiptKind,
  seqInput: string,
): boolean {
  const parsed = parseReceiptNumber(receiptNumber);
  if (!parsed || parsed.kind !== kind) return false;

  const raw = seqInput.trim();
  if (!raw) return false;

  const dashMatch = /^(\d{4})-(\d{1,4})$/.exec(raw);
  if (dashMatch) {
    return (
      parsed.year === Number(dashMatch[1]) &&
      parsed.seq === Number(dashMatch[2])
    );
  }

  const seqNum = Number(raw.replace(/^0+/, "") || "0");
  if (!Number.isFinite(seqNum)) return false;
  return parsed.seq === seqNum;
}

function memberMatchesSearch(
  member: MemberDoc,
  opts: {
    memberId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  },
): boolean {
  const memberIdQ = (opts.memberId ?? "").trim().toUpperCase();
  const firstNameQ = (opts.firstName ?? "").trim();
  const lastNameQ = (opts.lastName ?? "").trim();
  const phoneQ = digitsOnly(opts.phone ?? "");

  if (memberIdQ) {
    const hay = [
      member.memberId,
      member.tempMemberId,
      member.pendingMemberId,
    ]
      .filter(Boolean)
      .map((v) => String(v).toUpperCase());
    if (!hay.some((v) => v.includes(memberIdQ))) return false;
  }

  if (firstNameQ) {
    const first = (member.firstName ?? "").trim();
    if (!first.includes(firstNameQ)) return false;
  }

  if (lastNameQ) {
    const last = (member.lastName ?? "").trim();
    if (!last.includes(lastNameQ)) return false;
  }

  if (phoneQ) {
    const phone = digitsOnly(member.phone ?? "");
    if (!phone.includes(phoneQ)) return false;
  }

  return true;
}

export async function searchReceipts(opts: {
  receiptKind?: ReceiptKind;
  receiptSeq?: string;
  memberId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  page?: number;
  pageSize?: number;
}): Promise<ReceiptSearchResult> {
  const receiptSeq = (opts.receiptSeq ?? "").trim();
  const receiptKind = opts.receiptKind;
  const memberIdQ = (opts.memberId ?? "").trim();
  const firstNameQ = (opts.firstName ?? "").trim();
  const lastNameQ = (opts.lastName ?? "").trim();
  const phoneQ = (opts.phone ?? "").trim();

  const hasReceipt = Boolean(receiptSeq);
  const hasMember = Boolean(memberIdQ || firstNameQ || lastNameQ || phoneQ);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 10, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);

  if (!hasReceipt && !hasMember) {
    return { items: [], matched: 0, page: 1, pageSize, pageCount: 1 };
  }

  if (hasReceipt && !receiptKind) {
    throw new Error("receipt_kind_required");
  }

  const snap = await getFirestore().collection(PAYMENTS_COLLECTION).get();
  const results: ReceiptSearchItem[] = [];

  for (const doc of snap.docs) {
    const p = doc.data() as PaymentDoc;
    const rn = (p.receiptNumber ?? "").trim();
    if (!rn) continue;

    if (
      hasReceipt &&
      receiptKind &&
      !matchesReceiptByKindAndSeq(rn, receiptKind, receiptSeq)
    ) {
      continue;
    }

    const member = await findMemberById(p.memberId);
    if (!member) continue;

    if (
      hasMember &&
      !memberMatchesSearch(member, {
        memberId: memberIdQ || undefined,
        firstName: firstNameQ || undefined,
        lastName: lastNameQ || undefined,
        phone: phoneQ || undefined,
      })
    ) {
      continue;
    }

    const token = await ensureMemberPublicToken(member);
    const urls = memberCardUrls(member.memberId, token);
    const firstName = member.firstName ?? "";
    const lastName = member.lastName ?? "";

    results.push({
      paymentId: p.paymentId,
      memberId: member.memberId,
      fullName: `${firstName} ${lastName}`.trim(),
      phone: member.phone,
      receiptNumber: rn,
      amount: p.amount,
      receiptStatus: p.receiptStatus,
      receiptStatusLabel: RECEIPT_STATUS_LABEL[p.receiptStatus] ?? p.receiptStatus,
      paymentKind: p.paymentKind,
      paymentKindLabel: paymentKindLabel(p.paymentKind),
      createdAt: isoFromTs(p.createdAt),
      verifiedAt: isoFromTs(p.verifiedAt),
      printPath: `/admin/receipts/print?paymentId=${encodeURIComponent(p.paymentId)}`,
      memberReceiptUrl: urls.receiptUrl,
    });
  }

  results.sort((a, b) =>
    (b.verifiedAt ?? b.createdAt ?? "").localeCompare(
      a.verifiedAt ?? a.createdAt ?? "",
    ),
  );

  const matched = results.length;
  const pageCount = Math.max(1, Math.ceil(matched / pageSize) || 1);
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    items: results.slice(start, start + pageSize),
    matched,
    page: safePage,
    pageSize,
    pageCount,
  };
}

/** Payment-scoped receipt payload for admin print preview. */
export async function getReceiptDetailForPayment(paymentId: string) {
  const payment = await findPaymentById(paymentId);
  if (!payment?.receiptNumber?.trim()) return undefined;

  const member = await findMemberById(payment.memberId);
  if (!member) return undefined;

  await ensureMemberPublicToken(member);
  const view = buildStatusView(member, payment);
  const publicStatus = toPublicStatus(view);
  const token = await ensureMemberPublicToken(member);
  const urls = memberCardUrls(member.memberId, token);

  return {
    ...publicStatus,
    paymentId: payment.paymentId,
    memberReceiptUrl: urls.receiptUrl,
    printUrl: `${WEB_ORIGIN}/admin/receipts/print?paymentId=${encodeURIComponent(payment.paymentId)}&print=1`,
  };
}
