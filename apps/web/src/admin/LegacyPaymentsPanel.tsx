import { useEffect, useState } from "react";
import {
  fetchLegacyPayments,
  type LegacyPaymentRow,
} from "../lib/admin-api";
import DriveFileCard from "./DriveFileCard";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const hasTime = iso.includes("T") && !iso.endsWith("T00:00:00.000Z");
    return hasTime
      ? d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
      : d.toLocaleDateString("th-TH", { dateStyle: "medium" });
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

  const showReceipt = items.some((row) => Boolean(row.receiptNumber));
  const showAmount = items.some((row) => row.amount != null);
  const showExpiry = items.some((row) => Boolean(row.expiryDate));
  const showSlip = items.some(
    (row) => Boolean(row.slipUrl) || (row.slipUrls?.length ?? 0) > 0,
  );

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
                {showReceipt ? <th>ใบเสร็จ</th> : null}
                {showAmount ? <th>จำนวน</th> : null}
                <th>รายการ</th>
                {showExpiry ? <th>หมดอายุ</th> : null}
                <th>วันที่</th>
                {showSlip ? <th>สลิป</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => {
                const slips =
                  row.slipUrls && row.slipUrls.length > 0
                    ? row.slipUrls
                    : row.slipUrl
                      ? [row.slipUrl]
                      : [];
                return (
                  <tr key={`${row.receiptNumber ?? "row"}-${i}`}>
                    {showReceipt ? (
                      <td>
                        {row.receiptNumber ? (
                          <code>{row.receiptNumber}</code>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                    {showAmount ? <td>{formatAmount(row.amount)}</td> : null}
                    <td>{row.item || "—"}</td>
                    {showExpiry ? <td>{formatDate(row.expiryDate)}</td> : null}
                    <td>{formatDate(row.transferredAt)}</td>
                    {showSlip ? (
                      <td>
                        {slips.length ? (
                          <div className="bo-legacy-slip-cell">
                            {slips.map((url) => (
                              <DriveFileCard
                                key={url}
                                url={url}
                                label="สลิปโอนเงิน"
                              />
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LegacyPaymentsPanel;
