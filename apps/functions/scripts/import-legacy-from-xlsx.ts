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
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as XLSX from "xlsx";
import {
  LEGACY_MEMBERS_COLLECTION,
  LEGACY_PAYMENTS_COLLECTION,
  mapExcelEntityType,
  mapExcelMemberType,
  mapExcelStatus,
  splitThaiFullName,
  type LegacyMemberDoc,
  type LegacyPaymentDoc,
} from "../src/legacy/types";

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

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

function cell(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (k in row && row[k] != null && row[k] !== "") return row[k];
  }
  return undefined;
}

function asString(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  return String(v).trim() || undefined;
}

/** Date-only → UTC noon so th-TH / UTC clients keep the same calendar day. */
function dateOnlyTimestamp(year: number, monthIndex: number, day: number): Timestamp {
  return Timestamp.fromDate(new Date(Date.UTC(year, monthIndex, day, 12, 0, 0)));
}

function toGregorianYear(year: number): number {
  return year > 2400 ? year - 543 : year;
}

/**
 * SheetJS Excel dates often land a few seconds before local midnight
 * (e.g. 23:59:56) so the calendar day is one earlier than Excel displays.
 * Nudge forward before reading Y/M/D for date-only fields.
 */
const EXCEL_DATE_FP_SLACK_MS = 5_000;

function excelCalendarParts(d: Date): {
  rawYear: number;
  monthIndex: number;
  day: number;
  hasClockTime: boolean;
} {
  const shifted = new Date(d.getTime() + EXCEL_DATE_FP_SLACK_MS);
  const h = shifted.getHours();
  const min = shifted.getMinutes();
  const sec = shifted.getSeconds();
  const hasClockTime = !(h === 0 && min === 0 && sec === 0);
  return {
    rawYear: shifted.getFullYear(),
    monthIndex: shifted.getMonth(),
    day: shifted.getDate(),
    hasClockTime,
  };
}

/**
 * Parse Excel dates that may be:
 * - JS Date / Excel serial
 * - ISO strings
 * - Buddhist Era years (e.g. 2568-12-27 or 10/25/2562)
 *
 * SheetJS `cellDates` can yield a JS Date whose year is still พ.ศ. (e.g. 2569).
 * Those must be converted to ค.ศ. before storage — UI formats with `th-TH` (+543).
 */
function parseFlexibleDate(v: unknown): Timestamp | undefined {
  if (v == null || v === "") return undefined;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const parts = excelCalendarParts(v);
    const year = toGregorianYear(parts.rawYear);
    // Date-only (or BE year) → store calendar day at UTC noon
    if (!parts.hasClockTime || parts.rawYear > 2400) {
      return dateOnlyTimestamp(year, parts.monthIndex, parts.day);
    }
    // Timed value with Gregorian year — keep clock, only fix year if needed
    if (year !== v.getFullYear()) {
      const fixed = new Date(v.getTime());
      fixed.setFullYear(year);
      return Timestamp.fromDate(fixed);
    }
    return Timestamp.fromDate(v);
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    // Excel serial date (always Gregorian under the hood)
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000 + EXCEL_DATE_FP_SLACK_MS);
    if (!Number.isNaN(d.getTime())) {
      return dateOnlyTimestamp(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
      );
    }
  }

  const s = String(v).trim();
  // 2568-12-27T... or 2568-12-27
  const beIso = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(s);
  if (beIso) {
    const year = toGregorianYear(Number(beIso[1]));
    return dateOnlyTimestamp(year, Number(beIso[2]) - 1, Number(beIso[3]));
  }

  // 12/31/2569 or 10/25/2019 (Excel US-style M/D/YYYY; year may be พ.ศ.)
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (slash) {
    const year = toGregorianYear(Number(slash[3]));
    return dateOnlyTimestamp(year, Number(slash[1]) - 1, Number(slash[2]));
  }

  // 7/21/2569 15:00 — keep time-of-day, only fix BE year
  const slashDateTime =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/.exec(s);
  if (slashDateTime) {
    const year = toGregorianYear(Number(slashDateTime[3]));
    const d = new Date(
      year,
      Number(slashDateTime[1]) - 1,
      Number(slashDateTime[2]),
      Number(slashDateTime[4]),
      Number(slashDateTime[5]),
    );
    if (!Number.isNaN(d.getTime())) return Timestamp.fromDate(d);
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    if (parsed.getFullYear() > 2400) {
      parsed.setFullYear(parsed.getFullYear() - 543);
    }
    return Timestamp.fromDate(parsed);
  }
  return undefined;
}

