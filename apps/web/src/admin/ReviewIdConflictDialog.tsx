/**
 * Shown when the ID that would be applied on confirm collides with an
 * existing permanent member / official receipt number.
 */

export interface ReviewIdConflictDialogProps {
  open: boolean;
  kind: "member" | "receipt";
  /** Temporary / current number (e.g. ABTA-T-2026-0002). */
  tempId: string;
  /** Permanent / official number that would collide. */
  contestedId: string;
  /** Next free number suggested by the system. */
  suggestedId: string;
  busy?: boolean;
  onUseSuggested: () => void;
  onChangeManually: () => void;
  onCancel: () => void;
}

export default function ReviewIdConflictDialog(
  props: ReviewIdConflictDialogProps,
) {
  if (!props.open) return null;

  const isMember = props.kind === "member";
  const title = isMember ? "เลขสมาชิกซ้ำ" : "เลขใบเสร็จซ้ำ";
  const label = isMember ? "เลขสมาชิก" : "เลขใบเสร็จ";
  const tempLabel = isMember ? "เลขชั่วคราว" : "ใบเสร็จชั่วคราว";

  return (
    <div
      className="bo-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !props.busy) {
          props.onCancel();
        }
      }}
    >
      <div
        className="bo-modal bo-id-conflict-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bo-id-conflict-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="bo-id-conflict-title" className="bo-modal-title">
          {title}
        </h2>
        <p className="bo-modal-desc">
          {label} <code>{props.contestedId}</code> ที่จะได้จาก
          {tempLabel} <code>{props.tempId}</code>{" "}
          ถูกใช้โดยสมาชิกอื่นแล้ว — แอดมินและสมาชิกมักเข้าใจว่าเลขจริงจะตรงกับเลขชั่วคราว
          จึงต้องเลือกเลขใหม่ก่อนยืนยัน
        </p>

        <div className="bo-id-conflict-actions">
          <button
            type="button"
            className="bo-btn bo-btn-primary"
            disabled={props.busy || !props.suggestedId}
            onClick={props.onUseSuggested}
          >
            {props.busy
              ? "กำลังดำเนินการ…"
              : `ใช้เลขที่ระบบแนะนำ: ${props.suggestedId}`}
          </button>
          <button
            type="button"
            className="bo-btn bo-btn-ghost"
            disabled={props.busy}
            onClick={props.onChangeManually}
          >
            เปลี่ยนเลขเอง
          </button>
          <button
            type="button"
            className="bo-btn bo-btn-ghost"
            disabled={props.busy}
            onClick={props.onCancel}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
