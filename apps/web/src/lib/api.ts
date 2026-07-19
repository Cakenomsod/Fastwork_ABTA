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
  /** Membership fee amount on the public receipt (THB). */
  amountThb?: number;
  /** Thai-formatted payment / receipt date when known. */
  paymentDateLabel?: string;
  receiptStatusKey: string;
  receiptLabel: string;
  receiptNumber?: string;
  seminarLabel: string;
  memberCardUrl?: string;
  receiptUrl?: string;
  updatedAtLabel?: string;
  dataReviewStatus?: string;
  rejectReason?: string;
  canResubmit?: boolean;
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
    (err as Error & { code?: string }).code = data?.error ?? String(res.status);
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
