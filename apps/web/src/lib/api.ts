/** Shared API helpers for LIFF / web pages. */

/**
 * True when the page is served from Vite/dev (not Firebase Hosting).
 * Covers localhost, LAN, and Tailscale (100.64.0.0/10).
 */
function isDevHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  // IPv4 only — Tailscale / private LAN have no Hosting rewrite for /api
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 100 && b >= 64 && b <= 127) return true; // Tailscale CGNAT
  return false;
}

/**
 * In production the /api/** rewrite serves same-origin. During local / LAN /
 * Tailscale Vite we hit the deployed Hosting+Functions origin directly.
 */
export function apiBase(): string {
  if (typeof window === "undefined") return "";
  const { hostname } = window.location;
  return isDevHost(hostname) ? "https://abta-member.web.app" : "";
}

/** Public status payload returned by GET /api/members/status. */
export interface PublicStatus {
  memberId: string;
  fullName: string;
  legalEntityName?: string;
  statusKey: string;
  statusLabel: string;
  statusTone: "active" | "temporary" | "warning" | "danger" | "neutral";
  expiryLabel?: string;
  expiryDaysLeft?: number;
  paymentLabel: string;
  /** Membership fee amount on the public receipt (THB). */
  amountThb?: number;
  /** Thai-formatted payment / receipt date when known. */
  paymentDateLabel?: string;
  receiptStatusKey: string;
  receiptLabel: string;
  receiptNumber?: string;
  seminarLabel: string;
  renewalLabel?: string;
  memberCardUrl?: string;
  receiptUrl?: string;
  updatedAtLabel?: string;
  dataReviewStatus?: string;
  rejectReason?: string;
  canResubmit?: boolean;
  canResubmitSlip?: boolean;
  canRenew?: boolean;
}

export async function fetchMemberStatus(
  memberId: string,
  token: string,
): Promise<PublicStatus> {
  const params = new URLSearchParams({ m: memberId });
  if (token) params.set("t", token);
  const res = await fetch(`${apiBase()}/api/members/status?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data?.error ?? `request_failed_${res.status}`);
    (err as Error & { code?: string }).code = data?.error ?? String(res.status);
    throw err;
  }
  return data.status as PublicStatus;
}

export interface RegisterPayload {
  idToken: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  legalEntityName?: string;
  buildingName?: string;
  slipContentType: string;
  slipBase64: string;
}

export interface RegisterSuccess {
  memberId: string;
  publicToken: string;
  statusUrl: string;
  memberCardUrl: string;
  feeThb: number;
  expiryDate: string;
  resubmitted?: boolean;
}

export type RegisterDraft =
  | { mode: "new" }
  | {
      mode: "resubmit";
      memberId: string;
      rejectReason?: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      legalEntityName?: string;
      buildingName?: string;
    };

export async function fetchRegisterDraft(idToken: string): Promise<RegisterDraft> {
  const res = await fetch(`${apiBase()}/api/members/register/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data?.error ?? `request_failed_${res.status}`);
    (err as Error & { code?: string; statusUrl?: string }).code =
      data?.error ?? String(res.status);
    if (typeof data?.statusUrl === "string" && data.statusUrl) {
      (err as Error & { statusUrl?: string }).statusUrl = data.statusUrl;
    }
    throw err;
  }
  if (data.mode === "resubmit") {
    return {
      mode: "resubmit",
      memberId: String(data.memberId ?? ""),
      rejectReason: data.rejectReason != null ? String(data.rejectReason) : undefined,
      firstName: String(data.firstName ?? ""),
      lastName: String(data.lastName ?? ""),
      phone: String(data.phone ?? ""),
      email: data.email != null ? String(data.email) : undefined,
      legalEntityName:
        data.legalEntityName != null ? String(data.legalEntityName) : undefined,
      buildingName: data.buildingName != null ? String(data.buildingName) : undefined,
    };
  }
  return { mode: "new" };
}

