import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type MutableRefObject,
} from "react";
import {
  canEditMemberNumber,
  canEditReceiptNumber,
  checkMemberIds,
  effectiveIdOnConfirm,
  updateMemberIds,
  type AdminMe,
  type MemberDetail,
} from "../lib/admin-api";
import { ConfirmDialog } from "./ConfirmDialog";

export type ReviewIdChangeMode = "member" | "receipt";

export interface ReviewIdChangePanelProps {
  me: AdminMe;
  detail: MemberDetail;
  mode: ReviewIdChangeMode;
  disabled?: boolean;
  /** Increment to force-open the change panel (e.g. from conflict dialog). */
  openKey?: number;
  onUpdated: (result: {
    memberId: string;
    receiptNumber?: string;
    member: MemberDetail;
  }) => void;
}

const ERROR_LABEL: Record<string, string> = {
  member_id_taken: "เลขสมาชิกนี้ถูกใช้ไปแล้ว",
  receipt_number_taken: "เลขใบเสร็จนี้ถูกใช้ไปแล้ว",
  invalid_member_id_format:
    "รูปแบบเลขสมาชิกไม่ถูกต้อง (เช่น ABTA-2026-0001)",
  invalid_receipt_number_format:
    "รูปแบบเลขใบเสร็จไม่ถูกต้อง (เช่น RC-2026-0001)",
  forbidden_role: "บทบาทของคุณไม่มีสิทธิ์เปลี่ยนเลขนี้",
  not_found: "ไม่พบสมาชิก",
  payment_not_found: "ยังไม่มีใบเสร็จให้เปลี่ยนเลข",
  nothing_to_update: "ยังไม่ได้เปลี่ยนเลข",
  id_update_conflict: "เลขชนกับรายการอื่น — ลองเลขใหม่",
};

const DIGIT_RE = /^\d$/;

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | {
      status: "ready";
      value: string;
      validFormat: boolean;
      available: boolean;
      unchanged: boolean;
    }
  | { status: "error"; message: string };

type IdParts = {
  prefix: "ABTA" | "RC";
  hasT: boolean;
  year: string;
  seq: string;
};

const MEMBER_RE = /^ABTA(-T)?-(\d{4})-(\d{4})$/;
const RECEIPT_RE = /^RC(-T)?-(\d{4})-(\d{4})$/;

function parseIdParts(
  value: string,
  mode: ReviewIdChangeMode,
): IdParts | null {
  const raw = value.trim().toUpperCase();
  const re = mode === "member" ? MEMBER_RE : RECEIPT_RE;
  const m = re.exec(raw);
  if (!m) return null;
  return {
    prefix: mode === "member" ? "ABTA" : "RC",
    hasT: Boolean(m[1]),
    year: m[2],
    seq: m[3],
  };
}

/** New ID is always without T (permanent / official). */
function composeNewId(
  prefix: "ABTA" | "RC",
  year: string,
  seq: string,
): string {
  return `${prefix}-${year}-${seq}`;
}

function onlyDigits(value: string, length: number): string {
  return value.replace(/\D/g, "").slice(0, length);
}

function availabilityMessage(
  check: CheckState,
  mode: ReviewIdChangeMode,
): { tone: "ok" | "warn" | "error" | "muted"; text: string } | null {
  if (check.status === "idle") return null;
  if (check.status === "checking") {
    return { tone: "muted", text: "กำลังตรวจสอบ…" };
  }
  if (check.status === "error") {
    return { tone: "error", text: check.message };
  }
  if (!check.validFormat) {
    return { tone: "error", text: "รูปแบบไม่ถูกต้อง" };
  }
  if (!check.available) {
    return {
      tone: "warn",
      text: check.unchanged
        ? "เลขที่จะใช้เมื่อยืนยันถูกสมาชิกอื่นใช้ไปแล้ว — ต้องเปลี่ยนก่อน"
        : mode === "receipt"
          ? "เลขใบเสร็จนี้ถูกใช้โดยสมาชิกจริงแล้ว — เลือกเลขอื่น"
          : "เลขสมาชิกนี้ถูกใช้โดยสมาชิกจริงแล้ว — เลือกเลขอื่น",
    };
  }
  if (check.unchanged) {
    return { tone: "muted", text: "ตรงกับเลขที่จะใช้เมื่อยืนยันอยู่แล้ว" };
  }
  return { tone: "ok", text: "เลขนี้ว่าง ใช้ได้" };
}

