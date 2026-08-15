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

export type LegacyMemberType =
  | "ordinary"
  | "extraordinary"
  | "associate"
  | "honorary"
  | "other";

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
  /** Google Drive (or http) links from Excel attachment columns. */
  idCardFileUrls?: string[];
  businessRegFileUrls?: string[];
  otherDocumentUrls?: string[];
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
  /** Transfer-slip image from Excel (usually a Google Drive URL). */
  slipUrl?: string;
  slipUrls?: string[];
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

/**
 * Overlay calendar expiry onto Excel Active/Expired.
 * Keeps Pending / NonActive as recorded. Date-only timestamps are UTC noon.
 */
export function applyLegacyExpiryStatus(
  status: LegacyMemberStatus,
  expiry: Timestamp | undefined,
  now: Date = new Date(),
): LegacyMemberStatus {
  if (status === "pending" || status === "non_active") return status;
  if (!expiry) return status;
  const todayNoon = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    12,
    0,
    0,
  );
  if (expiry.toMillis() < todayNoon) return "expired";
  return "active";
}

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
  if (label.includes("สมทบ")) {
    return { memberType: "associate", memberTypeLabel: label || "สมทบ" };
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
