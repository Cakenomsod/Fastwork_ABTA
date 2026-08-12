import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { apiBase, fetchRenewDraft } from "../lib/api";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import PhoneDigitInput, {
  formatThaiMobileDisplay,
  isValidThaiMobile,
} from "./PhoneDigitInput";
import {
  hasTransferAccount,
  NO_TRANSFER_ACCOUNT_SUBMIT_HINT,
  PaymentConfirmPanel,
  TransferBankBlock,
} from "./TransferBank";
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

type MyRegistration = {
  registrationId: string;
  seminarId: string;
  title: string;
  eventDate?: string;
  location?: string;
  status: string;
  statusLabel: string;
  applicantType: string;
  applicantTypeLabel: string;
  feeThb: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  shirtSize?: string;
  foodType?: string;
  notes?: string;
  rejectReason?: string;
};

type SlipState =
  | { kind: "empty" }
  | { kind: "ready"; file: File; previewUrl: string }
  | { kind: "error"; message: string };

type StatusTone = "pending" | "paid" | "confirmed" | "rejected" | "neutral";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png"]);

const PRICING_FALLBACK: Record<string, string> = {
  public_paid: "บุคคลทั่วไป",
  member_free: "สมาชิก ABTA",
  member_paid: "สมาชิก ABTA",
};

const BLOCKING_STATUSES = new Set(["registered", "paid", "confirmed"]);

function wantsMineView(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("mine") === "1" || params.get("view") === "1") return true;
  const liffState = params.get("liff.state");
  if (!liffState) return false;
  const decoded = decodeURIComponent(liffState);
  const q = decoded.indexOf("?");
  if (q < 0) return false;
  const nested = new URLSearchParams(decoded.slice(q + 1));
  return nested.get("mine") === "1" || nested.get("view") === "1";
}

function statusTone(status: string): StatusTone {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "rejected":
      return "rejected";
    case "paid":
      return "paid";
    case "registered":
      return "pending";
    default:
      return "neutral";
  }
}

function regForSeminar(
  regs: MyRegistration[],
  seminarId: string,
): MyRegistration | undefined {
  return regs.find((r) => r.seminarId === seminarId);
}

function isBlockingReg(r: MyRegistration): boolean {
  return BLOCKING_STATUSES.has(r.status);
}

function applicantFullName(r: MyRegistration): string | null {
  const name = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
  return name || null;
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`sem-status sem-status--${statusTone(status)}`}>
      {label}
    </span>
  );
}

