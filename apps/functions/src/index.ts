import type { Request, Response } from "express";
import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { handleLineWebhook } from "./line/webhook";
import { getStatusViewByMemberId } from "./members/repository";
import { toPublicStatus } from "./members/status-view";

initializeApp();

setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
});

/** Health + LINE webhook + public status entrypoint for ABTA Member */
export const api = onRequest({ cors: true }, async (req, res) => {
  const path = req.path.replace(/^\/api/, "") || "/";

  if (path === "/health" || path === "/") {
    res.status(200).json({
      ok: true,
      service: "abta-member",
      region: "asia-southeast1",
    });
    return;
  }

  if (path === "/line/webhook" && req.method === "POST") {
    await handleLineWebhook(req, res);
    return;
  }

  if (path === "/members/status" && req.method === "GET") {
    await handleMemberStatus(req, res);
    return;
  }

  res.status(404).json({ ok: false, error: "not_found" });
});

/**
 * Public-safe member status for the web card page.
 * Requires memberId + matching short token to avoid exposing PII by enumeration.
 */
async function handleMemberStatus(req: Request, res: Response): Promise<void> {
  const memberId = String(req.query.memberId ?? req.query.m ?? "").trim();
  const token = String(req.query.token ?? req.query.t ?? "").trim();

  if (!memberId) {
    res.status(400).json({ ok: false, error: "member_id_required" });
    return;
  }

  const result = await getStatusViewByMemberId(memberId);
  if (!result) {
    res.status(404).json({ ok: false, error: "not_found" });
    return;
  }

  // Token is required when the member has one configured.
  if (result.publicToken && result.publicToken !== token) {
    res.status(403).json({ ok: false, error: "invalid_token" });
    return;
  }

  res.set("Cache-Control", "public, max-age=60");
  res.status(200).json({ ok: true, status: toPublicStatus(result.view) });
}
