import { useEffect, useState } from "react";
import {
  fetchLegacyPayments,
  type LegacyPaymentRow,
} from "../lib/admin-api";

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

export interface LegacyPaymentsPanelProps {
  legacyMemberId: string;
}

export function LegacyPaymentsPanel(props: LegacyPaymentsPanelProps) {
  const [items, setItems] = useState<LegacyPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchLegacyPayments(props.legacyMemberId)
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
  }, [props.legacyMemberId]);

  return (
    <div className="bo-panel-nested">
      <div className="bo-panel-head">
        <h2>ประวัติชำระเงิน (Legacy)</h2>
        <span style={{ fontSize: "0.78rem", color: "var(--bo-muted)" }}>
          <code>{props.legacyMemberId}</code>
        </span>
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
          ไม่พบรายการจากข้อมูลเก่า
        </div>
      ) : (
        <div className="bo-table-wrap">
          <table className="bo-table">
            <thead>
              <tr>
                <th>ใบเสร็จ</th>
                <th>จำนวน</th>
                <th>รายการ</th>
                <th>หมดอายุ</th>
                <th>วันที่</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={`${row.receiptNumber ?? "row"}-${i}`}>
                  <td>{row.receiptNumber ? <code>{row.receiptNumber}</code> : "—"}</td>
                  <td>{formatAmount(row.amount)}</td>
                  <td>{row.item || "—"}</td>
                  <td>{formatDate(row.expiryDate)}</td>
                  <td>{formatDate(row.transferredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LegacyPaymentsPanel;
