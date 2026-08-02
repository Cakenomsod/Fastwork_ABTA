import { useEffect, useState } from "react";
import { fetchMemberStatus, type PublicStatus } from "../lib/api";
import { liffPageUrl, readMemberStatusParams } from "../lib/member-links";
import "./status.css";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; code: string }
  | { phase: "ready"; data: PublicStatus };

const TONE_LABEL: Record<PublicStatus["statusTone"], string> = {
  active: "status--active",
  temporary: "status--temporary",
  warning: "status--warning",
  danger: "status--danger",
  neutral: "status--neutral",
};

function errorCopy(code: string): { title: string; detail: string } {
  switch (code) {
    case "not_found":
      return {
        title: "ไม่พบข้อมูลสมาชิก",
        detail: "ไม่พบหมายเลขสมาชิกนี้ในระบบ กรุณาตรวจสอบลิงก์อีกครั้ง",
      };
    case "invalid_token":
    case "forbidden":
    case "403":
      return {
        title: "ลิงก์ไม่ถูกต้อง",
        detail: "ลิงก์นี้หมดอายุหรือไม่ถูกต้อง กรุณาเปิดจาก LINE OA อีกครั้ง",
      };
    case "member_id_required":
      return {
        title: "ลิงก์ไม่สมบูรณ์",
        detail: "กรุณาเปิดหน้าสถานะจากปุ่มใน LINE OA ของสมาคม",
      };
    default:
      return {
        title: "เกิดข้อผิดพลาด",
        detail: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้งภายหลัง",
      };
  }
}

type ErrorCta =
  | { kind: "link"; href: string; label: string }
  | { kind: "retry"; label: string }
  | null;

function errorCta(code: string): ErrorCta {
  switch (code) {
    case "not_found":
      return {
        kind: "link",
        href: liffPageUrl("/register"),
        label: "ไปหน้าสมัครสมาชิก",
      };
    case "invalid_token":
    case "forbidden":
    case "403":
    case "member_id_required":
      return {
        kind: "link",
        href: liffPageUrl("/register"),
        label: "เปิดจาก LINE OA อีกครั้ง",
      };
    default:
      return { kind: "retry", label: "ลองใหม่อีกครั้ง" };
  }
}

export default function StatusPage() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    const { memberId, token } = readMemberStatusParams();

    if (!memberId) {
      setState({ phase: "error", code: "member_id_required" });
      return;
    }

    let active = true;
    fetchMemberStatus(memberId, token)
      .then((data) => active && setState({ phase: "ready", data }))
      .catch((err: Error & { code?: string }) =>
        active && setState({ phase: "error", code: err.code ?? "unknown" }),
      );
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="status-shell">
      <div className="status-atmosphere" aria-hidden />
      <main className="status-wrap">
        {state.phase === "loading" && <StatusSkeleton />}
        {state.phase === "error" && <StatusError code={state.code} />}
        {state.phase === "ready" && <StatusCard data={state.data} />}
      </main>
    </div>
  );
}

function receiptHref(memberId: string, receiptUrl?: string): string {
  if (receiptUrl) return receiptUrl;
  const params = new URLSearchParams(window.location.search);
  const token = params.get("t") ?? params.get("token") ?? "";
  const q = new URLSearchParams({ m: memberId });
  if (token) q.set("t", token);
  return `/receipt?${q.toString()}`;
}

