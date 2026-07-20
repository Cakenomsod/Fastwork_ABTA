/** Admin Back Office API client — Firebase Auth Bearer token. */

import { apiBase } from "./api";
import { getIdToken } from "./firebase";

export type StaffRole = "admin" | "registrar" | "treasurer";

export interface AdminMe {
  email: string;
  displayName?: string;
  roles: StaffRole[];
  isSuperAdmin: boolean;
  canManageStaff: boolean;
}

export interface QueueItem {
  memberId: string;
  tempMemberId?: string;
  fullName: string;
  phone?: string;
  email?: string;
  legalEntityName?: string;
  buildingName?: string;
  linkType?: string;
  status: string;
  dataReviewStatus?: string;
  createdAt?: string;
  paymentId?: string;
  amount?: number;
  receiptNumber?: string;
  receiptStatus?: string;
  paymentStatus?: string;
  hasSlip: boolean;
}

export interface MemberDetail extends QueueItem {
  firstName?: string;
  lastName?: string;
  legacyMemberId?: string;
  organization?: string;
  lineUserId?: string;
  expiryDate?: string;
  slipUrl?: string;
  slipViewUrl?: string;
  memberCardUrl?: string;
  rejectReason?: string;
}

export interface LegacyPaymentRow {
  receiptNumber?: string;
  amount?: number;
  item?: string;
  expiryDate?: string;
  transferredAt?: string;
}

export interface StaffRow {
  email: string;
  roles: StaffRole[];
  isSuperAdmin: boolean;
  displayName?: string;
}

export interface DashboardData {
  totalMembers: number;
  pendingDataReviews: number;
  pendingSlipReviews: number;
  activeMembers: number;
  temporaryMembers: number;
  recent: QueueItem[];
}

