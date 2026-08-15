/**
 * Parse NewMemDatabase-style Excel → Firestore legacyMembers / legacyPayments.
 * Shared by CLI (`npm run import:legacy`) and admin upload API.
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as XLSX from "xlsx";
import { extractHttpUrls, googleDriveFileId } from "./excel-urls";
import {
  LEGACY_MEMBERS_COLLECTION,
  LEGACY_PAYMENTS_COLLECTION,
  applyLegacyExpiryStatus,
  mapExcelEntityType,
  mapExcelMemberType,
  mapExcelStatus,
  splitThaiFullName,
  type LegacyMemberDoc,
  type LegacyPaymentDoc,
} from "./types";

export const MEMBERSHIP_FEE_MASTERS_COLLECTION = "membershipFeeMasters";

export const LEGACY_IMPORT_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export type LegacyImportWarning = {
  sheet: "Member" | "Transaction";
  /** 1-based Excel row (header = 1). */
  row: number;
  reason: "missing_member_id" | "incomplete_row" | "duplicate_member_id";
};

export type LegacyImportResult = {
  members: number;
  payments: number;
  feeMasters: number;
  sourceFile: string;
  sample: Array<{
    legacyMemberId: string;
    fullName: string;
    status: string;
    memberTypeLabel?: string;
  }>;
  /** Member sheet rows with content but no usable member id. */
  skippedMembers: number;
  /** Transaction sheet rows with content that were neither payment nor fee master. */
  skippedPayments: number;
  /** Sample of skip / duplicate reasons (capped). */
  warnings: LegacyImportWarning[];
  /** Members with at least one attachment URL. */
  attachmentMembers: number;
  /** Transaction rows that include a slip image URL. */
  paymentSlips: number;
  statusCounts: Record<string, number>;
  /** True when parse-only; no Firestore writes. */
  dryRun: boolean;
};

const MAX_WARNINGS = 25;

export type ImportLegacyOptions = {
  /** Parse and return projected counts without writing. */
  dryRun?: boolean;
};

function rowHasContent(row: Record<string, unknown>): boolean {
  return Object.values(row).some(
    (v) => v != null && String(v).trim() !== "",
  );
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
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

function asEmail(v: unknown): string | undefined {
  const s = asString(v);
  if (!s || !s.includes("@")) return undefined;
  return s;
}

function asIdNumber(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(Math.trunc(v));
  }
  const s = String(v).trim();
  return s || undefined;
}

function laterTimestamp(
  a: Timestamp | undefined,
  b: Timestamp | undefined,
): Timestamp | undefined {
  if (!a) return b;
  if (!b) return a;
  return a.toMillis() >= b.toMillis() ? a : b;
}

function overlayHyperlinks(
  sheet: XLSX.WorkSheet,
  rows: Record<string, unknown>[],
): void {
  if (!sheet["!ref"]) return;
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    const headerCell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    headers[C] = headerCell ? String(headerCell.v ?? "").trim() : "";
  }
  rows.forEach((row, i) => {
    const R = range.s.r + 1 + i;
    for (let C = range.s.c; C <= range.e.c; C++) {
      const key = headers[C];
      if (!key) continue;
      const excelCell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
      const target = excelCell?.l?.Target as string | undefined;
      if (!target || !/^https?:\/\//i.test(target)) continue;
      const existing = row[key];
      const existingStr =
        existing == null || existing === "" ? "" : String(existing);
      if (!existingStr.includes(target)) {
        row[key] = existingStr ? `${existingStr}, ${target}` : target;
      }
    }
  });
}

/** Date-only → UTC noon so th-TH / UTC clients keep the same calendar day. */
function dateOnlyTimestamp(
  year: number,
  monthIndex: number,
  day: number,
): Timestamp {
  return Timestamp.fromDate(new Date(Date.UTC(year, monthIndex, day, 12, 0, 0)));
}

