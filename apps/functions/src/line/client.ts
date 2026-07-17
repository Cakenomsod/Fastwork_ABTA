/**
 * Thin LINE Messaging API client (reply + push) using global fetch (Node 22).
 */

import {
  LINE_PUSH_ENDPOINT,
  LINE_REPLY_ENDPOINT,
  getMessagingAccessToken,
} from "../config";

// Loose message type — Flex objects are large and validated by LINE.
export type LineMessage = Record<string, unknown>;

async function postToLine(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const token = getMessagingAccessToken();
  if (!token) {
    console.error("LINE_MESSAGING_ACCESS_TOKEN is not set — cannot send message");
    return;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("LINE API error", res.status, detail);
  }
}

/** Reply within the webhook window (reply token valid ~1 min, one use). */
export async function replyMessages(
  replyToken: string,
  messages: LineMessage[],
): Promise<void> {
  await postToLine(LINE_REPLY_ENDPOINT, {
    replyToken,
    messages: messages.slice(0, 5),
  });
}

export async function pushMessages(
  to: string,
  messages: LineMessage[],
): Promise<void> {
  await postToLine(LINE_PUSH_ENDPOINT, { to, messages: messages.slice(0, 5) });
}
