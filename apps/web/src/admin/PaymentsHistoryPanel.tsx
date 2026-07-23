import { useEffect, useState } from "react";
import {
  fetchMemberPayments,
  type MemberPaymentRow,
} from "../lib/admin-api";
import SlipImage from "./SlipImage";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("th-TH", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function formatAmount(amount?: number): string {
  if (amount == null) return "—";
  return `${amount.toLocaleString("th-TH")} บาท`;
}

function receiptDisplay(row: MemberPaymentRow): string {
  if (row.receiptNumber) return row.receiptNumber;
  if (row.pendingReceiptNumber) return row.pendingReceiptNumber;
  return "";
}

export interface PaymentsHistoryPanelProps {
  memberId: string;
}

export function PaymentsHistoryPanel(props: PaymentsHistoryPanelProps) {
  const [items, setItems] = useState<MemberPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slipPaymentId, setSlipPaymentId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSlipPaymentId(null);
    void fetchMemberPayments(props.memberId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [props.memberId]);

  const slipRow = items.find((r) => r.paymentId === slipPaymentId);

  return (
    <div className="bo-panel-nested">
      <div className="bo-panel-head">
        <h2>ประวัติชำระเงิน</h2>
        {!loading && !error ? (
          <span style={{ fontSize: "0.78rem", color: "var(--bo-muted)" }}>
            {items.length} รายการ
          </span>
        ) : null}
      </div>
      {error ? (
        <div className="bo-error" style={{ margin: "0.75rem" }}>
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="bo-empty" style={{ padding: "1.25rem" }}>
          กำลังโหลดประวัติ…
        </div>
      ) : items.length === 0 ? (
        <div className="bo-empty" style={{ padding: "1.25rem" }}>
          <strong>ไม่มีประวัติชำระเงิน</strong>
          ยังไม่พบรายการสมัครหรือต่ออายุในระบบ
        </div>
      ) : (
        <>
          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>รายการ</th>
                  <th>จำนวน</th>
                  <th>ใบเสร็จ</th>
                  <th>สถานะ</th>
                  <th>สลิป</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const receipt = receiptDisplay(row);
                  const viewing = slipPaymentId === row.paymentId;
                  return (
                    <tr key={row.paymentId}>
                      <td>{formatDate(row.createdAt)}</td>
                      <td>{row.paymentKindLabel}</td>
                      <td>{formatAmount(row.amount)}</td>
                      <td>
                        {receipt ? <code>{receipt}</code> : "—"}
                        {row.receiptStatusLabel ? (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--bo-muted)",
                              marginTop: "0.15rem",
                            }}
                          >
                            {row.receiptStatusLabel}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {row.statusLabel}
                        {row.rejectReason ? (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--bo-danger)",
                              marginTop: "0.15rem",
                            }}
                          >
                            {row.rejectReason}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {row.hasSlip && row.slipViewUrl ? (
                          <button
                            type="button"
                            className="bo-btn bo-btn-ghost"
                            style={{
                              padding: "0.25rem 0.55rem",
                              fontSize: "0.8rem",
                              minHeight: "2rem",
                            }}
                            aria-expanded={viewing}
                            onClick={() =>
                              setSlipPaymentId(viewing ? null : row.paymentId)
                            }
                          >
                            {viewing ? "ปิด" : "ดู"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {slipRow?.slipViewUrl ? (
            <div style={{ padding: "0.75rem 1rem 1rem" }}>
              <p
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "0.8rem",
                  color: "var(--bo-muted)",
                }}
              >
                สลิป — {slipRow.paymentKindLabel}
                {receiptDisplay(slipRow)
                  ? ` · ${receiptDisplay(slipRow)}`
                  : ""}
              </p>
              <SlipImage
                slipViewUrl={slipRow.slipViewUrl}
                alt={`สลิป ${slipRow.paymentKindLabel}`}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default PaymentsHistoryPanel;
