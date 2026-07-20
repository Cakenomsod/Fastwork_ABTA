import { useEffect, useId, useRef, useState } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  requireTypedConfirm?: string;
  busy?: boolean;
  onConfirm: (typedConfirm?: string) => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const typedId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const typedRef = useRef<HTMLInputElement>(null);
  const [typedValue, setTypedValue] = useState("");

  const confirmLabel = props.confirmLabel ?? "ยืนยัน";
  const cancelLabel = props.cancelLabel ?? "ยกเลิก";
  const variant = props.variant ?? "default";

  useEffect(() => {
    if (!props.open) {
      setTypedValue("");
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget = props.requireTypedConfirm
      ? typedRef.current
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
  }, [props.open, props.busy, props.requireTypedConfirm, props.onCancel]);

  if (!props.open) return null;

  const typedOk =
    !props.requireTypedConfirm ||
    typedValue.trim() === props.requireTypedConfirm;

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
            disabled={props.busy || !typedOk}
            onClick={() =>
              props.onConfirm(
                props.requireTypedConfirm ? typedValue.trim() : undefined,
              )
            }
          >
            {props.busy ? "กำลังดำเนินการ…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
