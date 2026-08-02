import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
  type ReactNode,
} from "react";

const PHONE_LEN = 10;
const DIGIT_RE = /^\d$/;

function digitsFromValue(value: string): string[] {
  let cleaned = value.replace(/\D/g, "");
  if (!cleaned.startsWith("0")) {
    cleaned = `0${cleaned}`;
  }
  cleaned = cleaned.slice(0, PHONE_LEN);
  return Array.from({ length: PHONE_LEN }, (_, i) => cleaned[i] ?? "");
}

function joinDigits(digits: string[]): string {
  return digits.join("");
}

type Props = {
  id?: string;
  value: string;
  onChange: (phone: string) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

export type PhoneDigitInputHandle = {
  focus: () => void;
};

const PhoneDigitInput = forwardRef<PhoneDigitInputHandle, Props>(
  function PhoneDigitInput(
    {
      id = "phone",
      value,
      onChange,
      disabled = false,
      "aria-invalid": ariaInvalid,
      "aria-labelledby": ariaLabelledBy = "reg-phone-label",
      "aria-describedby": ariaDescribedBy,
    },
    ref,
  ) {
    const digits = digitsFromValue(value || "0");
    const refs = useRef<(HTMLInputElement | null)[]>([]);

    function emit(next: string[]) {
      next[0] = "0";
      onChange(joinDigits(next));
    }

    function focusAt(index: number) {
      const i = Math.max(1, Math.min(PHONE_LEN - 1, index));
      refs.current[i]?.focus();
      refs.current[i]?.select();
    }

    useImperativeHandle(ref, () => ({
      focus() {
        focusAt(1);
      },
    }));

    function setDigit(index: number, char: string) {
      if (index === 0) return;
      const next = [...digits];
      next[index] = char;
      emit(next);
      if (char && index < PHONE_LEN - 1) focusAt(index + 1);
    }

    function onInputChange(index: number, e: ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/\D/g, "");
      if (!raw) {
        setDigit(index, "");
        return;
      }
      // Mobile keyboards may append; take the last typed digit
      const char = raw.slice(-1);
      if (!DIGIT_RE.test(char)) return;
      setDigit(index, char);
    }

    function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (digits[index]) {
          setDigit(index, "");
        } else if (index > 1) {
          setDigit(index - 1, "");
          focusAt(index - 1);
        }
        return;
      }
      if (e.key === "ArrowLeft" && index > 1) {
        e.preventDefault();
        focusAt(index - 1);
        return;
      }
      if (e.key === "ArrowRight" && index < PHONE_LEN - 1) {
        e.preventDefault();
        focusAt(index + 1);
        return;
      }
      if (DIGIT_RE.test(e.key)) {
        e.preventDefault();
        setDigit(index, e.key);
      }
    }

    function onPaste(e: ClipboardEvent<HTMLInputElement>) {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;

      let normalized = pasted;
      if (normalized.length === 9 && !normalized.startsWith("0")) {
        normalized = `0${normalized}`;
      }
      if (normalized.length > PHONE_LEN) {
        normalized = normalized.slice(0, PHONE_LEN);
      }
      if (!normalized.startsWith("0")) {
        normalized = `0${normalized}`.slice(0, PHONE_LEN);
      }

      const next = digitsFromValue(normalized);
      emit(next);

      const firstEmpty = next.findIndex((d, i) => i > 0 && !d);
      focusAt(firstEmpty === -1 ? PHONE_LEN - 1 : firstEmpty);
    }

    const boxes: ReactNode[] = [];
    for (let index = 0; index < PHONE_LEN; index++) {
      if (index === 3 || index === 6) {
        boxes.push(
          <span key={`dash-${index}`} className="reg-phone-dash" aria-hidden>
            -
          </span>,
        );
      }
      const digit = digits[index] ?? "";
      const locked = index === 0;
      boxes.push(
        <input
          key={`d-${index}`}
          ref={(el) => {
            refs.current[index] = el;
          }}
          id={index === 1 ? id : undefined}
          className={`reg-phone-digit${locked ? " reg-phone-digit--locked" : ""}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 1 ? "tel-national" : "off"}
          maxLength={1}
          value={digit}
          readOnly={locked}
          tabIndex={locked ? -1 : 0}
          disabled={disabled}
          aria-label={
            locked ? "หลักที่ 1 คงที่เป็น 0" : `หลักที่ ${index + 1}`
          }
          aria-invalid={ariaInvalid}
          onChange={(e) => onInputChange(index, e)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
          onFocus={(e) => {
            if (locked) {
              focusAt(1);
              return;
            }
            e.target.select();
          }}
        />,
      );
    }

    return (
      <div
        className="reg-phone-digits"
        role="group"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      >
        {boxes}
        {/* Hidden field for native form / autofill association */}
        <input
          type="hidden"
          name="phone"
          value={joinDigits(digits)}
          autoComplete="tel-national"
        />
      </div>
    );
  },
);

export default PhoneDigitInput;

/** True when phone is exactly 10 digits starting with 0. */
export function isValidThaiMobile(phone: string): boolean {
  return /^0\d{9}$/.test(phone.trim());
}

/** Display as 080-802-6677 when complete. */
export function formatThaiMobileDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(0, 10);
  if (d.length !== 10) return phone;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}