async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getIdToken();
  if (!token) {
    const err = new Error("auth_required");
    (err as Error & { code?: string }).code = "auth_required";
    throw err;
  }

  const res = await fetch(`${apiBase()}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const code = data?.error ?? `request_failed_${res.status}`;
    const err = new Error(code);
    (err as Error & { code?: string; status?: number }).code = code;
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return data as T;
}

export async function fetchAdminMe(): Promise<AdminMe> {
  const data = await adminFetch<{ me: AdminMe }>("/admin/me");
  return data.me;
}

export async function fetchDashboard(): Promise<DashboardData> {
  return adminFetch<DashboardData>("/admin/dashboard");
}

export async function fetchPendingDataReviews(): Promise<QueueItem[]> {
  const data = await adminFetch<{ items: QueueItem[] }>("/admin/reviews/data");
  return data.items;
}

export async function fetchPendingSlipReviews(): Promise<QueueItem[]> {
  const data = await adminFetch<{ items: QueueItem[] }>("/admin/reviews/slips");
  return data.items;
}

export async function fetchMemberDetail(memberId: string): Promise<MemberDetail> {
  const params = new URLSearchParams({ memberId });
  const data = await adminFetch<{ member: MemberDetail }>(
    `/admin/members/detail?${params}`,
  );
  return data.member;
}

export async function searchAdminMembers(q: string): Promise<QueueItem[]> {
  const params = new URLSearchParams({ q });
  const data = await adminFetch<{ items: QueueItem[] }>(
    `/admin/members/search?${params}`,
  );
  return data.items;
}

/** Correct member / receipt numbers (transactional + counter bump). */
export async function updateMemberIds(input: {
  memberId: string;
  newMemberId?: string;
  newReceiptNumber?: string;
}): Promise<{ memberId: string; receiptNumber?: string; member: MemberDetail }> {
  return adminFetch<{
    memberId: string;
    receiptNumber?: string;
    member: MemberDetail;
  }>("/admin/members/ids", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function checkMemberIds(input: {
  memberId?: string;
  receiptNumber?: string;
  exceptMemberId?: string;
  exceptPaymentId?: string;
}): Promise<{
  memberId?: { value: string; validFormat: boolean; available: boolean };
  receiptNumber?: { value: string; validFormat: boolean; available: boolean };
  suggest: {
    nextTempMemberId: string;
    nextPermanentMemberId: string;
    nextTempReceiptNumber: string;
    nextOfficialReceiptNumber: string;
  };
}> {
  const params = new URLSearchParams();
  if (input.memberId) params.set("memberId", input.memberId);
  if (input.receiptNumber) params.set("receiptNumber", input.receiptNumber);
  if (input.exceptMemberId) params.set("exceptMemberId", input.exceptMemberId);
  if (input.exceptPaymentId) {
    params.set("exceptPaymentId", input.exceptPaymentId);
  }
  return adminFetch(`/admin/members/ids/check?${params}`);
}

export function canEditMemberNumber(me: AdminMe): boolean {
  return (
    me.isSuperAdmin ||
    me.roles.includes("admin") ||
    me.roles.includes("registrar")
  );
}

export function canEditReceiptNumber(me: AdminMe): boolean {
  return (
    me.isSuperAdmin ||
    me.roles.includes("admin") ||
    me.roles.includes("treasurer")
  );
}

export function canEditMemberProfile(me: AdminMe): boolean {
  return (
    me.isSuperAdmin ||
    me.roles.includes("admin") ||
    me.roles.includes("registrar")
  );
}

export function canDeleteMember(me: AdminMe): boolean {
  return me.isSuperAdmin || me.roles.includes("admin");
}

/** PATCH member profile fields (not ID renumbering). */
export async function updateMemberProfile(input: {
  memberId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  legalEntityName?: string;
  buildingName?: string;
  organization?: string;
  expiryDate?: string;
}): Promise<MemberDetail> {
  const { memberId, ...patch } = input;
  const data = await adminFetch<{ member: MemberDetail }>(
    "/admin/members/profile",
    {
      method: "PATCH",
      body: JSON.stringify({ memberId, ...patch }),
    },
  );
  return data.member;
}

/** Permanently delete member + related payments/registry. */
export async function deleteMember(input: {
  memberId: string;
  confirmMemberId: string;
}): Promise<{ memberId: string }> {
  return adminFetch<{ memberId: string }>("/admin/members", {
    method: "DELETE",
    body: JSON.stringify(input),
  });
}

export async function fetchLegacyPayments(
  legacyMemberId: string,
): Promise<LegacyPaymentRow[]> {
  const params = new URLSearchParams({ legacyMemberId });
  const data = await adminFetch<{ items: LegacyPaymentRow[] }>(
    `/admin/members/legacy-payments?${params}`,
  );
  return data.items;
}

export async function approveDataReview(memberId: string) {
  return adminFetch<{ memberId: string; receiptNumber?: string }>(
    "/admin/reviews/data/approve",
    { method: "POST", body: JSON.stringify({ memberId }) },
  );
}

export async function rejectDataReview(memberId: string, reason: string) {
  return adminFetch<{ memberId: string }>("/admin/reviews/data/reject", {
    method: "POST",
    body: JSON.stringify({ memberId, reason }),
  });
}

export async function approveSlipReview(memberId: string) {
  return adminFetch<{ memberId: string; receiptNumber?: string }>(
    "/admin/reviews/slips/approve",
    { method: "POST", body: JSON.stringify({ memberId }) },
  );
}

export async function rejectSlipReview(memberId: string, reason: string) {
  return adminFetch<{ memberId: string; receiptNumber?: string }>(
    "/admin/reviews/slips/reject",
    { method: "POST", body: JSON.stringify({ memberId, reason }) },
  );
}

export async function fetchStaffList(): Promise<StaffRow[]> {
  const data = await adminFetch<{ staff: StaffRow[] }>("/admin/staff");
  return data.staff;
}

export async function upsertStaff(input: {
  email: string;
  roles: StaffRole[];
  displayName?: string;
}): Promise<StaffRow> {
  const data = await adminFetch<{ staff: StaffRow }>("/admin/staff", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.staff;
}

export async function deleteStaff(email: string): Promise<void> {
  await adminFetch("/admin/staff", {
    method: "DELETE",
    body: JSON.stringify({ email }),
  });
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  admin: "แอดมิน",
  registrar: "นายทะเบียน",
  treasurer: "เหรัญญิก",
};
