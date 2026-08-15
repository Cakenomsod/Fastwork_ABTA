import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  canImportLegacy,
  importLegacyXlsx,
  type AdminMe,
  type LegacyImportResult,
  type LegacyImportWarning,
} from "../../lib/admin-api";
import { ConfirmDialog } from "../ConfirmDialog";

const MAX_BYTES = 8 * 1024 * 1024;
const SAMPLE_PREVIEW = 5;

const ERROR_LABEL: Record<string, string> = {
  file_required: "กรุณาเลือกไฟล์ Excel",
  file_too_large: "ไฟล์ใหญ่เกิน 8 MB",
  invalid_file_type: "รองรับเฉพาะไฟล์ .xlsx หรือ .xls",
  invalid_workbook: "อ่านไฟล์ Excel ไม่ได้ — ตรวจว่าไฟล์ไม่เสียหาย",
  missing_member_sheet: "ไม่พบชีต Member ในไฟล์",
  no_members_parsed: "ไม่พบแถวสมาชิกที่นำเข้าได้",
  invalid_file_encoding: "เข้ารหัสไฟล์ไม่ถูกต้อง",
  import_failed: "นำเข้าไม่สำเร็จ กรุณาลองใหม่",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  not_authorized: "ไม่มีสิทธิ์นำเข้าข้อมูลสมาชิกเก่า",
};

const WARN_REASON_LABEL: Record<LegacyImportWarning["reason"], string> = {
  missing_member_id: "ไม่มีเลขที่สมาชิก",
  incomplete_row: "ข้อมูลไม่ครบ",
  duplicate_member_id: "เลขที่สมาชิกซ้ำ — ใช้แถวล่าสุด",
};

function errorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : "import_failed";
  return ERROR_LABEL[code] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("invalid_file_encoding"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function goLegacyMembers() {
  window.history.pushState({}, "", "/admin/legacy");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function SkipReport(props: {
  skippedMembers: number;
  skippedPayments: number;
  warnings: LegacyImportWarning[];
}) {
  const { skippedMembers, skippedPayments, warnings } = props;
  if (
    skippedMembers === 0 &&
    skippedPayments === 0 &&
    warnings.length === 0
  ) {
    return null;
  }

  return (
    <div className="bo-legacy-skip" role="status">
      <strong>
        {skippedMembers + skippedPayments > 0
          ? "รายงานแถวที่ข้าม"
          : "ข้อควรทราบ"}
      </strong>
      {skippedMembers + skippedPayments > 0 ? (
        <p>
          สมาชิก {skippedMembers.toLocaleString("th-TH")} แถว · ประวัติชำระ{" "}
          {skippedPayments.toLocaleString("th-TH")} แถว (มีข้อมูลแต่ไม่นำเข้าได้)
        </p>
      ) : null}
      {warnings.length > 0 ? (
        <ul>
          {warnings.map((w) => (
            <li key={`${w.sheet}-${w.row}-${w.reason}`}>
              ชีต {w.sheet} แถว {w.row}: {WARN_REASON_LABEL[w.reason]}
            </li>
          ))}
        </ul>
      ) : null}
      {skippedMembers + skippedPayments > warnings.length ? (
        <p className="bo-legacy-skip__more">
          แสดงตัวอย่าง {warnings.length} รายการแรก — รวมทั้งหมด{" "}
          {(skippedMembers + skippedPayments).toLocaleString("th-TH")} แถว
        </p>
      ) : null}
    </div>
  );
}

function SampleTable(props: {
  sample: LegacyImportResult["sample"];
  showAll: boolean;
  onToggle: () => void;
  caption: string;
}) {
  const visible = props.showAll
    ? props.sample
    : props.sample.slice(0, SAMPLE_PREVIEW);
  const hiddenCount = Math.max(0, props.sample.length - SAMPLE_PREVIEW);

  if (!props.sample.length) return null;

  return (
    <>
      <div className="bo-table-wrap">
        <table className="bo-table">
          <caption className="bo-legacy-table-caption">{props.caption}</caption>
          <thead>
            <tr>
              <th>เลขสมาชิกเก่า</th>
              <th>ชื่อ</th>
              <th>สถานะ</th>
              <th>ประเภท</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.legacyMemberId}>
                <td>
                  <code>{row.legacyMemberId}</code>
                </td>
                <td>{row.fullName}</td>
                <td>{row.status}</td>
                <td>{row.memberTypeLabel || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hiddenCount > 0 ? (
        <div className="bo-legacy-sample-actions">
          <button
            type="button"
            className="bo-btn bo-btn-ghost"
            onClick={props.onToggle}
          >
            {props.showAll
              ? "ย่อรายชื่อ"
              : `แสดงเพิ่มอีก ${hiddenCount} รายชื่อ`}
          </button>
        </div>
      ) : null}
    </>
  );
}

export interface LegacyImportPageProps {
  me: AdminMe;
}

export default function LegacyImportPage(props: LegacyImportPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LegacyImportResult | null>(null);
  const [result, setResult] = useState<LegacyImportResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showAllSample, setShowAllSample] = useState(false);

  if (!canImportLegacy(props.me)) {
    return (
      <div className="bo-panel">
        <div className="bo-empty">
          <strong>ไม่มีสิทธิ์</strong>
          การนำเข้าสมาชิกเก่าจำกัดเฉพาะแอดมิน
        </div>
      </div>
    );
  }

  function resetImportState() {
    setPreview(null);
    setResult(null);
    setShowAllSample(false);
    setConfirmOpen(false);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    setError(null);
    resetImportState();
    if (!next) {
      setFile(null);
      return;
    }
    const lower = next.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      setFile(null);
      setError(ERROR_LABEL.invalid_file_type);
      e.target.value = "";
      return;
    }
    if (next.size > MAX_BYTES) {
      setFile(null);
      setError(ERROR_LABEL.file_too_large);
      e.target.value = "";
      return;
    }
    setFile(next);
  }

  function clearFile() {
    setFile(null);
    setError(null);
    resetImportState();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function runPreview(e: FormEvent) {
    e.preventDefault();
    if (!file || busy || result) return;
    setBusy(true);
    setError(null);
    setPreview(null);
    setShowAllSample(false);
    try {
      const contentBase64 = await fileToBase64(file);
      const out = await importLegacyXlsx({
        fileName: file.name,
        contentBase64,
        dryRun: true,
      });
      setPreview(out);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const contentBase64 = await fileToBase64(file);
      const out = await importLegacyXlsx({
        fileName: file.name,
        contentBase64,
        dryRun: false,
      });
      setResult(out);
      setPreview(null);
      setConfirmOpen(false);
      setShowAllSample(false);
    } catch (err) {
      setError(errorMessage(err));
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const display = result ?? preview;
  const skippedMembers = display?.skippedMembers ?? 0;
  const skippedPayments = display?.skippedPayments ?? 0;
  const warnings = display?.warnings ?? [];
  const sample = display?.sample ?? [];
  const statusCounts = display?.statusCounts ?? {};
  const statusLine = Object.entries(statusCounts)
    .map(([key, n]) => {
      const label =
        key === "active"
          ? "ใช้งาน"
          : key === "expired"
            ? "หมดอายุ"
            : key === "non_active"
              ? "ไม่ใช้งาน"
              : key === "pending"
                ? "รอดำเนินการ"
                : key;
      return `${label} ${n.toLocaleString("th-TH")}`;
    })
    .join(" · ");

  const confirmDescription = file
    ? [
        `ไฟล์: ${file.name} (${formatBytes(file.size)})`,
        preview
          ? `จะนำเข้า ประมาณ สมาชิก ${preview.members.toLocaleString("th-TH")} · ประวัติชำระ ${preview.payments.toLocaleString("th-TH")} · ค่าธรรมเนียม ${preview.feeMasters.toLocaleString("th-TH")}${preview.attachmentMembers ? ` · ไฟล์แนบ ${preview.attachmentMembers.toLocaleString("th-TH")} ราย` : ""}${preview.paymentSlips ? ` · สลิป ${preview.paymentSlips.toLocaleString("th-TH")} ใบ` : ""}`
          : null,
        "ระบบจะเพิ่มหรืออัปเดตสมาชิกเก่าตามเลขสมาชิกเก่า หากมีข้อมูลอยู่แล้ว ฟิลด์จากไฟล์จะทับค่าเดิม",
        "ไม่สามารถยกเลิกทีละแถวหลังนำเข้าได้",
      ]
        .filter(Boolean)
        .join("\n")
    : undefined;

  return (
    <div className="bo-legacy-page">
      <div className="bo-panel">
        <div className="bo-panel-head">
          <h2>นำเข้าสมาชิกเก่า</h2>
        </div>
        <div className="bo-legacy-intro">
          <p>
            อัปโหลดไฟล์ Excel แล้วตรวจสอบก่อนนำเข้า ระบบจะเพิ่มหรืออัปเดตสมาชิกเก่าตามเลขสมาชิกเก่า
            หากมีข้อมูลอยู่แล้ว ฟิลด์จากไฟล์จะทับค่าเดิม
          </p>
          <ul>
            <li>
              ต้องมีชีต <strong>Member</strong> (และ <strong>Transaction</strong>{" "}
              ถ้ามีประวัติชำระ)
            </li>
            <li>
              อ่านวันหมดอายุจากคอลัมน์ <strong>ExpiryData</strong> และคำนวณสถานะ
              Active / Expired ตามวันที่นั้น
            </li>
            <li>
              ลิงก์ไฟล์ในคอลัมน์สำเนาบัตร / ทะเบียน / เอกสารอื่น / สลิปโอน
              จะถูกเก็บและแสดงในหน้ารายละเอียด
            </li>
            <li>รองรับไฟล์ .xlsx / .xls ขนาดไม่เกิน 8 MB</li>
            <li>ขั้นตอน: ตรวจสอบไฟล์ → ยืนยัน → เขียนข้อมูล</li>
          </ul>
        </div>

        <form
          className="bo-legacy-form"
          aria-busy={busy}
          onSubmit={(e) => void runPreview(e)}
        >
          <label className={`bo-file-drop${file ? " has-file" : ""}`}>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={onPick}
              disabled={busy || Boolean(result)}
              aria-label="เลือกไฟล์ Excel"
            />
            {file ? (
              <span className="bo-file-drop__meta">
                <strong>{file.name}</strong>
                <span>{formatBytes(file.size)}</span>
              </span>
            ) : (
              <span className="bo-file-drop__meta">
                <strong>เลือกไฟล์ Excel</strong>
                <span>คลิกเพื่อเลือก หรือลากไฟล์มาวาง</span>
              </span>
            )}
          </label>

          {error ? (
            <div className="bo-error" role="alert">
              {error}
            </div>
          ) : null}

          {preview && !result ? (
            <div className="bo-legacy-preview" role="status">
              <strong>ตัวอย่างก่อนนำเข้า (ยังไม่ได้เขียนข้อมูล)</strong>
              <p>
                คาดว่าจะนำเข้า: สมาชิก{" "}
                {preview.members.toLocaleString("th-TH")} · ประวัติชำระ{" "}
                {preview.payments.toLocaleString("th-TH")} · ค่าธรรมเนียม{" "}
                {preview.feeMasters.toLocaleString("th-TH")}
                {preview.attachmentMembers
                  ? ` · ไฟล์แนบ ${preview.attachmentMembers.toLocaleString("th-TH")} ราย`
                  : ""}
                {preview.paymentSlips
                  ? ` · สลิป ${preview.paymentSlips.toLocaleString("th-TH")} ใบ`
                  : ""}
                {statusLine ? ` · ${statusLine}` : ""}
              </p>
              <span className="bo-legacy-source">
                ไฟล์ต้นทาง: {preview.sourceFile}
              </span>
            </div>
          ) : null}

          {result ? (
            <div className="bo-form-success" role="status">
              นำเข้าสำเร็จแล้ว
              <ul className="bo-legacy-success-counts">
                <li>
                  สมาชิก {result.members.toLocaleString("th-TH")} ราย
                </li>
                <li>
                  ประวัติชำระ {result.payments.toLocaleString("th-TH")} รายการ
                </li>
                <li>
                  ค่าธรรมเนียม {result.feeMasters.toLocaleString("th-TH")} รายการ
                </li>
                {result.attachmentMembers ? (
                  <li>
                    ไฟล์แนบ {result.attachmentMembers.toLocaleString("th-TH")}{" "}
                    ราย
                  </li>
                ) : null}
                {result.paymentSlips ? (
                  <li>
                    สลิปโอน {result.paymentSlips.toLocaleString("th-TH")} ใบ
                  </li>
                ) : null}
                {statusLine ? <li>{statusLine}</li> : null}
              </ul>
              <span className="bo-legacy-source">
                ไฟล์ต้นทาง: {result.sourceFile}
              </span>
            </div>
          ) : null}

          {display ? (
            <SkipReport
              skippedMembers={skippedMembers}
              skippedPayments={skippedPayments}
              warnings={warnings}
            />
          ) : null}

          <SampleTable
            sample={sample}
            showAll={showAllSample}
            onToggle={() => setShowAllSample((v) => !v)}
            caption={
              result
                ? "ตัวอย่างสมาชิกหลังนำเข้า"
                : "ตัวอย่างสมาชิกจากไฟล์ (ก่อนเขียน)"
            }
          />

          <div className="bo-legacy-actions">
            {result ? (
              <button
                type="button"
                className="bo-btn bo-btn-primary"
                onClick={goLegacyMembers}
              >
                ไปหน้ารายชื่อสมาชิกเก่า
              </button>
            ) : preview ? (
              <button
                type="button"
                className="bo-btn bo-btn-primary"
                disabled={!file || busy}
                onClick={() => setConfirmOpen(true)}
              >
                ยืนยันนำเข้า
              </button>
            ) : (
              <button
                type="submit"
                className="bo-btn bo-btn-primary"
                disabled={!file || busy}
              >
                {busy ? "กำลังตรวจสอบ…" : "ตรวจสอบไฟล์"}
              </button>
            )}
            {file && !result ? (
              <button
                type="button"
                className="bo-btn bo-btn-ghost"
                disabled={busy}
                onClick={clearFile}
              >
                ล้างไฟล์
              </button>
            ) : null}
            {result ? (
              <button
                type="button"
                className="bo-btn bo-btn-ghost"
                disabled={busy}
                onClick={clearFile}
              >
                นำเข้าไฟล์อื่น
              </button>
            ) : null}
            {preview && !result ? (
              <button
                type="submit"
                className="bo-btn bo-btn-ghost"
                disabled={!file || busy}
              >
                {busy ? "กำลังตรวจสอบ…" : "ตรวจสอบอีกครั้ง"}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="ยืนยันนำเข้าสมาชิกเก่า?"
        description={confirmDescription}
        confirmLabel="นำเข้าเลย"
        cancelLabel="ยกเลิก"
        variant="danger"
        busy={busy}
        onConfirm={() => void runCommit()}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </div>
  );
}
