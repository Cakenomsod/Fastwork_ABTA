/**
 * Seed demo members + payments for testing "เช็คสถานะ" on LINE OA.
 *
 * Run from repo root or apps/functions:
 *   cd apps/functions
 *   npm run seed
 *
 * Bind your own LINE userId(s) so you can test:
 *   DEMO_LINE_USER_ID=Uxxxx npm run seed
 *   DEMO_LINE_USER_ID=Uxxxx DEMO_LINE_USER_ID_2=Uyyyy npm run seed
 *   $env:DEMO_LINE_USER_ID="Uxxxx"; npm run seed            (PowerShell)
 *
 * Credentials: uses GOOGLE_APPLICATION_CREDENTIALS if set, otherwise the
 * service account JSON at the repo root.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { cert, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  ensureCounterAtLeastInTx,
  parseMemberId,
  parseReceiptNumber,
} from "../src/members/id-registry";

const PROJECT_ID = "abta-member";
const REPO_ROOT = resolve(__dirname, "../../..");
const DEFAULT_SA = resolve(
  REPO_ROOT,
  "abta-member-firebase-adminsdk-fbsvc-1a73213420.json",
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
}

function token(): string {
  return randomBytes(6).toString("hex");
}

function daysFromNow(days: number): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() + days * 86_400_000));
}

async function bumpCountersFromSeededIds(
  memberIds: string[],
  receiptNumbers: string[],
): Promise<void> {
  const db = getFirestore();
  const maxByCounter = new Map<string, { year: number; seq: number }>();

  const track = (docId: string, year: number, seq: number) => {
    const cur = maxByCounter.get(docId);
    if (!cur || seq > cur.seq) maxByCounter.set(docId, { year, seq });
  };

  for (const memberId of memberIds) {
    const parsed = parseMemberId(memberId);
    if (!parsed) continue;
    const docId =
      parsed.kind === "temp"
        ? `tempMembers-${parsed.year}`
        : `members-${parsed.year}`;
    track(docId, parsed.year, parsed.seq);
  }
  for (const receiptNumber of receiptNumbers) {
    const parsed = parseReceiptNumber(receiptNumber);
    if (!parsed) continue;
    const docId =
      parsed.kind === "temp"
        ? `tempReceipts-${parsed.year}`
        : `receipts-${parsed.year}`;
    track(docId, parsed.year, parsed.seq);
  }

  if (maxByCounter.size === 0) return;

  await db.runTransaction(async (tx) => {
    for (const [docId, { year, seq }] of maxByCounter) {
      await ensureCounterAtLeastInTx(tx, docId, year, seq);
    }
  });

  console.log("✓ Bumped counters from seeded IDs:");
  for (const [docId, { seq }] of maxByCounter) {
    console.log(`  • counters/${docId}  seq≥${seq}`);
  }
}

async function writeIdRegistryFromSeeded(
  members: { memberId: string }[],
  payments: { paymentId: string; receiptNumber: string }[],
  now: Timestamp,
): Promise<void> {
  const db = getFirestore();
  const batch = db.batch();
  let count = 0;

  for (const m of members) {
    const parsed = parseMemberId(m.memberId);
    if (!parsed) continue;
    batch.set(
      db.collection("idRegistry").doc(`members_${m.memberId}`),
      {
        memberId: m.memberId,
        kind: parsed.kind,
        source: "seed",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
    count += 1;
  }
  for (const p of payments) {
    const parsed = parseReceiptNumber(p.receiptNumber);
    if (!parsed) continue;
    batch.set(
      db.collection("idRegistry").doc(`receipts_${p.receiptNumber}`),
      {
        receiptNumber: p.receiptNumber,
        paymentId: p.paymentId,
        kind: parsed.kind,
        source: "seed",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
    count += 1;
  }

  if (count === 0) return;
  await batch.commit();
  console.log(`✓ Wrote ${count} idRegistry doc(s)`);
}

async function main() {
  initAdmin();
  const db = getFirestore();

  const demoLineUserId =
    process.env.DEMO_LINE_USER_ID || "Udemo00000000000000000000000000001";
  const demoLineUserId2 =
    process.env.DEMO_LINE_USER_ID_2 || "Udemo00000000000000000000000000002";

  const now = Timestamp.now();
  const origin = "https://abta-member.web.app";

  // Tokens are generated up front so they can be embedded in card/receipt URLs.
  const tok1 = token();
  const tok2 = token();
  const tok3 = token();
  const cardUrl = (id: string, t: string) => `${origin}/card?m=${id}&t=${t}`;
  const receiptLink = (id: string, t: string) =>
    `${origin}/receipt?m=${id}&t=${t}`;

  // 1) สมาชิกสมบูรณ์ + ใบเสร็จตัวจริง — ผูก LINE (คนทดสอบหลัก)
  const m1 = {
    memberId: "ABTA-2026-0001",
    firstName: "ธนกร",
    lastName: "วัฒนสมบัติ",
    legalEntityName: "บริษัท เอบีทีเอ พร็อพเพอร์ตี้ จำกัด",
    organization: "อาคารเอบีทีเอ ทาวเวอร์",
    buildingName: "เอบีทีเอ ทาวเวอร์",
    phone: "0812345678",
    email: "thanakorn@example.com",
    lineUserId: demoLineUserId,
    lineLinkedAt: now,
    linkType: "new_registration",
    status: "active",
    memberCardUrl: cardUrl("ABTA-2026-0001", tok1),
    expiryDate: daysFromNow(210),
    dataReviewStatus: "approved",
    seminarStatus: "confirmed",
    seminarTitle: "สัมมนาประจำปี ABTA 2569",
    publicToken: tok1,
    createdAt: now,
    updatedAt: now,
  };

  // 2) สมาชิกชั่วคราว + ใบเสร็จชั่วคราว (ยังไม่ผูก LINE จริง — placeholder)
  const m2 = {
    memberId: "ABTA-T-2026-0087",
    tempMemberId: "ABTA-T-2026-0087",
    firstName: "เพชญเกล้า",
    lastName: "จำปารัตน์",
    legalEntityName: "-",
    organization: "พอกอ จำกัด",
    buildingName: "สิริพรพลาซ่า",
    phone: "0808026677",
    email: "Cakepuarknomsod2@gmail.com",
    lineUserId: demoLineUserId2,
    lineLinkedAt: now,
    linkType: "new_registration",
    status: "temporary",
    memberCardUrl: cardUrl("ABTA-T-2026-0087", tok2),
    expiryDate: daysFromNow(360),
    dataReviewStatus: "pending",
    seminarStatus: "registered",
    publicToken: tok2,
    createdAt: now,
    updatedAt: now,
  };

  // 3) สมาชิกหมดอายุ — สำหรับทดสอบเส้นทางต่ออายุ
  const m3 = {
    memberId: "ABTA-2025-0450",
    legacyMemberId: "OLD-1188",
    firstName: "ประเสริฐ",
    lastName: "ธำรงกิจ",
    legalEntityName: "บริษัท ธำรงกิจ เรียลเอสเตท จำกัด",
    organization: "อาคารธำรงกิจ",
    buildingName: "ธำรงกิจ",
    phone: "0865551122",
    email: "prasert@example.com",
    lineUserId: "Udemo00000000000000000000000000003",
    lineLinkedAt: now,
    linkType: "legacy_bind",
    status: "expired",
    memberCardUrl: cardUrl("ABTA-2025-0450", tok3),
    expiryDate: daysFromNow(-45),
    dataReviewStatus: "approved",
    seminarStatus: "none",
    publicToken: tok3,
    createdAt: now,
    updatedAt: now,
  };

  const members = [m1, m2, m3];
  const batch = db.batch();
  for (const m of members) {
    batch.set(db.collection("members").doc(m.memberId), m, { merge: true });
  }

  // Payments (latest per member)
  const p1 = {
    paymentId: "PAY-2026-0001",
    memberId: m1.memberId,
    receiptNumber: "RC-2026-0001",
    receiptStatus: "official",
    receiptUrl: receiptLink("ABTA-2026-0001", tok1),
    slipUrl: "",
    amount: 3000,
    status: "official_receipt_issued",
    verifiedBy: "เหรัญญิก (เดโม)",
    verifiedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const p2 = {
    paymentId: "PAY-2026-0087",
    memberId: m2.memberId,
    receiptNumber: "RC-T-2026-0087",
    receiptStatus: "temp",
    receiptUrl: "",
    slipUrl: "",
    amount: 3000,
    status: "temp_receipt_issued",
    createdAt: now,
    updatedAt: now,
  };
  const p3 = {
    paymentId: "PAY-2025-0450",
    memberId: m3.memberId,
    receiptNumber: "RC-2025-0450",
    receiptStatus: "official",
    receiptUrl: "",
    slipUrl: "",
    amount: 3000,
    status: "official_receipt_issued",
    createdAt: now,
    updatedAt: now,
  };
  const payments = [p1, p2, p3];
  for (const p of payments) {
    batch.set(db.collection("payments").doc(p.paymentId), p, { merge: true });
  }

  await batch.commit();

  await writeIdRegistryFromSeeded(members, payments, now);
  await bumpCountersFromSeededIds(
    members.map((m) => m.memberId),
    payments.map((p) => p.receiptNumber),
  );

  console.log("\n✓ Seeded demo members + payments:\n");
  for (const m of members) {
    console.log(
      `  • ${m.memberId}  ${m.firstName} ${m.lastName}  [${m.status}]  lineUserId=${m.lineUserId}`,
    );
  }
  console.log(
    `\n👉 ABTA-2026-0001 bound to lineUserId="${demoLineUserId}"`,
  );
  console.log(
    `👉 ABTA-T-2026-0087 bound to lineUserId="${demoLineUserId2}"`,
  );
  console.log(
    "   Re-run with DEMO_LINE_USER_ID / DEMO_LINE_USER_ID_2 to rebind.\n",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