function StatusCard({ data }: { data: PublicStatus }) {
  const onCardPath =
    typeof window !== "undefined" &&
    (window.location.pathname.replace(/\/+$/, "") === "/card" ||
      window.location.pathname.endsWith("/card"));
  const expiryHint =
    data.expiryDaysLeft === undefined
      ? undefined
      : data.expiryDaysLeft < 0
        ? "หมดอายุแล้ว"
        : `อีก ${data.expiryDaysLeft} วัน`;
  const openReceipt = receiptHref(data.memberId, data.receiptUrl);
  const showRenew =
    data.canRenew &&
    (data.statusKey === "near_expiry" || data.statusKey === "expired");

  return (
    <div className="status-content" aria-live="polite">
      <section className="mcard">
        <div className="mcard__sheen" aria-hidden />
        <header className="mcard__top">
          <span className="mcard__brand">ABTA</span>
          <span className="mcard__kind">บัตรสมาชิกดิจิทัล</span>
        </header>
        <p className="mcard__assoc">สมาคมการค้าผู้ประกอบการธุรกิจห้องเช่า</p>

        <div className="mcard__person">
          <h1 className="mcard__name">{data.fullName || "สมาชิก ABTA"}</h1>
          {data.legalEntityName && (
            <p className="mcard__entity">{data.legalEntityName}</p>
          )}
        </div>

        <div className="mcard__idrow">
          <div>
            <span className="mcard__label">หมายเลขสมาชิก</span>
            <span className="mcard__id">{data.memberId}</span>
          </div>
          <span className={`status-pill ${TONE_LABEL[data.statusTone]}`}>
            {data.statusLabel}
          </span>
        </div>

        <div className="mcard__expiry">
          <span className="mcard__label">วันหมดอายุ</span>
          <span className="mcard__expiry-value">
            {data.expiryLabel ?? "—"}
            {expiryHint && <em className="mcard__expiry-hint"> · {expiryHint}</em>}
          </span>
        </div>
      </section>

      <section className="detail-card">
        <DetailRow label="สถานะการชำระเงิน" value={data.paymentLabel} />
        <DetailRow
          label="ใบเสร็จ"
          value={data.receiptLabel}
          sub={data.receiptNumber}
        />
        <DetailRow label="การสมัครสัมมนา" value={data.seminarLabel} />
        {data.seminarTitle ? (
          <DetailRow label="งานสัมมนา" value={data.seminarTitle} />
        ) : null}
        {data.seminarTitle && data.seminarLabel !== "ยังไม่ได้ลงทะเบียน" ? (
          <div
            className="actions"
            style={{ marginTop: 0, marginBottom: "0.75rem" }}
          >
            <a className="btn btn--ghost" href={liffPageUrl("/seminar?mine=1")}>
              ดูรายละเอียดสัมมนา
            </a>
          </div>
        ) : null}
        {data.renewalLabel ? (
          <DetailRow label="การต่ออายุ" value={data.renewalLabel} />
        ) : null}
        {data.updatedAtLabel && (
          <DetailRow label="อัปเดตล่าสุด" value={data.updatedAtLabel} muted />
        )}
      </section>

      {data.canResubmit && (
        <section className="actions">
          {data.rejectReason && (
            <p className="status-reject" role="status">
              เหตุผลที่ไม่ผ่าน: {data.rejectReason}
            </p>
          )}
          <a className="btn btn--primary" href={liffPageUrl("/register")}>
            แก้ไขข้อมูลแล้วส่งใหม่
          </a>
        </section>
      )}

      {data.canResubmitSlip && (
        <section className="actions">
          {data.rejectReason && (
            <p className="status-reject" role="status">
              เหตุผลที่สลิปไม่ผ่าน: {data.rejectReason}
            </p>
          )}
          <a className="btn btn--primary" href={liffPageUrl("/slip")}>
            ส่งสลิปใหม่
          </a>
        </section>
      )}

      {!data.canResubmit && !data.canResubmitSlip && (
        <section className="actions">
          {showRenew && (
            <a className="btn btn--primary" href={liffPageUrl("/renew")}>
              ต่ออายุสมาชิก
            </a>
          )}
          {data.memberCardUrl && !onCardPath && (
            <a
              className={showRenew ? "btn btn--ghost" : "btn btn--primary"}
              href={data.memberCardUrl}
            >
              เปิดบัตรสมาชิก
            </a>
          )}
          {onCardPath ? (
            <p className="foot-note" style={{ marginTop: 0 }}>
              บันทึกภาพหน้าจอเพื่อเก็บบัตรสมาชิกได้ครับ
            </p>
          ) : null}
          <a className="btn btn--ghost" href={openReceipt}>
            เปิดใบเสร็จ
          </a>
        </section>
      )}

      <p className="foot-note">
        ตรวจสอบสถานะสมาชิกผ่าน LINE OA · พิมพ์ “เช็คสถานะ” ได้ทุกเมื่อ
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  sub,
  muted,
}: {
  label: string;
  value: string;
  sub?: string;
  muted?: boolean;
}) {
  return (
    <div className={`detail-row${muted ? " detail-row--muted" : ""}`}>
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__value">
        {value}
        {sub && <em className="detail-row__sub">{sub}</em>}
      </span>
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div
      className="status-content"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">กำลังโหลดสถานะสมาชิก…</span>
      <div className="mcard mcard--skeleton" aria-hidden="true">
        <div className="sk sk--line" style={{ width: "40%" }} />
        <div className="sk sk--line" style={{ width: "70%", marginTop: 24 }} />
        <div className="sk sk--line" style={{ width: "55%" }} />
        <div className="sk sk--block" style={{ marginTop: 24 }} />
      </div>
      <div className="detail-card" aria-hidden="true">
        <div className="sk sk--line" />
        <div className="sk sk--line" />
        <div className="sk sk--line" />
      </div>
    </div>
  );
}

function StatusError({ code }: { code: string }) {
  const { title, detail } = errorCopy(code);
  const cta = errorCta(code);
  return (
    <div className="status-error" role="alert">
      <div className="status-error__badge">ABTA</div>
      <h1 className="status-error__title">{title}</h1>
      <p className="status-error__detail">{detail}</p>
      <p className="status-error__hint">
        เปิดจาก LINE OA ของสมาคม · หรือพิมพ์ “เช็คสถานะ” ได้ทุกเมื่อ
      </p>
      {cta && (
        <div className="status-error__actions">
          {cta.kind === "link" ? (
            <a className="btn btn--primary" href={cta.href}>
              {cta.label}
            </a>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => window.location.reload()}
            >
              {cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
