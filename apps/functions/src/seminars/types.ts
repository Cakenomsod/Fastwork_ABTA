/**
 * Seminar events + registrations (Phase 1).
 */

import { Timestamp } from "firebase-admin/firestore";

export type SeminarPricingType = "public_paid" | "member_free" | "member_paid";

export type SeminarRegistrationStatus =
  | "registered"
  | "paid"
  | "confirmed"
  | "rejected";

export interface SeminarDoc {
  seminarId: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  /** Fees in THB; member_free is typically 0. */
  pricing: Partial<Record<SeminarPricingType, number>>;
  active: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SeminarRegistrationDoc {
  registrationId: string;
  seminarId: string;
  memberId?: string;
  lineUserId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  applicantType: SeminarPricingType;
  feeThb: number;
  shirtSize?: string;
  foodType?: string;
  notes?: string;
  slipUrl?: string;
  status: SeminarRegistrationStatus;
  rejectReason?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const SEMINARS_COLLECTION = "seminars";
export const SEMINAR_REGISTRATIONS_COLLECTION = "seminarRegistrations";

export const SEMINAR_PRICING_LABEL: Record<SeminarPricingType, string> = {
  public_paid: "คนทั่วไป (เสียเงิน)",
  member_free: "สมาชิก (ฟรี)",
  member_paid: "สมาชิก (เสียเงิน)",
};