export default function SeminarPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [isMember, setIsMember] = useState(false);
  const [items, setItems] = useState<Seminar[]>([]);
  const [myRegs, setMyRegs] = useState<MyRegistration[]>([]);
  const [showMine, setShowMine] = useState(wantsMineView);
  const [mineDetail, setMineDetail] = useState<MyRegistration | null>(null);
  const [listPhase, setListPhase] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [minePhase, setMinePhase] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [selected, setSelected] = useState<Seminar | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "0",
    email: "",
    shirtSize: "",
    foodType: "",
    notes: "",
    applicantType: "public_paid",
  });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [slip, setSlip] = useState<SlipState>({ kind: "empty" });
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeWarning, setTypeWarning] = useState<string | null>(null);

  const canPay = hasTransferAccount();

  async function loadMyRegistrations(idToken: string) {
    setMinePhase("loading");
    try {
      const res = await fetch(`${apiBase()}/api/seminars/mine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "error");
      setMyRegs(data.items ?? []);
      setMinePhase("ready");
    } catch {
      setMinePhase("error");
    }
  }

  useEffect(() => {
    void initLiff().then(async (phase) => {
      setLiff(phase);
      if (phase.phase !== "ready" && phase.phase !== "dev") return;

      const idToken =
        (await getIdToken()) ?? (phase.phase === "dev" ? "dev" : "");
      const openMine = wantsMineView();

      if (openMine) {
        setShowMine(true);
      }

      if (!idToken) {
        if (openMine) setMinePhase("error");
        return;
      }

      await loadMyRegistrations(idToken);

      try {
        const draft = await fetchRenewDraft(idToken);
        const memberForPricing = draft.status !== "expired";
        setIsMember(memberForPricing);
        if (memberForPricing) {
          const phoneDigits = (draft.phone || "").replace(/\D/g, "").slice(0, 10);
          setForm((f) => ({
            ...f,
            firstName: draft.firstName || f.firstName,
            lastName: draft.lastName || f.lastName,
            phone: phoneDigits || f.phone,
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
        if (d.ok) {
          setItems(d.items ?? []);
          setListPhase("ready");
        } else {
          setListPhase("error");
          setError("โหลดรายการสัมมนาไม่สำเร็จ");
        }
      })
      .catch(() => {
        setListPhase("error");
        setError("โหลดรายการสัมมนาไม่สำเร็จ");
      });
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

  const phoneInvalid =
    phoneTouched && form.phone.length > 0 && !isValidThaiMobile(form.phone);
  const phoneIncomplete =
    phoneTouched && (!form.phone || !isValidThaiMobile(form.phone));

  function pricingLabel(key: string): string {
    const base =
      selected?.pricingLabels?.[key] ?? PRICING_FALLBACK[key] ?? key;
    const amount = selected ? Number(selected.pricing[key] ?? 0) || 0 : 0;
    if (amount <= 0) return `${base} · ไม่เสียค่าสมัคร`;
    return `${base} · ${amount.toLocaleString("th-TH")} บาท`;
  }

  function applyPreferredType(s: Seminar) {
    const keys = Object.keys(s.pricing);
    const preferred = isMember
      ? keys.find((k) => k.startsWith("member")) ?? keys[0]
      : keys.find((k) => k === "public_paid") ?? keys[0];
    if (preferred) {
      setForm((f) => ({ ...f, applicantType: preferred }));
    }
    setTypeWarning(null);
  }

  function onApplicantTypeChange(next: string) {
    setForm((f) => ({ ...f, applicantType: next }));
    setConfirmOpen(false);
    setError(null);
    if (isMember && next === "public_paid") {
      setTypeWarning(
        "คุณเป็นสมาชิก ABTA อยู่แล้ว — การสมัครแบบบุคคลทั่วไปจะเสียค่าสมัครตามเรททั่วไป และไม่ใช้สิทธิสมาชิก ต้องการดำเนินการต่อหรือไม่?",
      );
    } else {
      setTypeWarning(null);
    }
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
    setConfirmOpen(false);
  }

  function clearSlip() {
    if (slip.kind === "ready") URL.revokeObjectURL(slip.previewUrl);
    setSlip({ kind: "empty" });
    setConfirmOpen(false);
  }

  function onRequestSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected || membersOnly) return;
    if (liff.phase === "error") {
      setError("กรุณาเปิดจาก LINE OA");
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, "").slice(0, 10);
    if (phoneDigits !== form.phone) {
      setForm((f) => ({ ...f, phone: phoneDigits }));
    }
    setPhoneTouched(true);
    if (!isValidThaiMobile(phoneDigits)) {
      setError("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก เช่น 080-802-6677");
      return;
    }
    if (fee > 0) {
      if (!canPay) {
        setError(NO_TRANSFER_ACCOUNT_SUBMIT_HINT);
        return;
      }
      if (slip.kind !== "ready") {
        setError(seminarErrorCopy("slip_required"));
        return;
      }
    }
    setError(null);
    setConfirmOpen(true);
  }

  async function doSubmit() {
    if (!selected || membersOnly) return;
    if (fee > 0 && (!canPay || slip.kind !== "ready")) return;
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
          phone: form.phone.replace(/\D/g, ""),
          slipContentType,
          slipBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "error");
      setDone(data.registrationId);
      setConfirmOpen(false);
      const token = idToken ?? (liff.phase === "dev" ? "dev" : "");
      if (token) void loadMyRegistrations(token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      setError(seminarErrorCopy(msg));
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function openMineView() {
    setDone(null);
    setShowMine(true);
    setSelected(null);
    setMineDetail(null);
    setError(null);
    const idToken =
      (await getIdToken()) ?? (liff.phase === "dev" ? "dev" : "");
    if (!idToken) {
      setMinePhase("error");
      return;
    }
    await loadMyRegistrations(idToken);
  }

  function openBrowseView() {
    setShowMine(false);
    setMineDetail(null);
    setSelected(null);
    setError(null);
    setConfirmOpen(false);
    setTypeWarning(null);
  }

  function openRegistrationDetail(r: MyRegistration) {
    setMineDetail(r);
    setShowMine(true);
    setSelected(null);
    setDone(null);
    setError(null);
  }

  function startRegister(s: Seminar) {
    const existing = regForSeminar(myRegs, s.seminarId);
    if (existing && isBlockingReg(existing)) {
      openRegistrationDetail(existing);
      return;
    }
    setSelected(s);
    setMineDetail(null);
    setShowMine(false);
    setSlip({ kind: "empty" });
    setConfirmOpen(false);
    setError(null);
    setPhoneTouched(false);
    applyPreferredType(s);
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
            <h1>ส่งใบสมัครแล้ว</h1>
            <p className="reg-success__id">{done}</p>
            <p className="reg-lead">
              เจ้าหน้าที่จะตรวจสอบสิทธิ์ แล้วแจ้งผลทาง LINE ของท่าน
            </p>
            <button
              type="button"
              className="reg-btn reg-btn--ghost-light"
              onClick={() => void openMineView()}
            >
              ดูใบสมัครของฉัน
            </button>
          </section>
        ) : (
          <>
            {!selected && !mineDetail ? (
              <nav
                className="reg-mode-tabs"
                role="tablist"
                aria-label="โหมดสัมมนา"
              >
                <button
                  type="button"
                  className={`reg-mode-tab${!showMine ? " reg-mode-tab--active" : ""}`}
                  role="tab"
                  aria-selected={!showMine}
                  onClick={() => openBrowseView()}
                >
                  สมัครใหม่
                </button>
                <button
                  type="button"
                  className={`reg-mode-tab${showMine ? " reg-mode-tab--active" : ""}`}
                  role="tab"
                  aria-selected={showMine}
                  onClick={() => void openMineView()}
                >
                  ของฉัน
                </button>
              </nav>
            ) : null}

            <header className="reg-hero">
              <h1>
                {mineDetail
                  ? "รายละเอียดใบสมัคร"
                  : selected
                    ? "กรอกใบสมัคร"
                    : showMine
                      ? "ใบสมัครสัมมนา"
                      : "สัมมนาสมาคม"}
              </h1>
              <p className="reg-lead">
                {mineDetail
                  ? "ข้อมูลที่ท่านส่งไว้และสถานะล่าสุด"
                  : selected
                    ? selected.title
                    : showMine
                      ? "แตะรายการเพื่อดูรายละเอียดและติดตามสถานะ"
                      : isMember
                        ? "ใช้สิทธิสมาชิก ABTA เมื่อสมัครงานที่เปิดรับ"
                        : "เลือกงานที่เปิดรับสมัคร แล้วกรอกข้อมูลผู้สมัคร"}
              </p>
              {isMember && !showMine && !selected && !mineDetail ? (
                <p className="reg-user">เข้าสู่ระบบในฐานะสมาชิก ABTA</p>
              ) : null}
            </header>

            {error && !confirmOpen ? (
              <p className="reg-form-error" role="alert">
                {error}
              </p>
            ) : null}

            {mineDetail ? (
              <section className="reg-form">
                <button
                  type="button"
                  className="reg-btn reg-btn--ghost reg-seminar-back"
                  onClick={() => setMineDetail(null)}
                >
                  ← กลับรายการของฉัน
                </button>

                <div className="sem-detail-head">
                  <h2 className="reg-section__title sem-detail-title">
                    {mineDetail.title}
                  </h2>
                  <StatusBadge
                    status={mineDetail.status}
                    label={mineDetail.statusLabel}
                  />
                </div>

                {(mineDetail.eventDate || mineDetail.location) && (
                  <p className="reg-seminar-desc">
                    {[mineDetail.eventDate, mineDetail.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}

                {mineDetail.status === "rejected" && mineDetail.rejectReason ? (
                  <div className="sem-reject" role="status">
                    <strong>เหตุผลที่ไม่ผ่าน</strong>
                    <p>{mineDetail.rejectReason}</p>
                  </div>
                ) : null}

                <dl className="sem-detail">
                  <div className="sem-detail__row">
                    <dt>เลขที่ใบสมัคร</dt>
                    <dd>{mineDetail.registrationId}</dd>
                  </div>
                  {applicantFullName(mineDetail) ? (
                    <div className="sem-detail__row">
                      <dt>ชื่อผู้สมัคร</dt>
                      <dd>{applicantFullName(mineDetail)}</dd>
                    </div>
                  ) : null}
                  {mineDetail.phone ? (
                    <div className="sem-detail__row">
                      <dt>เบอร์โทร</dt>
                      <dd>
                        {formatThaiMobileDisplay(
                          mineDetail.phone.replace(/\D/g, "").slice(0, 10),
                        )}
                      </dd>
                    </div>
                  ) : null}
                  {mineDetail.email ? (
                    <div className="sem-detail__row">
                      <dt>อีเมล</dt>
                      <dd>{mineDetail.email}</dd>
                    </div>
                  ) : null}
                  <div className="sem-detail__row">
                    <dt>ประเภท</dt>
                    <dd>{mineDetail.applicantTypeLabel}</dd>
                  </div>
                  <div className="sem-detail__row">
                    <dt>ค่าสมัคร</dt>
                    <dd>
                      {mineDetail.feeThb > 0
                        ? `${mineDetail.feeThb.toLocaleString("th-TH")} บาท`
                        : "ไม่เสียค่าสมัคร"}
                    </dd>
                  </div>
                  {mineDetail.shirtSize ? (
                    <div className="sem-detail__row">
                      <dt>ไซส์เสื้อ</dt>
                      <dd>{mineDetail.shirtSize}</dd>
                    </div>
                  ) : null}
                  {mineDetail.foodType ? (
                    <div className="sem-detail__row">
                      <dt>ประเภทอาหาร</dt>
                      <dd>{mineDetail.foodType}</dd>
                    </div>
                  ) : null}
                  {mineDetail.notes ? (
                    <div className="sem-detail__row">
                      <dt>หมายเหตุ</dt>
                      <dd>{mineDetail.notes}</dd>
                    </div>
                  ) : null}
                </dl>

                {mineDetail.status === "rejected" ? (
                  <button
                    type="button"
                    className="reg-btn reg-btn--primary"
                    onClick={() => {
                      const seminar = items.find(
                        (s) => s.seminarId === mineDetail.seminarId,
                      );
                      setMineDetail(null);
                      if (seminar) {
                        startRegister(seminar);
                      } else {
                        openBrowseView();
                      }
                    }}
                  >
                    สมัครงานนี้อีกครั้ง
                  </button>
                ) : null}
              </section>
            ) : showMine ? (
              <section className="reg-form" aria-busy={minePhase === "loading"}>
                <h2 className="reg-section__title">รายการที่สมัครไว้</h2>
                {minePhase === "loading" || minePhase === "idle" ? (
                  <p className="reg-lead" aria-live="polite">
                    กำลังโหลดใบสมัคร…
                  </p>
                ) : minePhase === "error" ? (
                  <div className="reg-legacy-empty" role="alert">
                    <p>
                      โหลดใบสมัครไม่สำเร็จ กรุณาเปิดจาก LINE OA อีกครั้ง
                    </p>
                  </div>
                ) : myRegs.length === 0 ? (
                  <div className="reg-legacy-empty">
                    <p>ยังไม่มีใบสมัครสัมมนา</p>
                    <button
                      type="button"
                      className="reg-btn reg-btn--primary"
                      onClick={() => openBrowseView()}
                    >
                      ไปเลือกงานสมัครใหม่
                    </button>
                  </div>
                ) : (
                  <ul className="reg-seminar-list">
                    {myRegs.map((r) => (
                      <li key={r.registrationId} className="reg-seminar-item">
                        <button
                          type="button"
                          className="reg-btn reg-btn--ghost reg-seminar-item__btn sem-item"
                          onClick={() => openRegistrationDetail(r)}
                        >
                          <span className="sem-item__top">
                            <strong>{r.title}</strong>
                            <StatusBadge
                              status={r.status}
                              label={r.statusLabel}
                            />
                          </span>
                          {(r.eventDate || r.location) && (
                            <span className="reg-seminar-item__meta">
                              {[r.eventDate, r.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                          <span className="reg-seminar-item__meta">
                            {r.applicantTypeLabel}
                            {r.feeThb > 0
                              ? ` · ${r.feeThb.toLocaleString("th-TH")} บาท`
                              : " · ไม่เสียค่าสมัคร"}
                          </span>
                          <span className="sem-item__hint">ดูรายละเอียด →</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : !selected ? (
              <section className="reg-form" aria-busy={listPhase === "loading"}>
                <h2 className="reg-section__title">งานที่เปิดรับสมัคร</h2>
                {listPhase === "loading" ? (
                  <p className="reg-lead" aria-live="polite">
                    กำลังโหลดรายการสัมมนา…
                  </p>
                ) : listPhase === "error" ? (
                  <div className="reg-legacy-empty" role="alert">
                    <p>โหลดรายการสัมมนาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="reg-legacy-empty">
                    <p>
                      ขณะนี้ยังไม่มีงานที่เปิดรับสมัคร — กลับมาดูใหม่ภายหลังได้ครับ
                    </p>
                  </div>
                ) : (
                  <ul className="reg-seminar-list">
                    {items.map((s) => {
                      const existing = regForSeminar(myRegs, s.seminarId);
                      const blocked = existing
                        ? isBlockingReg(existing)
                        : false;
                      return (
                        <li key={s.seminarId} className="reg-seminar-item">
                          <button
                            type="button"
                            className={`reg-btn reg-btn--ghost reg-seminar-item__btn sem-item${blocked ? " sem-item--applied" : ""}`}
                            onClick={() => startRegister(s)}
                          >
                            <span className="sem-item__top">
                              <strong>{s.title}</strong>
                              {existing ? (
                                <StatusBadge
                                  status={existing.status}
                                  label={existing.statusLabel}
                                />
                              ) : (
                                <span className="sem-status sem-status--open">
                                  เปิดรับสมัคร
                                </span>
                              )}
                            </span>
                            {(s.eventDate || s.location) && (
                              <span className="reg-seminar-item__meta">
                                {[s.eventDate, s.location]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                            {s.description ? (
                              <span className="reg-seminar-item__meta sem-item__desc">
                                {s.description}
                              </span>
                            ) : null}
                            <span className="sem-item__hint">
                              {blocked
                                ? "ดูใบสมัครของคุณ →"
                                : existing?.status === "rejected"
                                  ? "สมัครอีกครั้ง →"
                                  : "สมัครงานนี้ →"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ) : (
              <form className="reg-form" onSubmit={onRequestSubmit}>
                <button
                  type="button"
                  className="reg-btn reg-btn--ghost reg-seminar-back"
                  onClick={() => {
                    setSelected(null);
                    setSlip({ kind: "empty" });
                    setConfirmOpen(false);
                    setError(null);
                    setTypeWarning(null);
                  }}
                >
                  ← กลับเลือกรายการ
                </button>
                <h2 className="reg-section__title">{selected.title}</h2>
                {(selected.eventDate || selected.location) && (
                  <p className="reg-seminar-desc">
                    {[selected.eventDate, selected.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {selected.description ? (
                  <p className="reg-seminar-desc">{selected.description}</p>
                ) : null}

                {membersOnly ? (
                  <div className="reg-legacy-empty">
                    <p>
                      สัมมานี้เปิดเฉพาะสมาชิก ABTA —
                      กรุณาสมัครหรือยืนยันสมาชิกก่อน
                    </p>
                  </div>
                ) : confirmOpen ? (
                  <PaymentConfirmPanel
                    title="ยืนยันข้อมูลก่อนสมัคร"
                    lead={
                      fee > 0
                        ? "ตรวจสอบยอด สลิป และข้อมูลผู้สมัครก่อนส่งคำขอ"
                        : "ตรวจสอบข้อมูลผู้สมัครก่อนยืนยันสมัครสัมมนา (ไม่เสียค่าสมัคร)"
                    }
                    rows={[
                      { label: "งาน", value: selected.title },
                      {
                        label: "ผู้สมัคร",
                        value: `${form.firstName} ${form.lastName}`,
                      },
                      {
                        label: "เบอร์โทร",
                        value: formatThaiMobileDisplay(form.phone),
                      },
                      {
                        label: "ประเภท",
                        value: pricingLabel(form.applicantType),
                      },
                      {
                        label: "ค่าสมัคร",
                        value:
                          fee > 0
                            ? `${fee.toLocaleString("th-TH")} บาท`
                            : "ไม่เสียค่าสมัคร",
                      },
                      ...(form.shirtSize
                        ? [{ label: "ไซส์เสื้อ", value: form.shirtSize }]
                        : []),
                      ...(form.foodType
                        ? [{ label: "อาหาร", value: form.foodType }]
                        : []),
                      ...(form.notes
                        ? [{ label: "หมายเหตุ", value: form.notes }]
                        : []),
                    ]}
                    slipPreviewUrl={
                      fee > 0 && slip.kind === "ready"
                        ? slip.previewUrl
                        : undefined
                    }
                    confirmLabel="ยืนยันสมัครสัมมนา"
                    warnText={
                      fee > 0
                        ? "ตรวจสอบยอดและสลิปให้ถูกต้องก่อนยืนยัน — หลังส่งแล้วรอเจ้าหน้าที่ตรวจ"
                        : "ตรวจสอบชื่อ เบอร์โทร และประเภทผู้สมัครให้ถูกต้องก่อนยืนยัน — หลังส่งแล้วรอเจ้าหน้าที่ยืนยันสิทธิ์"
                    }
                    busy={busy}
                    error={error}
                    onConfirm={() => void doSubmit()}
                    onBack={() => setConfirmOpen(false)}
                  />
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
                      <div className="reg-field">
                        <span id="sem-phone-label">
                          เบอร์โทร <em className="req">*</em>
                        </span>
                        <PhoneDigitInput
                          id="sem-phone"
                          value={form.phone}
                          aria-labelledby="sem-phone-label"
                          aria-invalid={phoneInvalid || undefined}
                          aria-describedby="sem-phone-hint"
                          onChange={(phone) => {
                            setForm((f) => ({ ...f, phone }));
                            setPhoneTouched(true);
                            if (error?.includes("เบอร์โทร")) setError(null);
                          }}
                        />
                        <small id="sem-phone-hint" className="reg-field-hint">
                          กรอก 10 หลัก เช่น 080-802-6677
                        </small>
                        {phoneIncomplete ? (
                          <p className="reg-field-error" role="alert">
                            กรุณากรอกเบอร์โทรให้ครบ 10 หลัก
                          </p>
                        ) : null}
                      </div>
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
                      {pricingOptions.length > 1 ? (
                        <label className="reg-field">
                          <span>ประเภทผู้สมัคร</span>
                          <select
                            value={form.applicantType}
                            onChange={(e) =>
                              onApplicantTypeChange(e.target.value)
                            }
                          >
                            {pricingOptions.map((k) => (
                              <option key={k} value={k}>
                                {pricingLabel(k)}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : pricingOptions.length === 1 ? (
                        <p className="reg-lead">
                          ประเภท: {pricingLabel(pricingOptions[0]!)}
                        </p>
                      ) : null}
                      {typeWarning ? (
                        <div className="reg-legacy-empty" role="alert">
                          <p>{typeWarning}</p>
                          <button
                            type="button"
                            className="reg-btn reg-btn--ghost"
                            onClick={() => {
                              const memberKey = pricingOptions.find((k) =>
                                k.startsWith("member"),
                              );
                              if (memberKey) onApplicantTypeChange(memberKey);
                            }}
                          >
                            กลับไปใช้สิทธิสมาชิก
                          </button>
                        </div>
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
                        <TransferBankBlock />
                        {canPay ? (
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
                              <p className="reg-field-error">{slip.message}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </section>
                    ) : null}

                    <section className="reg-section">
                      <h2 className="reg-section__title">ข้อมูลเพิ่มเติม</h2>
                      <p className="reg-section__hint">ไม่บังคับ — กรอกได้ถ้ามี</p>
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

                    <button
                      type="submit"
                      className="reg-btn reg-btn--primary"
                      disabled={
                        busy ||
                        liff.phase === "loading" ||
                        membersOnly ||
                        (fee > 0 && (!canPay || slip.kind !== "ready"))
                      }
                    >
                      {busy ? "กำลังส่ง…" : "ตรวจสอบก่อนส่ง"}
                    </button>
                    {fee > 0 && !canPay ? (
                      <p className="reg-submit-hint" role="status">
                        {NO_TRANSFER_ACCOUNT_SUBMIT_HINT}
                      </p>
                    ) : null}
                  </>
                )}
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
    case "already_registered":
      return "คุณสมัครสัมมนานี้ไว้แล้ว — ดูได้ที่แท็บ «ของฉัน»";
    case "invalid_phone":
      return "กรุณากรอกเบอร์โทรให้ครบ 10 หลัก เช่น 080-802-6677";
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
