import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { apiBase, fetchRenewDraft } from "../lib/api";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import { isValidThaiMobile } from "./PhoneDigitInput";
import "./register.css";

type Seminar = {
  seminarId: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  pricing: Record<string, number>;
  pricingLabels?: Record<string, string>;
};

type SlipState =
  | { kind: "empty" }
  | { kind: "ready"; file: File; previewUrl: string }
  | { kind: "error"; message: string };

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png"]);

const PRICING_FALLBACK: Record<string, string> = {
  public_paid: "บุคคลทั่วไป (เสียเงิน)",
  member_free: "สมาชิก (ฟรี)",
  member_paid: "สมาชิก (เสียเงิน)",
};

export default function SeminarPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [isMember, setIsMember] = useState(false);
  const [items, setItems] = useState<Seminar[]>([]);
  const [selected, setSelected] = useState<Seminar | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    shirtSize: "",
    foodType: "",
    notes: "",
    applicantType: "public_paid",
  });
  const [slip, setSlip] = useState<SlipState>({ kind: "empty" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initLiff().then(async (phase) => {
      setLiff(phase);
      if (phase.phase !== "ready" && phase.phase !== "dev") return;
      try {
        const idToken =
          (await getIdToken()) ?? (phase.phase === "dev" ? "dev" : "");
        if (!idToken) return;
        const draft = await fetchRenewDraft(idToken);
        // Match backend: expired members are not treated as members for pricing.
        const memberForPricing = draft.status !== "expired";
        setIsMember(memberForPricing);
        if (memberForPricing) {
          setForm((f) => ({
            ...f,
            firstName: draft.firstName || f.firstName,
            lastName: draft.lastName || f.lastName,
            applicantType: "member_free",
          }));
        }
      } catch {
        setIsMember(false);
      }
    });
    void fetch(`${apiBase()}/api/seminars`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems(d.items ?? []);
      })
      .catch(() => setError("โหลดรายการสัมมนาไม่สำเร็จ"));
  }, []);

  useEffect(() => {
    return () => {
      if (slip.kind === "ready") URL.revokeObjectURL(slip.previewUrl);
    };
  }, [slip]);

  const pricingOptions = selected
    ? Object.keys(selected.pricing).filter((k) => {
        if (isMember) return true;
        return k === "public_paid";
      })
    : [];

  const allowsPublic =
    selected != null && selected.pricing.public_paid != null;
  const membersOnly = Boolean(selected && !isMember && !allowsPublic);

  const fee = selected
    ? Number(selected.pricing[form.applicantType] ?? 0) || 0
    : 0;

  function pricingLabel(key: string): string {
    return (
      selected?.pricingLabels?.[key] ??
      PRICING_FALLBACK[key] ??
      key
    );
  }

  function onSlipChange(e: ChangeEvent<HTMLInputElement>) {
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
    if (!selected || membersOnly) return;
    if (liff.phase === "error") {
      setError("กรุณาเปิดจาก LINE OA");
      return;
    }
    if (!isValidThaiMobile(form.phone)) {
      setError("กรุณากรอกเบอร์โทร 10 หลักให้ครบ");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const idToken = await getIdToken();
      if (!idToken && liff.phase !== "dev") {
        throw new Error("invalid_id_token");
      }
      let slipContentType: string | undefined;
      let slipBase64: string | undefined;
      if (fee > 0) {
        if (slip.kind !== "ready") throw new Error("slip_required");
        slipContentType = slip.file.type;
        slipBase64 = await fileToBase64(slip.file);
      }
      const res = await fetch(`${apiBase()}/api/seminars/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: idToken ?? (liff.phase === "dev" ? "dev" : undefined),
          seminarId: selected.seminarId,
          ...form,
          slipContentType,
          slipBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "error");
      setDone(data.registrationId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      setError(seminarErrorCopy(msg));
    } finally {
      setBusy(false);
    }
  }

  if (liff.phase === "error") {
    return (
      <div className="reg-shell">
        <div className="reg-atmosphere" aria-hidden />
        <main className="reg-wrap">
          <div className="reg-error">
            <div className="reg-error__badge">ABTA</div>
            <h1 className="reg-error__title">เชื่อมต่อ LINE ไม่สำเร็จ</h1>
            <p className="reg-error__detail">{liff.message}</p>
            <p className="reg-error__detail">
              กรุณาเปิดหน้านี้จาก LINE OA ของสมาคมอีกครั้ง
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="reg-shell">
      <div className="reg-atmosphere" aria-hidden />
      <main className="reg-wrap">
        {done ? (
          <section className="reg-success">
            <p className="reg-kicker">ABTA</p>
            <h1>รับสมัครสัมมนาแล้ว</h1>
            <p className="reg-success__id">{done}</p>
            <p className="reg-lead">รอเจ้าหน้าที่ยืนยันสิทธิ์ครับ</p>
          </section>
        ) : (
          <>
            <header className="reg-hero">
              <p className="reg-kicker">ABTA</p>
              <h1>สมัครสัมมนา</h1>
              <p className="reg-lead">
                {isMember
                  ? "ดึงข้อมูลสมาชิกจากบัญชี LINE แล้ว"
                  : "เลือกงานแล้วกรอกข้อมูลผู้สมัคร"}
              </p>
              {isMember ? (
                <p className="reg-user">สมาชิก ABTA</p>
              ) : null}
            </header>

            {error ? <p className="reg-form-error">{error}</p> : null}

            {!selected ? (
              <section className="reg-form">
                <h2 className="reg-section__title">รายการสัมมนา</h2>
                {items.length === 0 ? (
                  <div className="reg-legacy-empty">
                    <p>ยังไม่มีงานสัมมนาที่เปิดรับสมัคร</p>
                  </div>
                ) : (
                  <ul className="reg-seminar-list">
                    {items.map((s) => (
                      <li key={s.seminarId} className="reg-seminar-item">
                        <button
                          type="button"
                          className="reg-btn reg-btn--ghost reg-seminar-item__btn"
                          onClick={() => {
                            setSelected(s);
                            setSlip({ kind: "empty" });
                            setError(null);
                            const keys = Object.keys(s.pricing);
                            const preferred = isMember
                              ? keys.find((k) => k.startsWith("member")) ??
                                keys[0]
                              : keys.find((k) => k === "public_paid") ??
                                keys[0];
                            if (preferred) {
                              setForm((f) => ({
                                ...f,
                                applicantType: preferred,
                              }));
                            }
                          }}
                        >
                          <strong>{s.title}</strong>
                          {(s.eventDate || s.location) && (
                            <span className="reg-seminar-item__meta">
                              {[s.eventDate, s.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : (
              <form className="reg-form" onSubmit={(e) => void onSubmit(e)}>
                <button
                  type="button"
                  className="reg-btn reg-btn--ghost reg-seminar-back"
                  onClick={() => {
                    setSelected(null);
                    setSlip({ kind: "empty" });
                    setError(null);
                  }}
                >
                  ← กลับเลือกรายการ
                </button>
                <h2 className="reg-section__title">{selected.title}</h2>
                {selected.description ? (
                  <p className="reg-seminar-desc">{selected.description}</p>
                ) : null}

                {membersOnly ? (
                  <div className="reg-legacy-empty">
                    <p>สัมมานี้สำหรับสมาชิกเท่านั้น</p>
                  </div>
                ) : (
                  <>
                    <section className="reg-section">
                      <h2 className="reg-section__title">ข้อมูลผู้สมัคร</h2>
                      <label className="reg-field">
                        <span>
                          ชื่อ <em className="req">*</em>
                        </span>
                        <input
                          value={form.firstName}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              firstName: e.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label className="reg-field">
                        <span>
                          นามสกุล <em className="req">*</em>
                        </span>
                        <input
                          value={form.lastName}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              lastName: e.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label className="reg-field">
                        <span>
                          เบอร์โทร <em className="req">*</em>
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              phone: e.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label className="reg-field">
                        <span>อีเมล</span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              email: e.target.value,
                            }))
                          }
                        />
                      </label>
                      {pricingOptions.length > 0 ? (
                        <label className="reg-field">
                          <span>ประเภทผู้สมัคร</span>
                          <select
                            value={form.applicantType}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                applicantType: e.target.value,
                              }))
                            }
                          >
                            {pricingOptions.map((k) => (
                              <option key={k} value={k}>
                                {pricingLabel(k)} ({selected.pricing[k]} บาท)
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </section>

                    {fee > 0 ? (
                      <section className="reg-section">
                        <h2 className="reg-section__title">
                          หลักฐานการชำระเงิน
                        </h2>
                        <div className="reg-fee">
                          <span>ค่าสมัครสัมมนา</span>
                          <strong>
                            {fee.toLocaleString("th-TH")} บาท
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
                              onChange={onSlipChange}
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
                    ) : null}

                    <section className="reg-section">
                      <h2 className="reg-section__title">
                        ข้อมูลเพิ่มเติม (ไม่บังคับ)
                      </h2>
                      <label className="reg-field">
                        <span>ไซส์เสื้อ</span>
                        <input
                          value={form.shirtSize}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              shirtSize: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="reg-field">
                        <span>ประเภทอาหาร</span>
                        <input
                          value={form.foodType}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              foodType: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="reg-field">
                        <span>หมายเหตุ</span>
                        <textarea
                          rows={3}
                          value={form.notes}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </section>
                  </>
                )}

                <button
                  type="submit"
                  className="reg-btn reg-btn--primary"
                  disabled={
                    busy ||
                    liff.phase === "loading" ||
                    membersOnly
                  }
                >
                  {busy ? "กำลังส่ง…" : "สมัครสัมมนา"}
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

function seminarErrorCopy(code: string): string {
  switch (code) {
    case "slip_required":
      return "กรุณาแนบสลิป";
    case "member_required":
      return "ประเภทนี้สำหรับสมาชิกเท่านั้น";
    case "slip_too_large":
      return "ไฟล์สลิปใหญ่เกิน 5 MB";
    case "invalid_slip_data":
      return "ไฟล์สลิปไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
    case "invalid_id_token":
    case "id_token_required":
      return "เซสชัน LINE หมดอายุ กรุณาเปิดจาก LINE OA อีกครั้ง";
    default:
      return "สมัครไม่สำเร็จ";
  }
}
