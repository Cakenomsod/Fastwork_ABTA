/**
 * Very light intent detection for incoming LINE text.
 * Thai + English variants, tolerant of spaces/casing.
 */

export type Intent = "status" | "register" | "help" | "greeting" | "unknown";

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

const STATUS_KEYS = [
  "เช็คสถานะ",
  "เชคสถานะ",
  "ตรวจสอบสถานะ",
  "ดูสถานะ",
  "สถานะ",
  "สถานะสมาชิก",
  "status",
  "checkstatus",
  "mystatus",
];

const REGISTER_KEYS = [
  "สมัครสมาชิก",
  "สมัคร",
  "ลงทะเบียน",
  "ลงทะเบียนสมาชิก",
  "register",
  "signup",
  "join",
];

const HELP_KEYS = [
  "ช่วยเหลือ",
  "เมนู",
  "คำสั่ง",
  "help",
  "menu",
  "commands",
  "start",
  "?",
];

const GREETING_KEYS = [
  "สวัสดี",
  "หวัดดี",
  "ดีครับ",
  "ดีค่ะ",
  "hello",
  "hi",
  "hey",
];

export function detectIntent(rawText: string): Intent {
  const text = normalize(rawText);
  if (!text) return "unknown";

  // Register before status so "สถานะ" in longer phrases still works,
  // but "สมัครสมาชิก" must not fall through to help.
  if (REGISTER_KEYS.some((k) => text === k || text.includes(k))) return "register";
  if (STATUS_KEYS.some((k) => text === k || text.includes(k))) return "status";
  if (HELP_KEYS.some((k) => text === k || text.includes(k))) return "help";
  if (GREETING_KEYS.some((k) => text === k || text.startsWith(k))) return "greeting";

  return "unknown";
}
