/**
 * Super-admin wipe of operational data (members, payments, receipts, slips).
 * Keeps staff, message templates, fee masters, and seminar catalog.
 */

import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export const WIPE_CONFIRM_PHRASE = "ล้างข้อมูลทั้งหมด";

export const WIPE_COLLECTIONS = [
  "members",
  "payments",
  "idRegistry",
  "counters",
  "legacyMembers",
  "legacyPayments",
  "broadcastLogs",
  "seminarRegistrations",
  "line_sightings",
] as const;

export const WIPE_STORAGE_PREFIXES = ["slips/", "seminar-slips/"] as const;

export const WIPE_KEEP_COLLECTIONS = [
  "staffUsers",
  "messageTemplates",
  "membershipFeeMasters",
  "seminars",
] as const;

export type WipePreview = {
  collections: Array<{ name: string; count: number }>;
  storage: Array<{ prefix: string; count: number }>;
};

export type WipeResult = {
  firestoreDeleted: number;
  storageDeleted: number;
  collections: Array<{ name: string; deleted: number }>;
  storage: Array<{ prefix: string; deleted: number }>;
};

async function countCollection(name: string): Promise<number> {
  const snap = await getFirestore().collection(name).count().get();
  return snap.data().count;
}

async function deleteCollection(name: string): Promise<number> {
  const col = getFirestore().collection(name);
  let total = 0;
  for (;;) {
    const snap = await col.limit(400).get();
    if (snap.empty) break;
    const batch = getFirestore().batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    total += snap.size;
  }
  return total;
}

async function countStoragePrefix(prefix: string): Promise<number> {
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles({ prefix });
  return files.length;
}

async function deleteStoragePrefix(prefix: string): Promise<number> {
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles({ prefix });
  if (files.length === 0) return 0;
  const chunkSize = 80;
  let deleted = 0;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    await Promise.all(chunk.map((f) => f.delete({ ignoreNotFound: true })));
    deleted += chunk.length;
  }
  return deleted;
}

export async function previewSystemWipe(): Promise<WipePreview> {
  const collections: WipePreview["collections"] = [];
  for (const name of WIPE_COLLECTIONS) {
    collections.push({ name, count: await countCollection(name) });
  }
  const storage: WipePreview["storage"] = [];
  for (const prefix of WIPE_STORAGE_PREFIXES) {
    storage.push({ prefix, count: await countStoragePrefix(prefix) });
  }
  return { collections, storage };
}

export async function runSystemWipe(opts: {
  confirm: string;
  actorEmail: string;
}): Promise<
  | { ok: true; result: WipeResult }
  | { ok: false; error: string; status: number }
> {
  if (opts.confirm.trim() !== WIPE_CONFIRM_PHRASE) {
    return { ok: false, error: "confirm_mismatch", status: 400 };
  }

  const collections: WipeResult["collections"] = [];
  let firestoreDeleted = 0;
  for (const name of WIPE_COLLECTIONS) {
    const deleted = await deleteCollection(name);
    collections.push({ name, deleted });
    firestoreDeleted += deleted;
  }

  const storage: WipeResult["storage"] = [];
  let storageDeleted = 0;
  for (const prefix of WIPE_STORAGE_PREFIXES) {
    const deleted = await deleteStoragePrefix(prefix);
    storage.push({ prefix, deleted });
    storageDeleted += deleted;
  }

  console.warn("system wipe completed", {
    actorEmail: opts.actorEmail,
    firestoreDeleted,
    storageDeleted,
  });

  return {
    ok: true,
    result: { firestoreDeleted, storageDeleted, collections, storage },
  };
}
