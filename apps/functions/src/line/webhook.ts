import type { Request, Response } from "express";
import * as crypto from "crypto";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessagingSecret } from "../config";
import { getStatusViewByLineUserId } from "../members/repository";
import { replyMessages, type LineMessage } from "./client";
import { detectIntent } from "./intents";
import { buildStatusFlex } from "./flex-status";
import {
  errorMessage,
  greetingMessage,
  helpMessage,
  notLinkedFlex,
  registerInviteFlex,
} from "./messages";

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { userId?: string; type?: string };
  message?: { type: string; text?: string };
}

/**
 * LINE Messaging API webhook.
 * Verifies signature, then replies to status-check / help intents.
 * Always returns 200 quickly after attempting replies (avoids LINE retries).
 */
export async function handleLineWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const secret = getMessagingSecret();
  if (!secret) {
    console.error("LINE_MESSAGING_CHANNEL_SECRET is not set");
    res.status(500).send("misconfigured");
    return;
  }

  const signature = req.get("x-line-signature");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!signature || !verifyLineSignature(rawBody, secret, signature)) {
    res.status(401).send("invalid signature");
    return;
  }

  const body = req.body as { events?: LineEvent[] };
  const events = body.events ?? [];

  // Process events concurrently but never let one failure break the batch.
  await Promise.all(events.map((event) => handleEvent(event).catch((err) => {
    console.error("event handling error", err);
  })));

  res.status(200).json({ ok: true });
}

async function handleEvent(event: LineEvent): Promise<void> {
  const replyToken = event.replyToken;
  if (!replyToken) return;

  // Greet on follow / add-friend.
  if (event.type === "follow") {
    await replyMessages(replyToken, [greetingMessage()]);
    return;
  }

  if (event.type !== "message" || event.message?.type !== "text") return;

  const text = event.message.text ?? "";
  const intent = detectIntent(text);
  const userId = event.source?.userId;
  console.log("line event", { type: event.type, intent, userId, text: text.slice(0, 80) });

  try {
    switch (intent) {
      case "status": {
        const messages = await buildStatusReply(userId);
        await replyMessages(replyToken, messages);
        return;
      }
      case "register":
        await replyMessages(replyToken, [registerInviteFlex()]);
        return;
      case "help":
        await replyMessages(replyToken, [helpMessage()]);
        return;
      case "greeting":
        await replyMessages(replyToken, [greetingMessage()]);
        return;
      default:
        await replyMessages(replyToken, [helpMessage()]);
        return;
    }
  } catch (err) {
    console.error("reply error", err);
    await replyMessages(replyToken, [errorMessage()]).catch(() => undefined);
  }
}

async function buildStatusReply(
  userId: string | undefined,
): Promise<LineMessage[]> {
  if (!userId) return [notLinkedFlex()];

  const result = await getStatusViewByLineUserId(userId);
  if (!result) {
    await rememberUnlinkedUser(userId).catch((err) => {
      console.error("failed to record line sighting", err);
    });
    return [notLinkedFlex(userId)];
  }

  return [buildStatusFlex(result.view, result.publicToken)];
}

/** Keeps recent unbound LINE userIds so we can bind demo/test accounts quickly. */
async function rememberUnlinkedUser(lineUserId: string): Promise<void> {
  await getFirestore()
    .collection("line_sightings")
    .doc(lineUserId)
    .set(
      {
        lineUserId,
        lastSeenAt: FieldValue.serverTimestamp(),
        lastIntent: "status",
      },
      { merge: true },
    );
}

function verifyLineSignature(
  rawBody: Buffer | undefined,
  channelSecret: string,
  signature: string,
): boolean {
  if (!rawBody) return false;
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(rawBody)
    .digest("base64");
  return hash === signature;
}
