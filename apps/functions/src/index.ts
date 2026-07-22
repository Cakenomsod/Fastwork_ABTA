import type { Request, Response } from "express";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  handleAdminDashboard,
  handleAdminMe,
  handleAdminMemberDetail,
  handleAdminMemberSearch,
  handleAdminMemberSlip,
  handleAdminCheckMemberIds,
  handleAdminDeleteMember,
  handleAdminLegacyImport,
  handleAdminListLegacyMembers,
  handleAdminLegacyPayments,
  handleAdminStaffDelete,
  handleAdminStaffList,
  handleAdminStaffUpsert,
  handleAdminUpdateMemberIds,
  handleAdminUpdateMemberProfile,
  handleAdminBroadcastRecipients,
  handleAdminBroadcastSend,
  handleAdminBroadcastLogs,
  handleApproveData,
  handleApproveSlip,
  handlePendingDataReviews,
  handlePendingSlipReviews,
  handleRejectData,
  handleRejectSlip,
} from "./admin/handlers";
import { handleLineWebhook } from "./line/webhook";
import { bindLegacyMember, searchLegacyMembers } from "./members/legacy-bind";
import { runExpiryReminderJob } from "./members/expiry-reminders";
import { getRegisterDraft, registerNewMember } from "./members/register";
import { getRenewDraft, renewMembership } from "./members/renew";
import { resubmitSlip } from "./members/slip-resubmit";
import { getStatusViewByMemberId } from "./members/repository";
import { toPublicStatus } from "./members/status-view";
import {
  adminCreateSeminar,
  adminDeactivateSeminar,
  adminDecideRegistration,
  adminListRegistrations,
  adminListSeminars,
  adminUpdateSeminar,
  publicListSeminars,
  registerForSeminar,
} from "./seminars/register";

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

    if (path === "/members/legacy/search" && req.method === "POST") {
      await handleLegacySearch(req, res);
      return;
    }
    if (path === "/members/legacy/bind" && req.method === "POST") {
      await handleLegacyBind(req, res);
      return;
    }

    if (path === "/members/slip/resubmit" && req.method === "POST") {
      await handleSlipResubmit(req, res);
      return;
    }
    if (path === "/members/renew/draft" && req.method === "POST") {
      await handleRenewDraft(req, res);
      return;
    }
    if (path === "/members/renew" && req.method === "POST") {
      await handleRenew(req, res);
      return;
    }

    if (path === "/seminars" && req.method === "GET") {
      await handlePublicSeminars(req, res);
      return;
    }
    if (path === "/seminars/register" && req.method === "POST") {
      await handleSeminarRegister(req, res);
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
    if (path === "/admin/members/ids/check" && req.method === "GET") {
      await handleAdminCheckMemberIds(req, res);
      return;
    }
    if (
      path === "/admin/members/profile" &&
      (req.method === "PATCH" || req.method === "PUT")
    ) {
      await handleAdminUpdateMemberProfile(req, res);
      return;
    }
    if (path === "/admin/members" && req.method === "DELETE") {
      await handleAdminDeleteMember(req, res);
      return;
    }
    if (path === "/admin/members/legacy-payments" && req.method === "GET") {
      await handleAdminLegacyPayments(req, res);
      return;
    }
    if (path === "/admin/legacy/members" && req.method === "GET") {
      await handleAdminListLegacyMembers(req, res);
      return;
    }
    if (path === "/admin/legacy/import" && req.method === "POST") {
      await handleAdminLegacyImport(req, res);
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
    if (path === "/admin/seminars" && req.method === "GET") {
      await handleAdminSeminarsList(req, res);
      return;
    }
    if (path === "/admin/seminars" && req.method === "POST") {
      await handleAdminSeminarsCreate(req, res);
      return;
    }
    if (path === "/admin/seminars/update" && req.method === "POST") {
      await handleAdminSeminarsUpdate(req, res);
      return;
    }
    if (path === "/admin/seminars/deactivate" && req.method === "POST") {
      await handleAdminSeminarsDeactivate(req, res);
      return;
    }
    if (path === "/admin/seminars/registrations" && req.method === "GET") {
      await handleAdminSeminarRegistrations(req, res);
      return;
    }
    if (path === "/admin/seminars/registrations/decide" && req.method === "POST") {
      await handleAdminSeminarDecide(req, res);
      return;
    }

    if (path === "/admin/broadcast/recipients" && req.method === "GET") {
      await handleAdminBroadcastRecipients(req, res);
      return;
    }

    if (path === "/admin/broadcast/send" && req.method === "POST") {
      await handleAdminBroadcastSend(req, res);
      return;
    }

    if (path === "/admin/broadcast/logs" && req.method === "GET") {
      await handleAdminBroadcastLogs(req, res);
      return;
    }

    res.status(404).json({ ok: false, error: "not_found" });
  },
);

