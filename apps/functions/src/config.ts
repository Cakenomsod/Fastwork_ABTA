/**
 * Central configuration + brand constants for ABTA Member functions.
 * Secrets come from apps/functions/.env (loaded automatically by Firebase).
 */

export const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";
export const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

/** Public web origin used for member card / status deep links. */
export const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "https://abta-member.web.app";

/** LIFF entry used to register / bind a LINE account to a member record. */
export const LIFF_URL =
  process.env.VITE_LIFF_URL ?? process.env.LIFF_URL ?? "https://liff.line.me";

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
