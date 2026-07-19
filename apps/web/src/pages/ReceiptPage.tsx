import { useEffect, useState } from "react";
import { fetchMemberStatus, type PublicStatus } from "../lib/api";
import "./receipt.css";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; code: string }
  | { phase: "ready"; data: PublicStatus };

const ASSOC_NAME = "สมาคมการค้าผู้ประกอบการธุรกิจห้องเช่า";
const ASSOC_SHORT = "ABTA";

function errorCopy(code: string): { title: string; detail: string } {
  switch (code) {
    case "not_found":
      return {
        title: "ไม่พบข้อมูลสมาชิก",
        detail: "ไม่พบหมายเลขสมาชิกนี้ในระบบ กรุณาตรวจสอบลิงก์อีกครั้ง",
      };
    case "invalid_token":
    case "403":
      return {
        title: "ลิงก์ไม่ถูกต้อง",
        detail: "ลิงก์นี้หมดอายุหรือไม่ถูกต้อง กรุณาเปิดจาก LINE OA อีกครั้ง",
      };
    case "member_id_required":
      return {
        title: "ลิงก์ไม่สมบูรณ์",
        detail: "กรุณาเปิดใบเสร็จจากปุ่มใน LINE OA ของสมาคม",
      };
    default:
      return {
        title: "เกิดข้อผิดพลาด",
        detail: "ไม่สามารถโหลดใบเสร็จได้ กรุณาลองใหม่อีกครั้งภายหลัง",
      };
  }
}

function receiptBadge(key: string): { text: string; tone: string } {
  switch (key) {
    case "official":
      return { text: "ตัวจริง", tone: "rcpt-badge--official" };
    case "temp":
      return { text: "ชั่วคราว", tone: "rcpt-badge--temp" };
    case "pending_review":
      return { text: "รอตรวจ", tone: "rcpt-badge--pending" };
    case "rejected":
      return { text: "ไม่ผ่าน", tone: "rcpt-badge--rejected" };
    default:
      return { text: "ยังไม่ออก", tone: "rcpt-badge--none" };
  }
}

function formatAmount(amount: number | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `${amount.toLocaleString("th-TH")} บาท`;
}

function statusLink(memberId: string): string {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("t") ?? params.get("token") ?? "";
  const q = new URLSearchParams({ m: memberId });
  if (token) q.set("t", token);
  return `/status?${q.toString()}`;
}

export default function ReceiptPage() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const memberId = params.get("m") ?? params.get("memberId") ?? "";
    const token = params.get("t") ?? params.get("token") ?? "";

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
    <div className="rcpt-shell">
      <div className="rcpt-atmosphere no-print" aria-hidden />
      <main className="rcpt-wrap">
        {state.phase === "loading" && <ReceiptSkeleton />}
        {state.phase === "error" && <ReceiptError code={state.code} />}
        {state.phase === "ready" && <ReceiptDocument data={state.data} />}
      </main>
    </div>
  );
}

