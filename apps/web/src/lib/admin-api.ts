/** Admin Back Office API client — Firebase Auth Bearer token. */

import { apiBase } from "./api";
import { ADMIN_OPEN_ACCESS } from "./admin-open-access";
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
  /** Staged permanent member ID — applied when data review is approved. */
  pendingMemberId?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  phone?: string;
  email?: string;
  legalEntityName?: string;
  buildingName?: string;
  linkType?: string;
  status: string;
  dataReviewStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Treasurer confirmation / official receipt time. */
  verifiedAt?: string;
  paymentId?: string;
  amount?: number;
  receiptNumber?: string;
  /** Staged official receipt number — applied when slip review is approved. */
  pendingReceiptNumber?: string;
  receiptStatus?: string;
  paymentStatus?: string;
  hasSlip: boolean;
}

/** Display-status filter (matches admin StatusBadge labels + Phase 1 statuses). */
export type MemberListStatusFilter =
  | "pending_data"
  | "pending_slip"
  | "temporary"
  | "active"
  | "near_expiry"
  | "expired";

export type ReceiptIdTFilter = "with_t" | "without_t";

export type MemberListSort =
  | "member_asc"
  | "member_desc"
  | "t_first"
  | "no_t_first"
  | "confirmed_desc"
  | "updated_desc";

export interface MemberListQuery {
  q?: string;
  status?: MemberListStatusFilter | "";
  receiptIdT?: ReceiptIdTFilter | "";
  sort?: MemberListSort | "";
  /** @deprecated Prefer pageSize */
  limit?: number;
  page?: number;
  pageSize?: number;
}

export const LIST_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
export type ListPageSize = (typeof LIST_PAGE_SIZE_OPTIONS)[number];

export type MemberListResult = {
  items: QueueItem[];
  matched: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Temp IDs are ABTA-T-{YYYY}-{####}; "ABTA" alone must not count as having T. */
export function memberIdHasT(memberId: string): boolean {
  return /^ABTA-T-\d{4}-\d{4}$/i.test(memberId.trim());
}

/** Temp receipts are RC-T-{YYYY}-{####}; "RC" alone must not count as having T. */
export function receiptIdHasT(receiptNumber?: string): boolean {
  if (!receiptNumber?.trim()) return false;
  return /^RC-T-\d{4}-\d{4}$/i.test(receiptNumber.trim());
}

/**
 * Number that will be applied when the review is confirmed:
 * the staged pending number if any, otherwise the current number with T
 * stripped (ABTA-T-2026-0042 → ABTA-2026-0042, RC-T-2026-0001 → RC-2026-0001).
 */
export function effectiveIdOnConfirm(
  current: string | undefined,
  pending: string | undefined,
): string {
  const staged = pending?.trim().toUpperCase();
  if (staged) return staged;
  const value = current?.trim().toUpperCase() ?? "";
  return value.replace(/^(ABTA|RC)-T-/, "$1-");
}

export type IdConflictCheck = {
  contestedId: string;
  tempId: string;
  suggestedId: string;
};

export const MEMBER_STATUS_FILTER_OPTIONS: {
  value: "" | MemberListStatusFilter;
  label: string;
}[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "pending_data", label: "รอตรวจข้อมูล" },
  { value: "pending_slip", label: "รอตรวจสลิป" },
  { value: "temporary", label: "สมาชิกชั่วคราว" },
  { value: "active", label: "สมาชิกสมบูรณ์" },
  { value: "near_expiry", label: "ใกล้หมดอายุ" },
  { value: "expired", label: "หมดอายุ" },
];

export const RECEIPT_ID_T_FILTER_OPTIONS: {
  value: "" | ReceiptIdTFilter;
  label: string;
}[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "with_t", label: "มี T" },
  { value: "without_t", label: "ไม่มี T" },
];

export const MEMBER_SORT_OPTIONS: { value: MemberListSort; label: string }[] = [
  { value: "updated_desc", label: "อัปเดตล่าสุด" },
  { value: "confirmed_desc", label: "ยืนยันล่าสุด" },
  { value: "member_asc", label: "เลขสมาชิก น้อยสุด" },
  { value: "member_desc", label: "เลขสมาชิก มากสุด" },
  { value: "t_first", label: "T ขึ้นก่อน แล้วค่อยเลข" },
  { value: "no_t_first", label: "ไม่มี T ขึ้นก่อน แล้วค่อยเลข" },
];

export interface MemberDetail extends QueueItem {
  legacyMemberId?: string;
  organization?: string;
  lineUserId?: string;
  expiryDate?: string;
  slipUrl?: string;
  slipViewUrl?: string;
  memberCardUrl?: string;
  rejectReason?: string;
}