function toGregorianYear(year: number): number {
  return year > 2400 ? year - 543 : year;
}

/**
 * SheetJS Excel dates often land a few seconds before local midnight
 * (e.g. 23:59:56) so the calendar day is one earlier than Excel displays.
 */
const EXCEL_DATE_FP_SLACK_MS = 5_000;

function looksLikeExcelDateOnly(d: Date): boolean {
  const uh = d.getUTCHours();
  const um = d.getUTCMinutes();
  const us = d.getUTCSeconds();
  if (um <= 1 && us < 10 && (uh === 0 || uh === 16 || uh === 17)) return true;
  if (uh === 16 && um === 59) return true;
  if (uh === 23 && um >= 59) return true;
  const h = d.getHours();
  const min = d.getMinutes();
  if (h === 0 && min === 0) return true;
  if (h === 23 && min >= 59) return true;
  const shifted = new Date(d.getTime() + EXCEL_DATE_FP_SLACK_MS);
  return shifted.getHours() === 0 && shifted.getMinutes() === 0 && shifted.getSeconds() < 10;
}

/**
 * Parse Excel dates that may be JS Date / serial / ISO / Buddhist Era years.
 * SheetJS `cellDates` can yield a Date whose year is still พ.ศ.
 */
export function parseFlexibleDate(v: unknown): Timestamp | undefined {
  if (v == null || v === "") return undefined;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    if (looksLikeExcelDateOnly(v) || v.getFullYear() > 2400) {
      // Thai workbooks (UTC+7): local midnight is stored as 16:59/17:00 UTC.
      const shifted = new Date(
        v.getTime() + 7 * 3600 * 1000 + EXCEL_DATE_FP_SLACK_MS,
      );
      const year = toGregorianYear(shifted.getUTCFullYear());
      return dateOnlyTimestamp(
        year,
        shifted.getUTCMonth(),
        shifted.getUTCDate(),
      );
    }
    return Timestamp.fromDate(v);
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(
      epoch.getTime() + v * 86400000 + EXCEL_DATE_FP_SLACK_MS,
    );
    if (!Number.isNaN(d.getTime())) {
      return dateOnlyTimestamp(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
      );
    }
  }

  const s = String(v).trim();
  const beIso = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(s);
  if (beIso) {
    const year = toGregorianYear(Number(beIso[1]));
    return dateOnlyTimestamp(year, Number(beIso[2]) - 1, Number(beIso[3]));
  }

  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (slash) {
    const year = toGregorianYear(Number(slash[3]));
    return dateOnlyTimestamp(year, Number(slash[1]) - 1, Number(slash[2]));
  }

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

function sheetToRows(
  wb: XLSX.WorkBook,
  name: string,
): Record<string, unknown>[] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });
  overlayHyperlinks(sheet, rows);
  return rows;
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

  const idNumber = asIdNumber(cell(row, "เลขที่บัตรประชาชน/นิติบุคคล"));
  const sheetExpiry = parseFlexibleDate(
    cell(row, "ExpiryData", "ExpiryDate", "วันที่พ้นสมาชิกภาพ"),
  );
  const expiryDate = laterTimestamp(
    sheetExpiry,
    expiryByMember.get(legacyMemberId),
  );
  const excelStatus = mapExcelStatus(cell(row, "สถานะ"));
  const idCardFileUrls = extractHttpUrls(cell(row, "ไฟล์สำเนาบัตรประชาชน"));
  const businessRegFileUrls = extractHttpUrls(
    cell(row, "ไฟล์ทะเบียนสถานประกอบการ"),
  );
  const otherDocumentUrls = extractHttpUrls(
    cell(
      row,
      "ไฟล์เอกสารอื่นๆ เช่น หนังสือรับรองบริษัท ใบอนุญาตก่อสร้าง ใบประกอบธุรกิจ",
    ),
  );

  return {
    legacyMemberId,
    firstName: firstName || "-",
    lastName: lastName || "-",
    legalEntityName,
    buildingName,
    organization: buildingName,
    phone: asString(cell(row, "เบอร์โทรติดต่อ")),
    email: asEmail(cell(row, "ที่อยู่อีเมล")),
    status: applyLegacyExpiryStatus(excelStatus, expiryDate),
    expiryDate,
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
    idCardFileUrls: idCardFileUrls.length ? idCardFileUrls : undefined,
    businessRegFileUrls: businessRegFileUrls.length
      ? businessRegFileUrls
      : undefined,
    otherDocumentUrls: otherDocumentUrls.length ? otherDocumentUrls : undefined,
    importedAt,
    sourceFile,
    updatedAt: importedAt,
  };
}

