/**
 * HTTP handlers for ABTA Back Office admin APIs.
 */

import type { Request, Response } from "express";
import { getStorage } from "firebase-admin/storage";
import {
  authenticateAdmin,
  requireRoles,
  requireStaffManager,
} from "./auth";
import {
  approveDataReview,
  approveSlipReview,
  getAdminMemberDetail,
  getDashboardStats,
  listPendingDataReviews,
  listPendingSlipReviews,
  rejectDataReview,
  rejectSlipReview,
  searchMembers,
  slipObjectRef,
} from "./reviews";
import { updateMemberIds } from "./update-ids";
import {
  deleteStaffUser,
  listStaffUsers,
  upsertStaffUser,
} from "../staff/repository";
import {
  hasAnyRole,
  isValidStaffRole,
  type StaffRole,
} from "../staff/types";

function jsonError(res: Response, status: number, error: string): void {
  res.status(status).json({ ok: false, error });
}

export async function handleAdminMe(req: Request, res: Response): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const { session } = auth;
  res.status(200).json({
    ok: true,
    me: {
      email: session.email,
      displayName: session.displayName,
      roles: session.staff.roles,
      isSuperAdmin: Boolean(session.staff.isSuperAdmin),
      canManageStaff:
        Boolean(session.staff.isSuperAdmin) ||
        session.staff.roles.includes("admin"),
    },
  });
}

export async function handleAdminDashboard(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const stats = await getDashboardStats();
  res.status(200).json({ ok: true, ...stats });
}

export async function handleAdminStaffList(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireStaffManager(auth.session);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }
  const staff = await listStaffUsers();
  res.status(200).json({
    ok: true,
    staff: staff.map((s) => ({
      email: s.email,
      roles: s.roles,
      isSuperAdmin: Boolean(s.isSuperAdmin),
      displayName: s.displayName,
    })),
  });
}

