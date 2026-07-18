/**
 * Firestore access for staffUsers allowlist + bootstrap super-admin.
 */

import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import {
  ALL_STAFF_ROLES,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_UID,
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

/**
 * Ensure bootstrap super-admin exists with all roles.
 * Safe to call on every admin session (not only when collection is empty).
 */
export async function ensureSuperAdminBootstrap(opts?: {
  uid?: string;
  displayName?: string;
}): Promise<StaffUserDoc> {
  const email = SUPER_ADMIN_EMAIL;
  const uid = opts?.uid || SUPER_ADMIN_UID;
  const ref = staffRef(email);
  const snap = await ref.get();

  if (!snap.exists) {
    const doc: Omit<StaffUserDoc, "createdAt" | "updatedAt"> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    } = {
      email,
      uid,
      roles: [...ALL_STAFF_ROLES],
      isSuperAdmin: true,
      displayName: opts?.displayName?.trim() || "Super Admin",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "system",
    };
    await ref.set(doc);
    return superAdminStaffDoc({
      uid,
      displayName: opts?.displayName?.trim() || "Super Admin",
    });
  }

  const existing = snap.data() as StaffUserDoc;
  const roles = new Set(existing.roles ?? []);
  for (const r of ALL_STAFF_ROLES) roles.add(r);

  const displayName =
    opts?.displayName?.trim() || existing.displayName || "Super Admin";

  const needsPatch =
    !existing.isSuperAdmin ||
    roles.size !== (existing.roles?.length ?? 0) ||
    normalizeEmail(existing.email) !== email ||
    existing.uid !== uid;

  if (needsPatch) {
    await ref.set(
      {
        email,
        uid,
        roles: [...roles],
        isSuperAdmin: true,
        displayName,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "system",
      },
      { merge: true },
    );
    return {
      ...existing,
      email,
      uid,
      roles: [...roles] as StaffRole[],
      isSuperAdmin: true,
      displayName,
    };
  }

  return existing;
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

  const isSuper = email === SUPER_ADMIN_EMAIL;
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
    ...(isSuper ? { uid: existing?.uid || SUPER_ADMIN_UID } : {}),
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
  if (normalized === SUPER_ADMIN_EMAIL) {
    throw new Error("cannot_delete_super_admin");
  }
  if (normalized === normalizeEmail(actorEmail)) {
    throw new Error("cannot_delete_self");
  }
  await staffRef(normalized).delete();
}
