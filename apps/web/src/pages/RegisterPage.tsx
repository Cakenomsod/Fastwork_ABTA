import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import {
  bindLegacyMember,
  fetchRegisterDraft,
  searchLegacyMembers,
  submitRegistration,
  type LegacyMatch,
  type RegisterDraft,
} from "../lib/api";
import { memberStatusHrefFromUrl } from "../lib/member-links";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import PhoneDigitInput, { isValidThaiMobile } from "./PhoneDigitInput";
import "./register.css";

const FEE_THB = 500;
const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

type RegMode = "new" | "legacy";

type FormState = {
  firstName: string;
  lastName: string;
  legalEntityName: string;
  phone: string;
  email: string;
  buildingName: string;
};

type SlipState =
  | { kind: "empty" }
  | { kind: "ready"; file: File; previewUrl: string }
  | { kind: "error"; message: string };

type SubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "done"; memberId: string; statusUrl: string; resubmitted: boolean }
  | { phase: "error"; code: string };

type DraftState =
  | { phase: "loading" }
  | { phase: "ready"; draft: RegisterDraft }
  | { phase: "blocked"; code: string; statusUrl?: string }
  | { phase: "error"; code: string };

type LegacyStep = 1 | 2 | 3;

type LegacySearchState =
  | { phase: "idle" }
  | { phase: "searching" }
  | { phase: "error"; code: string };

type LegacyBindState =
  | { phase: "idle" }
  | { phase: "binding" }
  | { phase: "done"; memberId: string; statusUrl: string; legacyMemberId: string }
  | { phase: "error"; code: string };

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  legalEntityName: "",
  phone: "0",
  email: "",
  buildingName: "",
};

function initialRegMode(): RegMode {
  if (typeof window === "undefined") return "new";
  const params = new URLSearchParams(window.location.search);
  return params.get("flow") === "legacy" ? "legacy" : "new";
}

function errorCopy(code: string): string {
  switch (code) {
    case "already_registered":
      return "บัญชี LINE นี้สมัครหรือผูกสมาชิกไว้แล้ว — พิมพ์ “เช็คสถานะ” ใน LINE OA เพื่อดูสถานะ";
    case "invalid_id_token":
      return "เซสชัน LINE หมดอายุ กรุณาปิดแล้วเปิดฟอร์มจาก LINE OA อีกครั้ง";
    case "invalid_slip_type":
      return "รองรับเฉพาะไฟล์ JPG หรือ PNG";
    case "slip_too_large":
      return "ขนาดสลิปเกิน 5 MB กรุณาเลือกรูปที่มีขนาดเล็กกว่า";
    case "required_fields_missing":
      return "กรุณากรอกชื่อ นามสกุล และเบอร์โทรศัพท์";
    case "invalid_phone":
      return "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก ให้ครบ (ขึ้นต้นด้วย 0)";
    case "slip_required":
      return "กรุณาแนบสลิปโอนเงิน";
    case "slip_upload_failed":
      return "อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่ หรือเลือกรูปขนาดเล็กลง";
    case "server_error":
    case "server_misconfigured":
      return "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง";
    default:
      return "ไม่สามารถส่งใบสมัครได้ กรุณาลองใหม่อีกครั้งภายหลัง";
  }
}

