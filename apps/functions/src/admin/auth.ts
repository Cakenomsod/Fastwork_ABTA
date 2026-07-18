/**
 * Verify Firebase Auth ID token and resolve allowlisted staff session.
 */

import type { Request } from "express";
import { getAuth } from "firebase-admin/auth";
import { ensureSuperAdminBootstrap, findStaffByEmail } from "../staff/repository";
import {
  canManageStaff,
  hasAnyRole,
  isSuperAdminEmail,
  normalizeEmail,
  superAdminStaffDoc,
  type StaffRole,
  type StaffUserDoc,
} from "../staff/types";

export interface AdminSession {
  uid: string;
  email: string;
  displayName?: string;
  staff: StaffUserDoc;
}

export type AuthResult =
  | { ok: true; session: AdminSession }
  | { ok: false; error: string; status: number };

function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization ?? req.headers.Authorization;
  if (!header || typeof header !== "string") return undefined;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() || undefined;
}

export async function authenticateAdmin(req: Request): Promise<AuthResult> {
  const token = bearerToken(req);
  if (!token) {
    return { ok: false, error: "auth_required", status: 401 };
  }

  let decoded: { uid: string; email?: string; name?: string };
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch (err) {
    console.warn("Firebase ID token verify failed", err);
    return { ok: false, error: "invalid_token", status: 401 };
  }

  const email = decoded.email ? normalizeEmail(decoded.email) : "";
  if (!email) {
    return { ok: false, error: "email_required", status: 403 };
  }

  // Always upsert the bootstrap super-admin on every auth gate.
  let staff: StaffUserDoc | undefined;
  try {
    const bootstrapped = await ensureSuperAdminBootstrap({
      uid: decoded.uid,
      displayName: decoded.name,
    });
    if (isSuperAdminEmail(email)) {
      staff = bootstrapped;
    }
  } catch (err) {
    console.error("ensureSuperAdminBootstrap failed", err);
  }

  if (!staff) {
    staff = await findStaffByEmail(email);
  }

  // Hard allow: super-admin email must never be blocked even if Firestore write failed.
  if (!staff && isSuperAdminEmail(email)) {
    staff = superAdminStaffDoc({
      uid: decoded.uid,
      displayName: decoded.name || "Super Admin",
    });
  }

  if (!staff) {
    return { ok: false, error: "not_authorized", status: 403 };
  }

  return {
    ok: true,
    session: {
      uid: decoded.uid,
      email,
      displayName: decoded.name || staff.displayName,
      staff,
    },
  };
}

export function requireRoles(
  session: AdminSession,
  roles: StaffRole[],
): AuthResult {
  if (!hasAnyRole(session.staff, roles)) {
    return { ok: false, error: "forbidden_role", status: 403 };
  }
  return { ok: true, session };
}

export function requireStaffManager(session: AdminSession): AuthResult {
  if (!canManageStaff(session.staff)) {
    return { ok: false, error: "forbidden_role", status: 403 };
  }
  return { ok: true, session };
}
