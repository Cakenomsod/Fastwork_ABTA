import { useState } from "react";
import {
  canDeleteMember,
  deleteMember,
  type AdminMe,
  type MemberDetail,
} from "../lib/admin-api";
import { ConfirmDialog } from "./ConfirmDialog";

const ERROR_LABEL: Record<string, string> = {
  confirm_mismatch: "เลขสมาชิกที่พิมพ์ไม่ตรงกัน",
  not_found: "ไม่พบสมาชิก",
  forbidden_role: "บทบาทของคุณไม่มีสิทธิ์ลบ",
  member_id_required: "ต้องระบุเลขสมาชิก",
};

export interface MemberDeletePanelProps {
  detail: MemberDetail;
  me: AdminMe;
  onDeleted: (memberId: string) => void;
}

export function MemberDeletePanel(props: MemberDeletePanelProps) {
  const canDelete = canDeleteMember(props.me);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirmDelete(typedConfirm?: string) {
    if (!typedConfirm || typedConfirm !== props.detail.memberId) {
      setError(ERROR_LABEL.confirm_mismatch);
      setConfirmOpen(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteMember({
        memberId: props.detail.memberId,
        confirmMemberId: typedConfirm,
      });
      setConfirmOpen(false);
      props.onDeleted(props.detail.memberId);
    } catch (err) {
      const code = err instanceof Error ? err.message : "delete_failed";
      setError(ERROR_LABEL[code] ?? code);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!canDelete) return null;

  return (
    <section className="bo-danger-zone">
      {error ? <div className="bo-error bo-danger-zone-error">{error}</div> : null}
      <div className="bo-danger-zone-actions">
        <button
          type="button"
          className="bo-btn bo-btn-danger"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
        >
          ลบสมาชิก
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="ยืนยันลบสมาชิก"
        description={`สมาชิก: ${props.detail.fullName}\nเลข: ${props.detail.memberId}`}
        confirmLabel="ลบถาวร"
        variant="danger"
        requireTypedConfirm={props.detail.memberId}
        busy={busy}
        onConfirm={(typed) => void onConfirmDelete(typed)}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </section>
  );
}

export default MemberDeletePanel;
