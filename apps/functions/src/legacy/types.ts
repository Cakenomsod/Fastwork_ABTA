/**
 * Legacy member types — imported from NewMemDatabase.xlsx into `legacyMembers`.
 * Read-only for member-facing flows until LINE bind (Phase B).
 */

import { Timestamp } from "firebase-admin/firestore";

export type LegacyMemberStatus =
  | "active"
  | "expired"
  | "non_active"
  | "pending";

export type LegacyMemberType = "ordinary" | "extraordinary" | "honorary" | "other";

export type LegacyEntityType = "juristic" | "individual" | "other";

/** Firestore document: collection `legacyMembers` (doc id = legacyMemberId). */
export interface LegacyMemberDoc {
  legacyMemberId: string;
  firstName: string;
  lastName: string;
  legalEntityName?: string;
  buildingName?: string;
  organization?: string;
  phone?: string;
  email?: string;
  status: LegacyMemberStatus;
  expiryDate?: Timestamp;
  memberType?: LegacyMemberType;
  memberTypeLabel?: string;
  entityType?: LegacyEntityType;
  entityTypeLabel?: string;
  /** National ID / juristic ID — restrict exposure in APIs. */
  idNumber?: string;
  businessPhone?: string;
  businessAddress?: string;
  personAddress?: string;
  registrarChecked?: boolean;
  reviewedAt?: Timestamp;
  certifiedAt?: Timestamp;
  importedAt: Timestamp;
  sourceFile: string;
  updatedAt?: Timestamp;
}

/** Optional payment history from Excel Transaction sheet. */
export interface LegacyPaymentDoc {
  legacyPaymentId: string;
  legacyMemberId: string;
  transferredAt?: Timestamp;
  item?: string;
  itemType?: string;
  amount?: number;
  receiptNumber?: string;
  treasurerChecked?: boolean;
  treasurerCheckedAt?: Timestamp;
  expiryDate?: Timestamp;
  receiptEmailFlag?: boolean;
  importedAt: Timestamp;
  sourceFile: string;
}

export const LEGACY_MEMBERS_COLLECTION = "legacyMembers";
export const LEGACY_PAYMENTS_COLLECTION = "legacyPayments";

export const LEGACY_STATUS_LABEL: Record<LegacyMemberStatus, string> = {
  active: "Active",
  expired: "Expired",
  non_active: "NonActive",
  pending: "Pending",
};

export function mapExcelStatus(raw: unknown): LegacyMemberStatus {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "active") return "active";
  if (s === "expired") return "expired";
  if (s === "nonactive" || s === "non_active" || s === "non-active") {
    return "non_active";
  }
  if (s === "pending") return "pending";
  return "pending";
}

export function mapExcelMemberType(raw: unknown): {
  memberType: LegacyMemberType;
  memberTypeLabel: string;
} {
  const label = String(raw ?? "").trim();
  if (label.includes("กิตติม")) {
    return { memberType: "honorary", memberTypeLabel: label || "กิตติมาศักดิ์" };
  }
  if (label.includes("วิสามัญ")) {
    return { memberType: "extraordinary", memberTypeLabel: label || "วิสามัญ" };
  }
  if (label.includes("สามัญ")) {
    return { memberType: "ordinary", memberTypeLabel: label || "สามัญ" };
  }
  return { memberType: "other", memberTypeLabel: label || "อื่น ๆ" };
}

export function mapExcelEntityType(raw: unknown): {
  entityType: LegacyEntityType;
  entityTypeLabel: string;
} {
  const label = String(raw ?? "").trim();
  if (label.includes("นิติ")) {
    return { entityType: "juristic", entityTypeLabel: label || "นิติบุคคล" };
  }
  if (label.includes("บุคคล")) {
    return { entityType: "individual", entityTypeLabel: label || "บุคคลธรรมดา" };
  }
  return { entityType: "other", entityTypeLabel: label || "อื่น ๆ" };
}

/** Split "ชื่อ นามสกุล" — last token = lastName, rest = firstName. */
export function splitThaiFullName(full: string): {
  firstName: string;
  lastName: string;
} {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "-" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}