/** Prefer API first/last; fall back to splitting fullName for older payloads. */
export function memberNameParts(row: {
  firstName?: string;
  lastName?: string;
  fullName?: string;
}): { firstName: string; lastName: string } {
  const first = row.firstName?.trim();
  const last = row.lastName?.trim();
  if (first || last) {
    return { firstName: first || "—", lastName: last || "—" };
  }
  const full = row.fullName?.trim() ?? "";
  if (!full) return { firstName: "—", lastName: "—" };
  const i = full.indexOf(" ");
  if (i === -1) return { firstName: full, lastName: "—" };
  return {
    firstName: full.slice(0, i),
    lastName: full.slice(i + 1).trim() || "—",
  };
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
  if (!token && !ADMIN_OPEN_ACCESS) {
    const err = new Error("auth_required");
    (err as Error & { code?: string }).code = "auth_required";
    throw err;
  }

  const res = await fetch(`${apiBase()}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export async function searchAdminMembers(
  query: string | MemberListQuery,
): Promise<MemberListResult> {
  const opts: MemberListQuery =
    typeof query === "string" ? { q: query } : query;
  const params = new URLSearchParams();
  const q = opts.q?.trim() ?? "";
  if (q) params.set("q", q);
  if (opts.status) params.set("status", opts.status);
  if (opts.receiptIdT) params.set("receiptIdT", opts.receiptIdT);
  if (opts.sort) params.set("sort", opts.sort);
  if (opts.page != null) params.set("page", String(opts.page));
  if (opts.pageSize != null) params.set("pageSize", String(opts.pageSize));
  else if (opts.limit != null) params.set("pageSize", String(opts.limit));
  const data = await adminFetch<MemberListResult>(
    `/admin/members/search?${params}`,
  );
  return {
    items: data.items ?? [],
    matched: data.matched ?? data.items?.length ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? opts.pageSize ?? opts.limit ?? 10,
    pageCount: data.pageCount ?? 1,
  };
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

/** Returns conflict info when the ID that would apply on confirm is taken. */
export async function checkIdConflictOnConfirm(opts: {
  kind: "member" | "receipt";
  current: string | undefined;
  pending: string | undefined;
  exceptMemberId: string;
  exceptPaymentId?: string;
}): Promise<IdConflictCheck | null> {
  const contestedId = effectiveIdOnConfirm(opts.current, opts.pending);
  if (!contestedId) return null;

  const result = await checkMemberIds({
    memberId: opts.kind === "member" ? contestedId : undefined,
    receiptNumber: opts.kind === "receipt" ? contestedId : undefined,
    exceptMemberId: opts.exceptMemberId,
    exceptPaymentId: opts.exceptPaymentId,
  });

  const row = opts.kind === "member" ? result.memberId : result.receiptNumber;
  if (!row || row.available) return null;

  const suggestedId =
    opts.kind === "member"
      ? result.suggest.nextPermanentMemberId
      : result.suggest.nextOfficialReceiptNumber;

  return {
    contestedId,
    tempId: (opts.current ?? "").trim().toUpperCase() || contestedId,
    suggestedId,
  };
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
  return me.isSuperAdmin || me.roles.includes("admin");
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

export interface LegacyImportResult {
  members: number;
  payments: number;
  feeMasters: number;
  sourceFile: string;
  sample: Array<{
    legacyMemberId: string;
    fullName: string;
    status: string;
    memberTypeLabel?: string;
  }>;
}

export type LegacyBindFilter = "all" | "bound" | "unbound";

export type LegacyStatusFilter =
  | "active"
  | "expired"
  | "non_active"
  | "pending";

export interface LegacyMemberListRow {
  legacyMemberId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  legalEntityName?: string;
  buildingName?: string;
  phone?: string;
  email?: string;
  status: string;
  memberTypeLabel?: string;
  entityTypeLabel?: string;
  expiryDate?: string;
  sourceFile?: string;
  lineBound: boolean;
  boundMemberId?: string;
  boundFullName?: string;
}

export interface LegacyMemberListResult {
  total: number;
  matched: number;
  boundCount: number;
  unboundCount: number;
  truncated: boolean;
  page: number;
  pageSize: number;
  pageCount: number;
  items: LegacyMemberListRow[];
}

/** Browse / search imported legacy members (+ LINE bind status). */
export async function searchLegacyMembersAdmin(input: {
  q?: string;
  bindStatus?: LegacyBindFilter;
  status?: "" | LegacyStatusFilter;
  page?: number;
  pageSize?: number;
}): Promise<LegacyMemberListResult> {
  const params = new URLSearchParams();
  if (input.q?.trim()) params.set("q", input.q.trim());
  if (input.bindStatus && input.bindStatus !== "all") {
    params.set("bindStatus", input.bindStatus);
  }
  if (input.status) params.set("status", input.status);
  if (input.page) params.set("page", String(input.page));
  if (input.pageSize) params.set("pageSize", String(input.pageSize));
  const qs = params.toString();
  return adminFetch<LegacyMemberListResult>(
    `/admin/legacy/members${qs ? `?${qs}` : ""}`,
  );
}

/** Upload NewMemDatabase-style .xlsx → upsert legacyMembers / legacyPayments. */
export async function importLegacyXlsx(input: {
  fileName: string;
  contentBase64: string;
}): Promise<LegacyImportResult> {
  return adminFetch<LegacyImportResult>("/admin/legacy/import", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function canImportLegacy(me: AdminMe): boolean {
  return me.isSuperAdmin || me.roles.includes("admin");
}

export const LEGACY_BIND_FILTER_OPTIONS: Array<{
  value: LegacyBindFilter;
  label: string;
}> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "bound", label: "ยืนยัน LINE แล้ว" },
  { value: "unbound", label: "ยังไม่ยืนยัน" },
];

export const LEGACY_STATUS_FILTER_OPTIONS: Array<{
  value: "" | LegacyStatusFilter;
  label: string;
}> = [
  { value: "", label: "ทุกสถานะ" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "non_active", label: "NonActive" },
  { value: "pending", label: "Pending" },
];

export const LEGACY_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  non_active: "NonActive",
  pending: "Pending",
};

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