function asBool(v: unknown): boolean | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return Boolean(v);
}

function sheetToRows(wb: XLSX.WorkBook, name: string): Record<string, unknown>[] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });
}

function buildMember(
  row: Record<string, unknown>,
  sourceFile: string,
  importedAt: Timestamp,
  expiryByMember: Map<string, Timestamp>,
): LegacyMemberDoc | null {
  const legacyMemberId = asString(cell(row, "เลขที่สมาชิก"));
  if (!legacyMemberId) return null;

  const entityLabel = asString(cell(row, "เป็นสมาชิกสมาคมแบบ")) ?? "";
  const { entityType, entityTypeLabel } = mapExcelEntityType(entityLabel);
  const personOrEntity = asString(cell(row, "ชื่อบุคคล/นิติบุคคล")) ?? "";
  const representative = asString(cell(row, "ชื่อ-นามสกุลผู้แทนนิติฯ"));

  let firstName = "";
  let lastName = "";
  let legalEntityName: string | undefined;

  if (entityType === "juristic") {
    legalEntityName = personOrEntity || undefined;
    const split = splitThaiFullName(representative ?? personOrEntity);
    firstName = split.firstName;
    lastName = split.lastName;
  } else {
    const split = splitThaiFullName(personOrEntity || representative || "");
    firstName = split.firstName;
    lastName = split.lastName;
    legalEntityName = personOrEntity || undefined;
  }

  const buildingName = asString(cell(row, "ชื่อสถานประกอบการ"));
  const { memberType, memberTypeLabel } = mapExcelMemberType(
    cell(row, "ประเภทสมาชิก"),
  );

  const idRaw = cell(row, "เลขที่บัตรประชาชน/นิติบุคคล");
  const idNumber =
    idRaw == null || idRaw === "" ? undefined : String(idRaw).trim();

  const doc: LegacyMemberDoc = {
    legacyMemberId,
    firstName: firstName || "-",
    lastName: lastName || "-",
    legalEntityName,
    buildingName,
    organization: buildingName,
    phone: asString(cell(row, "เบอร์โทรติดต่อ")),
    email: asString(cell(row, "ที่อยู่อีเมล")),
    status: mapExcelStatus(cell(row, "สถานะ")),
    expiryDate: expiryByMember.get(legacyMemberId),
    memberType,
    memberTypeLabel,
    entityType,
    entityTypeLabel,
    idNumber,
    businessPhone: asString(cell(row, "เบอร์โทรสถานประกอบการ")),
    businessAddress: asString(cell(row, "ที่อยู่สถานประกอบการ")),
    personAddress: asString(cell(row, "ที่อยู่บุคคล/นิติบุคคล")),
    registrarChecked: asBool(cell(row, "นายทะเบียนตรวจสอบ")),
    reviewedAt: parseFlexibleDate(cell(row, "วันที่นายทะเบียนตรวจสอบ")),
    certifiedAt: parseFlexibleDate(cell(row, "วันที่รับรองสมาชิกภาพ")),
    importedAt,
    sourceFile,
    updatedAt: importedAt,
  };
  return doc;
}

function buildPayment(
  row: Record<string, unknown>,
  sourceFile: string,
  importedAt: Timestamp,
  index: number,
): LegacyPaymentDoc | null {
  const legacyMemberId = asString(cell(row, "เลขที่สมาชิก"));
  if (!legacyMemberId) return null; // skip fee master rows

  const receiptNumber = asString(cell(row, "เลขที่ใบเสร็จ"));
  const legacyPaymentId = `${legacyMemberId}_${receiptNumber ?? index}`;

  return {
    legacyPaymentId,
    legacyMemberId,
    transferredAt: parseFlexibleDate(
      cell(row, "วันเวลาโอนเงิน", "DateStamp"),
    ),
    item: asString(cell(row, "รายการ")),
    itemType: asString(cell(row, "ประเภทรายการ")),
    amount:
      typeof cell(row, "จำนวนเงิน") === "number"
        ? (cell(row, "จำนวนเงิน") as number)
        : Number(cell(row, "จำนวนเงิน")) || undefined,
    receiptNumber,
    treasurerChecked: asBool(cell(row, "เหรัญญิกตรวจสอบ")),
    treasurerCheckedAt: parseFlexibleDate(cell(row, "วันที่เหรัญญิกตรวจสอบ")),
    expiryDate: parseFlexibleDate(cell(row, "วันที่พ้นสมาชิกภาพ")),
    receiptEmailFlag: asBool(cell(row, "อีเมล์ใบเสร็จ")),
    importedAt,
    sourceFile,
  };
}

