import { useEffect, useId, useRef, useState } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  requireTypedConfirm?: string;
  /** When true, show a required reason textarea; value is passed to onConfirm. */
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  busy?: boolean;
  onConfirm: (typedOrReason?: string) => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const typedId = useId();
  const reasonId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const typedRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [typedValue, setTypedValue] = useState("");
  const [reasonValue, setReasonValue] = useState("");

  const confirmLabel = props.confirmLabel ?? "ยืนยัน";
  const cancelLabel = props.cancelLabel ?? "ยกเลิก";
  const variant = props.variant ?? "default";
  const reasonLabel = props.reasonLabel ?? "เหตุผลการปฏิเสธ (จำเป็น)";
  const reasonPlaceholder =
    props.reasonPlaceholder ?? "ระบุเหตุผลการปฏิเสธ";

  useEffect(() => {
    if (!props.open) {
      setTypedValue("");
      setReasonValue("");
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget = props.requireTypedConfirm
      ? typedRef.current
      : props.requireReason
        ? reasonRef.current
        : cancelRef.current;
    focusTarget?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !props.busy) {
        props.onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    props.open,
    props.busy,
    props.requireTypedConfirm,
    props.requireReason,
    props.onCancel,
  ]);

  if (!props.open) return null;

  const typedOk =
    !props.requireTypedConfirm ||
    typedValue.trim() === props.requireTypedConfirm;
  const reasonOk = !props.requireReason || reasonValue.trim().length > 0;

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
        className="bo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={props.description ? descId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="bo-modal-title">
          {props.title}
        </h2>
        {props.description ? (
          <p id={descId} className="bo-modal-desc">
            {props.description}
          </p>
        ) : null}

        {props.requireTypedConfirm ? (
          <div className="bo-field" style={{ marginTop: "0.85rem" }}>
            <label htmlFor={typedId}>
              พิมพ์{" "}
              <code className="bo-modal-code">{props.requireTypedConfirm}</code>{" "}
              เพื่อยืนยัน
            </label>
            <input
              id={typedId}
              ref={typedRef}
              type="text"
              value={typedValue}
              autoComplete="off"
              spellCheck={false}
              disabled={props.busy}
              placeholder={props.requireTypedConfirm}
              onChange={(e) => setTypedValue(e.target.value)}
            />
          </div>
        ) : null}

        {props.requireReason ? (
          <div className="bo-field" style={{ marginTop: "0.85rem" }}>
            <label htmlFor={reasonId}>{reasonLabel}</label>
            <textarea
              id={reasonId}
              ref={reasonRef}
              value={reasonValue}
              disabled={props.busy}
              placeholder={reasonPlaceholder}
              rows={3}
              onChange={(e) => setReasonValue(e.target.value)}
            />
          </div>
        ) : null}

        <div className="bo-modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="bo-btn bo-btn-ghost"
            disabled={props.busy}
            onClick={props.onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`bo-btn ${variant === "danger" ? "bo-btn-danger" : "bo-btn-primary"}`}
            disabled={props.busy || !typedOk || !reasonOk}
            onClick={() => {
              if (props.requireReason) {
                props.onConfirm(reasonValue.trim());
                return;
              }
              props.onConfirm(
                props.requireTypedConfirm ? typedValue.trim() : undefined,
              );
            }}
          >
            {props.busy ? "กำลังดำเนินการ…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
