/**
 * Assembles a presentation-ready StatusView from a member + latest payment.
 * Shared shape used by the LINE Flex message and the public web status page.
 */

import { Timestamp } from "firebase-admin/firestore";
import { MEMBERSHIP_FEE_THB } from "../config";
import {
  MEMBER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  RECEIPT_STATUS_LABEL,
  SEMINAR_STATUS_LABEL,
  memberStatusTone,
  type MemberDoc,
  type PaymentDoc,
  type StatusTone,
} from "./types";

export interface StatusView {
  memberId: string;
  fullName: string;
  legalEntityName?: string;
  statusKey: MemberDoc["status"];
  statusLabel: string;
  statusTone: StatusTone;
  expiryLabel?: string;
  expiryDaysLeft?: number;
  paymentLabel: string;
  /** Membership fee amount shown on the public receipt (THB). */
  amountThb?: number;
  /** Thai-formatted payment / receipt date when known. */
  paymentDateLabel?: string;
  receiptStatusKey: PaymentDoc["receiptStatus"];
  receiptLabel: string;
  receiptNumber?: string;
  seminarLabel: string;
  renewalLabel: string;
  memberCardUrl?: string;
  receiptUrl?: string;
  updatedAtLabel?: string;
  dataReviewStatus?: MemberDoc["dataReviewStatus"];
  rejectReason?: string;
  canResubmit?: boolean;
  canResubmitSlip?: boolean;
  canRenew?: boolean;
}

const TH_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function toDate(value: Timestamp | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  // Tolerate plain {seconds} objects that slipped through.
  const seconds = (value as { seconds?: number }).seconds;
  return typeof seconds === "number" ? new Date(seconds * 1000) : undefined;
}

/** e.g. 31 ธ.ค. 2569 (Buddhist era). */
export function formatThaiDate(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  const day = date.getDate();
  const month = TH_MONTHS[date.getMonth()];
  const beYear = date.getFullYear() + 543;
  return `${day} ${month} ${beYear}`;
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function paymentLabelFor(member: MemberDoc, payment?: PaymentDoc): string {
  if (payment?.receiptStatus === "rejected") {
    return "สลิปไม่ผ่าน — รอส่งใหม่";
  }
  if (payment) {
    if (payment.paymentKind === "renewal" && payment.status === "slip_review") {
      return "รอตรวจสลิปต่ออายุ";
    }
    return PAYMENT_STATUS_LABEL[payment.status] ?? payment.status;
  }
  // Legacy-bound members have no registration payment.
  if (
    member.linkType === "legacy_bind" ||
    member.legacyMemberId ||
    member.dataReviewStatus === "approved"
  ) {
    return "ไม่ต้องชำระเพิ่ม (สมาชิกเดิม)";
  }
  return "รอชำระเงิน";
}

function renewalLabelFor(member: MemberDoc, payment?: PaymentDoc): string {
  if (
    payment?.paymentKind === "renewal" &&
    (payment.status === "slip_review" || payment.receiptStatus === "temp")
  ) {
    return "รอเหรัญญิกตรวจสลิปต่ออายุ";
  }
  if (payment?.paymentKind === "renewal" && payment.receiptStatus === "rejected") {
    return "สลิปต่ออายุไม่ผ่าน — ส่งใหม่ได้";
  }
  if (member.status === "expired") return "หมดอายุ — ต่ออายุได้";
  if (member.status === "near_expiry") return "ใกล้หมดอายุ — แนะนำให้ต่ออายุ";
  if (
    payment?.paymentKind === "renewal" &&
    (payment.status === "official_receipt_issued" ||
      payment.receiptStatus === "official")
  ) {
    return "ต่ออายุแล้ว";
  }
  return "ยังไม่ถึงรอบต่ออายุ";
}

export function buildStatusView(member: MemberDoc, payment?: PaymentDoc): StatusView {
  const expiry = toDate(member.expiryDate);
  const expiryDaysLeft = expiry ? daysBetween(new Date(), expiry) : undefined;
  const updatedAt = toDate(member.updatedAt);
  const canResubmit = member.dataReviewStatus === "rejected";
  const canResubmitSlip =
    member.dataReviewStatus === "approved" &&
    payment?.receiptStatus === "rejected";
  const canRenew =
    !canResubmit &&
    (member.status === "near_expiry" ||
      member.status === "expired" ||
      member.status === "active" ||
      member.status === "temporary");
  const paymentDate =
    toDate(payment?.verifiedAt) ?? toDate(payment?.updatedAt) ?? toDate(payment?.createdAt);
  const amountThb = payment
    ? (typeof payment.amount === "number" ? payment.amount : MEMBERSHIP_FEE_THB)
    : undefined;

  return {
    memberId: member.memberId,
    fullName: `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim(),
    legalEntityName: member.legalEntityName || member.organization,
    statusKey: member.status,
    statusLabel: canResubmit
      ? "ข้อมูลไม่ผ่าน — รอแก้ไข"
      : MEMBER_STATUS_LABEL[member.status] ?? member.status,
    statusTone: canResubmit ? "danger" : memberStatusTone(member.status),
    expiryLabel: formatThaiDate(expiry),
    expiryDaysLeft,
    paymentLabel: paymentLabelFor(member, payment),
    amountThb,
    paymentDateLabel: formatThaiDate(paymentDate),
    receiptStatusKey: payment?.receiptStatus ?? "none",
    receiptLabel:
      payment?.receiptStatus === "rejected"
        ? "สลิปไม่ผ่าน"
        : RECEIPT_STATUS_LABEL[payment?.receiptStatus ?? "none"],
    receiptNumber: payment?.receiptNumber,
    seminarLabel: SEMINAR_STATUS_LABEL[member.seminarStatus ?? "none"],
    renewalLabel: renewalLabelFor(member, payment),
    memberCardUrl: member.memberCardUrl,
    receiptUrl: payment?.receiptUrl,
    updatedAtLabel: formatThaiDate(updatedAt),
    dataReviewStatus: member.dataReviewStatus,
    rejectReason: member.rejectReason ?? payment?.rejectReason,
    canResubmit,
    canResubmitSlip,
    canRenew,
  };
}

/** Safe subset for the public web page (no phone/email). */
export function toPublicStatus(view: StatusView) {
  return {
    memberId: view.memberId,
    fullName: view.fullName,
    legalEntityName: view.legalEntityName,
    statusKey: view.statusKey,
    statusLabel: view.statusLabel,
    statusTone: view.statusTone,
    expiryLabel: view.expiryLabel,
    expiryDaysLeft: view.expiryDaysLeft,
    paymentLabel: view.paymentLabel,
    amountThb: view.amountThb,
    paymentDateLabel: view.paymentDateLabel,
    receiptStatusKey: view.receiptStatusKey,
    receiptLabel: view.receiptLabel,
    receiptNumber: view.receiptNumber,
    seminarLabel: view.seminarLabel,
    renewalLabel: view.renewalLabel,
    memberCardUrl: view.memberCardUrl,
    receiptUrl: view.receiptUrl,
    updatedAtLabel: view.updatedAtLabel,
    dataReviewStatus: view.dataReviewStatus,
    rejectReason: view.rejectReason,
    canResubmit: view.canResubmit === true,
    canResubmitSlip: view.canResubmitSlip === true,
    canRenew: view.canRenew === true,
  };
}

export type PublicStatus = ReturnType<typeof toPublicStatus>;