function ReceiptDocument({ data }: { data: PublicStatus }) {
  const badge = receiptBadge(data.receiptStatusKey);
  const hasReceipt =
    data.receiptStatusKey !== "none" && Boolean(data.receiptNumber);
  const issuedLabel =
    data.paymentDateLabel ?? data.updatedAtLabel ?? "—";

  return (
    <div className="rcpt-content">
      <div className="rcpt-toolbar no-print">
        <a className="rcpt-toolbar__link" href={statusLink(data.memberId)}>
          ← กลับไปสถานะสมาชิก
        </a>
        <button
          type="button"
          className="rcpt-print-btn"
          onClick={() => window.print()}
        >
          พิมพ์ / บันทึก PDF
        </button>
      </div>

      <article className="rcpt-sheet" aria-label="ใบเสร็จรับเงิน">
        <header className="rcpt-head">
          <div className="rcpt-brand">
            <span className="rcpt-brand__mark">{ASSOC_SHORT}</span>
            <div>
              <h1 className="rcpt-brand__title">ใบเสร็จรับเงิน</h1>
              <p className="rcpt-brand__assoc">{ASSOC_NAME}</p>
            </div>
          </div>
          <div className="rcpt-meta">
            <span className={`rcpt-badge ${badge.tone}`}>{badge.text}</span>
            <dl className="rcpt-meta__list">
              <div>
                <dt>เลขที่</dt>
                <dd>{data.receiptNumber ?? "—"}</dd>
              </div>
              <div>
                <dt>วันที่</dt>
                <dd>{issuedLabel}</dd>
              </div>
            </dl>
          </div>
        </header>

        <p className="rcpt-intro">
          ได้รับเงินจากสมาชิกดังรายการด้านล่างนี้แล้ว
        </p>

        <section className="rcpt-party">
          <h2 className="rcpt-section-title">ข้อมูลสมาชิก</h2>
          <dl className="rcpt-fields">
            <div>
              <dt>ชื่อ–นามสกุล</dt>
              <dd>{data.fullName || "—"}</dd>
            </div>
            {data.legalEntityName && (
              <div>
                <dt>นิติบุคคล / องค์กร</dt>
                <dd>{data.legalEntityName}</dd>
              </div>
            )}
            <div>
              <dt>หมายเลขสมาชิก</dt>
              <dd className="rcpt-mono">{data.memberId}</dd>
            </div>
          </dl>
        </section>

        <section className="rcpt-items">
          <h2 className="rcpt-section-title">รายการ</h2>
          <table className="rcpt-table">
            <thead>
              <tr>
                <th scope="col">รายละเอียด</th>
                <th scope="col" className="rcpt-table__num">
                  จำนวนเงิน
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  ค่าธรรมเนียมสมาชิก
                  {data.expiryLabel ? (
                    <span className="rcpt-table__note">
                      {" "}
                      · หมดอายุ {data.expiryLabel}
                    </span>
                  ) : null}
                </td>
                <td className="rcpt-table__num">
                  {formatAmount(data.amountThb)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">รวมทั้งสิ้น</th>
                <td className="rcpt-table__num rcpt-table__total">
                  {formatAmount(data.amountThb)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="rcpt-status-row">
          <div>
            <span className="rcpt-label">สถานะใบเสร็จ</span>
            <p>{data.receiptLabel}</p>
          </div>
          <div>
            <span className="rcpt-label">สถานะการชำระเงิน</span>
            <p>{data.paymentLabel}</p>
          </div>
        </section>

        {!hasReceipt && (
          <p className="rcpt-notice">
            ยังไม่ออกเลขใบเสร็จ — เอกสารนี้เป็นแบบร่างสำหรับตรวจสอบสถานะเท่านั้น
            จะมีเลขที่ใบเสร็จหลังนายทะเบียนอนุมัติข้อมูล
          </p>
        )}

        {data.receiptStatusKey === "temp" && (
          <p className="rcpt-notice">
            ใบเสร็จชั่วคราว — รอเหรัญญิกตรวจสอบสลิปแล้วจะเปลี่ยนเป็นใบเสร็จตัวจริง
          </p>
        )}

        {data.receiptStatusKey === "pending_review" && (
          <p className="rcpt-notice">
            อยู่ระหว่างรอเหรัญญิกตรวจสอบหลักฐานการชำระเงิน
          </p>
        )}

        <footer className="rcpt-foot">
          <div className="rcpt-sign">
            <div className="rcpt-sign__line" />
            <span>ผู้รับเงิน / เจ้าหน้าที่</span>
          </div>
          <div className="rcpt-sign">
            <div className="rcpt-sign__line" />
            <span>ตราประทับสมาคม</span>
          </div>
        </footer>

        <p className="rcpt-fineprint">
          เอกสารนี้ออกโดยระบบสมาชิก {ASSOC_SHORT} · สำหรับใช้เป็นหลักฐานการชำระเงิน
          {data.receiptStatusKey === "official"
            ? " (ใบเสร็จตัวจริง)"
            : " (สถานะตามที่ระบบบันทึก)"}
        </p>
      </article>
    </div>
  );
}

function ReceiptSkeleton() {
  return (
    <div className="rcpt-content" aria-busy>
      <div className="rcpt-sheet rcpt-sheet--skeleton">
        <div className="rcpt-sk" style={{ width: "45%", height: 28 }} />
        <div className="rcpt-sk" style={{ width: "70%", marginTop: 12 }} />
        <div className="rcpt-sk" style={{ width: "100%", height: 120, marginTop: 28 }} />
        <div className="rcpt-sk" style={{ width: "100%", height: 80, marginTop: 20 }} />
      </div>
    </div>
  );
}

function ReceiptError({ code }: { code: string }) {
  const { title, detail } = errorCopy(code);
  return (
    <div className="rcpt-error no-print">
      <div className="rcpt-error__badge">{ASSOC_SHORT}</div>
      <h1 className="rcpt-error__title">{title}</h1>
      <p className="rcpt-error__detail">{detail}</p>
    </div>
  );
}