function DigitBoxes(props: {
  id: string;
  label: string;
  value: string;
  length: number;
  disabled?: boolean;
  inputRef?: MutableRefObject<Array<HTMLInputElement | null>>;
  onChange: (next: string) => void;
  onComplete?: () => void;
  onBackspaceAtStart?: () => void;
  onArrowLeftAtStart?: () => void;
  onArrowRightAtEnd?: () => void;
}) {
  const localRefs = useRef<Array<HTMLInputElement | null>>([]);
  const refs = props.inputRef ?? localRefs;
  const digits = Array.from(
    { length: props.length },
    (_, i) => props.value[i] ?? "",
  );

  function emit(nextDigits: string[]) {
    props.onChange(onlyDigits(nextDigits.join(""), props.length));
  }

  function focusAt(index: number) {
    const el = refs.current[index];
    if (!el) return;
    el.focus();
    el.select();
  }

  function setDigit(index: number, char: string) {
    const next = [...digits];
    next[index] = char;
    emit(next);
    if (char && index < props.length - 1) {
      focusAt(index + 1);
    } else if (char && index === props.length - 1) {
      props.onComplete?.();
    }
  }

  function onInputChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(index, "");
      return;
    }
    const char = raw.slice(-1);
    if (!DIGIT_RE.test(char)) return;
    setDigit(index, char);
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        focusAt(index - 1);
      } else {
        props.onBackspaceAtStart?.();
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) focusAt(index - 1);
      else props.onArrowLeftAtStart?.();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < props.length - 1) focusAt(index + 1);
      else props.onArrowRightAtEnd?.();
      return;
    }
    if (DIGIT_RE.test(e.key)) {
      e.preventDefault();
      setDigit(index, e.key);
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = onlyDigits(e.clipboardData.getData("text"), props.length);
    if (!pasted) return;
    const next = Array.from(
      { length: props.length },
      (_, i) => pasted[i] ?? digits[i] ?? "",
    );
    emit(next);
    const nextFocus = Math.min(pasted.length, props.length - 1);
    window.requestAnimationFrame(() => focusAt(nextFocus));
    if (pasted.length >= props.length) props.onComplete?.();
  }

  return (
    <div className="bo-id-digits" role="group" aria-label={props.label}>
      <div className="bo-id-digits-boxes">
        {digits.map((digit, index) => (
          <input
            key={`${props.id}-${index}`}
            ref={(el) => {
              refs.current[index] = el;
            }}
            className="bo-id-digit"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="one-time-code"
            spellCheck={false}
            aria-label={`${props.label} หลักที่ ${index + 1}`}
            value={digit}
            disabled={props.disabled}
            onChange={(e) => onInputChange(index, e)}
            onKeyDown={(e) => onKeyDown(index, e)}
            onPaste={onPaste}
            onFocus={(e) => e.currentTarget.select()}
          />
        ))}
      </div>
    </div>
  );
}

