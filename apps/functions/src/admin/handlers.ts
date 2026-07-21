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
  listMembers,
  listPendingDataReviews,
  listPendingSlipReviews,
  rejectDataReview,
  rejectSlipReview,
  slipObjectRef,
  type MemberListSort,
  type MemberListStatusFilter,
  type ReceiptIdTFilter,
} from "./reviews";
import { checkMemberIds, updateMemberIds } from "./update-ids";
import {
  deleteMemberRecord,
  updateMemberProfile,
} from "./member-profile";
import {
  findBoundLegacyLinks,
  findLegacyPaymentsByMemberId,
  listLegacyMembers,
} from "../legacy/repository";
import type { LegacyMemberStatus } from "../legacy/types";
import {
  importLegacyWorkbookFromBuffer,
  LegacyImportError,
  LEGACY_IMPORT_MAX_BYTES,
} from "../legacy/import-xlsx";
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

const STATUS_FILTERS = new Set<MemberListStatusFilter>([
  "pending_data",
  "pending_slip",
  "temporary",
  "active",
  "near_expiry",
  "expired",
  "ordinary_active",
]);
const RECEIPT_ID_T_FILTERS = new Set<ReceiptIdTFilter>(["with_t", "without_t"]);
const MEMBER_SORTS = new Set<MemberListSort>([
  "member_asc",
  "member_desc",
  "t_first",
  "no_t_first",
  "confirmed_desc",
  "updated_desc",
]);

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
  const statusRaw = String(req.query.status ?? "").trim();
  const receiptIdTRaw = String(req.query.receiptIdT ?? "").trim();
  const sortRaw = String(req.query.sort ?? "").trim();
  const pageRaw = Number(req.query.page ?? 1);
  const pageSizeRaw = Number(
    req.query.pageSize ?? req.query.limit ?? 10,
  );

  const status = STATUS_FILTERS.has(statusRaw as MemberListStatusFilter)
    ? (statusRaw as MemberListStatusFilter)
    : undefined;
  const receiptIdT = RECEIPT_ID_T_FILTERS.has(receiptIdTRaw as ReceiptIdTFilter)
    ? (receiptIdTRaw as ReceiptIdTFilter)
    : undefined;
  const sort = MEMBER_SORTS.has(sortRaw as MemberListSort)
    ? (sortRaw as MemberListSort)
    : "updated_desc";

  const result = await listMembers({
    q,
    status,
    receiptIdT,
    sort,
    page: Number.isFinite(pageRaw) ? pageRaw : 1,
    pageSize: Number.isFinite(pageSizeRaw) ? pageSizeRaw : 10,
  });
  res.status(200).json({ ok: true, ...result });
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

/** GET pre-check uniqueness + next suggested sequential IDs. */
export async function handleAdminCheckMemberIds(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }

  const memberId = String(req.query.memberId ?? "").trim() || undefined;
  const receiptNumber =
    String(req.query.receiptNumber ?? "").trim() || undefined;
  const exceptMemberId =
    String(req.query.exceptMemberId ?? "").trim() || undefined;
  const exceptPaymentId =
    String(req.query.exceptPaymentId ?? "").trim() || undefined;

  const result = await checkMemberIds({
    memberId,
    receiptNumber,
    exceptMemberId,
    exceptPaymentId,
  });
  res.status(200).json(result);
}

/** PATCH member profile (name, contact, expiry). */
export async function handleAdminUpdateMemberProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin"]);
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

  const result = await updateMemberProfile({
    memberId,
    patch: {
      firstName:
        body.firstName != null ? String(body.firstName) : undefined,
      lastName: body.lastName != null ? String(body.lastName) : undefined,
      phone: body.phone != null ? String(body.phone) : undefined,
      email: body.email != null ? String(body.email) : undefined,
      legalEntityName:
        body.legalEntityName != null
          ? String(body.legalEntityName)
          : undefined,
      buildingName:
        body.buildingName != null ? String(body.buildingName) : undefined,
      organization:
        body.organization != null ? String(body.organization) : undefined,
      expiryDate:
        body.expiryDate != null ? String(body.expiryDate) : undefined,
    },
    actorEmail: auth.session.email,
  });

  if (!result.ok) {
    jsonError(res, result.status, result.error);
    return;
  }
  res.status(200).json({ ok: true, member: result.member });
}

/** DELETE member — requires typed confirmMemberId. */
export async function handleAdminDeleteMember(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const gate = requireRoles(auth.session, ["admin"]);
  if (!gate.ok) {
    jsonError(res, gate.status, gate.error);
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const memberId = String(body.memberId ?? "").trim();
  const confirmMemberId = String(body.confirmMemberId ?? "").trim();
  if (!memberId) {
    jsonError(res, 400, "member_id_required");
    return;
  }

  const result = await deleteMemberRecord({
    memberId,
    confirmMemberId,
    actorEmail: auth.session.email,
  });
  if (!result.ok) {
    jsonError(res, result.status, result.error);
    return;
  }
  res.status(200).json({ ok: true, memberId: result.memberId });
}

/** GET legacy payment history for admin detail panel. */
export async function handleAdminLegacyPayments(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }
  const legacyMemberId = String(req.query.legacyMemberId ?? "").trim();
  if (!legacyMemberId) {
    jsonError(res, 400, "legacy_member_id_required");
    return;
  }

  const rows = await findLegacyPaymentsByMemberId(legacyMemberId);
  res.status(200).json({
    ok: true,
    items: rows.map((r) => ({
      receiptNumber: r.receiptNumber,
      amount: r.amount,
      item: r.item,
      itemType: r.itemType,
      expiryDate: r.expiryDate?.toDate?.()?.toISOString?.()?.slice(0, 10),
      transferredAt: r.transferredAt?.toDate?.()?.toISOString?.(),
    })),
  });
}

