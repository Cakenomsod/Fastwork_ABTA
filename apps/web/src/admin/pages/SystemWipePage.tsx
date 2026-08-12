import { useEffect, useState } from "react";
import {
  WIPE_CONFIRM_PHRASE,
  fetchWipePreview,
  runSystemWipe,
  type WipePreview,
  type WipeResult,
} from "../../lib/admin-api";
import { ConfirmDialog } from "../ConfirmDialog";

const COLLECTION_LABEL: Record<string, string> = {
  members: "สมาชิก",
  payments: "รายการชำระเงิน / ใบเสร็จ",
  idRegistry: "ทะเบียนเลขที่",
  counters: "ตัวนับเลขที่",
  legacyMembers: "สมาชิกเก่า",
  legacyPayments: "ประวัติชำระเงินเก่า",
  broadcastLogs: "ประวัติส่งข้อความกลุ่ม",
  seminarRegistrations: "การสมัครสัมมนา",
  line_sightings: "บันทึก LINE",
};

const KEEP_LABEL: Record<string, string> = {
  staffUsers: "เจ้าหน้าที่ / สิทธิ์เข้าใช้งาน",
  messageTemplates: "แม่แบบข้อความ",
  membershipFeeMasters: "อัตราค่าธรรมเนียม",
  seminars: "รายการสัมมนา",
};

const STORAGE_LABEL: Record<string, string> = {
  "slips/": "รูปสลิปสมาชิก",
  "seminar-slips/": "รูปสลิปสัมมนา",
};

const ERROR_LABEL: Record<string, string> = {
  confirm_mismatch: "ข้อความยืนยันไม่ตรง — พิมพ์ตามที่กำหนด",
  forbidden_role: "เฉพาะซูเปอร์แอดมินเท่านั้น",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  load_failed: "โหลดสรุปข้อมูลไม่สำเร็จ",
  wipe_failed: "ล้างข้อมูลไม่สำเร็จ — ลองอีกครั้ง",
};

export default function SystemWipePage() {
  const [preview, setPreview] = useState<WipePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WipeResult | null>(null);

  async function loadPreview() {
    setLoading(true);
    setError(null);
    try {
      setPreview(await fetchWipePreview());
    } catch (err) {
      const code = err instanceof Error ? err.message : "load_failed";
      setError(ERROR_LABEL[code] ?? code);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPreview();
  }, []);

  async function onConfirm() {
    setBusy(true);
    setError(null);
    try {
      const out = await runSystemWipe(WIPE_CONFIRM_PHRASE);
      setResult(out);
      setConfirmOpen(false);
      await loadPreview();
    } catch (err) {
      const code = err instanceof Error ? err.message : "wipe_failed";
      setError(ERROR_LABEL[code] ?? code);
    } finally {
      setBusy(false);
    }
  }

  const totalDocs =
    preview?.collections.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const totalFiles =
    preview?.storage.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <div className="bo-wipe">
      <div className="bo-panel bo-wipe-panel">
        <div className="bo-panel-head bo-wipe-head">
          <h2>ล้างข้อมูลทดลอง</h2>
          <p>
            ลบสมาชิก การชำระเงิน ใบเสร็จ สลิป และคิวที่เกี่ยวข้องทั้งหมด
            ใช้ก่อนเปิดทดลองกับกรรมการเมื่อต้องการเริ่มใหม่
            — ไม่ลบเจ้าหน้าที่ แม่แบบ ค่าธรรมเนียม และรายการสัมมนา
          </p>
        </div>

        <div className="bo-wipe-body">
          {error ? (
            <p className="bo-error" role="alert">
              {error}
            </p>
          ) : null}
          {result ? (
            <p className="bo-wipe-done" role="status">
              ล้างแล้ว {result.firestoreDeleted.toLocaleString("th-TH")} รายการ
              และไฟล์สลิป {result.storageDeleted.toLocaleString("th-TH")} ไฟล์
              — เลขสมาชิกและใบเสร็จจะเริ่มนับใหม่
            </p>
          ) : null}

          {loading ? (
            <div className="bo-empty">กำลังนับข้อมูลที่จะลบ…</div>
          ) : preview ? (
            <div className="bo-wipe-cols">
              <section>
                <h3>จะลบ</h3>
                <ul>
                  {preview.collections.map((row) => (
                    <li key={row.name}>
                      <span>
                        {COLLECTION_LABEL[row.name] ?? row.name}
                      </span>
                      <strong>
                        {row.count.toLocaleString("th-TH")}
                      </strong>
                    </li>
                  ))}
                  {preview.storage.map((row) => (
                    <li key={row.prefix}>
                      <span>
                        {STORAGE_LABEL[row.prefix] ?? row.prefix}
                      </span>
                      <strong>
                        {row.count.toLocaleString("th-TH")}
                      </strong>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>จะเก็บไว้</h3>
                <ul>
                  {preview.keep.map((name) => (
                    <li key={name}>
                      <span>{KEEP_LABEL[name] ?? name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : null}

          <div className="bo-wipe-actions">
            <button
              type="button"
              className="bo-btn bo-btn-danger"
              disabled={loading || busy || (totalDocs === 0 && totalFiles === 0)}
              onClick={() => setConfirmOpen(true)}
            >
              ล้างข้อมูลทดลอง
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        variant="danger"
        title="ล้างข้อมูลทดลองทั้งระบบ?"
        description="การลบย้อนกลับไม่ได้ สมาชิก ใบเสร็จ สลิป และคิวตรวจจะหายทั้งหมด เจ้าหน้าที่และค่าตั้งค่ายังอยู่"
        confirmLabel="ล้างข้อมูลทั้งหมด"
        requireTypedConfirm={WIPE_CONFIRM_PHRASE}
        busy={busy}
        onConfirm={() => void onConfirm()}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </div>
  );
}
