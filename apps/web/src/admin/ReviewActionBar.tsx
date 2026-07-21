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
  /**
   * Called when the user clicks Approve (before the built-in confirm).
   * Return true to show the normal confirm; false if the parent handled
   * the click (e.g. opened an ID-conflict dialog).
   */
  gateApprove?: () => boolean | Promise<boolean>;
}

export default function ReviewActionBar(props: ReviewActionBarProps) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [gating, setGating] = useState(false);

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
    gateApprove,
  } = props;

  async function handleApproveClick() {
    if (gateApprove) {
      setGating(true);
      try {
        const proceed = await gateApprove();
        if (!proceed) return;
      } finally {
        setGating(false);
      }
    }
    setShowApproveConfirm(true);
  }

  function handleApproveConfirm() {
    setShowApproveConfirm(false);
    onApprove();
  }

  function handleApproveCancel() {
    setShowApproveConfirm(false);
  }

  const locked = busy || gating;

  return (
    <div className="bo-review-actions">
      {showApproveConfirm ? (
        <div className="bo-review-confirm">
          <p className="bo-review-confirm-msg">{approveConfirmMessage}</p>
          <div className="bo-review-btn-row">
            <button
              type="button"
              className="bo-btn bo-btn-success"
              disabled={locked}
              onClick={() => void handleApproveConfirm()}
            >
              ยืนยันอนุมัติ
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={locked}
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
            disabled={locked || approveDisabled}
            onClick={() => void handleApproveClick()}
          >
            {gating ? "กำลังตรวจสอบเลข…" : approveLabel}
          </button>
          <button
            type="button"
            className="bo-btn bo-btn-danger-ghost"
            disabled={locked}
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
              disabled={locked}
              onClick={() => void onRejectConfirm()}
            >
              ยืนยันปฏิเสธ
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={locked}
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