function buildPayment(
  row: Record<string, unknown>,
  sourceFile: string,
  importedAt: Timestamp,
  index: number,
): LegacyPaymentDoc | null {
  const legacyMemberId = asString(cell(row, "เลขที่สมาชิก"));
  if (!legacyMemberId) return null;

  const receiptNumber = asString(cell(row, "เลขที่ใบเสร็จ"));
  const transferredAt = parseFlexibleDate(
    cell(row, "วันเวลาโอนเงิน", "DateStamp"),
  );
  const slipUrls = extractHttpUrls(
    cell(row, "รูปภาพหลักฐานการโอนเงิน", "ไฟล์สลิป", "สลิปโอนเงิน"),
  );
  const slipUrl = slipUrls[0];
  const stableKey =
    receiptNumber ??
    googleDriveFileId(slipUrl ?? "") ??
    (transferredAt ? String(transferredAt.toMillis()) : String(index));
  const legacyPaymentId = `${legacyMemberId}_${stableKey}`;

  const amountRaw = cell(row, "จำนวนเงิน");
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : amountRaw != null && amountRaw !== ""
        ? Number(amountRaw) || undefined
        : undefined;

  return {
    legacyPaymentId,
    legacyMemberId,
    transferredAt,
    item: asString(cell(row, "รายการ")),
    itemType: asString(cell(row, "ประเภทรายการ")),
    amount,
    receiptNumber,
    treasurerChecked: asBool(cell(row, "เหรัญญิกตรวจสอบ")),
    treasurerCheckedAt: parseFlexibleDate(cell(row, "วันที่เหรัญญิกตรวจสอบ")),
    expiryDate: parseFlexibleDate(cell(row, "วันที่พ้นสมาชิกภาพ")),
    receiptEmailFlag: asBool(cell(row, "อีเมล์ใบเสร็จ")),
    slipUrl,
    slipUrls: slipUrls.length ? slipUrls : undefined,
    importedAt,
    sourceFile,
  };
}

export type LegacyImportErrorCode =
  | "invalid_workbook"
  | "missing_member_sheet"
  | "no_members_parsed"
  | "file_too_large";

export class LegacyImportError extends Error {
  readonly code: LegacyImportErrorCode;

  constructor(code: LegacyImportErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "LegacyImportError";
  }
}

/**
 * Parse workbook buffer and upsert into Firestore (merge).
 * Pass `{ dryRun: true }` to preview projected counts without writing.
 */
