/**
 * Push short alerts to staff LINE accounts (STAFF_LINE_USER_IDS).
 */

import { pushMessages } from "../line/client";
import { textMessage } from "../line/messages";

export function staffLineUserIds(): string[] {
  const raw = process.env.STAFF_LINE_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function notifyStaff(lines: string[]): Promise<void> {
  const staff = staffLineUserIds();
  if (!staff.length) return;
  const msg = textMessage(lines.filter(Boolean).join("\n"));
  await Promise.allSettled(staff.map((id) => pushMessages(id, [msg])));
}
