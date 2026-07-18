import { useEffect, useState } from "react";
import {
  canEditMemberNumber,
  canEditReceiptNumber,
  updateMemberIds,
  type AdminMe,
  type MemberDetail,
} from "../lib/admin-api";

const MEMBER_ID_RE = /^ABTA(?:-T)?-\d{4}-\d{4}$/;
const RECEIPT_RE = /^RC(?:-T)?-\d{4}-\d{4}$/;

const ERROR_LABEL: Record<string, string> = {
  invalid_member_id_format: "รูปแบบเลขสมาชิกไม่ถูกต้อง (เช่น ABTA-2026-0001 หรือ ABTA-T-2026-0001)",
  invalid_receipt_number_format: "รูปแบบเลขใบเสร็จไม่ถูกต้อง (เช่น RC-2026-0001 หรือ RC-T-2026-0001)",
  member_id_taken: "เลขสมาชิกนี้ถูกใช้แล้ว",
  receipt_number_taken: "เลขใบเสร็จนี้ถูกใช้แล้ว",
  forbidden_role: "บทบาทของคุณไม่มีสิทธิ์แก้ไขฟิลด์นี้",
  payment_not_found: "ยังไม่มีข้อมูลการชำระ — แก้เลขใบเสร็จไม่ได้",
  nothing_to_update: "ไม่มีค่าที่ต้องบันทึก",
  not_found: "ไม่พบสมาชิก",
};

export default function MemberIdsEditor(props: {
  detail: MemberDetail;
  me: AdminMe;
  onSaved: (member: MemberDetail) => void;
}) {
  const canMember = canEditMemberNumber(props.me);
  const canReceipt = canEditReceiptNumber(props.me);

  const [memberIdDraft, setMemberIdDraft] = useState(props.detail.memberId);
  const [receiptDraft, setReceiptDraft] = useState(
    props.detail.receiptNumber ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    setMemberIdDraft(props.detail.memberId);
    setReceiptDraft(props.detail.receiptNumber ?? "");
    setError(null);
    setOkMsg(null);
  }, [props.detail.memberId, props.detail.receiptNumber]);

  if (!canMember && !canReceipt) return null;

  const memberLabel =
    props.detail.status === "temporary" ||
    props.detail.memberId.startsWith("ABTA-T-")
      ? "เลขสมาชิกชั่วคราว"
      : "เลขสมาชิก";

  const receiptLabel =
    props.detail.receiptStatus === "official"
      ? "เลขใบเสร็จตัวจริง"
      : props.detail.receiptNumber
        ? "เลขใบเสร็จ"
        : "เลขใบเสร็จ (ยังไม่ออก)";

  const memberDirty = memberIdDraft.trim() !== props.detail.memberId;
  const receiptDirty =
    receiptDraft.trim() !== (props.detail.receiptNumber ?? "");
  const dirty = (canMember && memberDirty) || (canReceipt && receiptDirty);

  async function onSave() {
    setError(null);
    setOkMsg(null);

    const payload: {
      memberId: string;
      newMemberId?: string;
      newReceiptNumber?: string;
    } = { memberId: props.detail.memberId };

    if (canMember && memberDirty) {
      const v = memberIdDraft.trim();
      if (!v) {
        setError("เลขสมาชิกต้องไม่ว่าง");
        return;
      }
      if (!MEMBER_ID_RE.test(v)) {
        setError(ERROR_LABEL.invalid_member_id_format);
        return;
      }
      payload.newMemberId = v;
    }

    if (canReceipt && receiptDirty) {
      const v = receiptDraft.trim();
      if (!v) {
        setError("เลขใบเสร็จต้องไม่ว่าง");
        return;
      }
      if (!RECEIPT_RE.test(v)) {
        setError(ERROR_LABEL.invalid_receipt_number_format);
        return;
      }
      payload.newReceiptNumber = v;
    }

    if (!payload.newMemberId && !payload.newReceiptNumber) {
      setError("ไม่มีค่าที่เปลี่ยน");
      return;
    }

    setBusy(true);
    try {
      const result = await updateMemberIds(payload);
      setOkMsg("บันทึกแล้ว");
      props.onSaved(result.member);
    } catch (err) {
      const code = err instanceof Error ? err.message : "save_failed";
      setError(ERROR_LABEL[code] ?? code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-ids-editor">
      <h4>แก้ไขเลขสมาชิก / ใบเสร็จ</h4>
      <div className="bo-form-grid">
        {canMember ? (
          <div className="bo-field">
            <label htmlFor={`bo-member-id-${props.detail.memberId}`}>
              {memberLabel}
            </label>
            <input
              id={`bo-member-id-${props.detail.memberId}`}
              value={memberIdDraft}
              onChange={(e) => setMemberIdDraft(e.target.value.toUpperCase())}
              spellCheck={false}
              autoComplete="off"
              placeholder="ABTA-2026-0001"
            />
            {props.detail.tempMemberId &&
            props.detail.tempMemberId !== props.detail.memberId ? (
              <p className="bo-field-hint">
                เลขชั่วคราวเดิม: <code>{props.detail.tempMemberId}</code>
              </p>
            ) : null}
          </div>
        ) : null}

        {canReceipt ? (
          <div className="bo-field">
            <label htmlFor={`bo-receipt-${props.detail.memberId}`}>
              {receiptLabel}
            </label>
            <input
              id={`bo-receipt-${props.detail.memberId}`}
              value={receiptDraft}
              onChange={(e) => setReceiptDraft(e.target.value.toUpperCase())}
              spellCheck={false}
              autoComplete="off"
              placeholder="RC-T-2026-0001"
              disabled={!props.detail.paymentId && !props.detail.receiptNumber}
            />
            {!props.detail.paymentId && !props.detail.receiptNumber ? (
              <p className="bo-field-hint">ยังไม่มีรายการชำระ — แก้เลขใบเสร็จไม่ได้</p>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="bo-error">{error}</div> : null}
        {okMsg ? <div className="bo-ok">{okMsg}</div> : null}

        <button
          type="button"
          className="bo-btn bo-btn-primary"
          disabled={busy || !dirty}
          onClick={() => void onSave()}
        >
          {busy ? "กำลังบันทึก…" : "บันทึกเลข"}
        </button>
      </div>
    </div>
  );
}
