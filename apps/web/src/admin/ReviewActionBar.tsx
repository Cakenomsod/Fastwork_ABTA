import { useState } from "react";

export interface ReviewActionBarProps {
  busy: boolean;
  showReject: boolean;
  rejectReason: string;
  onApprove: () => void;
  onRejectToggle: () => void;
  onRejectConfirm: () => void;
  onRejectReasonChange: (value: string) => void;
  rejectLabel?: string;
  approveLabel?: string;
  rejectPlaceholder?: string;
  approveConfirmMessage?: string;
  note?: string;
  approveDisabled?: boolean;
  rejectTextareaId?: string;
}

export default function ReviewActionBar(props: ReviewActionBarProps) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const {
    busy,
    showReject,
    rejectReason,
    onApprove,
    onRejectToggle,
    onRejectConfirm,
    onRejectReasonChange,
    rejectLabel = "ไม่ผ่าน",
    approveLabel = "อนุมัติ",
    rejectPlaceholder = "ระบุเหตุผลการปฏิเสธ",
    approveConfirmMessage = "ยืนยันการอนุมัติ?",
    note,
    approveDisabled = false,
    rejectTextareaId = "review-reject-reason",
  } = props;

  function handleApproveClick() {
    setShowApproveConfirm(true);
  }

  function handleApproveConfirm() {
    setShowApproveConfirm(false);
    onApprove();
  }

  function handleApproveCancel() {
    setShowApproveConfirm(false);
  }

  return (
    <div className="bo-review-actions">
      {showApproveConfirm ? (
        <div className="bo-review-confirm">
          <p className="bo-review-confirm-msg">{approveConfirmMessage}</p>
          <div className="bo-review-btn-row">
            <button
              type="button"
              className="bo-btn bo-btn-success"
              disabled={busy}
              onClick={() => void handleApproveConfirm()}
            >
              ยืนยันอนุมัติ
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={busy}
              onClick={handleApproveCancel}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <div className="bo-review-btn-row">
          <button
            type="button"
            className="bo-btn bo-btn-success"
            disabled={busy || approveDisabled}
            onClick={handleApproveClick}
          >
            {approveLabel}
          </button>
          <button
            type="button"
            className="bo-btn bo-btn-danger-ghost"
            disabled={busy}
            onClick={onRejectToggle}
          >
            {rejectLabel}
          </button>
        </div>
      )}

      {showReject ? (
        <div className="bo-review-reject">
          <div className="bo-field">
            <label htmlFor={rejectTextareaId}>เหตุผลการปฏิเสธ (จำเป็น)</label>
            <textarea
              id={rejectTextareaId}
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder={rejectPlaceholder}
            />
          </div>
          <div className="bo-review-btn-row">
            <button
              type="button"
              className="bo-btn bo-btn-danger"
              disabled={busy}
              onClick={() => void onRejectConfirm()}
            >
              ยืนยันปฏิเสธ
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={busy}
              onClick={onRejectToggle}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : null}

      {note ? <p className="bo-review-note">{note}</p> : null}
    </div>
  );
}
