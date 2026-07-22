import { useEffect, useId, useState } from "react";
import {
  canEditMemberProfile,
  updateMemberProfile,
  type AdminMe,
  type MemberDetail,
} from "../lib/admin-api";

const ERROR_LABEL: Record<string, string> = {
  required_fields_missing: "ต้องมีชื่อและนามสกุล",
  invalid_expiry_date: "วันหมดอายุไม่ถูกต้อง",
  nothing_to_update: "ยังไม่ได้แก้ไขข้อมูล",
  not_found: "ไม่พบสมาชิก",
  forbidden_role: "ไม่มีสิทธิ์แก้ไขโปรไฟล์",
};

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  legalEntityName: string;
  buildingName: string;
  organization: string;
  expiryDate: string;
  isBoardMember: boolean;
};

function formFromDetail(detail: MemberDetail): ProfileForm {
  return {
    firstName: detail.firstName ?? "",
    lastName: detail.lastName ?? "",
    phone: detail.phone ?? "",
    email: detail.email ?? "",
    legalEntityName: detail.legalEntityName ?? "",
    buildingName: detail.buildingName ?? "",
    organization: detail.organization ?? "",
    expiryDate: detail.expiryDate?.slice(0, 10) ?? "",
    isBoardMember: Boolean(detail.isBoardMember),
  };
}

const FIELDS: ReadonlyArray<{
  key: Exclude<keyof ProfileForm, "isBoardMember">;
  label: string;
  type?: "text" | "email" | "tel" | "date";
}> = [
  { key: "firstName", label: "ชื่อ" },
  { key: "lastName", label: "นามสกุล" },
  { key: "phone", label: "โทร", type: "tel" },
  { key: "email", label: "อีเมล", type: "email" },
  { key: "legalEntityName", label: "นิติบุคคล" },
  { key: "buildingName", label: "ชื่อตึก" },
  { key: "organization", label: "หน่วยงาน" },
  { key: "expiryDate", label: "วันหมดอายุ", type: "date" },
];

export interface MemberProfileEditPanelProps {
  detail: MemberDetail;
  me: AdminMe;
  onUpdated: (member: MemberDetail) => void;
}

export function MemberProfileEditPanel(props: MemberProfileEditPanelProps) {
  const canEdit = canEditMemberProfile(props.me);
  const formId = useId();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(() =>
    formFromDetail(props.detail),
  );

  useEffect(() => {
    setForm(formFromDetail(props.detail));
    setEditing(false);
    setError(null);
  }, [props.detail.memberId]);

  if (!canEdit) return null;

  async function onSave() {
    setBusy(true);
    setError(null);
    try {
      const updated = await updateMemberProfile({
        memberId: props.detail.memberId,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        legalEntityName: form.legalEntityName || undefined,
        buildingName: form.buildingName || undefined,
        organization: form.organization || undefined,
        expiryDate: form.expiryDate || undefined,
        isBoardMember: form.isBoardMember,
      });
      props.onUpdated(updated);
      setEditing(false);
    } catch (err) {
      const code = err instanceof Error ? err.message : "update_failed";
      setError(ERROR_LABEL[code] ?? code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bo-panel-nested bo-profile-edit">
      <div className="bo-panel-head bo-profile-edit__head">
        <div className="bo-profile-edit__titles">
          <h2>แก้ไขข้อมูลสมาชิก</h2>
          {!editing ? (
            <p className="bo-profile-edit__lead">
              แก้ชื่อ ติดต่อ หน่วยงาน และวันหมดอายุได้จากปุ่มแก้ไข
            </p>
          ) : null}
        </div>
        {!editing ? (
          <button
            type="button"
            className="bo-btn bo-btn-ghost bo-btn-sm bo-profile-edit__trigger"
            onClick={() => {
              setForm(formFromDetail(props.detail));
              setEditing(true);
              setError(null);
            }}
          >
            แก้ไข
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="bo-error bo-profile-edit__error">{error}</div>
      ) : null}

      {editing ? (
        <div className="bo-profile-edit__body">
          <div className="bo-profile-edit__grid">
            {FIELDS.map((field) => {
              const inputId = `${formId}-${field.key}`;
              return (
                <div key={field.key} className="bo-field">
                  <label htmlFor={inputId}>{field.label}</label>
                  <input
                    id={inputId}
                    type={field.type ?? "text"}
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.key]: e.target.value }))
                    }
                    autoComplete="off"
                  />
                </div>
              );
            })}
            <label className="bo-check bo-profile-edit__board">
              <input
                type="checkbox"
                checked={form.isBoardMember}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isBoardMember: e.target.checked }))
                }
              />
              กรรมการสมาคม
            </label>
          </div>
          <div className="bo-profile-edit__actions">
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setError(null);
                setForm(formFromDetail(props.detail));
              }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-primary"
              disabled={busy}
              onClick={() => void onSave()}
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default MemberProfileEditPanel;
