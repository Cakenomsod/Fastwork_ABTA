/**
 * Membership fee schedule (confirmed by association 2026-08-02).
 * Keep in sync with apps/functions/src/members/fees.ts
 */

export type PayableMemberType = "ordinary" | "extraordinary" | "associate";

export const PAYABLE_MEMBER_TYPE_OPTIONS: {
  value: PayableMemberType;
  label: string;
  hint: string;
}[] = [
  {
    value: "ordinary",
    label: "สามัญ",
    hint: "สมาชิกสามัญ",
  },
  {
    value: "extraordinary",
    label: "วิสามัญ",
    hint: "สมาชิกวิสามัญ",
  },
  {
    value: "associate",
    label: "สมทบ",
    hint: "สมาชิกสมทบ",
  },
];

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

export function payableTypeFromMemberType(
  type: string | undefined | null,
): PayableMemberType {
  if (type === "extraordinary") return "extraordinary";
  if (type === "associate") return "associate";
  return "ordinary";
}

export function memberTypeLabel(type: PayableMemberType): string {
  return (
    PAYABLE_MEMBER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
  );
}

export function formatFeeThb(amount: number): string {
  return `${amount.toLocaleString("th-TH")} บาท`;
}

/** Parse YYYY-MM-DD (or ISO) as UTC noon for stable Thai calendar day. */
export function parseDateOnly(isoOrYmd?: string | null): Date | null {
  if (!isoOrYmd) return null;
  const ymd = isoOrYmd.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
}

/**
 * After renewal: next 31 Dec after current expiry.
 * If already at/after this year's Dec 31 → Dec 31 of next year.
 * Keep in sync with apps/functions/src/members/membership.ts
 */
export function nextMembershipExpiryDec31(fromExpiry?: Date | null): Date {
  const base = fromExpiry ?? new Date();
  const y = base.getUTCFullYear();
  const endThisYear = new Date(Date.UTC(y, 11, 31, 12, 0, 0));
  if (base.getTime() >= endThisYear.getTime()) {
    return new Date(Date.UTC(y + 1, 11, 31, 12, 0, 0));
  }
  return endThisYear;
}

/** Thai long date e.g. 31 ธันวาคม 2569 */
export function formatThaiDateLong(d: Date): string {
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatExpiryYmdThai(ymd?: string | null): string {
  const d = parseDateOnly(ymd);
  return d ? formatThaiDateLong(d) : "—";
}

export function projectedRenewalExpiryYmd(currentYmd?: string | null): string {
  const current = parseDateOnly(currentYmd);
  const next = nextMembershipExpiryDec31(current);
  return next.toISOString().slice(0, 10);
}

