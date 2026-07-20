import { useEffect, useMemo, useState } from "react";
import {
  canEditMemberProfile,
  updateMemberProfile,
  type AdminMe,
  type MemberDetail,
} from "../lib/admin-api";
import { ConfirmDialog } from "./ConfirmDialog";

const ERROR_LABEL: Record<string, string> = {
  required_fields_missing: "ชื่อและนามสกุลต้องไม่ว่าง",
  invalid_expiry_date: "วันหมดอายุไม่ถูกต้อง",
  nothing_to_update: "ไม่มีค่าที่เปลี่ยน",
  not_found: "ไม่พบสมาชิก",
  forbidden_role: "บทบาทของคุณไม่มีสิทธิ์แก้ไข",
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatDateLabel(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("th-TH", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

export interface MemberProfileEditorProps {
  detail: MemberDetail;
  me: AdminMe;
  onSaved: (member: MemberDetail) => void;
}

export function MemberProfileEditor(props: MemberProfileEditorProps) {
  const canEdit = canEditMemberProfile(props.me);
  const fallback = splitName(props.detail.fullName);
  const [firstName, setFirstName] = useState(
    props.detail.firstName ?? fallback.firstName,
  );
  const [lastName, setLastName] = useState(
    props.detail.lastName ?? fallback.lastName,
  );
  const [phone, setPhone] = useState(props.detail.phone ?? "");
  const [email, setEmail] = useState(props.detail.email ?? "");
  const [legalEntityName, setLegalEntityName] = useState(
    props.detail.legalEntityName ?? "",
  );
  const [buildingName, setBuildingName] = useState(
    props.detail.buildingName ?? "",
  );
  const [organization, setOrganization] = useState(
    props.detail.organization ?? "",
  );
  const [expiryDate, setExpiryDate] = useState(
    toDateInputValue(props.detail.expiryDate),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const fb = splitName(props.detail.fullName);
    setFirstName(props.detail.firstName ?? fb.firstName);
    setLastName(props.detail.lastName ?? fb.lastName);
    setPhone(props.detail.phone ?? "");
    setEmail(props.detail.email ?? "");
    setLegalEntityName(props.detail.legalEntityName ?? "");
    setBuildingName(props.detail.buildingName ?? "");
    setOrganization(props.detail.organization ?? "");
    setExpiryDate(toDateInputValue(props.detail.expiryDate));
    setError(null);
    setOkMsg(null);
  }, [props.detail]);

  const dirty = useMemo(() => {
    const fb = splitName(props.detail.fullName);
    const baseFirst = props.detail.firstName ?? fb.firstName;
    const baseLast = props.detail.lastName ?? fb.lastName;
    return (
      firstName.trim() !== baseFirst.trim() ||
      lastName.trim() !== baseLast.trim() ||
      phone.trim() !== (props.detail.phone ?? "").trim() ||
      email.trim() !== (props.detail.email ?? "").trim() ||
      legalEntityName.trim() !== (props.detail.legalEntityName ?? "").trim() ||
      buildingName.trim() !== (props.detail.buildingName ?? "").trim() ||
      organization.trim() !== (props.detail.organization ?? "").trim() ||
      expiryDate !== toDateInputValue(props.detail.expiryDate)
    );
  }, [
    firstName,
    lastName,
    phone,
    email,
    legalEntityName,
    buildingName,
    organization,
    expiryDate,
    props.detail,
  ]);

  const changeSummary = useMemo(() => {
    const fb = splitName(props.detail.fullName);
    const baseFirst = props.detail.firstName ?? fb.firstName;
    const baseLast = props.detail.lastName ?? fb.lastName;
    const lines: string[] = [];
    if (firstName.trim() !== baseFirst.trim()) {
      lines.push(`ชื่อ: ${baseFirst || "—"} → ${firstName.trim()}`);
    }
    if (lastName.trim() !== baseLast.trim()) {
      lines.push(`นามสกุล: ${baseLast || "—"} → ${lastName.trim()}`);
    }
    if (phone.trim() !== (props.detail.phone ?? "").trim()) {
      lines.push(`เบอร์โทร: ${props.detail.phone || "—"} → ${phone.trim() || "—"}`);
    }
    if (email.trim() !== (props.detail.email ?? "").trim()) {
      lines.push(`อีเมล: ${props.detail.email || "—"} → ${email.trim() || "—"}`);
    }
    if (legalEntityName.trim() !== (props.detail.legalEntityName ?? "").trim()) {
      lines.push(
        `นิติบุคคล: ${props.detail.legalEntityName || "—"} → ${legalEntityName.trim() || "—"}`,
      );
    }
    if (buildingName.trim() !== (props.detail.buildingName ?? "").trim()) {
      lines.push(
        `ชื่อตึก: ${props.detail.buildingName || "—"} → ${buildingName.trim() || "—"}`,
      );
    }
    if (organization.trim() !== (props.detail.organization ?? "").trim()) {
      lines.push(
        `หน่วยงาน: ${props.detail.organization || "—"} → ${organization.trim() || "—"}`,
      );
    }
    if (expiryDate !== toDateInputValue(props.detail.expiryDate)) {
      lines.push(
        `วันหมดอายุ: ${formatDateLabel(props.detail.expiryDate)} → ${expiryDate ? formatDateLabel(expiryDate) : "—"}`,
      );
    }
    return lines.join("\n");
  }, [
    firstName,
    lastName,
    phone,
    email,
    legalEntityName,
    buildingName,
    organization,
    expiryDate,
    props.detail,
  ]);

  function onRequestSave() {
    setError(null);
    setOkMsg(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("ชื่อและนามสกุลต้องไม่ว่าง");
      return;
    }
    if (!dirty) {
      setError("ไม่มีค่าที่เปลี่ยน");
      return;
    }
    setConfirmOpen(true);
  }

  async function onConfirmSave() {
    setBusy(true);
    setError(null);
    try {
      const member = await updateMemberProfile({
        memberId: props.detail.memberId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        legalEntityName: legalEntityName.trim(),
        buildingName: buildingName.trim(),
        organization: organization.trim(),
        expiryDate,
      });
      setOkMsg("บันทึกข้อมูลแล้ว");
      setConfirmOpen(false);
      props.onSaved(member);
    } catch (err) {
      const code = err instanceof Error ? err.message : "save_failed";
      setError(ERROR_LABEL[code] ?? code);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!canEdit) return null;

  return (
    <div className="bo-profile-editor">
      <h4>แก้ไขข้อมูลสมาชิก</h4>
      <p className="bo-field-hint">
        แก้ไขข้อมูลติดต่อและองค์กร — ไม่รวมเลขสมาชิก / ใบเสร็จ
      </p>
      <div className="bo-form-grid">
        <div className="bo-field">
          <label htmlFor={`bo-fn-${props.detail.memberId}`}>ชื่อ</label>
          <input
            id={`bo-fn-${props.detail.memberId}`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="bo-field">
          <label htmlFor={`bo-ln-${props.detail.memberId}`}>นามสกุล</label>
          <input
            id={`bo-ln-${props.detail.memberId}`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="bo-field">
          <label htmlFor={`bo-phone-${props.detail.memberId}`}>เบอร์โทร</label>
          <input
            id={`bo-phone-${props.detail.memberId}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="bo-field">
          <label htmlFor={`bo-email-${props.detail.memberId}`}>อีเมล</label>
          <input
            id={`bo-email-${props.detail.memberId}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="bo-field">
          <label htmlFor={`bo-legal-${props.detail.memberId}`}>นิติบุคคล</label>
          <input
            id={`bo-legal-${props.detail.memberId}`}
            value={legalEntityName}
            onChange={(e) => setLegalEntityName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="bo-field">
          <label htmlFor={`bo-building-${props.detail.memberId}`}>
            ชื่อตึก
          </label>
          <input
            id={`bo-building-${props.detail.memberId}`}
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="bo-field">
          <label htmlFor={`bo-org-${props.detail.memberId}`}>หน่วยงาน</label>
          <input
            id={`bo-org-${props.detail.memberId}`}
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="bo-field">
          <label htmlFor={`bo-expiry-${props.detail.memberId}`}>
            วันหมดอายุ
          </label>
          <input
            id={`bo-expiry-${props.detail.memberId}`}
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        {error ? <div className="bo-error">{error}</div> : null}
        {okMsg ? <div className="bo-ok">{okMsg}</div> : null}

        <button
          type="button"
          className="bo-btn bo-btn-primary"
          disabled={busy || !dirty}
          onClick={onRequestSave}
        >
          {busy ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="ยืนยันบันทึกข้อมูล"
        description={changeSummary || "บันทึกการเปลี่ยนแปลงข้อมูลสมาชิก?"}
        confirmLabel="บันทึก"
        busy={busy}
        onConfirm={() => void onConfirmSave()}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </div>
  );
}

export default MemberProfileEditor;
