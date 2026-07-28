/**
 * Shown when the ID that would be applied on confirm collides with an
 * existing permanent member / official receipt number.
 */

import { useEffect, useId, useRef } from "react";

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

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ReviewIdConflictDialog(
  props: ReviewIdConflictDialogProps,
) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!props.open) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Prefer enabled primary action; otherwise first focusable control.
    const primary = primaryRef.current;
    const focusTarget =
      primary && !primary.disabled
        ? primary
        : dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    focusTarget?.focus();

    function focusableInDialog(): HTMLElement[] {
      if (!dialogRef.current) return [];
      return Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !props.busy) {
        e.preventDefault();
        props.onCancel();
        return;
      }

      if (e.key !== "Tab") return;

      const list = focusableInDialog();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }

      const first = list[0]!;
      const last = list[list.length - 1]!;
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !dialogRef.current?.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [props.open, props.busy, props.onCancel]);

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
        ref={dialogRef}
        className="bo-modal bo-id-conflict-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="bo-modal-title">
          {title}
        </h2>
        <p id={descId} className="bo-modal-desc">
          {label} <code>{props.contestedId}</code> ที่จะได้จาก
          {tempLabel} <code>{props.tempId}</code>{" "}
          ถูกใช้โดยสมาชิกอื่นแล้ว — แอดมินและสมาชิกมักเข้าใจว่าเลขจริงจะตรงกับเลขชั่วคราว
          จึงต้องเลือกเลขใหม่ก่อนยืนยัน
        </p>

        <div className="bo-id-conflict-actions">
          <button
            ref={primaryRef}
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
