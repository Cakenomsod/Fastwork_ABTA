/**
 * Firestore access for staffUsers allowlist + bootstrap super-admin.
 */

import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import {
  ALL_STAFF_ROLES,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_EMAILS,
  SUPER_ADMIN_UID,
  isSuperAdminEmail,
  normalizeEmail,
  superAdminStaffDoc,
  type StaffRole,
  type StaffUserDoc,
} from "./types";

export const STAFF_COLLECTION = "staffUsers";

function db(): Firestore {
  return getFirestore();
}

function staffRef(email: string) {
  return db().collection(STAFF_COLLECTION).doc(normalizeEmail(email));
}

async function ensureOneSuperAdmin(
  email: string,
  opts?: {
    uid?: string;
    displayName?: string;
  },
): Promise<StaffUserDoc> {
  const normalized = normalizeEmail(email);
  const ref = staffRef(normalized);
  const snap = await ref.get();
  const defaultUid =
    normalized === SUPER_ADMIN_EMAIL ? SUPER_ADMIN_UID : undefined;
  const uid = opts?.uid || defaultUid;

  if (!snap.exists) {
    const doc: Omit<StaffUserDoc, "createdAt" | "updatedAt"> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    } = {
      email: normalized,
      roles: [...ALL_STAFF_ROLES],
      isSuperAdmin: true,
      displayName: opts?.displayName?.trim() || "Super Admin",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "system",
      ...(uid ? { uid } : {}),
    };
    await ref.set(doc);
    return superAdminStaffDoc(normalized, {
      uid,
      displayName: opts?.displayName?.trim() || "Super Admin",
    });
  }

  const existing = snap.data() as StaffUserDoc;
  const roles = new Set(existing.roles ?? []);
  for (const r of ALL_STAFF_ROLES) roles.add(r);

  const displayName =
    opts?.displayName?.trim() || existing.displayName || "Super Admin";
  const nextUid = opts?.uid || existing.uid || defaultUid;

  const needsPatch =
    !existing.isSuperAdmin ||
    roles.size !== (existing.roles?.length ?? 0) ||
    normalizeEmail(existing.email) !== normalized ||
    (nextUid && existing.uid !== nextUid) ||
    (opts?.displayName?.trim() && existing.displayName !== displayName);

  if (needsPatch) {
    await ref.set(
      {
        email: normalized,
        roles: [...roles],
        isSuperAdmin: true,
        displayName,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "system",
        ...(nextUid ? { uid: nextUid } : {}),
      },
      { merge: true },
    );
    return {
      ...existing,
      email: normalized,
      uid: nextUid,
      roles: [...roles] as StaffRole[],
      isSuperAdmin: true,
      displayName,
    };
  }

  return existing;
}

/**
 * Ensure all bootstrap super-admins exist with all roles.
 * Safe to call on every admin session.
 * When `opts.email` is a super-admin, updates that account's uid/displayName
 * and returns that doc; otherwise returns undefined.
 */
export async function ensureSuperAdminBootstrap(opts?: {
  email?: string;
  uid?: string;
  displayName?: string;
}): Promise<StaffUserDoc | undefined> {
  const loginEmail = opts?.email ? normalizeEmail(opts.email) : "";
  let matched: StaffUserDoc | undefined;

  for (const email of SUPER_ADMIN_EMAILS) {
    const isLogin = loginEmail === email;
    const doc = await ensureOneSuperAdmin(email, {
      uid: isLogin ? opts?.uid : undefined,
      displayName: isLogin ? opts?.displayName : undefined,
    });
    if (isLogin) matched = doc;
  }

  return matched;
}

export async function findStaffByEmail(
  email: string,
): Promise<StaffUserDoc | undefined> {
  const snap = await staffRef(email).get();
  return snap.exists ? (snap.data() as StaffUserDoc) : undefined;
}

export async function listStaffUsers(): Promise<StaffUserDoc[]> {
  const snap = await db().collection(STAFF_COLLECTION).get();
  const rows = snap.docs.map((d) => d.data() as StaffUserDoc);
  rows.sort((a, b) => a.email.localeCompare(b.email));
  return rows;
}

export async function upsertStaffUser(input: {
  email: string;
  roles: StaffRole[];
  displayName?: string;
  actorEmail: string;
}): Promise<StaffUserDoc> {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw new Error("invalid_email");
  }
  if (!input.roles.length) {
    throw new Error("roles_required");
  }

  const isSuper = isSuperAdminEmail(email);
  const roles = isSuper
    ? [...ALL_STAFF_ROLES]
    : ([...new Set(input.roles)] as StaffRole[]);

  const ref = staffRef(email);
  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() as StaffUserDoc) : undefined;
  const payload = {
    email,
    roles,
    isSuperAdmin: isSuper || undefined,
    ...(isSuper && email === SUPER_ADMIN_EMAIL
      ? { uid: existing?.uid || SUPER_ADMIN_UID }
      : {}),
    displayName: input.displayName?.trim() || undefined,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: input.actorEmail,
    ...(snap.exists
      ? {}
      : {
          createdAt: FieldValue.serverTimestamp(),
          createdBy: input.actorEmail,
        }),
  };

  await ref.set(payload, { merge: true });
  const after = await ref.get();
  return after.data() as StaffUserDoc;
}

export async function deleteStaffUser(
  email: string,
  actorEmail: string,
): Promise<void> {
  const normalized = normalizeEmail(email);
  if (isSuperAdminEmail(normalized)) {
    throw new Error("cannot_delete_super_admin");
  }
  if (normalized === normalizeEmail(actorEmail)) {
    throw new Error("cannot_delete_self");
  }
  await staffRef(normalized).delete();
}
