import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  canImportLegacy,
  importLegacyXlsx,
  type AdminMe,
  type LegacyImportResult,
} from "../../lib/admin-api";

const MAX_BYTES = 8 * 1024 * 1024;

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

function errorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : "import_failed";
  return ERROR_LABEL[code] ?? code;
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

export interface LegacyImportPageProps {
  me: AdminMe;
}

export default function LegacyImportPage(props: LegacyImportPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LegacyImportResult | null>(null);

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

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    setError(null);
    setResult(null);
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
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const contentBase64 = await fileToBase64(file);
      const out = await importLegacyXlsx({
        fileName: file.name,
        contentBase64,
      });
      setResult(out);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-legacy-page">
      <div className="bo-panel">
        <div className="bo-panel-head">
          <h2>นำเข้าสมาชิกเก่า</h2>
        </div>
        <div className="bo-legacy-intro ">
          <p>
            อัปโหลดไฟล์ Excel {" "} ระบบจะแยกข้อมูลเข้า collection{" "}
            <code>legacyMembers</code> และ <code>legacyPayments</code>{" "}
            (อัปเดทแบบ merge ตามเลขสมาชิกเก่า)
          </p>
          <ul>
            <li>
              ต้องมีชีต <strong>Member</strong> (และ <strong>Transaction</strong>{" "}
              ถ้ามีประวัติชำระ)
            </li>
            <li>รองรับไฟล์ .xlsx / .xls ขนาดไม่เกิน 8 MB</li>
          </ul>
        </div>

        <form className="bo-legacy-form" onSubmit={(e) => void onSubmit(e)}>
          <label className={`bo-file-drop${file ? " has-file" : ""}`}>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={onPick}
              disabled={busy}
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

          {result ? (
            <div className="bo-form-success" role="status">
              นำเข้าแล้ว: สมาชิก {result.members.toLocaleString("th-TH")} ·
              ประวัติชำระ {result.payments.toLocaleString("th-TH")} · ค่าธรรมเนียม{" "}
              {result.feeMasters.toLocaleString("th-TH")}
              <span className="bo-legacy-source">
                ไฟล์ต้นทาง: {result.sourceFile}
              </span>
            </div>
          ) : null}

          {result?.sample?.length ? (
            <div className="bo-table-wrap">
              <table className="bo-table">
                <thead>
                  <tr>
                    <th>เลขสมาชิกเก่า</th>
                    <th>ชื่อ</th>
                    <th>สถานะ</th>
                    <th>ประเภท</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sample.map((row) => (
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
          ) : null}

          <div className="bo-legacy-actions">
            <button
              type="submit"
              className="bo-btn bo-btn-primary"
              disabled={!file || busy}
            >
              {busy ? "กำลังนำเข้า…" : "นำเข้าข้อมูล"}
            </button>
            {file ? (
              <button
                type="button"
                className="bo-btn bo-btn-ghost"
                disabled={busy}
                onClick={clearFile}
              >
                ล้างไฟล์
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
