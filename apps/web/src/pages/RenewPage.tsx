import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  fetchRenewDraft,
  submitRenewal,
  type RenewDraft,
} from "../lib/api";
import { liffPageUrl, memberStatusHrefFromUrl } from "../lib/member-links";
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
        const idToken =
          (await getIdToken()) ?? (phase.phase === "dev" ? "dev" : "");
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

  useEffect(() => {
    return () => {
      if (slip.kind === "ready") URL.revokeObjectURL(slip.previewUrl);
    };
  }, [slip]);

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
    if (slip.kind === "ready") URL.revokeObjectURL(slip.previewUrl);
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
      const idToken = await getIdToken();
      if (!idToken && liff.phase !== "dev") {
        throw Object.assign(new Error("invalid_id_token"), {
          code: "invalid_id_token",
        });
      }
      const base64 = await fileToBase64(slip.file);
      const result = await submitRenewal({
        idToken: idToken ?? "dev",
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

  const slipRejected =
    draft != null &&
    !draft.pendingRenewal &&
    draft.receiptStatus === "rejected";

  return (
    <div className="reg-shell">
      <div className="reg-atmosphere" aria-hidden />
      <main className="reg-wrap">
        {liff.phase === "loading" && (
          <p className="reg-lead">กำลังเชื่อมต่อ LINE…</p>
        )}
        {liff.phase === "error" && (
          <div className="reg-error">
            <div className="reg-error__badge">ABTA</div>
            <h1 className="reg-error__title">เชื่อมต่อ LINE ไม่สำเร็จ</h1>
            <p className="reg-error__detail">{liff.message}</p>
            <p className="reg-error__detail">
              กรุณาเปิดหน้านี้จาก LINE OA ของสมาคมอีกครั้ง
            </p>
          </div>
        )}

        {liff.phase !== "loading" &&
          liff.phase !== "error" &&
          done && (
            <section className="reg-success">
              <p className="reg-kicker">ABTA</p>
              <h1>รับคำขอต่ออายุแล้ว</h1>
              <p className="reg-success__id">{done.receiptNumber}</p>
              <p className="reg-lead">รอเหรัญญิกตรวจสอบสลิปครับ</p>
              <a
                className="reg-btn reg-btn--primary"
                href={memberStatusHrefFromUrl(done.statusUrl)}
              >
                ดูสถานะ
              </a>
            </section>
          )}

        {liff.phase !== "loading" &&
          liff.phase !== "error" &&
          !done &&
          draftError && (
            <div className="reg-error">
              <div className="reg-error__badge">ABTA</div>
              <h1 className="reg-error__title">ต่ออายุสมาชิก</h1>
              <p className="reg-error__detail">{errorCopy(draftError)}</p>
              <a className="reg-btn reg-btn--primary" href={liffPageUrl("/register")}>
                ไปหน้าสมัคร / ยืนยันสมาชิกเก่า
              </a>
            </div>
          )}

        {liff.phase !== "loading" &&
          liff.phase !== "error" &&
          !done &&
          !draftError &&
          !draft && <p className="reg-lead">กำลังโหลดข้อมูลสมาชิก…</p>}

        {liff.phase !== "loading" &&
          liff.phase !== "error" &&
          !done &&
          !draftError &&
          draft && (
            <>
              <header className="reg-hero">
                <p className="reg-kicker">ABTA</p>
                <h1>ต่ออายุสมาชิก</h1>
                <p className="reg-lead">
                  {draft.firstName} {draft.lastName}
                  <br />
                  เลขสมาชิก {draft.memberId}
                  {draft.expiryDate ? ` · หมดอายุ ${draft.expiryDate}` : ""}
                </p>
              </header>

              {draft.pendingRenewal ? (
                <div className="reg-warn">มีคำขอต่ออายุรอตรวจอยู่แล้ว</div>
              ) : slipRejected ? (
                <div className="reg-form">
                  <div className="reg-warn">
                    สลิปถูกปฏิเสธ — กรุณาส่งสลิปใหม่
                  </div>
                  <a
                    className="reg-btn reg-btn--primary"
                    href={liffPageUrl("/slip")}
                  >
                    ส่งสลิปใหม่
                  </a>
                </div>
              ) : (
                <form
                  className="reg-form"
                  onSubmit={(e) => void onSubmit(e)}
                >
                  <section className="reg-section">
                    <h2 className="reg-section__title">หลักฐานการชำระเงิน</h2>
                    <div className="reg-fee">
                      <span>ค่าธรรมเนียมต่ออายุ</span>
                      <strong>
                        {draft.feeThb.toLocaleString("th-TH")} บาท
                      </strong>
                    </div>
                    <div className="reg-bank">
                      <span className="reg-bank__label">บัญชีรับโอน</span>
                      <p>รอข้อมูลจากสมาคม</p>
                      <small>
                        จะแสดงชื่อบัญชี เลขบัญชี และธนาคารเมื่อสมาคมยืนยันแล้ว
                      </small>
                    </div>
                    <div className="reg-field">
                      <span>
                        แนบสลิปโอนเงิน <em className="req">*</em>
                      </span>
                      <label className="reg-upload">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                          onChange={onFile}
                        />
                        {slip.kind === "ready" ? (
                          <>
                            <img
                              src={slip.previewUrl}
                              alt="ตัวอย่างสลิป"
                            />
                            <span className="reg-upload__name">
                              {slip.file.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <strong>แตะเพื่ออัปโหลดสลิป</strong>
                            <small>รองรับ JPG, PNG · สูงสุด 5 MB</small>
                          </>
                        )}
                      </label>
                      {slip.kind === "error" ? (
                        <p className="reg-field-error">{slip.message}</p>
                      ) : null}
                    </div>
                  </section>
                  {error ? <p className="reg-form-error">{error}</p> : null}
                  <button
                    type="submit"
                    className="reg-btn reg-btn--primary"
                    disabled={busy || slip.kind !== "ready"}
                  >
                    {busy ? "กำลังส่ง…" : "ส่งคำขอต่ออายุ"}
                  </button>
                </form>
              )}
            </>
          )}
      </main>
    </div>
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
    case "id_token_required":
      return "เซสชัน LINE หมดอายุ กรุณาเปิดจาก LINE OA อีกครั้ง";
    case "invalid_id_token":
      return "เซสชัน LINE หมดอายุ กรุณาเปิดจาก LINE OA อีกครั้ง";
    case "slip_too_large":
      return "ไฟล์สลิปใหญ่เกิน 5 MB";
    case "invalid_slip_data":
      return "ไฟล์สลิปไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
    default:
      return "ดำเนินการไม่สำเร็จ กรุณาลองใหม่";
  }
}
