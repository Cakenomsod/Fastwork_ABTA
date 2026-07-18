import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import {
  fetchRegisterDraft,
  submitRegistration,
  type RegisterDraft,
} from "../lib/api";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import PhoneDigitInput, { isValidThaiMobile } from "./PhoneDigitInput";
import "./register.css";

const FEE_THB = 500;
const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

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
  | { phase: "blocked"; code: string }
  | { phase: "error"; code: string };

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  legalEntityName: "",
  phone: "0",
  email: "",
  buildingName: "",
};

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

export default function RegisterPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [draftState, setDraftState] = useState<DraftState>({ phase: "loading" });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slip, setSlip] = useState<SlipState>({ kind: "empty" });
  const [submit, setSubmit] = useState<SubmitState>({ phase: "idle" });
  const [legacyNote, setLegacyNote] = useState(false);

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
          setDraftState({ phase: "blocked", code });
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
            <p className="reg-error__detail">{errorCopy(draftState.code)}</p>
            {draftState.code === "already_registered" && (
              <a className="reg-btn reg-btn--primary" href="/status">
                เปิดหน้าสถานะ
              </a>
            )}
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
            <a className="reg-btn reg-btn--primary" href={submit.statusUrl}>
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
    <div className="reg-shell">
      <div className="reg-atmosphere" aria-hidden />
      <main className="reg-wrap">
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
          <div className="reg-info">
            <p>
              หากเคยเป็นสมาชิกแล้วแต่ยังไม่ได้ผูก LINE ให้ใช้ปุ่มยืนยันสมาชิกเก่าด้านล่าง
            </p>
          </div>
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
                <>
                  {" "}
                  <a href="/status">เปิดหน้าสถานะ</a>
                </>
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

        {!isResubmit && (
          <div className="reg-legacy">
            <button
              type="button"
              className="reg-btn reg-btn--ghost"
              onClick={() => setLegacyNote(true)}
            >
              ยืนยันสมาชิกเก่า
            </button>
            {legacyNote && (
              <p className="reg-legacy__note">
                ฟีเจอร์ยืนยันสมาชิกเก่ากำลังพัฒนา — หากเคยเป็นสมาชิกแล้ว กรุณาติดต่อเจ้าหน้าที่สมาคมชั่วคราว
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