/** Daily 09:00 Asia/Bangkok — near-expiry status + 45/15 day LINE reminders. */
export const expiryReminderJob = onSchedule(
  {
    schedule: "0 9 * * *",
    timeZone: "Asia/Bangkok",
    region: "asia-southeast1",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const result = await runExpiryReminderJob();
    console.log("expiryReminderJob", result);
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
      res.status(result.status).json({
        ok: false,
        error: result.error,
        ...(result.statusUrl ? { statusUrl: result.statusUrl } : {}),
      });
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

async function handleLegacySearch(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await searchLegacyMembers({
      idToken: String(body.idToken ?? ""),
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      legalEntityName:
        body.legalEntityName != null ? String(body.legalEntityName) : undefined,
      buildingName:
        body.buildingName != null ? String(body.buildingName) : undefined,
    });
    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }
    res.status(200).json({ ok: true, matches: result.matches });
  } catch (err) {
    console.error("legacy search handler error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleLegacyBind(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await bindLegacyMember({
      idToken: String(body.idToken ?? ""),
      legacyMemberId: String(body.legacyMemberId ?? ""),
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      legalEntityName:
        body.legalEntityName != null ? String(body.legalEntityName) : undefined,
      buildingName:
        body.buildingName != null ? String(body.buildingName) : undefined,
    });
    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }
    res.status(201).json({
      ok: true,
      memberId: result.memberId,
      legacyMemberId: result.legacyMemberId,
      publicToken: result.publicToken,
      statusUrl: result.statusUrl,
      memberCardUrl: result.memberCardUrl,
      status: result.status,
    });
  } catch (err) {
    console.error("legacy bind handler error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleSlipResubmit(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await resubmitSlip({
      idToken: String(body.idToken ?? ""),
      slipContentType: String(body.slipContentType ?? ""),
      slipBase64: String(body.slipBase64 ?? ""),
    });
    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    console.error("slip resubmit handler error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleRenewDraft(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await getRenewDraft(String(body.idToken ?? ""));
    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    console.error("renew draft handler error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleRenew(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await renewMembership({
      idToken: String(body.idToken ?? ""),
      slipContentType: String(body.slipContentType ?? ""),
      slipBase64: String(body.slipBase64 ?? ""),
    });
    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    console.error("renew handler error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handlePublicSeminars(_req: Request, res: Response): Promise<void> {
  try {
    const items = await publicListSeminars();
    res.status(200).json({ ok: true, items });
  } catch (err) {
    console.error("public seminars error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleSeminarRegister(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await registerForSeminar({
      idToken: body.idToken != null ? String(body.idToken) : undefined,
      seminarId: String(body.seminarId ?? ""),
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      phone: String(body.phone ?? ""),
      email: body.email != null ? String(body.email) : undefined,
      applicantType:
        body.applicantType != null ? String(body.applicantType) : undefined,
      shirtSize: body.shirtSize != null ? String(body.shirtSize) : undefined,
      foodType: body.foodType != null ? String(body.foodType) : undefined,
      notes: body.notes != null ? String(body.notes) : undefined,
      slipContentType:
        body.slipContentType != null ? String(body.slipContentType) : undefined,
      slipBase64: body.slipBase64 != null ? String(body.slipBase64) : undefined,
    });
    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    console.error("seminar register error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleAdminSeminarsList(req: Request, res: Response): Promise<void> {
  const { authenticateAdmin } = await import("./admin/auth");
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }
  try {
    const items = await adminListSeminars();
    res.status(200).json({ ok: true, items });
  } catch (err) {
    console.error("admin seminars list error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleAdminSeminarsCreate(req: Request, res: Response): Promise<void> {
  const { authenticateAdmin, requireRoles } = await import("./admin/auth");
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }
  const role = requireRoles(auth.session, ["admin", "registrar"]);
  if (!role.ok) {
    res.status(role.status).json({ ok: false, error: role.error });
    return;
  }
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const item = await adminCreateSeminar({
      title: String(body.title ?? ""),
      description: body.description != null ? String(body.description) : undefined,
      eventDate: body.eventDate != null ? String(body.eventDate) : undefined,
      location: body.location != null ? String(body.location) : undefined,
      publicPaid: body.publicPaid != null ? Number(body.publicPaid) : undefined,
      memberFree: body.memberFree != null ? Number(body.memberFree) : undefined,
      memberPaid: body.memberPaid != null ? Number(body.memberPaid) : undefined,
    });
    res.status(201).json({ ok: true, item });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error("admin seminars create error", err);
    res.status(status).json({
      ok: false,
      error: err instanceof Error ? err.message : "server_error",
    });
  }
}

