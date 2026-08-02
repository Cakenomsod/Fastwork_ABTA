/**
 * Association bank-transfer display for member payment flows.
 * Account details confirmed by association (2026-08-02).
 */

export type TransferAccount = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
};

/** Live transfer details — Krungthai account from association. */
export const ASSOCIATION_TRANSFER_ACCOUNT: TransferAccount = {
  accountName: "สมาคมการค้าผู้ประกอบการห้องเช่า",
  accountNumber: "766-0-35634-8",
  bankName: "ธนาคารกรุงไทย สาขาวงศ์สว่าง ทาวน์ เซ็นเตอร์",
};

export const NO_TRANSFER_ACCOUNT_SUBMIT_HINT =
  "ยังไม่มีบัญชีรับโอน — ติดต่อเจ้าหน้าที่";

export function hasTransferAccount(
  account: TransferAccount | null | undefined = ASSOCIATION_TRANSFER_ACCOUNT,
): boolean {
  if (!account) return false;
  const bankName = account.bankName?.trim() ?? "";
  const accountName = account.accountName?.trim() ?? "";
  const accountNumber = account.accountNumber?.trim() ?? "";
  return Boolean(bankName || accountName || accountNumber);
}

type TransferBankBlockProps = {
  account?: TransferAccount | null;
};

export function TransferBankBlock({
  account = ASSOCIATION_TRANSFER_ACCOUNT,
}: TransferBankBlockProps) {
  if (!hasTransferAccount(account)) {
    return (
      <div className="reg-bank reg-bank--empty">
        <span className="reg-bank__label">บัญชีรับโอน</span>
        <p>ยังไม่มีข้อมูลบัญชีรับโอน</p>
        <small>ยังไม่สามารถโอนเงินผ่านระบบนี้ได้ — กรุณาติดต่อเจ้าหน้าที่สมาคม</small>
      </div>
    );
  }

  const bankName = account?.bankName?.trim() ?? "";
  const accountName = account?.accountName?.trim() ?? "";
  const accountNumber = account?.accountNumber?.trim() ?? "";

  return (
    <div className="reg-bank">
      <span className="reg-bank__label">บัญชีรับโอน</span>
      {accountName ? <p>{accountName}</p> : null}
      {accountNumber ? (
        <p className="reg-bank__number">{accountNumber}</p>
      ) : null}
      {bankName ? <small>{bankName}</small> : null}
    </div>
  );
}

type PaymentConfirmRow = {
  label: string;
  value: string;
};

type PaymentConfirmPanelProps = {
  title: string;
  lead: string;
  rows: PaymentConfirmRow[];
  slipPreviewUrl?: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onBack: () => void;
};

/** Inline confirm before high-stakes payment submit (reuse `.reg-confirm` patterns). */
export function PaymentConfirmPanel({
  title,
  lead,
  rows,
  slipPreviewUrl,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onBack,
}: PaymentConfirmPanelProps) {
  return (
    <div className="reg-confirm">
      <h2 className="reg-confirm__title">{title}</h2>
      <p className="reg-confirm__lead">{lead}</p>
      <dl className="reg-confirm__summary">
        {rows.map((row) => (
          <div key={row.label} className="reg-confirm__row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {slipPreviewUrl ? (
        <img
          src={slipPreviewUrl}
          alt="ตัวอย่างสลิปที่จะส่ง"
          className="reg-slip-preview"
        />
      ) : null}
      <p className="reg-confirm__warn">
        ตรวจสอบยอดและสลิปให้ถูกต้องก่อนยืนยัน — หลังส่งแล้วรอเจ้าหน้าที่ตรวจ
      </p>
      {error ? (
        <p className="reg-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="reg-confirm__actions">
        <button
          type="button"
          className="reg-btn reg-btn--primary"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "กำลังส่ง…" : confirmLabel}
        </button>
        <button
          type="button"
          className="reg-btn reg-btn--ghost reg-btn--ghost-light"
          disabled={busy}
          onClick={onBack}
        >
          แก้ไข
        </button>
      </div>
    </div>
  );
}
