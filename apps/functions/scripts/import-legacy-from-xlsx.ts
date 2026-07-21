/**
 * Import legacy members (+ transaction history) from NewMemDatabase.xlsx
 * into Firestore `legacyMembers` / `legacyPayments`.
 *
 * Run:
 *   cd apps/functions
 *   npm run import:legacy
 *   npm run import:legacy -- --file ../../ABTA-System/Data/NewMemDatabase.xlsx
 *
 * Credentials: same as seed-demo-members.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  importLegacyWorkbookFromBuffer,
  LegacyImportError,
} from "../src/legacy/import-xlsx";

const PROJECT_ID = "abta-member";
const REPO_ROOT = resolve(__dirname, "../../..");
const DEFAULT_SA = resolve(
  REPO_ROOT,
  "abta-member-firebase-adminsdk-fbsvc-1a73213420.json",
);
const DEFAULT_XLSX = resolve(
  REPO_ROOT,
  "ABTA-System/Data/NewMemDatabase.xlsx",
);

function initAdmin() {
  const explicit = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const saPath = explicit && existsSync(explicit) ? explicit : DEFAULT_SA;

  if (existsSync(saPath)) {
    const sa = JSON.parse(readFileSync(saPath, "utf8"));
    initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
    console.log(`✓ Admin SDK using service account: ${saPath}`);
  } else {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
    console.log("✓ Admin SDK using application default credentials");
  }
  getFirestore().settings({ ignoreUndefinedProperties: true });
}

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

async function main() {
  initAdmin();

  const filePath = resolve(argValue("--file") ?? DEFAULT_XLSX);
  if (!existsSync(filePath)) {
    throw new Error(`Excel not found: ${filePath}`);
  }
  const sourceFile = filePath.split(/[/\\]/).pop() ?? "NewMemDatabase.xlsx";
  console.log(`✓ Reading ${filePath}`);

  const buffer = readFileSync(filePath);
  const result = await importLegacyWorkbookFromBuffer(buffer, sourceFile);

  console.log(`✓ Upserted ${result.members} legacyMembers`);
  console.log(`✓ Upserted ${result.payments} legacyPayments`);
  console.log(`✓ Upserted ${result.feeMasters} membership fee masters`);
  console.log("Sample:");
  for (const m of result.sample) {
    console.log(
      `  - ${m.legacyMemberId} | ${m.fullName} | ${m.status} | ${m.memberTypeLabel ?? ""}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    if (err instanceof LegacyImportError) {
      console.error(`import:legacy failed: ${err.code}`);
    } else {
      console.error("import:legacy failed", err);
    }
    process.exit(1);
  });
