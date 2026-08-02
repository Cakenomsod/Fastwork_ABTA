/**
 * Membership fee schedule (confirmed by association 2026-08-02).
 * New registration includes 500 THB entrance fee in the totals below.
 */

import type { MemberType } from "./membership";

/** Types that pay a membership fee via self-service forms. */
export type PayableMemberType = "ordinary" | "extraordinary" | "associate";

export const PAYABLE_MEMBER_TYPES: readonly PayableMemberType[] = [
  "ordinary",
  "extraordinary",
  "associate",
] as const;

/** New join (ค่าแรกเข้า 500 รวมแล้ว). */
export const NEW_MEMBERSHIP_FEE_THB: Record<PayableMemberType, number> = {
  ordinary: 1500,
  extraordinary: 1000,
  associate: 5500,
};

/** Renew / change member type. */
export const RENEW_MEMBERSHIP_FEE_THB: Record<PayableMemberType, number> = {
  ordinary: 1000,
  extraordinary: 500,
  associate: 5000,
};

export function isPayableMemberType(raw: unknown): raw is PayableMemberType {
  return (
    raw === "ordinary" || raw === "extraordinary" || raw === "associate"
  );
}

export function parsePayableMemberType(
  raw: unknown,
  fallback: PayableMemberType = "ordinary",
): PayableMemberType {
  return isPayableMemberType(raw) ? raw : fallback;
}

export function newMembershipFeeThb(type: PayableMemberType): number {
  return NEW_MEMBERSHIP_FEE_THB[type];
}

export function renewMembershipFeeThb(type: PayableMemberType): number {
  return RENEW_MEMBERSHIP_FEE_THB[type];
}

/** Map stored member type to a payable fee tier (honorary/other → ordinary fee). */
export function payableTypeFromMemberType(
  type: MemberType | string | undefined | null,
): PayableMemberType {
  if (type === "extraordinary") return "extraordinary";
  if (type === "associate") return "associate";
  return "ordinary";
}