async function main() {
  initAdmin();
  const db = getFirestore();

  const filePath = resolve(argValue("--file") ?? DEFAULT_XLSX);
  if (!existsSync(filePath)) {
    throw new Error(`Excel not found: ${filePath}`);
  }
  const sourceFile = filePath.split(/[/\\]/).pop() ?? "NewMemDatabase.xlsx";
  console.log(`✓ Reading ${filePath}`);

  const wb = XLSX.readFile(filePath, { cellDates: true });
  const memberRows = sheetToRows(wb, "Member");
  const txRows = sheetToRows(wb, "Transaction");
  console.log(`  Member rows: ${memberRows.length}`);
  console.log(`  Transaction rows: ${txRows.length}`);

  const importedAt = Timestamp.now();

  // Prefetch expiry from transactions (latest wins)
  const expiryByMember = new Map<string, Timestamp>();
  const payments: LegacyPaymentDoc[] = [];
  const feeMasters: Array<Record<string, unknown>> = [];
  txRows.forEach((row, i) => {
    const legacyMemberId = asString(cell(row, "เลขที่สมาชิก"));
    if (!legacyMemberId) {
      const item = asString(cell(row, "รายการ"));
      const itemType = asString(cell(row, "ประเภทรายการ"));
      const amount =
        typeof cell(row, "จำนวนเงิน") === "number"
          ? (cell(row, "จำนวนเงิน") as number)
          : Number(cell(row, "จำนวนเงิน")) || undefined;
      if (item && itemType) {
        const feeId = `${item}_${itemType}`.replace(/\s+/g, "_").slice(0, 120);
        feeMasters.push({
          feeId,
          item,
          itemType,
          amount,
          importedAt,
          sourceFile,
        });
      }
      return;
    }
    const pay = buildPayment(row, sourceFile, importedAt, i + 1);
    if (!pay) return;
    payments.push(pay);
    if (pay.expiryDate) {
      const prev = expiryByMember.get(pay.legacyMemberId);
      if (!prev || pay.expiryDate.toMillis() > prev.toMillis()) {
        expiryByMember.set(pay.legacyMemberId, pay.expiryDate);
      }
    }
  });

  const members: LegacyMemberDoc[] = [];
  for (const row of memberRows) {
    const m = buildMember(row, sourceFile, importedAt, expiryByMember);
    if (m) members.push(m);
  }

  if (members.length === 0) {
    throw new Error("No members parsed from Excel");
  }

  // Batch write (chunks of 400)
  const chunkSize = 400;
  let writtenMembers = 0;
  for (let i = 0; i < members.length; i += chunkSize) {
    const batch = db.batch();
    const slice = members.slice(i, i + chunkSize);
    for (const m of slice) {
      batch.set(
        db.collection(LEGACY_MEMBERS_COLLECTION).doc(m.legacyMemberId),
        omitUndefined(m as unknown as Record<string, unknown>),
        { merge: true },
      );
    }
    await batch.commit();
    writtenMembers += slice.length;
  }

  let writtenPayments = 0;
  for (let i = 0; i < payments.length; i += chunkSize) {
    const batch = db.batch();
    const slice = payments.slice(i, i + chunkSize);
    for (const p of slice) {
      batch.set(
        db.collection(LEGACY_PAYMENTS_COLLECTION).doc(p.legacyPaymentId),
        omitUndefined(p as unknown as Record<string, unknown>),
        { merge: true },
      );
    }
    await batch.commit();
    writtenPayments += slice.length;
  }

  let writtenFees = 0;
  if (feeMasters.length > 0) {
    const batch = db.batch();
    for (const fee of feeMasters) {
      batch.set(
        db.collection("membershipFeeMasters").doc(String(fee.feeId)),
        fee,
        { merge: true },
      );
      writtenFees += 1;
    }
    await batch.commit();
  }

  console.log(`✓ Upserted ${writtenMembers} legacyMembers`);
  console.log(`✓ Upserted ${writtenPayments} legacyPayments`);
  console.log(`✓ Upserted ${writtenFees} membership fee masters`);
  console.log("Sample:");
  for (const m of members.slice(0, 3)) {
    console.log(
      `  - ${m.legacyMemberId} | ${m.firstName} ${m.lastName} | ${m.status} | ${m.memberTypeLabel}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("import:legacy failed", err);
    process.exit(1);
  });