export async function importLegacyWorkbookFromBuffer(
  buffer: Buffer,
  sourceFile: string,
  options: ImportLegacyOptions = {},
): Promise<LegacyImportResult> {
  const dryRun = options.dryRun === true;

  if (buffer.byteLength > LEGACY_IMPORT_MAX_BYTES) {
    throw new LegacyImportError("file_too_large");
  }

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch {
    throw new LegacyImportError("invalid_workbook");
  }

  if (!wb.Sheets["Member"]) {
    throw new LegacyImportError("missing_member_sheet");
  }

  const memberRows = sheetToRows(wb, "Member");
  const txRows = sheetToRows(wb, "Transaction");
  const importedAt = Timestamp.now();
  const safeName =
    sourceFile.replace(/[^\w.\-ก-๙\s]/g, "_").trim().slice(0, 120) ||
    "upload.xlsx";

  const expiryByMember = new Map<string, Timestamp>();
  const payments: LegacyPaymentDoc[] = [];
  const feeMasters: Array<Record<string, unknown>> = [];
  const warnings: LegacyImportWarning[] = [];
  let skippedMembers = 0;
  let skippedPayments = 0;

  function pushWarning(w: LegacyImportWarning) {
    if (warnings.length < MAX_WARNINGS) warnings.push(w);
  }

  txRows.forEach((row, i) => {
    const excelRow = i + 2;
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
          sourceFile: safeName,
        });
        return;
      }
      if (rowHasContent(row)) {
        skippedPayments += 1;
        pushWarning({
          sheet: "Transaction",
          row: excelRow,
          reason: item || itemType ? "incomplete_row" : "missing_member_id",
        });
      }
      return;
    }
    const pay = buildPayment(row, safeName, importedAt, i + 1);
    if (!pay) {
      if (rowHasContent(row)) {
        skippedPayments += 1;
        pushWarning({
          sheet: "Transaction",
          row: excelRow,
          reason: "incomplete_row",
        });
      }
      return;
    }
    payments.push(pay);
    if (pay.expiryDate) {
      const prev = expiryByMember.get(pay.legacyMemberId);
      if (!prev || pay.expiryDate.toMillis() > prev.toMillis()) {
        expiryByMember.set(pay.legacyMemberId, pay.expiryDate);
      }
    }
  });

  const membersById = new Map<string, LegacyMemberDoc>();
  memberRows.forEach((row, i) => {
    const m = buildMember(row, safeName, importedAt, expiryByMember);
    if (m) {
      if (membersById.has(m.legacyMemberId)) {
        pushWarning({
          sheet: "Member",
          row: i + 2,
          reason: "duplicate_member_id",
        });
      }
      membersById.set(m.legacyMemberId, m);
      return;
    }
    if (rowHasContent(row)) {
      skippedMembers += 1;
      pushWarning({
        sheet: "Member",
        row: i + 2,
        reason: "missing_member_id",
      });
    }
  });

  const members = [...membersById.values()];

  if (members.length === 0) {
    throw new LegacyImportError("no_members_parsed");
  }

  const sample = members.slice(0, 100).map((m) => ({
    legacyMemberId: m.legacyMemberId,
    fullName: `${m.firstName} ${m.lastName}`.trim(),
    status: m.status,
    memberTypeLabel: m.memberTypeLabel,
  }));
  const attachmentMembers = members.filter(
    (m) =>
      (m.idCardFileUrls?.length ?? 0) +
        (m.businessRegFileUrls?.length ?? 0) +
        (m.otherDocumentUrls?.length ?? 0) >
      0,
  ).length;
  const paymentSlips = payments.filter((p) => Boolean(p.slipUrl)).length;
  const statusCounts: Record<string, number> = {};
  for (const m of members) {
    statusCounts[m.status] = (statusCounts[m.status] ?? 0) + 1;
  }

  const summary = {
    sourceFile: safeName,
    sample,
    skippedMembers,
    skippedPayments,
    warnings,
    attachmentMembers,
    paymentSlips,
    statusCounts,
  };

  if (dryRun) {
    return {
      members: members.length,
      payments: payments.length,
      feeMasters: feeMasters.length,
      ...summary,
      dryRun: true,
    };
  }

  const db = getFirestore();
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
        db
          .collection(MEMBERSHIP_FEE_MASTERS_COLLECTION)
          .doc(String(fee.feeId)),
        fee,
        { merge: true },
      );
      writtenFees += 1;
    }
    await batch.commit();
  }

  return {
    members: writtenMembers,
    payments: writtenPayments,
    feeMasters: writtenFees,
    ...summary,
    dryRun: false,
  };
}