async function handleAdminSeminarsUpdate(
  req: Request,
  res: Response,
): Promise<void> {
  const { authenticateAdmin, requireRoles } = await import("./admin/auth");
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }
  const role = requireRoles(auth.session, ["admin", "registrar"]);
  if (!role.ok) {
    res.status(role.status).json({ ok: false, error: role.error });
    return;
  }
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const item = await adminUpdateSeminar({
      seminarId: String(body.seminarId ?? ""),
      title: String(body.title ?? ""),
      description: body.description != null ? String(body.description) : undefined,
      eventDate: body.eventDate != null ? String(body.eventDate) : undefined,
      location: body.location != null ? String(body.location) : undefined,
      publicPaid: body.publicPaid != null ? Number(body.publicPaid) : undefined,
      memberFree: body.memberFree != null ? Number(body.memberFree) : undefined,
      memberPaid: body.memberPaid != null ? Number(body.memberPaid) : undefined,
    });
    res.status(200).json({ ok: true, item });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error("admin seminars update error", err);
    res.status(status).json({
      ok: false,
      error: err instanceof Error ? err.message : "server_error",
    });
  }
}

async function handleAdminSeminarsDeactivate(
  req: Request,
  res: Response,
): Promise<void> {
  const { authenticateAdmin, requireRoles } = await import("./admin/auth");
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }
  const role = requireRoles(auth.session, ["admin", "registrar"]);
  if (!role.ok) {
    res.status(role.status).json({ ok: false, error: role.error });
    return;
  }
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const item = await adminDeactivateSeminar(String(body.seminarId ?? ""));
    res.status(200).json({ ok: true, item });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error("admin seminars deactivate error", err);
    res.status(status).json({
      ok: false,
      error: err instanceof Error ? err.message : "server_error",
    });
  }
}

async function handleAdminSeminarRegistrations(
  req: Request,
  res: Response,
): Promise<void> {
  const { authenticateAdmin } = await import("./admin/auth");
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }
  try {
    const seminarId = String(req.query.seminarId ?? "").trim() || undefined;
    const items = await adminListRegistrations(seminarId);
    res.status(200).json({ ok: true, items });
  } catch (err) {
    console.error("admin seminar registrations error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function handleAdminSeminarDecide(req: Request, res: Response): Promise<void> {
  const { authenticateAdmin, requireRoles } = await import("./admin/auth");
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }
  const role = requireRoles(auth.session, ["admin", "registrar"]);
  if (!role.ok) {
    res.status(role.status).json({ ok: false, error: role.error });
    return;
  }
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await adminDecideRegistration({
      registrationId: String(body.registrationId ?? ""),
      approve: Boolean(body.approve),
      reason: body.reason != null ? String(body.reason) : undefined,
    });
    if (!result.ok) {
      res.status(result.status).json({ ok: false, error: result.error });
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    console.error("admin seminar decide error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}
