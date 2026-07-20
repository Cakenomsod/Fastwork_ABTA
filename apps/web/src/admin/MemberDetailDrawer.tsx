import { useEffect, useId, useRef } from "react";
import type { AdminMe, MemberDetail } from "../lib/admin-api";
import MemberDetailExtras from "./MemberDetailExtras";

export interface MemberDetailDrawerProps {
  open: boolean;
  loading?: boolean;
  detail: MemberDetail | null;
  me: AdminMe;
  onClose: () => void;
  onSaved: (member: MemberDetail) => void;
  onDeleted: (memberId: string) => void;
}

export function MemberDetailDrawer(props: MemberDetailDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

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
                : (props.detail?.fullName ?? "—")}
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
          ) : !props.detail ? (
            <div className="bo-empty" style={{ padding: "2rem 0" }}>
              <strong>ไม่พบข้อมูล</strong>
              ไม่สามารถโหลดรายละเอียดสมาชิกได้
            </div>
          ) : (
            <>
              <section className="bo-detail-modal-summary">
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
                onSaved={props.onSaved}
                onDeleted={props.onDeleted}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge(props: { status: string; dataReview?: string }) {
  if (props.dataReview === "pending") {
    return <span className="bo-badge pending">รอตรวจข้อมูล</span>;
  }
  if (props.status === "active") {
    return <span className="bo-badge active">สมาชิกสมบูรณ์</span>;
  }
  if (props.status === "temporary") {
    return <span className="bo-badge temp">สมาชิกชั่วคราว</span>;
  }
  return <span className="bo-badge pending">{props.status}</span>;
}

export default MemberDetailDrawer;
