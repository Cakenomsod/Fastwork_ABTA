import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { handleLineWebhook } from "./line/webhook";

initializeApp();

setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
});

/** Health + LINE webhook entrypoint for ABTA Member */
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

  res.status(404).json({ ok: false, error: "not_found" });
});
