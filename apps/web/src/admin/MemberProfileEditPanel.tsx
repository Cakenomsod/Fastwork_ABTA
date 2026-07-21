import { useState } from "react";
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

export interface MemberProfileEditPanelProps {
  detail: MemberDetail;
  me: AdminMe;
  onUpdated: (member: MemberDetail) => void;
}

export function MemberProfileEditPanel(props: MemberProfileEditPanelProps) {
  const canEdit = canEditMemberProfile(props.me);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: props.detail.firstName ?? "",
    lastName: props.detail.lastName ?? "",
    phone: props.detail.phone ?? "",
    email: props.detail.email ?? "",
    legalEntityName: props.detail.legalEntityName ?? "",
    buildingName: props.detail.buildingName ?? "",
    organization: props.detail.organization ?? "",
    expiryDate: props.detail.expiryDate?.slice(0, 10) ?? "",
  });

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
    <section className="bo-panel" style={{ marginTop: "1rem" }}>
      <div className="bo-panel-head">
        <h3 style={{ margin: 0, fontSize: "1rem" }}>แก้ไขข้อมูลสมาชิก</h3>
        {!editing ? (
          <button
            type="button"
            className="bo-btn bo-btn-ghost"
            onClick={() => {
              setForm({
                firstName: props.detail.firstName ?? "",
                lastName: props.detail.lastName ?? "",
                phone: props.detail.phone ?? "",
                email: props.detail.email ?? "",
                legalEntityName: props.detail.legalEntityName ?? "",
                buildingName: props.detail.buildingName ?? "",
                organization: props.detail.organization ?? "",
                expiryDate: props.detail.expiryDate?.slice(0, 10) ?? "",
              });
              setEditing(true);
              setError(null);
            }}
          >
            แก้ไข
          </button>
        ) : null}
      </div>

      {error ? <div className="bo-error">{error}</div> : null}

      {editing ? (
        <div
          style={{
            display: "grid",
            gap: "0.65rem",
            padding: "0.75rem 1rem 1rem",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          {(
            [
              ["firstName", "ชื่อ"],
              ["lastName", "นามสกุล"],
              ["phone", "โทร"],
              ["email", "อีเมล"],
              ["legalEntityName", "นิติบุคคล"],
              ["buildingName", "ชื่อตึก"],
              ["organization", "หน่วยงาน"],
              ["expiryDate", "วันหมดอายุ"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type={key === "expiryDate" ? "date" : "text"}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                style={{ width: "100%", display: "block", marginTop: 4 }}
              />
            </label>
          ))}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="bo-btn bo-btn-primary"
              disabled={busy}
              onClick={() => void onSave()}
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            padding: "0 1rem 1rem",
            color: "var(--bo-muted)",
            fontSize: "0.9rem",
          }}
        >
          แก้ชื่อ ติดต่อ หน่วยงาน และวันหมดอายุได้จากปุ่มแก้ไข
        </p>
      )}
    </section>
  );
}

export default MemberProfileEditPanel;
