import { useEffect, useId, useRef } from "react";
import { memberNameParts, type AdminMe, type MemberDetail } from "../lib/admin-api";
import MemberDetailExtras from "./MemberDetailExtras";

export interface MemberDetailDrawerProps {
  open: boolean;
  loading?: boolean;
  detail: MemberDetail | null;
  me: AdminMe;
  onClose: () => void;
  onDeleted: (memberId: string) => void;
}

export function MemberDetailDrawer(props: MemberDetailDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const name = props.detail ? memberNameParts(props.detail) : null;

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
            <p className="bo-detail-modal-eyebrow">รายละเอียดสมาชิก</p>
            <h2 id={titleId} className="bo-detail-modal-title">
              {props.loading && !props.detail
                ? "กำลังโหลด…"
                : name
                  ? `${name.firstName} ${name.lastName}`.trim()
                  : "—"}
            </h2>
            {props.detail ? (
              <p className="bo-detail-modal-sub">
                <code>{props.detail.memberId}</code>
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
          {props.loading && !props.detail ? (
            <div className="bo-empty" style={{ padding: "2rem 0" }}>
              กำลังโหลดข้อมูลสมาชิก…
            </div>
          ) : !props.detail || !name ? (
            <div className="bo-empty" style={{ padding: "2rem 0" }}>
              <strong>ไม่พบข้อมูล</strong>
              ไม่สามารถโหลดรายละเอียดสมาชิกได้
            </div>
          ) : (
            <>
              <section className="bo-detail-modal-summary">
                <div className="bo-detail-row">
                  <span>ชื่อ</span>
                  <strong>{name.firstName}</strong>
                </div>
                <div className="bo-detail-row">
                  <span>นามสกุล</span>
                  <strong>{name.lastName}</strong>
                </div>
                <div className="bo-detail-row">
                  <span>เลขใบเสร็จ</span>
                  <strong>{props.detail.receiptNumber || "—"}</strong>
                </div>
                <div className="bo-detail-row">
                  <span>สถานะ</span>
                  <strong>
                    <StatusBadge
                      status={props.detail.status}
                      dataReview={props.detail.dataReviewStatus}
                      paymentStatus={props.detail.paymentStatus}
                      receiptStatus={props.detail.receiptStatus}
                    />
                  </strong>
                </div>
                <div className="bo-detail-row">
                  <span>โทร</span>
                  <strong>{props.detail.phone || "—"}</strong>
                </div>
                <div className="bo-detail-row">
                  <span>อีเมล</span>
                  <strong>{props.detail.email || "—"}</strong>
                </div>
                {props.detail.legacyMemberId ? (
                  <div className="bo-detail-row">
                    <span>เลขสมาชิกเก่า</span>
                    <strong>
                      <code>{props.detail.legacyMemberId}</code>
                    </strong>
                  </div>
                ) : null}
                {props.detail.linkType === "legacy_bind" ? (
                  <div className="bo-detail-row">
                    <span>ประเภท</span>
                    <strong>
                      <span className="bo-badge temp">ผูกสมาชิกเก่า</span>
                    </strong>
                  </div>
                ) : null}
              </section>

              <MemberDetailExtras
                detail={props.detail}
                me={props.me}
                onDeleted={props.onDeleted}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function isAwaitingSlipReview(props: {
  dataReview?: string;
  paymentStatus?: string;
  receiptStatus?: string;
}): boolean {
  if (props.dataReview === "pending" || props.dataReview === "rejected") {
    return false;
  }
  if (props.paymentStatus === "slip_review") return true;
  if (
    props.receiptStatus === "temp" ||
    props.receiptStatus === "pending_review" ||
    props.receiptStatus === "rejected"
  ) {
    return props.dataReview === "approved";
  }
  return false;
}

function StatusBadge(props: {
  status: string;
  dataReview?: string;
  paymentStatus?: string;
  receiptStatus?: string;
}) {
  if (props.dataReview === "pending") {
    return <span className="bo-badge pending">รอตรวจข้อมูล</span>;
  }
  if (isAwaitingSlipReview(props)) {
    return <span className="bo-badge slip">รอตรวจสลิป</span>;
  }
  if (props.status === "near_expiry") {
    return <span className="bo-badge near-expiry">ใกล้หมดอายุ</span>;
  }
  if (props.status === "expired") {
    return <span className="bo-badge expired">หมดอายุ</span>;
  }
  if (props.status === "active") {
    return <span className="bo-badge active">สมาชิกสมบูรณ์</span>;
  }
  if (props.status === "temporary") {
    return <span className="bo-badge temp">สมาชิกชั่วคราว</span>;
  }
  if (props.status === "registered") {
    return <span className="bo-badge pending">สมัครแล้ว</span>;
  }
  if (props.status === "pending_review") {
    return <span className="bo-badge pending">รอตรวจสอบเอกสาร</span>;
  }
  return <span className="bo-badge pending">{props.status}</span>;
}

export default MemberDetailDrawer;