function legacyErrorCopy(code: string): string {
  switch (code) {
    case "legacy_not_found":
      return "ไม่พบข้อมูลสมาชิกเก่าในระบบ กรุณาตรวจสอบชื่อ–นามสกุลอีกครั้ง หรือสมัครสมาชิกใหม่";
    case "legacy_pending":
      return "สมาชิกรายนี้อยู่ระหว่างรออนุมัติจากสมาคม กรุณาติดต่อเจ้าหน้าที่";
    case "legacy_already_bound":
      return "สมาชิกรายนี้ถูกผูกกับ LINE แล้ว หากเป็นบัญชีของคุณ ให้พิมพ์ “เช็คสถานะ” ใน LINE OA";
    case "identity_mismatch":
      return "ข้อมูลยืนยันตัวตนไม่ตรงกับรายการที่เลือก กรุณาค้นหาใหม่";
    case "already_registered":
      return "บัญชี LINE นี้สมัครหรือผูกสมาชิกไว้แล้ว — พิมพ์ “เช็คสถานะ” ใน LINE OA เพื่อดูสถานะ";
    case "required_fields_missing":
      return "กรุณากรอกชื่อและนามสกุล";
    case "invalid_id_token":
      return "เซสชัน LINE หมดอายุ กรุณาปิดแล้วเปิดฟอร์มจาก LINE OA อีกครั้ง";
    case "server_error":
    case "server_misconfigured":
      return "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง";
    default:
      return "ไม่สามารถยืนยันสมาชิกเก่าได้ กรุณาลองใหม่อีกครั้งภายหลัง";
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatExpiry(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y + 543}`;
}

function LegacyMatchCard({
  match,
  selected,
  onSelect,
  name,
}: {
  match: LegacyMatch;
  selected: boolean;
  onSelect?: () => void;
  name?: string;
}) {
  const Tag = onSelect ? "label" : "div";
  return (
    <Tag
      className={`reg-legacy-match${selected ? " reg-legacy-match--selected" : ""}`}
    >
      {onSelect && (
        <input
          type="radio"
          name={name}
          checked={selected}
          onChange={onSelect}
          className="reg-legacy-match__radio"
        />
      )}
      <div className="reg-legacy-match__body">
        <p className="reg-legacy-match__name">{match.fullName}</p>
        {match.legalEntityName && (
          <p className="reg-legacy-match__meta">{match.legalEntityName}</p>
        )}
        {match.buildingName && (
          <p className="reg-legacy-match__meta">{match.buildingName}</p>
        )}
        <div className="reg-legacy-match__tags">
          <span className="reg-legacy-match__id">{match.legacyMemberId}</span>
          <span
            className={`reg-legacy-match__status reg-legacy-match__status--${match.status}`}
          >
            {match.statusLabel}
          </span>
          {match.memberTypeLabel && (
            <span className="reg-legacy-match__type">{match.memberTypeLabel}</span>
          )}
        </div>
        {match.expiryDate && (
          <p className="reg-legacy-match__expiry">
            หมดอายุ {formatExpiry(match.expiryDate)}
          </p>
        )}
      </div>
    </Tag>
  );
}

export default function RegisterPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [draftState, setDraftState] = useState<DraftState>({ phase: "loading" });
  const [regMode, setRegMode] = useState<RegMode>(initialRegMode);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slip, setSlip] = useState<SlipState>({ kind: "empty" });
  const [submit, setSubmit] = useState<SubmitState>({ phase: "idle" });

  const [legacyStep, setLegacyStep] = useState<LegacyStep>(1);
  const [legacySearch, setLegacySearch] = useState<LegacySearchState>({
    phase: "idle",
  });
  const [legacyMatches, setLegacyMatches] = useState<LegacyMatch[]>([]);
  const [selectedLegacyId, setSelectedLegacyId] = useState<string | null>(null);
  const [legacyBind, setLegacyBind] = useState<LegacyBindState>({ phase: "idle" });

  useEffect(() => {
    let active = true;
    initLiff().then((state) => {
      if (active) setLiff(state);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (liff.phase !== "ready" && liff.phase !== "dev") return;

    let active = true;
    (async () => {
      try {
        const idToken = await getIdToken();
        if (!idToken) {
          if (active) setDraftState({ phase: "error", code: "invalid_id_token" });
          return;
        }
        const draft = await fetchRegisterDraft(idToken);
        if (!active) return;
        if (draft.mode === "resubmit") {
          const phoneDigits = (draft.phone ?? "").replace(/\D/g, "");
          setForm({
            firstName: draft.firstName,
            lastName: draft.lastName,
            legalEntityName: draft.legalEntityName ?? "",
            phone: phoneDigits || "0",
            email: draft.email ?? "",
            buildingName: draft.buildingName ?? "",
          });
        }
        setDraftState({ phase: "ready", draft });
      } catch (err) {
        const code = (err as Error & { code?: string }).code ?? "unknown";
        if (!active) return;
        if (code === "already_registered") {
          const statusUrl = (err as Error & { statusUrl?: string }).statusUrl;
          setDraftState({ phase: "blocked", code, statusUrl });
        } else {
          setDraftState({ phase: "error", code });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [liff]);

  useEffect(() => {
    return () => {
      if (slip.kind === "ready") URL.revokeObjectURL(slip.previewUrl);
    };
  }, [slip]);

  function switchRegMode(mode: RegMode) {
    setRegMode(mode);
    setLegacyStep(1);
    setLegacySearch({ phase: "idle" });
    setLegacyMatches([]);
    setSelectedLegacyId(null);
    setLegacyBind({ phase: "idle" });
    setSubmit({ phase: "idle" });
  }

  function onField(key: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function onSlipChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setSlip({ kind: "error", message: "รองรับเฉพาะ JPG หรือ PNG" });
      return;
    }
    if (file.size > MAX_SLIP_BYTES) {
      setSlip({ kind: "error", message: "ไฟล์ใหญ่เกิน 5 MB" });
      return;
    }
    if (slip.kind === "ready") URL.revokeObjectURL(slip.previewUrl);
    setSlip({ kind: "ready", file, previewUrl: URL.createObjectURL(file) });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submit.phase === "submitting") return;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setSubmit({ phase: "error", code: "required_fields_missing" });
      return;
    }
    if (!isValidThaiMobile(form.phone)) {
      setSubmit({ phase: "error", code: "invalid_phone" });
      return;
    }
    if (slip.kind !== "ready") {
      setSubmit({ phase: "error", code: "slip_required" });
      return;
    }

    setSubmit({ phase: "submitting" });

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        setSubmit({ phase: "error", code: "invalid_id_token" });
        return;
      }

      const slipBase64 = await fileToBase64(slip.file);
      const result = await submitRegistration({
        idToken,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        legalEntityName: form.legalEntityName || undefined,
        buildingName: form.buildingName || undefined,
        slipContentType: slip.file.type,
        slipBase64,
      });

      setSubmit({
        phase: "done",
        memberId: result.memberId,
        statusUrl: result.statusUrl,
        resubmitted: result.resubmitted === true,
      });
    } catch (err) {
      const code = (err as Error & { code?: string }).code ?? "unknown";
      setSubmit({ phase: "error", code });
    }
  }

  async function onLegacySearch(e: FormEvent) {
    e.preventDefault();
    if (legacySearch.phase === "searching") return;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setLegacySearch({ phase: "error", code: "required_fields_missing" });
      return;
    }

    setLegacySearch({ phase: "searching" });
    setLegacyBind({ phase: "idle" });

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        setLegacySearch({ phase: "error", code: "invalid_id_token" });
        return;
      }

      const matches = await searchLegacyMembers({
        idToken,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        legalEntityName: form.legalEntityName.trim() || undefined,
        buildingName: form.buildingName.trim() || undefined,
      });

      setLegacyMatches(matches);
      if (matches.length === 1) {
        setSelectedLegacyId(matches[0]!.legacyMemberId);
      } else if (matches.length > 1) {
        setSelectedLegacyId(null);
      } else {
        setSelectedLegacyId(null);
      }
      setLegacyStep(2);
      setLegacySearch({ phase: "idle" });
    } catch (err) {
      const code = (err as Error & { code?: string }).code ?? "unknown";
      setLegacySearch({ phase: "error", code });
    }
  }

  function onLegacyProceedToConfirm() {
    if (!selectedLegacyId) return;
    setLegacyStep(3);
    setLegacyBind({ phase: "idle" });
  }

  async function onLegacyBindConfirm() {
    if (!selectedLegacyId || legacyBind.phase === "binding") return;

    setLegacyBind({ phase: "binding" });

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        setLegacyBind({ phase: "error", code: "invalid_id_token" });
        return;
      }

      const result = await bindLegacyMember({
        idToken,
        legacyMemberId: selectedLegacyId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        legalEntityName: form.legalEntityName.trim() || undefined,
        buildingName: form.buildingName.trim() || undefined,
      });

      setLegacyBind({
        phase: "done",
        memberId: result.memberId,
        statusUrl: result.statusUrl,
        legacyMemberId: result.legacyMemberId,
      });
    } catch (err) {
      const code = (err as Error & { code?: string }).code ?? "unknown";
      setLegacyBind({ phase: "error", code });
    }
  }

  const selectedMatch =
    legacyMatches.find((m) => m.legacyMemberId === selectedLegacyId) ?? null;

  if (liff.phase === "loading") {
    return (
      <div className="reg-shell">
        <div className="reg-atmosphere" aria-hidden />
        <main className="reg-wrap">
          <p className="reg-loading">กำลังเชื่อมต่อ LINE…</p>
        </main>
      </div>
    );
  }

  if (liff.phase === "error") {
    return (
      <div className="reg-shell">
        <div className="reg-atmosphere" aria-hidden />
        <main className="reg-wrap">
          <div className="reg-error">
            <div className="reg-error__badge">ABTA</div>
            <h1 className="reg-error__title">เปิดจาก LINE OA</h1>
            <p className="reg-error__detail">{liff.message}</p>
          </div>
        </main>
      </div>
    );
  }

  if (draftState.phase === "loading") {
    return (
      <div className="reg-shell">
        <div className="reg-atmosphere" aria-hidden />
        <main className="reg-wrap">
          <p className="reg-loading">กำลังโหลดฟอร์ม…</p>
        </main>
      </div>
    );
  }

  if (draftState.phase === "blocked" || draftState.phase === "error") {
    return (
      <div className="reg-shell">
        <div className="reg-atmosphere" aria-hidden />
        <main className="reg-wrap">
          <div className="reg-error">
            <div className="reg-error__badge">ABTA</div>
            <h1 className="reg-error__title">
              {draftState.code === "already_registered"
                ? "สมัครแล้ว"
                : "ไม่สามารถเปิดฟอร์มได้"}
            </h1>
            <p className="reg-error__detail">
              {draftState.code === "already_registered"
                ? legacyErrorCopy(draftState.code)
                : errorCopy(draftState.code)}
            </p>
            {draftState.phase === "blocked" &&
              draftState.code === "already_registered" &&
              (draftState.statusUrl ? (
                <a
                  className="reg-btn reg-btn--primary"
                  href={memberStatusHrefFromUrl(draftState.statusUrl)}
                >
                  เปิดหน้าสถานะ
                </a>
              ) : (
                <p className="reg-lead">พิมพ์ «เช็คสถานะ» ใน LINE OA เพื่อดูข้อมูลสมาชิก</p>
              ))}
          </div>
        </main>
      </div>
    );
  }

  if (submit.phase === "done") {
    return (
      <div className="reg-shell">
        <div className="reg-atmosphere" aria-hidden />
        <main className="reg-wrap">
          <section className="reg-success">
            <p className="reg-kicker">ABTA</p>
            <h1>{submit.resubmitted ? "รับข้อมูลที่แก้ไขแล้ว" : "รับใบสมัครแล้ว"}</h1>
            <p className="reg-success__id">{submit.memberId}</p>
            <p className="reg-lead">
              {submit.resubmitted
                ? "ส่งกลับเข้าคิวนายทะเบียนแล้ว · ใช้สิทธิ์สมาชิกชั่วคราวได้ตามเดิม"
                : "คุณเป็นสมาชิกชั่วคราวแล้ว ใช้สิทธิ์ได้ทันที · ใบเสร็จชั่วคราวจะออกหลังนายทะเบียนอนุมัติข้อมูล"}
            </p>
            <a
              className="reg-btn reg-btn--primary"
              href={memberStatusHrefFromUrl(submit.statusUrl)}
            >
              ดูสถานะสมาชิก
            </a>
            <p className="reg-foot">ตรวจสอบสถานะได้ทุกเมื่อด้วยคำว่า “เช็คสถานะ” ใน LINE OA</p>
          </section>
        </main>
      </div>
    );
  }

  if (legacyBind.phase === "done") {
    return (
      <div className="reg-shell reg-shell--legacy">
        <div className="reg-atmosphere" aria-hidden />
        <main className="reg-wrap">
          <section className="reg-success reg-success--legacy">
            <p className="reg-kicker reg-kicker--legacy">ยืนยันสมาชิกเก่า</p>
            <h1>ผูกบัญชี LINE สำเร็จ</h1>
            <p className="reg-success__id">{legacyBind.memberId}</p>
            <p className="reg-lead">
              เลขสมาชิกเก่า {legacyBind.legacyMemberId} · ใช้สิทธิ์สมาชิกได้ทันทีตามสถานะเดิม
            </p>
            <a
              className="reg-btn reg-btn--legacy"
              href={memberStatusHrefFromUrl(legacyBind.statusUrl)}
            >
              ดูสถานะสมาชิก
            </a>
            <p className="reg-foot">ตรวจสอบสถานะได้ทุกเมื่อด้วยคำว่า “เช็คสถานะ” ใน LINE OA</p>
          </section>
        </main>
      </div>
    );
  }

  const isResubmit =
    draftState.phase === "ready" && draftState.draft.mode === "resubmit";
  const rejectReason =
    isResubmit && draftState.draft.mode === "resubmit"
      ? draftState.draft.rejectReason
      : undefined;
  const displayName =
    liff.phase === "ready" || liff.phase === "dev" ? liff.displayName : undefined;

  return (
    <div className={`reg-shell${regMode === "legacy" ? " reg-shell--legacy" : ""}`}>
      <div className="reg-atmosphere" aria-hidden />
      <main className="reg-wrap">
        {!isResubmit && (
          <nav className="reg-mode-tabs" aria-label="เลือกประเภทการสมัคร">
            <button
              type="button"
              className={`reg-mode-tab${regMode === "new" ? " reg-mode-tab--active" : ""}`}
              onClick={() => switchRegMode("new")}
            >
              สมัครสมาชิกใหม่
            </button>
            <button
              type="button"
              className={`reg-mode-tab reg-mode-tab--legacy${regMode === "legacy" ? " reg-mode-tab--active" : ""}`}
              onClick={() => switchRegMode("legacy")}
            >
              ยืนยันสมาชิกเก่า
            </button>
          </nav>
        )}

        {regMode === "legacy" && !isResubmit ? (
          <>
            <header className="reg-hero reg-hero--legacy">
              <p className="reg-kicker reg-kicker--legacy">ยืนยันตัวตน</p>
              <h1>ยืนยันสมาชิกเก่า</h1>
              <p className="reg-lead">
                กรอกชื่อตามข้อมูลเดิมในระบบสมาคม · ไม่ต้องแนบสลิป
              </p>
              {displayName && (
                <p className="reg-user">เข้าสู่ระบบเป็น {displayName}</p>
              )}
            </header>

            <ol className="reg-steps" aria-label="ขั้นตอน">
              <li
                className={`reg-step${legacyStep >= 1 ? " reg-step--active" : ""}${legacyStep > 1 ? " reg-step--done" : ""}`}
              >
                <span className="reg-step__num">1</span>
                <span className="reg-step__label">กรอกข้อมูล</span>
              </li>
              <li
                className={`reg-step${legacyStep >= 2 ? " reg-step--active" : ""}${legacyStep > 2 ? " reg-step--done" : ""}`}
              >
                <span className="reg-step__num">2</span>
                <span className="reg-step__label">เลือกรายการ</span>
              </li>
              <li className={`reg-step${legacyStep >= 3 ? " reg-step--active" : ""}`}>
                <span className="reg-step__num">3</span>
                <span className="reg-step__label">ยืนยัน</span>
              </li>
            </ol>

            {legacyStep === 1 && (
              <form className="reg-form reg-form--legacy" onSubmit={onLegacySearch} noValidate>
                <section className="reg-section">
                  <h2 className="reg-section__title reg-section__title--legacy">
                    ข้อมูลตามทะเบียนเดิม
                  </h2>
                  <div className="reg-row">
                    <label className="reg-field">
                      <span>
                        ชื่อ <em className="req">*</em>
                      </span>
                      <input
                        name="legacyFirstName"
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={onField("firstName")}
                        required
                      />
                    </label>
                    <label className="reg-field">
                      <span>
                        นามสกุล <em className="req">*</em>
                      </span>
                      <input
                        name="legacyLastName"
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={onField("lastName")}
                        required
                      />
                    </label>
                  </div>
                  <label className="reg-field">
                    <span>ชื่อนิติบุคคล</span>
                    <input
                      name="legacyLegalEntity"
                      value={form.legalEntityName}
                      onChange={onField("legalEntityName")}
                    />
                  </label>
                  <label className="reg-field">
                    <span>ชื่อตึก / หน่วยงาน</span>
                    <input
                      name="legacyBuilding"
                      value={form.buildingName}
                      onChange={onField("buildingName")}
                    />
                  </label>
                  <div className="reg-field">
                    <span id="legacy-phone-label">เบอร์โทรศัพท์</span>
                    <PhoneDigitInput
                      id="legacy-phone"
                      value={form.phone}
                      onChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
                    />
                    <small className="reg-field-hint">ไม่บังคับ · ใช้ช่วยตรวจสอบเท่านั้น</small>
                  </div>
                </section>

                <div className="reg-legacy-info">
                  ระบบจะค้นหาจากชื่อ นามสกุล ชื่อนิติบุคคล และชื่อตึกตามข้อมูลเดิม
                </div>

                {(legacySearch.phase === "error" || legacyBind.phase === "error") && (
                  <p className="reg-form-error" role="alert">
                    {legacyErrorCopy(
                      legacySearch.phase === "error"
                        ? legacySearch.code
                        : legacyBind.phase === "error"
                          ? legacyBind.code
                          : "unknown",
                    )}
                    {((legacySearch.phase === "error" &&
                      legacySearch.code === "already_registered") ||
                      (legacyBind.phase === "error" &&
                        legacyBind.code === "already_registered")) && (
                      <> พิมพ์ «เช็คสถานะ» ใน LINE OA</>
                    )}
                  </p>
                )}

                <button
                  type="submit"
                  className="reg-btn reg-btn--legacy"
                  disabled={legacySearch.phase === "searching"}
                >
                  {legacySearch.phase === "searching" ? "กำลังค้นหา…" : "ค้นหาข้อมูลสมาชิก"}
                </button>
              </form>
            )}

            {legacyStep === 2 && (
              <section className="reg-form reg-form--legacy">
                <h2 className="reg-section__title reg-section__title--legacy">
                  {legacyMatches.length === 0
                    ? "ไม่พบข้อมูลที่ตรงกัน"
                    : legacyMatches.length === 1
                      ? "พบข้อมูล 1 รายการ"
                      : `พบข้อมูล ${legacyMatches.length} รายการ`}
                </h2>

                {legacyMatches.length === 0 ? (
                  <div className="reg-legacy-empty">
                    <p>
                      ไม่พบสมาชิกที่ตรงกับข้อมูลที่กรอก หากยังไม่เคยเป็นสมาชิก หรือข้อมูลไม่ตรง
                      กรุณาสมัครสมาชิกใหม่
                    </p>
                    <button
                      type="button"
                      className="reg-btn reg-btn--legacy"
                      onClick={() => switchRegMode("new")}
                    >
                      ไปสมัครสมาชิกใหม่
                    </button>
                    <button
                      type="button"
                      className="reg-btn reg-btn--ghost reg-btn--ghost-light"
                      onClick={() => {
                        setLegacyStep(1);
                        setLegacyMatches([]);
                      }}
                    >
                      แก้ไขข้อมูลแล้วค้นหาใหม่
                    </button>
                  </div>
                ) : legacyMatches.length === 1 ? (
                  <>
                    <LegacyMatchCard match={legacyMatches[0]!} selected />
                    <div className="reg-legacy-actions">
                      <button
                        type="button"
                        className="reg-btn reg-btn--legacy"
                        onClick={onLegacyProceedToConfirm}
                      >
                        ยืนยันรายการนี้
                      </button>
                      <button
                        type="button"
                        className="reg-btn reg-btn--ghost reg-btn--ghost-light"
                        onClick={() => setLegacyStep(1)}
                      >
                        แก้ไขข้อมูล
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <fieldset className="reg-legacy-list">
                      <legend className="sr-only">เลือกรายการสมาชิก</legend>
                      {legacyMatches.map((match) => (
                        <LegacyMatchCard
                          key={match.legacyMemberId}
                          match={match}
                          name="legacyMatch"
                          selected={selectedLegacyId === match.legacyMemberId}
                          onSelect={() => setSelectedLegacyId(match.legacyMemberId)}
                        />
                      ))}
                    </fieldset>
                    <div className="reg-legacy-actions">
                      <button
                        type="button"
                        className="reg-btn reg-btn--legacy"
                        disabled={!selectedLegacyId}
                        onClick={onLegacyProceedToConfirm}
                      >
                        ดำเนินการต่อ
                      </button>
                      <button
                        type="button"
                        className="reg-btn reg-btn--ghost reg-btn--ghost-light"
                        onClick={() => setLegacyStep(1)}
                      >
                        แก้ไขข้อมูล
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}

            {legacyStep === 3 && selectedMatch && (
              <section className="reg-form reg-form--legacy">
                <div className="reg-confirm">
                  <h2 className="reg-confirm__title">ยืนยันการผูกบัญชี LINE</h2>
                  <p className="reg-confirm__lead">
                    คุณกำลังจะผูกบัญชี LINE นี้กับข้อมูลสมาชิกเดิม
                  </p>
                  <LegacyMatchCard match={selectedMatch} selected />
                  <p className="reg-confirm__warn">
                    หลังยืนยัน จะได้รับ Member ID ใหม่และใช้สิทธิ์สมาชิกตามสถานะเดิมทันที
                  </p>

                  {legacyBind.phase === "error" && (
                    <p className="reg-form-error" role="alert">
                      {legacyErrorCopy(legacyBind.code)}
                      {legacyBind.code === "already_registered" && (
                        <> พิมพ์ «เช็คสถานะ» ใน LINE OA</>
                      )}
                    </p>
                  )}

                  <div className="reg-confirm__actions">
                    <button
                      type="button"
                      className="reg-btn reg-btn--legacy"
                      disabled={legacyBind.phase === "binding"}
                      onClick={onLegacyBindConfirm}
                    >
                      {legacyBind.phase === "binding" ? "กำลังผูกบัญชี…" : "ยืนยันและผูก LINE"}
                    </button>
                    <button
                      type="button"
                      className="reg-btn reg-btn--ghost reg-btn--ghost-light"
                      disabled={legacyBind.phase === "binding"}
                      onClick={() => setLegacyStep(2)}
                    >
                      กลับไปเลือกใหม่
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <header className="reg-hero">
              <p className="reg-kicker">{isResubmit ? "แก้ไขแล้วส่งใหม่" : "ขั้นตอนเดียว"}</p>
              <h1>{isResubmit ? "แก้ไขข้อมูลสมาชิก" : "สมัครสมาชิกใหม่"}</h1>
              <p className="reg-lead">
                {isResubmit
                  ? "ตรวจทานข้อมูล แนบสลิปใหม่ แล้วส่งกลับให้นายทะเบียนตรวจ"
                  : "กรอกข้อมูลและแนบสลิปโอนเงินในครั้งเดียว"}
              </p>
              {displayName && (
                <p className="reg-user">เข้าสู่ระบบเป็น {displayName}</p>
              )}
            </header>

            {isResubmit && rejectReason ? (
              <div className="reg-warn" role="status">
                เหตุผลที่ไม่ผ่าน: {rejectReason}
              </div>
            ) : (
              !isResubmit && (
                <div className="reg-info">
                  <p>
                    หากเคยเป็นสมาชิกแล้วแต่ยังไม่ได้ผูก LINE ให้เลือกแท็บ
                    “ยืนยันสมาชิกเก่า” ด้านบน
                  </p>
                </div>
              )
            )}

            <form className="reg-form" onSubmit={onSubmit} noValidate>
              <section className="reg-section">
                <h2 className="reg-section__title">ข้อมูลส่วนตัว</h2>
                <div className="reg-row">
                  <label className="reg-field">
                    <span>
                      ชื่อ <em className="req">*</em>
                    </span>
                    <input
                      name="firstName"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={onField("firstName")}
                      required
                    />
                  </label>
                  <label className="reg-field">
                    <span>
                      นามสกุล <em className="req">*</em>
                    </span>
                    <input
                      name="lastName"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={onField("lastName")}
                      required
                    />
                  </label>
                </div>
                <label className="reg-field">
                  <span>ชื่อนิติบุคคล</span>
                  <input
                    name="legalEntityName"
                    value={form.legalEntityName}
                    onChange={onField("legalEntityName")}
                  />
                </label>
                <div className="reg-field">
                  <span id="reg-phone-label">
                    เบอร์โทรศัพท์ <em className="req">*</em>
                  </span>
                  <PhoneDigitInput
                    id="reg-phone"
                    value={form.phone}
                    onChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
                    aria-invalid={submit.phase === "error" && submit.code === "invalid_phone"}
                  />
                </div>
                <label className="reg-field">
                  <span>อีเมล</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={onField("email")}
                  />
                </label>
                <label className="reg-field">
                  <span>ชื่อตึก / หน่วยงาน</span>
                  <input
                    name="buildingName"
                    value={form.buildingName}
                    onChange={onField("buildingName")}
                  />
                </label>
              </section>

              <section className="reg-section">
                <h2 className="reg-section__title">หลักฐานการชำระเงิน</h2>
                <div className="reg-fee">
                  <span>ค่าธรรมเนียมสมาชิก</span>
                  <strong>{FEE_THB.toLocaleString("th-TH")} บาท</strong>
                </div>
                <div className="reg-bank">
                  <span className="reg-bank__label">บัญชีรับโอน</span>
                  <p>รอข้อมูลจากสมาคม</p>
                  <small>จะแสดงชื่อบัญชี เลขบัญชี และธนาคารเมื่อสมาคมยืนยันแล้ว</small>
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
                        <img src={slip.previewUrl} alt="ตัวอย่างสลิป" />
                        <span className="reg-upload__name">{slip.file.name}</span>
                      </>
                    ) : (
                      <>
                        <strong>
                          {isResubmit ? "แตะเพื่ออัปโหลดสลิปใหม่" : "แตะเพื่ออัปโหลดสลิป"}
                        </strong>
                        <small>รองรับ JPG, PNG · สูงสุด 5 MB</small>
                      </>
                    )}
                  </label>
                  {slip.kind === "error" && (
                    <p className="reg-field-error">{slip.message}</p>
                  )}
                </div>
              </section>

              <div className="reg-warn">
                {isResubmit
                  ? "หลังส่ง นายทะเบียนจะตรวจข้อมูลใหม่อีกครั้ง · เลขสมาชิกชั่วคราวเดิมยังใช้ได้"
                  : "หลังส่ง จะได้รับ Member ID ชั่วคราวทันที — ใช้สิทธิ์ครบ · ใบเสร็จชั่วคราวออกหลังนายทะเบียนอนุมัติข้อมูล"}
              </div>

              {submit.phase === "error" && (
                <p className="reg-form-error" role="alert">
                  {errorCopy(submit.code)}
                  {submit.code === "already_registered" && (
                    <> พิมพ์ «เช็คสถานะ» ใน LINE OA</>
                  )}
                </p>
              )}

              <button
                type="submit"
                className="reg-btn reg-btn--primary"
                disabled={submit.phase === "submitting"}
              >
                {submit.phase === "submitting"
                  ? "กำลังส่ง…"
                  : isResubmit
                    ? "ส่งข้อมูลใหม่"
                    : "ส่งใบสมัคร"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
