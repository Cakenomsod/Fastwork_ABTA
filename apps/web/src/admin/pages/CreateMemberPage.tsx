import { useId, useState, type FormEvent } from "react";
import {
  createAdminMember,
  type AdminMe,
} from "../../lib/admin-api";

const ERROR_LABEL: Record<string, string> = {
  required_fields_missing: "ต้องมีชื่อและนามสกุล",
  invalid_phone: "เบอร์โทรต้องเป็น 10 หลัก ขึ้นต้นด้วย 0",
  invalid_expiry_date: "วันหมดอายุไม่ถูกต้อง",
  tag_too_long: "แท็กยาวเกิน 40 ตัวอักษร",
  create_failed: "สร้างสมาชิกไม่สำเร็จ — ลองอีกครั้ง",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  forbidden_role: "ไม่มีสิทธิ์สร้างสมาชิกจากหลังบ้าน",
};

const MEMBER_TYPES: Array<{ value: string; label: string }> = [
  { value: "ordinary", label: "สามัญ" },
  { value: "extraordinary", label: "วิสามัญ" },
  { value: "associate", label: "สมทบ" },
  { value: "honorary", label: "กิตติมาศักดิ์" },
];

function defaultExpiry(): string {
  const y = new Date().getFullYear();
  return `${y}-12-31`;
}

function emptyForm() {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    legalEntityName: "",
    buildingName: "",
    organization: "",
    memberType: "ordinary",
    expiryDate: defaultExpiry(),
    isBoardMember: false,
    tagsText: "",
  };
}

export default function CreateMemberPage(_props: { me: AdminMe }) {
  const formId = useId();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function setField<K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setCreatedId(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreatedId(null);
    try {
      const tags = form.tagsText
        .split(/[,，\n]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const result = await createAdminMember({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        legalEntityName: form.legalEntityName || undefined,
        buildingName: form.buildingName || undefined,
        organization: form.organization || undefined,
        memberType: form.memberType,
        expiryDate: form.expiryDate || undefined,
        isBoardMember: form.isBoardMember,
        tags,
      });
      setCreatedId(result.memberId);
      setForm(emptyForm());
    } catch (err) {
      const code = err instanceof Error ? err.message : "create_failed";
      setError(ERROR_LABEL[code] ?? code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-create-member">
      <form className="bo-panel" onSubmit={(e) => void onSubmit(e)}>
        <div className="bo-panel-head bo-create-member__head">
          <h2>สร้างสมาชิกจากหลังบ้าน</h2>
          <p>
            กรอกข้อมูลแทนสมาชิกที่ไม่สมัครผ่าน LINE — ระบบออกเลขสมาชิกถาวร
            และตั้งสถานะเป็นสมาชิกสมบูรณ์ทันที ไม่ต้องรอคิวตรวจ
          </p>
        </div>

        <div className="bo-create-member__body">
          {error ? (
            <p className="bo-error" role="alert">
              {error}
            </p>
          ) : null}
          {createdId ? (
            <p className="bo-create-member__success" role="status">
              สร้างสมาชิกแล้ว — เลขที่{" "}
              <code>{createdId}</code>
              {" · "}ค้นหาได้จากหน้าค้นหาสมาชิก
            </p>
          ) : null}

          <div className="bo-create-member__grid">
            <label className="bo-field" htmlFor={`${formId}-first`}>
              <span>ชื่อ</span>
              <input
                id={`${formId}-first`}
                value={form.firstName}
                disabled={busy}
                required
                autoComplete="off"
                onChange={(e) => setField("firstName", e.target.value)}
              />
            </label>
            <label className="bo-field" htmlFor={`${formId}-last`}>
              <span>นามสกุล</span>
              <input
                id={`${formId}-last`}
                value={form.lastName}
                disabled={busy}
                required
                autoComplete="off"
                onChange={(e) => setField("lastName", e.target.value)}
              />
            </label>
            <label className="bo-field" htmlFor={`${formId}-phone`}>
              <span>เบอร์โทร</span>
              <input
                id={`${formId}-phone`}
                type="tel"
                inputMode="tel"
                value={form.phone}
                disabled={busy}
                placeholder="0812345678"
                autoComplete="off"
                onChange={(e) => setField("phone", e.target.value)}
              />
            </label>
            <label className="bo-field" htmlFor={`${formId}-email`}>
              <span>อีเมล</span>
              <input
                id={`${formId}-email`}
                type="email"
                value={form.email}
                disabled={busy}
                autoComplete="off"
                onChange={(e) => setField("email", e.target.value)}
              />
            </label>
            <label className="bo-field" htmlFor={`${formId}-legal`}>
              <span>นิติบุคคล</span>
              <input
                id={`${formId}-legal`}
                value={form.legalEntityName}
                disabled={busy}
                autoComplete="off"
                onChange={(e) => setField("legalEntityName", e.target.value)}
              />
            </label>
            <label className="bo-field" htmlFor={`${formId}-building`}>
              <span>ชื่อตึก</span>
              <input
                id={`${formId}-building`}
                value={form.buildingName}
                disabled={busy}
                autoComplete="off"
                onChange={(e) => setField("buildingName", e.target.value)}
              />
            </label>
            <label className="bo-field" htmlFor={`${formId}-org`}>
              <span>หน่วยงาน</span>
              <input
                id={`${formId}-org`}
                value={form.organization}
                disabled={busy}
                autoComplete="off"
                onChange={(e) => setField("organization", e.target.value)}
              />
            </label>
            <label className="bo-field" htmlFor={`${formId}-type`}>
              <span>ประเภทสมาชิก</span>
              <select
                id={`${formId}-type`}
                value={form.memberType}
                disabled={busy}
                onChange={(e) => setField("memberType", e.target.value)}
              >
                {MEMBER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="bo-field" htmlFor={`${formId}-expiry`}>
              <span>วันหมดอายุ</span>
              <input
                id={`${formId}-expiry`}
                type="date"
                value={form.expiryDate}
                disabled={busy}
                onChange={(e) => setField("expiryDate", e.target.value)}
              />
            </label>
            <label className="bo-field" htmlFor={`${formId}-tags`}>
              <span>แท็ก (คั่นด้วยจุลภาค)</span>
              <input
                id={`${formId}-tags`}
                value={form.tagsText}
                disabled={busy}
                placeholder="เช่น agm2026, bangkok"
                autoComplete="off"
                onChange={(e) => setField("tagsText", e.target.value)}
              />
            </label>
          </div>

          <label className="bo-create-member__board">
            <input
              type="checkbox"
              checked={form.isBoardMember}
              disabled={busy}
              onChange={(e) => setField("isBoardMember", e.target.checked)}
            />
            เป็นกรรมการ
          </label>

          <div className="bo-create-member__actions">
            <button
              type="submit"
              className="bo-btn bo-btn-primary"
              disabled={busy}
            >
              {busy ? "กำลังบันทึก…" : "สร้างสมาชิก"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
