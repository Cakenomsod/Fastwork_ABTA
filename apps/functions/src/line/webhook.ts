import type { Request, Response } from "express";
import * as crypto from "crypto";

/**
 * LINE Messaging API webhook stub.
 * Next: reply to "เช็คสถานะ" using Firestore members.
 */
export async function handleLineWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const secret = process.env.LINE_MESSAGING_CHANNEL_SECRET;
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

  const body = req.body as {
    events?: Array<{ type: string; message?: { type: string; text?: string } }>;
  };

  for (const event of body.events ?? []) {
    if (event.type === "message" && event.message?.type === "text") {
      console.log("LINE text:", event.message.text);
    }
  }

  res.status(200).json({ ok: true });
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
