/** Shared API helpers for LIFF / web pages. */

/**
 * In production the /api/** rewrite serves same-origin. During local dev
 * (vite on :5173) we hit the deployed function directly.
 */
export function apiBase(): string {
  if (typeof window === "undefined") return "";
  const { hostname } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  return isLocal ? "https://abta-member.web.app" : "";
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
  receiptStatusKey: string;
  receiptLabel: string;
  receiptNumber?: string;
  seminarLabel: string;
  memberCardUrl?: string;
  receiptUrl?: string;
  updatedAtLabel?: string;
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
  };
}