export async function submitRegistration(
  payload: RegisterPayload,
): Promise<RegisterSuccess> {
  const res = await fetch(`${apiBase()}/api/members/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data?.error ?? `request_failed_${res.status}`);
    (err as Error & { code?: string }).code = data?.error ?? String(res.status);
    throw err;
  }
  return {
    memberId: data.memberId,
    publicToken: data.publicToken,
    statusUrl: data.statusUrl,
    memberCardUrl: data.memberCardUrl,
    feeThb: data.feeThb,
    expiryDate: data.expiryDate,
    resubmitted: data.resubmitted === true,
  };
}

/** Public legacy match from POST /api/members/legacy/search. */
export interface LegacyMatch {
  legacyMemberId: string;
  fullName: string;
  legalEntityName?: string;
  buildingName?: string;
  status: "active" | "expired" | "non_active" | "pending";
  statusLabel: string;
  memberTypeLabel?: string;
  expiryDate?: string;
}

export async function searchLegacyMembers(input: {
  idToken: string;
  firstName: string;
  lastName: string;
  legalEntityName?: string;
  buildingName?: string;
}): Promise<LegacyMatch[]> {
  const res = await fetch(`${apiBase()}/api/members/legacy/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data?.error ?? `request_failed_${res.status}`);
    (err as Error & { code?: string }).code = data?.error ?? String(res.status);
    throw err;
  }
  return (data.matches ?? []) as LegacyMatch[];
}

/** Success payload from POST /api/members/legacy/bind. */
export interface LegacyBindSuccess {
  memberId: string;
  legacyMemberId: string;
  publicToken: string;
  statusUrl: string;
  memberCardUrl: string;
  status: string;
}

export async function bindLegacyMember(input: {
  idToken: string;
  legacyMemberId: string;
  firstName: string;
  lastName: string;
  legalEntityName?: string;
  buildingName?: string;
}): Promise<LegacyBindSuccess> {
  const res = await fetch(`${apiBase()}/api/members/legacy/bind`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data?.error ?? `request_failed_${res.status}`);
    (err as Error & { code?: string }).code = data?.error ?? String(res.status);
    throw err;
  }
  return {
    memberId: data.memberId,
    legacyMemberId: data.legacyMemberId,
    publicToken: data.publicToken,
    statusUrl: data.statusUrl,
    memberCardUrl: data.memberCardUrl,
    status: data.status,
  };
}

export async function resubmitSlip(input: {
  idToken: string;
  slipContentType: string;
  slipBase64: string;
}): Promise<{ memberId: string; statusUrl: string; receiptNumber?: string }> {
  const res = await fetch(`${apiBase()}/api/members/slip/resubmit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data?.error ?? `request_failed_${res.status}`);
    (err as Error & { code?: string }).code = data?.error ?? String(res.status);
    throw err;
  }
  return {
    memberId: data.memberId,
    statusUrl: data.statusUrl,
    receiptNumber: data.receiptNumber,
  };
}

export type RenewDraft = {
  memberId: string;
  firstName: string;
  lastName: string;
  status: string;
  expiryDate?: string;
  feeThb: number;
  pendingRenewal: boolean;
  /** Present when draft API exposes slip review state (e.g. rejected → resubmit). */
  receiptStatus?: string;
};

export async function fetchRenewDraft(idToken: string): Promise<RenewDraft> {
  const res = await fetch(`${apiBase()}/api/members/renew/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data?.error ?? `request_failed_${res.status}`);
    (err as Error & { code?: string }).code = data?.error ?? String(res.status);
    throw err;
  }
  return {
    memberId: data.memberId,
    firstName: data.firstName,
    lastName: data.lastName,
    status: data.status,
    expiryDate: data.expiryDate,
    feeThb: data.feeThb,
    pendingRenewal: Boolean(data.pendingRenewal),
    receiptStatus:
      typeof data.receiptStatus === "string" ? data.receiptStatus : undefined,
  };
}

export async function submitRenewal(input: {
  idToken: string;
  slipContentType: string;
  slipBase64: string;
}): Promise<{
  memberId: string;
  statusUrl: string;
  receiptNumber: string;
  feeThb: number;
  expiryDate?: string;
}> {
  const res = await fetch(`${apiBase()}/api/members/renew`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data?.error ?? `request_failed_${res.status}`);
    (err as Error & { code?: string }).code = data?.error ?? String(res.status);
    throw err;
  }
  return {
    memberId: data.memberId,
    statusUrl: data.statusUrl,
    receiptNumber: data.receiptNumber,
    feeThb: data.feeThb,
    expiryDate: data.expiryDate,
  };
}
