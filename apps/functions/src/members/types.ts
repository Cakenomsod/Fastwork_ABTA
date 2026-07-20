/**
 * Domain types for ABTA members + payments.
 * Enum keys are stored in Firestore; Thai labels are derived for display,
 * aligned with ABTA-System/05-Status-and-SLA.md.
 */

import { Timestamp } from "firebase-admin/firestore";

export type MemberStatus =
  | "registered" // สมัครแล้ว
  | "pending_review" // รอตรวจสอบเอกสาร
  | "temporary" // สมาชิกชั่วคราว
  | "active" // สมาชิกสมบูรณ์
  | "near_expiry" // ใกล้หมดอายุ
  | "expired"; // หมดอายุ

export type PaymentStatus =
  | "awaiting_payment" // รอชำระเงิน
  | "payment_received" // ได้รับหลักฐานการชำระเงินแล้ว
  | "data_review" // รอตรวจสอบข้อมูล
  | "temp_receipt_issued" // ออกใบเสร็จชั่วคราวแล้ว
  | "slip_review" // รอตรวจสอบสลิป
  | "payment_confirmed" // ยืนยันการชำระเงินแล้ว
  | "official_receipt_issued"; // ออกใบเสร็จตัวจริงแล้ว

export type ReceiptStatus = "none" | "temp" | "pending_review" | "official" | "rejected";

export type DataReviewStatus = "pending" | "approved" | "rejected";

export type SeminarStatus =
  | "none"
  | "registered" // ลงทะเบียนแล้ว
  | "paid" // ชำระเงินแล้ว
  | "confirmed"; // ยืนยันสิทธิ์แล้ว

export type LinkType = "new_registration" | "legacy_bind" | "renewal";

/** Firestore document: collection `members`. */
export interface MemberDoc {
  memberId: string;
  tempMemberId?: string;
  legacyMemberId?: string;
  firstName: string;
  lastName: string;
  legalEntityName?: string;
  organization?: string;
  buildingName?: string;
  phone?: string;
  email?: string;
  lineUserId?: string;
  lineLinkedAt?: Timestamp;
  linkType?: LinkType;
  status: MemberStatus;
  memberCardUrl?: string;
  expiryDate?: Timestamp;
  dataReviewStatus?: DataReviewStatus;
  seminarStatus?: SeminarStatus;
  seminarTitle?: string;
  /** Set when registrar rejects data review; cleared on resubmit. */
  rejectReason?: string;
  rejectedBy?: string;
  /** Short random token gating the public web status page. */
  publicToken?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** Firestore document: collection `payments`. */
export interface PaymentDoc {
  paymentId: string;
  memberId: string;
  receiptNumber?: string;
  /** Prior receipt number kept for audit when replaced. */
  previousReceiptNumber?: string;
  receiptStatus: ReceiptStatus;
  receiptUrl?: string;
  slipUrl?: string;
  amount?: number;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ---------------------------------------------------------------------------
// Display maps (Thai)
// ---------------------------------------------------------------------------

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  registered: "สมัครแล้ว",
  pending_review: "รอตรวจสอบเอกสาร",
  temporary: "สมาชิกชั่วคราว",
  active: "สมาชิกสมบูรณ์",
  near_expiry: "ใกล้หมดอายุ",
  expired: "หมดอายุ",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  awaiting_payment: "รอชำระเงิน",
  payment_received: "ได้รับหลักฐานการชำระเงินแล้ว",
  data_review: "รอตรวจสอบข้อมูล",
  temp_receipt_issued: "ออกใบเสร็จชั่วคราวแล้ว",
  slip_review: "รอตรวจสอบสลิป (เหรัญญิก)",
  payment_confirmed: "ยืนยันการชำระเงินแล้ว",
  official_receipt_issued: "ออกใบเสร็จตัวจริงแล้ว",
};

export const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  none: "ยังไม่ออกใบเสร็จ",
  temp: "ใบเสร็จชั่วคราว",
  pending_review: "รอเหรัญญิกตรวจสลิป",
  official: "ใบเสร็จตัวจริง",
  rejected: "ไม่ผ่าน — รอออกเลขใหม่",
};

export const SEMINAR_STATUS_LABEL: Record<SeminarStatus, string> = {
  none: "ยังไม่ได้ลงทะเบียน",
  registered: "ลงทะเบียนแล้ว",
  paid: "ชำระเงินแล้ว",
  confirmed: "ยืนยันสิทธิ์แล้ว",
};

/** Semantic tone used to pick colors on both Flex + web. */
export type StatusTone = "active" | "temporary" | "warning" | "danger" | "neutral";

export function memberStatusTone(status: MemberStatus): StatusTone {
  switch (status) {
    case "active":
      return "active";
    case "temporary":
      return "temporary";
    case "near_expiry":
      return "warning";
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}
