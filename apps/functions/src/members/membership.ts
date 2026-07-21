/**
 * Membership year rules (Phase 1 — confirmed 21 Jul 2026):
 * - Ordinary / extraordinary expire on 31 Dec each year
 * - Auto reminders at 45 and 15 days before expiry
 * - "near_expiry" when ≤ 45 days remain
 */

import { Timestamp } from "firebase-admin/firestore";
import type { MemberStatus } from "./types";

export type MemberType = "ordinary" | "extraordinary" | "honorary" | "other";

export const MEMBER_TYPE_LABEL: Record<MemberType, string> = {
  ordinary: "สามัญ",
  extraordinary: "วิสามัญ",
  honorary: "กิตติมาศักดิ์",
  other: "อื่น ๆ",
};

/** Days before expiry when status becomes near_expiry. */
export const NEAR_EXPIRY_DAYS = 45;

/** Push reminder offsets (days before expiry). */
export const EXPIRY_REMINDER_DAYS = [45, 15] as const;

export type ExpiryReminderOffset = (typeof EXPIRY_REMINDER_DAYS)[number];

/** Date-only at UTC noon so th-TH clients keep the calendar day. */
export function dateOnlyUtcNoon(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
}

/**
 * Membership expiry = 31 Dec of the calendar year of `from`.
 * If `from` is already past that Dec 31, use 31 Dec of the next year.
 */
export function membershipExpiryDec31(from: Date = new Date()): Date {
  const y = from.getFullYear();
  const endLocal = new Date(y, 11, 31, 23, 59, 59, 999);
  if (from.getTime() > endLocal.getTime()) {
    return dateOnlyUtcNoon(y + 1, 11, 31);
  }
  return dateOnlyUtcNoon(y, 11, 31);
}

/** After renewal / payment: next 31 Dec after current expiry (or from today). */
export function nextMembershipExpiryDec31(fromExpiry?: Date | null): Date {
  const base = fromExpiry ?? new Date();
  const y = base.getFullYear();
  const endThisYear = dateOnlyUtcNoon(y, 11, 31);
  // If current expiry is already this year's Dec 31 (or later), jump to next year.
  if (base.getTime() >= endThisYear.getTime()) {
    return dateOnlyUtcNoon(y + 1, 11, 31);
  }
  return endThisYear;
}

export function membershipExpiryTimestamp(from: Date = new Date()): Timestamp {
  return Timestamp.fromDate(membershipExpiryDec31(from));
}

export function daysUntilExpiry(
  expiry: Date,
  now: Date = new Date(),
): number {
  const ms = expiry.getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

/**
 * Overlay expiry onto lifecycle status for members who already passed data review
 * (active / near_expiry / expired). Leave review/temporary statuses alone unless past expiry.
 */
export function applyExpiryToMemberStatus(
  status: MemberStatus,
  expiry: Date | undefined | null,
  now: Date = new Date(),
): MemberStatus {
  if (!expiry) return status;

  if (expiry.getTime() < now.getTime()) {
    if (
      status === "active" ||
      status === "near_expiry" ||
      status === "expired" ||
      status === "temporary"
    ) {
      return "expired";
    }
    return status;
  }

  const days = daysUntilExpiry(expiry, now);
  if (status === "active" || status === "near_expiry") {
    if (days <= NEAR_EXPIRY_DAYS) return "near_expiry";
    return "active";
  }

  return status;
}

export function isMemberActiveNotExpired(
  status: MemberStatus,
  expiry?: Date | null,
  now: Date = new Date(),
): boolean {
  if (status === "expired") return false;
  if (expiry && expiry.getTime() < now.getTime()) return false;
  return (
    status === "active" ||
    status === "near_expiry" ||
    status === "temporary"
  );
}

export function normalizeMemberType(
  raw: string | undefined | null,
): MemberType | undefined {
  if (!raw) return undefined;
  const s = raw.trim().toLowerCase();
  if (
    s === "ordinary" ||
    (s.includes("สามัญ") && !s.includes("วิ"))
  ) {
    return "ordinary";
  }
  if (s === "extraordinary" || s.includes("วิสามัญ")) return "extraordinary";
  if (s === "honorary" || s.includes("กิตติม")) return "honorary";
  if (s === "other") return "other";
  if (s.includes("สามัญ")) return "ordinary";
  return "other";
}
