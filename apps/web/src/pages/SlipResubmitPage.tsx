import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { fetchSlipDraft, resubmitSlip, type SlipDraft } from "../lib/api";
import { memberStatusHrefFromUrl } from "../lib/member-links";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import "./register.css";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png"]);

type SlipState =
  | { kind: "empty" }
  | { kind: "ready"; file: File; previewUrl: string }
  | { kind: "error"; message: string };

type DraftState =
  | { phase: "loading" }
  | { phase: "ready"; draft: SlipDraft }
  | { phase: "error"; code: string; statusUrl?: string };

/** Optional handoff from /status (`?reason=`), including nested liff.state. */
function readQueryRejectReason(search = window.location.search): string {
  const params = new URLSearchParams(search);
  let reason = params.get("reason")?.trim() ?? "";
  const liffState = params.get("liff.state");
  if (liffState) {
    const decoded = decodeURIComponent(liffState);
    const queryStart = decoded.indexOf("?");
    if (queryStart >= 0) {
      const nested = new URLSearchParams(decoded.slice(queryStart + 1));
      reason ||= nested.get("reason")?.trim() ?? "";
    }
  }
  return reason;
}

export default function SlipResubmitPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [draftState, setDraftState] = useState<DraftState>({ phase: "loading" });
  const [queryReason] = useState(() => readQueryRejectReason());
  const [slip, setSlip] = useState<SlipState>({ kind: "empty" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ statusUrl: string; memberId: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [errorStatusUrl, setErrorStatusUrl] = useState<string | undefined>();

  useEffect(() => {
    void initLiff().then(async (phase) => {
      setLiff(phase);
      if (phase.phase !== "ready" && phase.phase !== "dev") return;
      try {
        const idToken =
          (await getIdToken()) ?? (phase.phase === "dev" ? "dev" : "");
        if (!idToken) {
          setDraftState({ phase: "error", code: "invalid_id_token" });
          return;
        }
        setDraftState({ phase: "ready", draft: await fetchSlipDraft(idToken) });
      } catch (err) {
        const e = err as Error & { code?: string; statusUrl?: string };
        setDraftState({
          phase: "error",
          code: e.code ?? "error",
          statusUrl: e.statusUrl,
        });
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

  function clearSlip() {
    if (slip.kind === "ready") URL.revokeObjectURL(slip.previewUrl);
    setSlip({ kind: "empty" });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (slip.kind !== "ready") return;
    setBusy(true);
    setError(null);
    setErrorStatusUrl(undefined);
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
      const e = err as Error & { code?: string; statusUrl?: string };
      setError(errorCopy(e.code ?? "error"));
      setErrorStatusUrl(e.statusUrl);
    } finally {
      setBusy(false);
    }
  }

  const rejectReason =
    (draftState.phase === "ready"
      ? draftState.draft.rejectReason
      : undefined) || queryReason || undefined;

  const statusHref =
    draftState.phase === "ready" && draftState.draft.statusUrl
      ? memberStatusHrefFromUrl(draftState.draft.statusUrl)
      : draftState.phase === "error" && draftState.statusUrl
        ? memberStatusHrefFromUrl(draftState.statusUrl)
        : undefined;

  return (
    <div className="reg-shell">
      <div className="reg-atmosphere" aria-hidden />
      <main className="reg-wrap">
        {liff.phase === "loading" && (
          <p className="reg-lead" aria-live="polite">
            กำลังเชื่อมต่อ LINE…
          </p>
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

        {liff.phase !== "loading" && liff.phase !== "error" && done && (
          <section className="reg-success">
            <p className="reg-kicker">ABTA</p>
            <h1>รับสลิปใหม่แล้ว</h1>
            <p className="reg-success__id">{done.memberId}</p>
            <p className="reg-lead">รอเหรัญญิกตรวจสอบครับ</p>
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
          draftState.phase === "loading" && (
            <p className="reg-lead" aria-live="polite">
              กำลังโหลดข้อมูล…
            </p>
          )}

        {liff.phase !== "loading" &&
          liff.phase !== "error" &&
          !done &&
          draftState.phase === "error" && (
            <div className="reg-error">
              <div className="reg-error__badge">ABTA</div>
              <h1 className="reg-error__title">ส่งสลิปใหม่</h1>
              <p className="reg-error__detail" role="alert">
                {errorCopy(draftState.code)}
              </p>
              {statusHref ? (
                <a className="reg-btn reg-btn--primary" href={statusHref}>
                  ดูสถานะสมาชิก
                </a>
              ) : (
                <p className="reg-error__detail">
                  หากเปิดจาก LINE OA แล้วยังไม่ได้ผล ลองพิมพ์ “เช็คสถานะ” ในแชทสมาคม
                </p>
              )}
            </div>
          )}

        {liff.phase !== "loading" &&
          liff.phase !== "error" &&
          !done &&
          draftState.phase === "ready" && (
            <>
              <header className="reg-hero">
                <p className="reg-kicker">ABTA</p>
                <h1>ส่งสลิปใหม่</h1>
                <p className="reg-lead">
                  ใช้เมื่อเหรัญญิกแจ้งว่าสลิปไม่ผ่าน — สมาชิกยังคงสถานะสมาชิกสมบูรณ์
                </p>
              </header>

              {rejectReason ? (
                <div className="reg-warn" role="status">
                  เหตุผลที่สลิปไม่ผ่าน: {rejectReason}
                </div>
              ) : (
                <div className="reg-info" role="status">
                  โปรดแนบสลิปที่ชัด อ่านยอดและวันที่ได้
                  {statusHref ? (
                    <>
                      {" "}
                      ·{" "}
                      <a href={statusHref}>เปิดหน้าสถานะ</a> หากต้องการดูรายละเอียดจากเหรัญญิก
                    </>
                  ) : (
                    " · หากไม่แน่ใจ ให้เปิดหน้าสถานะดูเหตุผลจากเหรัญญิก"
                  )}
                </div>
              )}

              <form
                className="reg-form"
                onSubmit={(e) => void onSubmit(e)}
                aria-busy={busy}
              >
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
                          alt="ตัวอย่างสลิปที่เลือก"
                        />
                        <span className="reg-upload__name">{slip.file.name}</span>
                      </>
                    ) : (
                      <>
                        <strong>แตะเพื่ออัปโหลดสลิปใหม่</strong>
                        <small>รองรับ JPG, PNG · สูงสุด 5 MB</small>
                      </>
                    )}
                  </label>
                  {slip.kind === "ready" ? (
                    <button
                      type="button"
                      className="reg-btn reg-btn--ghost reg-upload-clear"
                      onClick={clearSlip}
                    >
                      ลบรูป / เลือกใหม่
                    </button>
                  ) : null}
                  {slip.kind === "error" ? (
                    <p className="reg-field-error" role="alert">
                      {slip.message}
                    </p>
                  ) : null}
                </div>

                <ul className="reg-checklist">
                  <li>ยอดเงินและวันที่อ่านได้ชัด</li>
                  <li>เห็นชื่อบัญชีผู้โอนครบ ไม่ถูกตัดขอบ</li>
                  <li>รูปไม่เบลอ — เป็น JPG หรือ PNG</li>
                </ul>

                {error ? (
                  <p className="reg-form-error" role="alert">
                    {error}
                    {(errorStatusUrl || statusHref) && (
                      <>
                        {" "}
                        <a
                          href={
                            errorStatusUrl
                              ? memberStatusHrefFromUrl(errorStatusUrl)
                              : statusHref!
                          }
                        >
                          ดูสถานะ
                        </a>
                      </>
                    )}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="reg-btn reg-btn--primary"
                  disabled={busy || slip.kind !== "ready"}
                  aria-busy={busy}
                >
                  {busy ? "กำลังส่ง…" : "ส่งสลิป"}
                </button>
              </form>
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
      return "ยังไม่ได้ผูก LINE กับสมาชิก";
    case "slip_not_rejected":
      return "ยังไม่มีสลิปที่ถูกปฏิเสธ — ไม่ต้องส่งใหม่ตอนนี้";
    case "data_not_approved":
      return "ข้อมูลสมาชิกยังไม่พร้อมส่งสลิปใหม่ — ดูสถานะก่อนครับ";
    case "payment_not_found":
      return "ไม่พบข้อมูลการชำระเงิน — เปิดหน้าสถานะเพื่อตรวจสอบ";
    case "invalid_id_token":
      return "เซสชัน LINE หมดอายุ กรุณาเปิดจาก LINE OA อีกครั้ง";
    default:
      return "ส่งไม่สำเร็จ กรุณาลองใหม่";
  }
}