const LEGACY_STATUS_SET = new Set<LegacyMemberStatus>([
  "active",
  "expired",
  "non_active",
  "pending",
]);

function matchesLegacyQuery(haystack: string, q: string): boolean {
  if (!q) return true;
  return haystack.toLowerCase().includes(q.toLowerCase());
}

/**
 * GET /admin/legacy/members
 * Query: q, bindStatus (all|bound|unbound), status (active|…),
 *        page (1-based), pageSize (default 10)
 * Any authenticated staff can browse (import remains admin-only).
 */
export async function handleAdminListLegacyMembers(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await authenticateAdmin(req);
  if (!auth.ok) {
    jsonError(res, auth.status, auth.error);
    return;
  }

  const q = String(req.query.q ?? "").trim();
  const bindRaw = String(req.query.bindStatus ?? "all").trim().toLowerCase();
  const bindStatus =
    bindRaw === "bound" || bindRaw === "unbound" ? bindRaw : "all";
  const statusRaw = String(req.query.status ?? "").trim().toLowerCase();
  const statusFilter = LEGACY_STATUS_SET.has(statusRaw as LegacyMemberStatus)
    ? (statusRaw as LegacyMemberStatus)
    : "";
  const pageSize = Math.min(
    Math.max(Number(req.query.pageSize) || 10, 1),
    50,
  );
  const page = Math.max(Number(req.query.page) || 1, 1);
  /** Cap how many docs we scan server-side for browse/search. */
  const scanLimit = Math.min(
    Math.max(Number(req.query.limit) || 2000, pageSize),
    5000,
  );

  const [legacyRows, boundMap] = await Promise.all([
    listLegacyMembers(scanLimit),
    findBoundLegacyLinks(),
  ]);

  let filtered = legacyRows.map((m) => {
    const bound = boundMap.get(m.legacyMemberId);
    return {
      legacyMemberId: m.legacyMemberId,
      firstName: m.firstName,
      lastName: m.lastName,
      fullName: `${m.firstName} ${m.lastName}`.trim(),
      legalEntityName: m.legalEntityName,
      buildingName: m.buildingName ?? m.organization,
      phone: m.phone,
      email: m.email,
      status: m.status,
      memberTypeLabel: m.memberTypeLabel,
      entityTypeLabel: m.entityTypeLabel,
      expiryDate: m.expiryDate?.toDate?.()?.toISOString?.()?.slice(0, 10),
      sourceFile: m.sourceFile,
      lineBound: Boolean(bound),
      boundMemberId: bound?.memberId,
      boundFullName: bound?.fullName || undefined,
    };
  });

  if (statusFilter) {
    filtered = filtered.filter((r) => r.status === statusFilter);
  }
  if (bindStatus === "bound") {
    filtered = filtered.filter((r) => r.lineBound);
  } else if (bindStatus === "unbound") {
    filtered = filtered.filter((r) => !r.lineBound);
  }
  if (q) {
    filtered = filtered.filter((r) => {
      const blob = [
        r.legacyMemberId,
        r.fullName,
        r.firstName,
        r.lastName,
        r.legalEntityName,
        r.buildingName,
        r.phone,
        r.email,
        r.boundMemberId,
      ]
        .filter(Boolean)
        .join(" ");
      return matchesLegacyQuery(blob, q);
    });
  }

  filtered.sort((a, b) =>
    a.legacyMemberId.localeCompare(b.legacyMemberId, "th"),
  );

  const matched = filtered.length;
  const pageCount = Math.max(1, Math.ceil(matched / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const boundCount = legacyRows.reduce(
    (n, m) => n + (boundMap.has(m.legacyMemberId) ? 1 : 0),
    0,
  );

  res.status(200).json({
    ok: true,
    total: legacyRows.length,
    matched,
    boundCount,
    unboundCount: legacyRows.length - boundCount,
    truncated: legacyRows.length >= scanLimit,
    page: safePage,
    pageSize,
    pageCount,
    items,
  });
}

/**
 * POST /admin/legacy/import
 * Body: { fileName: string, contentBase64: string }
 * Staff: admin (or super-admin) only.
 */
export async function handleAdminLegacyImport(
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
  const fileName = String(body.fileName ?? "").trim() || "upload.xlsx";
  const contentBase64 = String(body.contentBase64 ?? "").trim();
  if (!contentBase64) {
    jsonError(res, 400, "file_required");
    return;
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(contentBase64, "base64");
  } catch {
    jsonError(res, 400, "invalid_file_encoding");
    return;
  }

  if (!buffer.byteLength) {
    jsonError(res, 400, "file_required");
    return;
  }
  if (buffer.byteLength > LEGACY_IMPORT_MAX_BYTES) {
    jsonError(res, 413, "file_too_large");
    return;
  }

  const lower = fileName.toLowerCase();
  if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
    jsonError(res, 400, "invalid_file_type");
    return;
  }

  try {
    const result = await importLegacyWorkbookFromBuffer(buffer, fileName);
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof LegacyImportError) {
      const status =
        err.code === "file_too_large"
          ? 413
          : err.code === "invalid_workbook" ||
              err.code === "missing_member_sheet" ||
              err.code === "no_members_parsed"
            ? 400
            : 500;
      jsonError(res, status, err.code);
      return;
    }
    console.error("legacy import failed", err);
    jsonError(res, 500, "import_failed");
  }
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
