/**
 * Reset transactional Firestore data (+ Storage slips) back to empty.
 *
 * Keeps config / access:
 *   - staffUsers
 *   - messageTemplates
 *   - membershipFeeMasters
 *   - seminars
 *
 * Run:
 *   cd apps/functions
 *   npx tsx scripts/reset-firestore.ts
 *   npx tsx scripts/reset-firestore.ts --yes   # skip confirm
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const PROJECT_ID = "abta-member";
const REPO_ROOT = resolve(__dirname, "../../..");
const DEFAULT_SA = resolve(
  REPO_ROOT,
  "abta-member-firebase-adminsdk-fbsvc-1a73213420.json",
);

/** Operational / transactional collections to wipe completely. */
const WIPE_COLLECTIONS = [
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

/** Storage prefixes that hold slip images. */
const WIPE_STORAGE_PREFIXES = ["slips/", "seminar-slips/"] as const;

const KEEP_COLLECTIONS = [
  "staffUsers",
  "messageTemplates",
  "membershipFeeMasters",
  "seminars",
] as const;

function initAdmin() {
  const explicit = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const saPath = explicit && existsSync(explicit) ? explicit : DEFAULT_SA;

  if (existsSync(saPath)) {
    const sa = JSON.parse(readFileSync(saPath, "utf8"));
    initializeApp({
      credential: cert(sa),
      projectId: PROJECT_ID,
      storageBucket: "abta-member",
    });
    console.log(`✓ Admin SDK using service account: ${saPath}`);
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
      storageBucket: "abta-member",
    });
    console.log("✓ Admin SDK using application default credentials");
  }
}

async function deleteCollection(name: string): Promise<number> {
  const db = getFirestore();
  const col = db.collection(name);
  let total = 0;

  for (;;) {
    const snap = await col.limit(400).get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    total += snap.size;
    process.stdout.write(`  ${name}: deleted ${total}…\r`);
  }

  if (total > 0) console.log(`  ${name}: deleted ${total} docs`);
  else console.log(`  ${name}: already empty`);
  return total;
}

async function deleteStoragePrefix(prefix: string): Promise<number> {
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles({ prefix });
  if (files.length === 0) {
    console.log(`  gs://${bucket.name}/${prefix}: already empty`);
    return 0;
  }

  let deleted = 0;
  const chunkSize = 100;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    await Promise.all(chunk.map((f) => f.delete({ ignoreNotFound: true })));
    deleted += chunk.length;
    process.stdout.write(`  ${prefix}: deleted ${deleted}/${files.length}…\r`);
  }
  console.log(`  gs://${bucket.name}/${prefix}: deleted ${deleted} files`);
  return deleted;
}

async function main() {
  const skipConfirm = process.argv.includes("--yes");

  console.log(`Project: ${PROJECT_ID}`);
  console.log("Will WIPE Firestore collections:");
  for (const c of WIPE_COLLECTIONS) console.log(`  - ${c}`);
  console.log("Will WIPE Storage prefixes:");
  for (const p of WIPE_STORAGE_PREFIXES) console.log(`  - ${p}`);
  console.log("Will KEEP:");
  for (const c of KEEP_COLLECTIONS) console.log(`  - ${c}`);

  if (!skipConfirm) {
    console.log("\nPass --yes to confirm and run.");
    process.exit(1);
  }

  initAdmin();

  console.log("\n--- Firestore ---");
  let firestoreTotal = 0;
  for (const name of WIPE_COLLECTIONS) {
    firestoreTotal += await deleteCollection(name);
  }

  // Also wipe any other top-level collections except KEEP list
  // (safety net for unexpected collections created during testing)
  const db = getFirestore();
  const rootCols = await db.listCollections();
  const known = new Set<string>([...WIPE_COLLECTIONS, ...KEEP_COLLECTIONS]);
  for (const col of rootCols) {
    if (known.has(col.id)) continue;
    console.log(`  unexpected collection "${col.id}" — wiping`);
    firestoreTotal += await deleteCollection(col.id);
  }

  console.log("\n--- Storage ---");
  let storageTotal = 0;
  for (const prefix of WIPE_STORAGE_PREFIXES) {
    storageTotal += await deleteStoragePrefix(prefix);
  }

  console.log("\n✓ Reset complete");
  console.log(`  Firestore docs deleted: ${firestoreTotal}`);
  console.log(`  Storage files deleted:  ${storageTotal}`);
  console.log("  Counters / idRegistry cleared → IDs will start from 1 again");
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
