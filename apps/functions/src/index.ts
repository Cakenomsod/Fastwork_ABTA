import type { Request, Response } from "express";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  handleAdminDashboard,
  handleAdminMe,
  handleAdminMemberDetail,
  handleAdminMemberSearch,
  handleAdminMemberSlip,
  handleAdminStaffDelete,
  handleAdminStaffList,
  handleAdminStaffUpsert,
  handleAdminUpdateMemberIds,
  handleApproveData,
  handleApproveSlip,
  handlePendingDataReviews,
  handlePendingSlipReviews,
  handleRejectData,
  handleRejectSlip,
} from "./admin/handlers";
import { handleLineWebhook } from "./line/webhook";
import { getRegisterDraft, registerNewMember } from "./members/register";
import { getStatusViewByMemberId } from "./members/repository";
import { toPublicStatus } from "./members/status-view";

initializeApp({
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "abta-member",
});

// Optional form fields may be omitted — Firestore rejects explicit `undefined`.
getFirestore().settings({ ignoreUndefinedProperties: true });

setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
});

/** Health + LINE webhook + public status + admin BO entrypoint for ABTA Member */
export const api = onRequest(
  { cors: true, memory: "512MiB", timeoutSeconds: 120 },
  async (req, res) => {
    // API responses must never be CDN-cached (Hosting previously cached 404s for 10m).
    res.set("Cache-Control", "no-store, max-age=0");

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

    if (path === "/members/register" && req.method === "POST") {
      await handleMemberRegister(req, res);
      return;
    }

    if (path === "/members/register/draft" && req.method === "POST") {
      await handleRegisterDraft(req, res);
      return;
    }

    // ── Admin Back Office (Firebase Auth ID token + staff allowlist) ──
    if (path === "/admin/me" && req.method === "GET") {
      await handleAdminMe(req, res);
      return;
    }
    if (path === "/admin/dashboard" && req.method === "GET") {
      await handleAdminDashboard(req, res);
      return;
    }
    if (path === "/admin/staff" && req.method === "GET") {
      await handleAdminStaffList(req, res);
      return;
    }
    if (path === "/admin/staff" && (req.method === "POST" || req.method === "PUT")) {
      await handleAdminStaffUpsert(req, res);
      return;
    }
    if (path === "/admin/staff" && req.method === "DELETE") {
      await handleAdminStaffDelete(req, res);
      return;
    }
    if (path === "/admin/reviews/data" && req.method === "GET") {
      await handlePendingDataReviews(req, res);
      return;
    }
    if (path === "/admin/reviews/slips" && req.method === "GET") {
      await handlePendingSlipReviews(req, res);
      return;
    }
    if (path === "/admin/members/detail" && req.method === "GET") {
      await handleAdminMemberDetail(req, res);
      return;
    }
    if (path === "/admin/members/slip" && req.method === "GET") {
      await handleAdminMemberSlip(req, res);
      return;
    }
    if (path === "/admin/members/search" && req.method === "GET") {
      await handleAdminMemberSearch(req, res);
      return;
    }
    if (
      path === "/admin/members/ids" &&
      (req.method === "PATCH" || req.method === "PUT")
    ) {
      await handleAdminUpdateMemberIds(req, res);
      return;
    }
    if (path === "/admin/reviews/data/approve" && req.method === "POST") {
      await handleApproveData(req, res);
      return;
    }
    if (path === "/admin/reviews/data/reject" && req.method === "POST") {
      await handleRejectData(req, res);
      return;
    }
    if (path === "/admin/reviews/slips/approve" && req.method === "POST") {
      await handleApproveSlip(req, res);
      return;
    }
    if (path === "/admin/reviews/slips/reject" && req.method === "POST") {
      await handleRejectSlip(req, res);
      return;
    }

    res.status(404).json({ ok: false, error: "not_found" });
  },
);

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

async function handleMemberRegister(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await registerNewMember({
      idToken: String(body.idToken ?? ""),
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      phone: String(body.phone ?? ""),
      email: body.email != null ? String(body.email) : undefined,
      legalEntityName:
        body.legalEntityName != null ? String(body.legalEntityName) : undefined,
      buildingName: body.buildingName != null ? String(body.buildingName) : undefined,
      slipContentType: String(body.slipContentType ?? ""),
      slipBase64: String(body.slipBase64 ?? ""),
    });

    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }

    res.status(result.resubmitted ? 200 : 201).json({
      ok: true,
      memberId: result.memberId,
      publicToken: result.publicToken,
      statusUrl: result.statusUrl,
      memberCardUrl: result.memberCardUrl,
      feeThb: result.feeThb,
      expiryDate: result.expiryDate,
      resubmitted: result.resubmitted === true,
    });
  } catch (err) {
    console.error("register handler error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleRegisterDraft(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await getRegisterDraft(String(body.idToken ?? ""));

    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }

    if (result.mode === "new") {
      res.status(200).json({ ok: true, mode: "new" });
      return;
    }

    res.status(200).json({
      ok: true,
      mode: "resubmit",
      memberId: result.memberId,
      rejectReason: result.rejectReason,
      firstName: result.firstName,
      lastName: result.lastName,
      phone: result.phone,
      email: result.email,
      legalEntityName: result.legalEntityName,
      buildingName: result.buildingName,
    });
  } catch (err) {
    console.error("register draft handler error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}
