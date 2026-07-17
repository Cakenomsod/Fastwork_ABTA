/**
 * Assembles a presentation-ready StatusView from a member + latest payment.
 * Shared shape used by the LINE Flex message and the public web status page.
 */

import { Timestamp } from "firebase-admin/firestore";
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
  receiptStatusKey: PaymentDoc["receiptStatus"];
  receiptLabel: string;
  receiptNumber?: string;
  seminarLabel: string;
  memberCardUrl?: string;
  receiptUrl?: string;
  updatedAtLabel?: string;
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

export function buildStatusView(member: MemberDoc, payment?: PaymentDoc): StatusView {
  const expiry = toDate(member.expiryDate);
  const expiryDaysLeft = expiry ? daysBetween(new Date(), expiry) : undefined;
  const updatedAt = toDate(member.updatedAt);

  return {
    memberId: member.memberId,
    fullName: `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim(),
    legalEntityName: member.legalEntityName || member.organization,
    statusKey: member.status,
    statusLabel: MEMBER_STATUS_LABEL[member.status] ?? member.status,
    statusTone: memberStatusTone(member.status),
    expiryLabel: formatThaiDate(expiry),
    expiryDaysLeft,
    paymentLabel: payment
      ? PAYMENT_STATUS_LABEL[payment.status] ?? payment.status
      : "รอชำระเงิน",
    receiptStatusKey: payment?.receiptStatus ?? "none",
    receiptLabel: RECEIPT_STATUS_LABEL[payment?.receiptStatus ?? "none"],
    receiptNumber: payment?.receiptNumber,
    seminarLabel: SEMINAR_STATUS_LABEL[member.seminarStatus ?? "none"],
    memberCardUrl: member.memberCardUrl,
    receiptUrl: payment?.receiptUrl,
    updatedAtLabel: formatThaiDate(updatedAt),
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
    receiptStatusKey: view.receiptStatusKey,
    receiptLabel: view.receiptLabel,
    receiptNumber: view.receiptNumber,
    seminarLabel: view.seminarLabel,
    memberCardUrl: view.memberCardUrl,
    receiptUrl: view.receiptUrl,
    updatedAtLabel: view.updatedAtLabel,
  };
}

export type PublicStatus = ReturnType<typeof toPublicStatus>;
