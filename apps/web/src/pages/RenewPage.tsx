import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  fetchRenewDraft,
  submitRenewal,
  type RenewDraft,
} from "../lib/api";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import "./register.css";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png"]);

type SlipState =
  | { kind: "empty" }
  | { kind: "ready"; file: File; previewUrl: string }
  | { kind: "error"; message: string };

export default function RenewPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [draft, setDraft] = useState<RenewDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [slip, setSlip] = useState<SlipState>({ kind: "empty" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
    statusUrl: string;
    receiptNumber: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initLiff().then(async (phase) => {
      setLiff(phase);
      if (phase.phase !== "ready" && phase.phase !== "dev") return;
      try {
        const idToken = (await getIdToken()) ?? (phase.phase === "dev" ? "dev" : "");
        if (!idToken) {
          setDraftError("invalid_id_token");
          return;
        }
        setDraft(await fetchRenewDraft(idToken));
      } catch (err) {
        setDraftError((err as Error & { code?: string }).code ?? "error");
      }
    });
  }, []);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.has(file.type)) {
      setSlip({ kind: "error", message: "ใช้ได้เฉพาะ JPG หรือ PNG" });
      return;
    }
    if (file.size > MAX_SLIP_BYTES) {
      setSlip({ kind: "error", message: "ไฟล์ใหญ่เกิน 5 MB" });
      return;
    }
    setSlip({
      kind: "ready",
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (slip.kind !== "ready" || !draft) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = (await getIdToken()) ?? "dev";
      const base64 = await fileToBase64(slip.file);
      const result = await submitRenewal({
        idToken,
        slipContentType: slip.file.type,
        slipBase64: base64,
      });
      setDone({
        statusUrl: result.statusUrl,
        receiptNumber: result.receiptNumber,
      });
    } catch (err) {
      setError(errorCopy((err as Error & { code?: string }).code ?? "error"));
    } finally {
      setBusy(false);
    }
  }

  if (liff.phase === "loading") {
    return (
      <main className="reg-page">
        <p className="reg-muted">กำลังเชื่อมต่อ LINE…</p>
      </main>
    );
  }
  if (liff.phase === "error") {
    return (
      <main className="reg-page">
        <p className="reg-error">{liff.message}</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="reg-page">
        <section className="reg-card">
          <h1>รับคำขอต่ออายุแล้ว</h1>
          <p>เลขใบเสร็จชั่วคราว {done.receiptNumber}</p>
          <p>รอเหรัญญิกตรวจสอบสลิปครับ</p>
          <p>
            <a href={done.statusUrl}>ดูสถานะ</a>
          </p>
        </section>
      </main>
    );
  }

  if (draftError) {
    return (
      <main className="reg-page">
        <section className="reg-card">
          <h1>ต่ออายุสมาชิก</h1>
          <p className="reg-error">{errorCopy(draftError)}</p>
          <p>
            <a href="/register">ไปหน้าสมัคร / ยืนยันสมาชิกเก่า</a>
          </p>
        </section>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="reg-page">
        <p className="reg-muted">กำลังโหลดข้อมูลสมาชิก…</p>
      </main>
    );
  }

  return (
    <main className="reg-page">
      <section className="reg-card">
        <h1>ต่ออายุสมาชิก</h1>
        <p>
          {draft.firstName} {draft.lastName}
        </p>
        <p className="reg-muted">
          เลขสมาชิก {draft.memberId}
          {draft.expiryDate ? ` · หมดอายุ ${draft.expiryDate}` : null}
        </p>
        <p>ค่าธรรมเนียม {draft.feeThb.toLocaleString("th-TH")} บาท</p>
        {draft.pendingRenewal ? (
          <p className="reg-error">มีคำขอต่ออายุรอตรวจอยู่แล้ว</p>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)}>
            <label className="reg-field">
              <span>แนบสลิปโอนเงิน</span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={onFile}
              />
            </label>
            {slip.kind === "ready" ? (
              <img
                src={slip.previewUrl}
                alt="สลิป"
                className="reg-slip-preview"
              />
            ) : null}
            {slip.kind === "error" ? (
              <p className="reg-error">{slip.message}</p>
            ) : null}
            {error ? <p className="reg-error">{error}</p> : null}
            <button
              type="submit"
              className="reg-btn-primary"
              disabled={busy || slip.kind !== "ready"}
            >
              {busy ? "กำลังส่ง…" : "ส่งคำขอต่ออายุ"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function errorCopy(code: string): string {
  switch (code) {
    case "not_linked":
      return "ยังไม่ได้ผูก LINE — กรุณายืนยันสมาชิกเก่าหรือสมัครก่อน";
    case "data_rejected":
      return "ข้อมูลสมาชิกถูกปฏิเสธ — แก้ไขข้อมูลก่อนต่ออายุ";
    case "renewal_pending":
      return "มีคำขอต่ออายุรอตรวจอยู่แล้ว";
    case "invalid_id_token":
      return "เซสชัน LINE หมดอายุ กรุณาเปิดจาก LINE OA อีกครั้ง";
    default:
      return "ดำเนินการไม่สำเร็จ กรุณาลองใหม่";
  }
}