export async function handleAdminStaffUpsert(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireStaffManager(auth.session);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = String(body.email ?? "");
  const displayName =
    body.displayName != null ? String(body.displayName) : undefined;
  const rawRoles = Array.isArray(body.roles) ? body.roles : [];
  const roles = rawRoles.filter(isValidStaffRole) as StaffRole[];

  try {
    const staff = await upsertStaffUser({
      email,
      roles,
      displayName,
      actorEmail: auth.session.email,
    });
    res.status(200).json({
      ok: true,
      staff: {
        email: staff.email,
        roles: staff.roles,
        isSuperAdmin: Boolean(staff.isSuperAdmin),
        displayName: staff.displayName,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server_error";
    const status =
      msg === "invalid_email" || msg === "roles_required" ? 400 : 500;
    jsonError(res, status, msg);
  }
}

export async function handleAdminStaffDelete(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireStaffManager(auth.session);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }

  const email = String(
    (req.body as Record<string, unknown>)?.email ?? req.query.email ?? "",
  );
  try {
    await deleteStaffUser(email, auth.session.email);
    res.status(200).json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server_error";
    const status =
      msg === "cannot_delete_super_admin" || msg === "cannot_delete_self"
        ? 400
        : 500;
    jsonError(res, status, msg);
  }
}

export async function handlePendingDataReviews(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin", "registrar"]);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }
  const items = await listPendingDataReviews();
  res.status(200).json({ ok: true, items });
}

export async function handlePendingSlipReviews(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin", "treasurer"]);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }
  const items = await listPendingSlipReviews();
  res.status(200).json({ ok: true, items });
}

export async function handleAdminMemberDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const memberId = String(req.query.memberId ?? req.query.m ?? "").trim();
  if (!memberId) {
    jsonError(res, 400, "member_id_required");
    return;
  }
  const detail = await getAdminMemberDetail(memberId);
  if (!detail) {
    jsonError(res, 404, "not_found");
    return;
  }
  res.status(200).json({ ok: true, member: detail });
}

/** Stream slip image for authenticated staff (avoids Storage signBlob IAM). */
export async function handleAdminMemberSlip(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin", "registrar", "treasurer"]);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }

  const memberId = String(req.query.memberId ?? req.query.m ?? "").trim();
  if (!memberId) {
    jsonError(res, 400, "member_id_required");
    return;
  }

  const detail = await getAdminMemberDetail(memberId);
  if (!detail?.slipUrl) {
    jsonError(res, 404, "slip_not_found");
    return;
  }

  if (detail.slipUrl.startsWith("http://") || detail.slipUrl.startsWith("https://")) {
    res.redirect(detail.slipUrl);
    return;
  }

  const ref = slipObjectRef(detail.slipUrl);
  if (!ref) {
    jsonError(res, 404, "slip_not_found");
    return;
  }

  try {
    const bucket = ref.bucketName
      ? getStorage().bucket(ref.bucketName)
      : getStorage().bucket();
    const file = bucket.file(ref.objectPath);
    const [meta] = await file.getMetadata();
    const contentType = (meta.contentType as string) || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    file.createReadStream().on("error", (err) => {
      console.error("slip stream error", err);
      if (!res.headersSent) jsonError(res, 500, "slip_read_failed");
      else res.end();
    }).pipe(res);
  } catch (err) {
    console.error("slip proxy error", err);
    jsonError(res, 500, "slip_read_failed");
  }
}

export async function handleAdminMemberSearch(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const q = String(req.query.q ?? "").trim();
  const items = await searchMembers(q);
  res.status(200).json({ ok: true, items });
}

/** PATCH member / receipt numbers (admin correction). */
export async function handleAdminUpdateMemberIds(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const memberId = String(body.memberId ?? "").trim();
  const newMemberId =
    body.newMemberId != null ? String(body.newMemberId).trim() : undefined;
  const newReceiptNumber =
    body.newReceiptNumber != null
      ? String(body.newReceiptNumber).trim()
      : undefined;

  if (!memberId) {
    jsonError(res, 400, "member_id_required");
    return;
  }

  const allowMemberId = hasAnyRole(auth.session.staff, [
    "admin",
    "registrar",
  ]);
  const allowReceiptNumber = hasAnyRole(auth.session.staff, [
    "admin",
    "treasurer",
  ]);

  if (
    (newMemberId && !allowMemberId) ||
    (newReceiptNumber && !allowReceiptNumber)
  ) {
    jsonError(res, 403, "forbidden_role");
    return;
  }
  if (!allowMemberId && !allowReceiptNumber) {
    jsonError(res, 403, "forbidden_role");
    return;
  }

  const result = await updateMemberIds({
    memberId,
    newMemberId,
    newReceiptNumber,
    actorEmail: auth.session.email,
    allowMemberId,
    allowReceiptNumber,
  });

  if (!result.ok) {
    jsonError(res, result.status, result.error);
    return;
  }

  res.status(200).json({
    ok: true,
    memberId: result.memberId,
    receiptNumber: result.receiptNumber,
    member: result.member,
  });
}

export async function handleApproveData(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin", "registrar"]);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const memberId = String(body.memberId ?? "").trim();
  if (!memberId) {
    jsonError(res, 400, "member_id_required");
    return;
  }
  const result = await approveDataReview(memberId, auth.session.email);
  if (!result.ok) {
    jsonError(res, result.status, result.error);
    return;
  }
  res.status(200).json(result);
}

export async function handleRejectData(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin", "registrar"]);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const memberId = String(body.memberId ?? "").trim();
  const reason = String(body.reason ?? "");
  if (!memberId) {
    jsonError(res, 400, "member_id_required");
    return;
  }
  const result = await rejectDataReview(memberId, auth.session.email, reason);
  if (!result.ok) {
    jsonError(res, result.status, result.error);
    return;
  }
  res.status(200).json(result);
}

export async function handleApproveSlip(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin", "treasurer"]);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const memberId = String(body.memberId ?? "").trim();
  if (!memberId) {
    jsonError(res, 400, "member_id_required");
    return;
  }
  const result = await approveSlipReview(memberId, auth.session.email);
  if (!result.ok) {
    jsonError(res, result.status, result.error);
    return;
  }
  res.status(200).json(result);
}

export async function handleRejectSlip(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin", "treasurer"]);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const memberId = String(body.memberId ?? "").trim();
  const reason = String(body.reason ?? "");
  if (!memberId) {
    jsonError(res, 400, "member_id_required");
    return;
  }
  const result = await rejectSlipReview(memberId, auth.session.email, reason);
  if (!result.ok) {
    jsonError(res, result.status, result.error);
    return;
  }
  res.status(200).json(result);
}
