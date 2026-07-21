import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { resubmitSlip } from "../lib/api";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import "./register.css";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png"]);

type SlipState =
  | { kind: "empty" }
  | { kind: "ready"; file: File; previewUrl: string }
  | { kind: "error"; message: string };

export default function SlipResubmitPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [slip, setSlip] = useState<SlipState>({ kind: "empty" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ statusUrl: string; memberId: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initLiff().then(setLiff);
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
    if (slip.kind !== "ready") return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await getIdToken();
      if (!idToken && liff.phase !== "dev") {
        throw Object.assign(new Error("invalid_id_token"), {
          code: "invalid_id_token",
        });
      }
      const base64 = await fileToBase64(slip.file);
      const result = await resubmitSlip({
        idToken: idToken ?? "dev",
        slipContentType: slip.file.type,
        slipBase64: base64,
      });
      setDone({ statusUrl: result.statusUrl, memberId: result.memberId });
    } catch (err) {
      const code = (err as Error & { code?: string }).code ?? "error";
      setError(errorCopy(code));
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
          <h1>รับสลิปใหม่แล้ว</h1>
          <p>เลขสมาชิก {done.memberId}</p>
          <p>รอเหรัญญิกตรวจสอบครับ</p>
          <p>
            <a href={done.statusUrl}>ดูสถานะ</a>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="reg-page">
      <section className="reg-card">
        <h1>ส่งสลิปใหม่</h1>
        <p className="reg-muted">
          ใช้เมื่อเหรัญญิกแจ้งว่าสลิปไม่ผ่าน — สมาชิกยังคงสถานะสมาชิกสมบูรณ์
        </p>
        <form onSubmit={(e) => void onSubmit(e)}>
          <label className="reg-field">
            <span>ไฟล์สลิป (JPG/PNG)</span>
            <input type="file" accept="image/jpeg,image/png" onChange={onFile} />
          </label>
          {slip.kind === "ready" ? (
            <img src={slip.previewUrl} alt="สลิป" className="reg-slip-preview" />
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
            {busy ? "กำลังส่ง…" : "ส่งสลิป"}
          </button>
        </form>
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
      return "ยังไม่ได้ผูก LINE กับสมาชิก";
    case "slip_not_rejected":
      return "ยังไม่มีสลิปที่ถูกปฏิเสธ — ไม่ต้องส่งใหม่ตอนนี้";
    case "invalid_id_token":
      return "เซสชัน LINE หมดอายุ กรุณาเปิดจาก LINE OA อีกครั้ง";
    default:
      return "ส่งไม่สำเร็จ กรุณาลองใหม่";
  }
}
