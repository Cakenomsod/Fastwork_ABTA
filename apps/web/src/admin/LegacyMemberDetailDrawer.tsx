import { useEffect, useId, useRef } from "react";
import {
  LEGACY_STATUS_EXCEL_CODE,
  LEGACY_STATUS_LABEL,
  type LegacyMemberListRow,
} from "../lib/admin-api";
import LegacyPaymentsPanel from "./LegacyPaymentsPanel";

export interface LegacyMemberDetailDrawerProps {
  open: boolean;
  row: LegacyMemberListRow | null;
  onClose: () => void;
}

function formatExpiry(value?: string): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toLocaleDateString("th-TH", { dateStyle: "medium" });
  }
  return trimmed;
}

function displayOrDash(value?: string): string {
  const t = value?.trim();
  return t ? t : "—";
}

function legacyStatusClass(status: string): string {
  if (status === "active") return "active";
  if (status === "expired") return "expired";
  if (status === "pending") return "pending";
  return "temp";
}

export function LegacyMemberDetailDrawer(props: LegacyMemberDetailDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const row = props.row;

  useEffect(() => {
    if (!props.open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  const statusLabel = row
    ? (LEGACY_STATUS_LABEL[row.status] ?? row.status)
    : "";
  const statusCode = row ? LEGACY_STATUS_EXCEL_CODE[row.status] : undefined;

  return (
    <div
      className="bo-detail-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div
        className="bo-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bo-detail-modal-head">
          <div className="bo-detail-modal-head-text">
            <p className="bo-detail-modal-eyebrow">รายละเอียดสมาชิกเก่า</p>
            <h2 id={titleId} className="bo-detail-modal-title">
              {row?.fullName?.trim() || "—"}
            </h2>
            {row ? (
              <p className="bo-detail-modal-sub">
                <code>{row.legacyMemberId}</code>
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="bo-detail-modal-close"
            aria-label="ปิด"
            onClick={props.onClose}
          >
            ×
          </button>
        </header>

        <div className="bo-detail-modal-body">
          {!row ? (
            <div className="bo-empty" style={{ padding: "2rem 0" }}>
              <strong>ไม่พบข้อมูล</strong>
              ไม่สามารถแสดงรายละเอียดสมาชิกเก่าได้
            </div>
          ) : (
            <>
              <section className="bo-detail-modal-summary">
                <div className="bo-detail-row">
                  <span>เลขสมาชิกเก่า</span>
                  <strong>
                    <code>{row.legacyMemberId}</code>
                  </strong>
                </div>
                <div className="bo-detail-row">
                  <span>ชื่อ</span>
                  <strong>{displayOrDash(row.fullName)}</strong>
                </div>
                {row.buildingName?.trim() ? (
                  <div className="bo-detail-row">
                    <span>อาคาร / สถานที่</span>
                    <strong>{row.buildingName.trim()}</strong>
                  </div>
                ) : null}
                {row.memberTypeLabel?.trim() ? (
                  <div className="bo-detail-row">
                    <span>ประเภท</span>
                    <strong>{row.memberTypeLabel.trim()}</strong>
                  </div>
                ) : null}
                <div className="bo-detail-row">
                  <span>สถานะ</span>
                  <strong>
                    <span
                      className={`bo-badge ${legacyStatusClass(row.status)}`}
                      title={statusCode}
                    >
                      {statusLabel}
                    </span>
                  </strong>
                </div>
                <div className="bo-detail-row">
                  <span>โทร</span>
                  <strong>{displayOrDash(row.phone)}</strong>
                </div>
                <div className="bo-detail-row">
                  <span>อีเมล</span>
                  <strong>{displayOrDash(row.email)}</strong>
                </div>
                <div className="bo-detail-row">
                  <span>วันหมดอายุ</span>
                  <strong>{formatExpiry(row.expiryDate)}</strong>
                </div>
                <div className="bo-detail-row">
                  <span>LINE</span>
                  <strong>
                    {row.lineBound ? (
                      <span className="bo-badge active">ยืนยันแล้ว</span>
                    ) : (
                      <span className="bo-badge pending">ยังไม่ยืนยัน</span>
                    )}
                  </strong>
                </div>
                <div className="bo-detail-row">
                  <span>เลขสมาชิกใหม่</span>
                  <strong>
                    {row.boundMemberId ? (
                      <code>{row.boundMemberId}</code>
                    ) : (
                      "—"
                    )}
                  </strong>
                </div>
                {row.boundFullName?.trim() ? (
                  <div className="bo-detail-row">
                    <span>ชื่อสมาชิกที่ผูก</span>
                    <strong>{row.boundFullName.trim()}</strong>
                  </div>
                ) : null}
                {row.sourceFile?.trim() ? (
                  <div className="bo-detail-row">
                    <span>ไฟล์ต้นทาง</span>
                    <strong>{row.sourceFile.trim()}</strong>
                  </div>
                ) : null}
              </section>

              <LegacyPaymentsPanel legacyMemberId={row.legacyMemberId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LegacyMemberDetailDrawer;
