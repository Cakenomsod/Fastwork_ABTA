/**
 * Staff allowlist for ABTA Back Office.
 * Collection: `staffUsers` keyed by lowercase email.
 *
 * Roles are multi-select. Super-admin can always manage staff;
 * users with the `admin` role can also manage staff.
 */

import type { Timestamp } from "firebase-admin/firestore";

export type StaffRole = "admin" | "registrar" | "treasurer";

export const ALL_STAFF_ROLES: StaffRole[] = ["admin", "registrar", "treasurer"];

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  admin: "แอดมิน",
  registrar: "นายทะเบียน",
  treasurer: "เหรัญญิก",
};

/** Bootstrap super-admin — normalize case on every compare. */
export const SUPER_ADMIN_EMAIL = "phetklaowork01@gmail.com";

/** Known Firebase Auth UID for the bootstrap super-admin (Google). */
export const SUPER_ADMIN_UID = "HcCJg86QQJPiaBFAFPxL0KLMPjR2";

export interface StaffUserDoc {
  email: string;
  roles: StaffRole[];
  /** Firebase Auth UID when known (set on bootstrap / login). */
  uid?: string;
  /** True for the bootstrap account; always may manage staff. */
  isSuperAdmin?: boolean;
  displayName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

export function isSuperAdminEmail(email: string): boolean {
  return normalizeEmail(email) === SUPER_ADMIN_EMAIL;
}

export function superAdminStaffDoc(
  overrides?: Partial<StaffUserDoc>,
): StaffUserDoc {
  return {
    email: SUPER_ADMIN_EMAIL,
    roles: [...ALL_STAFF_ROLES],
    isSuperAdmin: true,
    displayName: "Super Admin",
    uid: SUPER_ADMIN_UID,
    ...overrides,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidStaffRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "registrar" || value === "treasurer";
}

export function canManageStaff(staff: Pick<StaffUserDoc, "roles" | "isSuperAdmin">): boolean {
  if (staff.isSuperAdmin) return true;
  return staff.roles.includes("admin");
}

export function hasAnyRole(
  staff: Pick<StaffUserDoc, "roles" | "isSuperAdmin">,
  roles: StaffRole[],
): boolean {
  if (staff.isSuperAdmin) return true;
  return roles.some((r) => staff.roles.includes(r));
}