export default function ReviewIdChangePanel(props: ReviewIdChangePanelProps) {
  const { me, detail, mode, disabled, openKey, onUpdated } = props;
  const allowed =
    mode === "member" ? canEditMemberNumber(me) : canEditReceiptNumber(me);

  const currentValue =
    mode === "member" ? detail.memberId : (detail.receiptNumber ?? "");
  const pendingValue =
    mode === "member" ? detail.pendingMemberId : detail.pendingReceiptNumber;
  /** Number that will be applied when the reviewer confirms. */
  const effectiveValue = effectiveIdOnConfirm(currentValue, pendingValue);
  const currentParts = parseIdParts(currentValue, mode);
  const effectiveParts = parseIdParts(effectiveValue, mode);

  const title =
    mode === "member" ? "เปลี่ยนเลขสมาชิก" : "เปลี่ยนเลขใบเสร็จ";
  const fieldLabel = mode === "member" ? "เลขสมาชิกใหม่" : "เลขใบเสร็จใหม่";
  const yearLabelId = useId();
  const seqLabelId = useId();
  const yearRefs = useRef<Array<HTMLInputElement | null>>([]);
  const seqRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(effectiveParts?.year ?? "");
  const [seq, setSeq] = useState(effectiveParts?.seq ?? "");
  const [check, setCheck] = useState<CheckState>({ status: "idle" });
  const [suggest, setSuggest] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const prefix = currentParts?.prefix ?? (mode === "member" ? "ABTA" : "RC");
  // New number always drops T (permanent member / official receipt).
  const value =
    year.length === 4 && seq.length === 4
      ? composeNewId(prefix, year, seq)
      : "";

  useEffect(() => {
    if (openKey != null && openKey > 0) {
      setOpen(true);
    }
  }, [openKey]);

  useEffect(() => {
    if (!open) return;
    const parts = parseIdParts(effectiveValue, mode);
    setYear(parts?.year ?? "");
    setSeq(parts?.seq ?? "");
    setCheck({ status: "idle" });
    setError(null);
    setSuggest(null);
  }, [open, effectiveValue, mode, detail.memberId]);

  useEffect(() => {
    if (!open) return;
    if (year.length !== 4 || seq.length !== 4) {
      setCheck({ status: "idle" });
      return;
    }

    const trimmed = composeNewId(prefix, year, seq);
    const unchanged = trimmed === effectiveValue;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setCheck({ status: "checking" });
      void checkMemberIds({
        memberId: mode === "member" ? trimmed : undefined,
        receiptNumber: mode === "receipt" ? trimmed : undefined,
        exceptMemberId: detail.memberId,
        exceptPaymentId: detail.paymentId,
      })
        .then((result) => {
          if (cancelled) return;
          const row =
            mode === "member" ? result.memberId : result.receiptNumber;
          const nextSuggest =
            mode === "member"
              ? result.suggest.nextPermanentMemberId
              : result.suggest.nextOfficialReceiptNumber;
          setSuggest(nextSuggest);
          if (!row) {
            setCheck({
              status: "error",
              message: "ตรวจสอบไม่สำเร็จ",
            });
            return;
          }
          setCheck({
            status: "ready",
            value: row.value,
            validFormat: row.validFormat,
            available: row.available,
            unchanged,
          });
        })
        .catch((err: Error) => {
          if (cancelled) return;
          setCheck({
            status: "error",
            message: ERROR_LABEL[err.message] ?? err.message,
          });
        });
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    open,
    year,
    seq,
    prefix,
    mode,
    effectiveValue,
    detail.memberId,
    detail.paymentId,
  ]);

  if (!allowed) return null;
  if (mode === "receipt" && !detail.receiptNumber) return null;
  if (!currentParts) return null;

  const avail = availabilityMessage(check, mode);
  const canSubmit =
    !busy &&
    !disabled &&
    check.status === "ready" &&
    !check.unchanged &&
    check.validFormat &&
    check.available;

  function applySuggest(raw: string) {
    const parts = parseIdParts(raw, mode);
    if (!parts) return;
    setYear(parts.year);
    setSeq(parts.seq);
  }

  async function onConfirmSave() {
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      const result = await updateMemberIds({
        memberId: detail.memberId,
        newMemberId: mode === "member" ? value : undefined,
        newReceiptNumber: mode === "receipt" ? value : undefined,
      });
      setConfirmOpen(false);
      setOpen(false);
      onUpdated(result);
    } catch (err) {
      const code = err instanceof Error ? err.message : "update_failed";
      setError(ERROR_LABEL[code] ?? code);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const confirmHint =
    mode === "member"
      ? "จะมีผลเมื่อกดอนุมัติข้อมูล (ยืนยัน)"
      : "จะมีผลเมื่อกดยืนยันออกใบเสร็จตัวจริง";

  return (
    <div className="bo-id-change">
      {pendingValue ? (
        <p className="bo-id-change-pending" role="status">
          เลขใหม่ที่บันทึกไว้: <code>{pendingValue}</code> · {confirmHint}
        </p>
      ) : null}
      {!open ? (
        <button
          type="button"
          className="bo-btn bo-btn-ghost bo-id-change-toggle"
          disabled={disabled || busy}
          onClick={() => setOpen(true)}
        >
          {title}
        </button>
      ) : (
        <div className="bo-id-change-panel" role="region" aria-label={title}>
          <div className="bo-id-change-panel-head">
            <strong>{title}</strong>
            <button
              type="button"
              className="bo-btn bo-btn-ghost bo-id-change-cancel"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              ปิด
            </button>
          </div>

          <p className="bo-id-change-current">
            เลขชั่วคราวปัจจุบัน: <code>{currentValue || "—"}</code>
            <br />
            เลขที่จะใช้เมื่อยืนยัน: <code>{effectiveValue || "—"}</code>
            {!pendingValue ? " (ตัด T จากเลขชั่วคราวอัตโนมัติ)" : ""}
          </p>

          <div className="bo-field bo-id-change-field">
            <span className="bo-id-change-field-label">{fieldLabel}</span>
            <div className="bo-id-segments" aria-label={fieldLabel}>
              <span className="bo-id-seg bo-id-seg-lock" aria-hidden="true">
                {prefix}
              </span>
              <DigitBoxes
                id={yearLabelId}
                label="ปี"
                value={year}
                length={4}
                disabled={busy || disabled}
                inputRef={yearRefs}
                onChange={setYear}
                onComplete={() => {
                  const el = seqRefs.current[0];
                  el?.focus();
                  el?.select();
                }}
                onArrowRightAtEnd={() => {
                  const el = seqRefs.current[0];
                  el?.focus();
                  el?.select();
                }}
              />
              <span className="bo-id-seg-sep" aria-hidden="true">
                –
              </span>
              <DigitBoxes
                id={seqLabelId}
                label="ลำดับ"
                value={seq}
                length={4}
                disabled={busy || disabled}
                inputRef={seqRefs}
                onChange={setSeq}
                onBackspaceAtStart={() => {
                  const last = Math.max(0, year.length - 1);
                  setYear(year.slice(0, last));
                  window.requestAnimationFrame(() => {
                    const el = yearRefs.current[Math.min(last, 3)];
                    el?.focus();
                    el?.select();
                  });
                }}
                onArrowLeftAtStart={() => {
                  const el = yearRefs.current[3];
                  el?.focus();
                  el?.select();
                }}
              />
            </div>
            <small className="bo-id-change-hint">
              ตัด T ออกอัตโนมัติ · แก้ได้เฉพาะปีและเลขลำดับ ·
              ตรวจซ้ำกับเลขจริงเท่านั้น · บันทึกเก็บไว้ก่อน
              เลขชั่วคราวยังไม่เปลี่ยน — {confirmHint}
            </small>
          </div>

          {avail ? (
            <p
              className={`bo-id-change-status bo-id-change-status-${avail.tone}`}
              role="status"
              aria-live="polite"
            >
              {avail.text}
            </p>
          ) : null}

          {suggest &&
          check.status === "ready" &&
          (!check.validFormat || !check.available) &&
          suggest !== check.value ? (
            <button
              type="button"
              className="bo-btn bo-btn-ghost bo-id-change-suggest"
              disabled={busy}
              onClick={() => applySuggest(suggest)}
            >
              ใช้เลขถัดไปที่ว่าง: <code>{suggest}</code>
            </button>
          ) : null}

          {error ? (
            <div className="bo-error bo-id-change-error">{error}</div>
          ) : null}

          <div className="bo-id-change-actions">
            <button
              type="button"
              className="bo-btn bo-btn-primary"
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
            >
              บันทึกเลขใหม่
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`ยืนยัน${title}`}
        description={`เลขที่จะใช้: ${value}\nบันทึกเก็บไว้ก่อน เลขชั่วคราว ${currentValue || "—"} ยังไม่เปลี่ยน\n${confirmHint}`}
        confirmLabel="บันทึกเลขใหม่"
        busy={busy}
        onConfirm={() => void onConfirmSave()}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </div>
  );
}
