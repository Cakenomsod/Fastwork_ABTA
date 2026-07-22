/**
 * Capability token for public member card / status URLs.
 * Not derived from memberId — must be stored and presented as `t=`.
 */

import { timingSafeEqual, randomBytes } from "node:crypto";
import { WEB_ORIGIN } from "../config";

/** 16 bytes → 32 hex chars (~128 bits). */
export function mintPublicToken(): string {
  return randomBytes(16).toString("hex");
}

/** Constant-time compare; false if either side empty or length mismatch. */
export function publicTokensEqual(
  stored: string | undefined,
  provided: string | undefined,
): boolean {
  const a = (stored ?? "").trim();
  const b = (provided ?? "").trim();
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export function memberCardUrls(
  memberId: string,
  token: string,
): { memberCardUrl: string; statusUrl: string; receiptUrl: string } {
  const q = `m=${encodeURIComponent(memberId)}&t=${encodeURIComponent(token)}`;
  return {
    memberCardUrl: `${WEB_ORIGIN}/card?${q}`,
    statusUrl: `${WEB_ORIGIN}/status?${q}`,
    receiptUrl: `${WEB_ORIGIN}/receipt?${q}`,
  };
}

/** Use existing token or mint a new one. */
export function resolvePublicToken(existing?: string | null): string {
  const t = (existing ?? "").trim();
  return t || mintPublicToken();
}
