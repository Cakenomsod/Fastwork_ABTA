/**
 * Central configuration + brand constants for ABTA Member functions.
 * Secrets come from apps/functions/.env (loaded automatically by Firebase).
 */

export const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";
export const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
export const LINE_MULTICAST_ENDPOINT =
  "https://api.line.me/v2/bot/message/multicast";

/** Public web origin used for member card / status deep links. */
export const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "https://abta-member.web.app";

/** LIFF entry used to register / bind a LINE account to a member record. */
export const LIFF_URL =
  process.env.VITE_LIFF_URL ?? process.env.LIFF_URL ?? "https://liff.line.me";

/** Membership fee (THB) — default from mockup until customer confirms. */
export const MEMBERSHIP_FEE_THB = Number(process.env.MEMBERSHIP_FEE_THB ?? "500") || 500;

export const BRAND = {
  short: "ABTA",
  nameTh: "สมาคมการค้าผู้ประกอบการธุรกิจห้องเช่า",
  oaName: "ABTA สมาชิก",
  // Deep association green + gold accent — intentionally not purple/cream cliché.
  green: "#0F4C36",
  greenLight: "#186B4A",
  greenDeep: "#0B3A29",
  gold: "#C9A24B",
  goldSoft: "#E4CE93",
  ink: "#12211B",
  paper: "#FFFFFF",
  mist: "#EEF3EF",
  line: "#DCE6E0",
  subtle: "#6B7C72",
} as const;

export function getMessagingSecret(): string | undefined {
  return process.env.LINE_MESSAGING_CHANNEL_SECRET;
}

export function getMessagingAccessToken(): string | undefined {
  return process.env.LINE_MESSAGING_ACCESS_TOKEN;
}

export function getLoginChannelId(): string | undefined {
  return process.env.LINE_LOGIN_CHANNEL_ID;
}

/** True when LIFF_URL looks like a real LIFF deep link (not the bare placeholder). */
export function isConfiguredLiffUrl(url: string = LIFF_URL): boolean {
  return /^https:\/\/liff\.line\.me\/\d+-\w+/i.test(url);
}

/** LIFF deep link for auth pages (/renew, /seminar, …) when Endpoint URL is /register. */
export function liffPageUri(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!isConfiguredLiffUrl()) return `${WEB_ORIGIN}${normalized}`;
  const base = LIFF_URL.replace(/\/+$/, "");
  return normalized === "/" ? base : `${base}${normalized}`;
}
