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
