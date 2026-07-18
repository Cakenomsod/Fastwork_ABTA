import { useEffect, useState } from "react";
import {
  fetchDashboard,
  type DashboardData,
  type QueueItem,
} from "../../lib/admin-api";

export default function DashboardPage(props: {
  onCounts?: (c: { data: number; slips: number }) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboard()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        props.onCounts?.({
          data: d.pendingDataReviews,
          slips: d.pendingSlipReviews,
        });
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
  }, []);

  if (loading) {
    return <div className="bo-empty">กำลังโหลด Dashboard…</div>;
  }
  if (error) {
    return <div className="bo-error">{error}</div>;
  }
  if (!data) return null;

  return (
    <>
      <div className="bo-stats">
        <div className="bo-stat">
          <div className="num">{data.totalMembers}</div>
          <div className="lbl">สมาชิกทั้งหมด</div>
        </div>
        <div className="bo-stat">
          <div className="num">{data.pendingDataReviews}</div>
          <div className="lbl">รอตรวจข้อมูล</div>
        </div>
        <div className="bo-stat">
          <div className="num">{data.pendingSlipReviews}</div>
          <div className="lbl">รอตรวจสลิป</div>
        </div>
        <div className="bo-stat">
          <div className="num">{data.activeMembers}</div>
          <div className="lbl">สมาชิกสมบูรณ์</div>
        </div>
      </div>

      <div className="bo-panel">
        <div className="bo-panel-head">
          <h2>รายการล่าสุด</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--bo-muted)" }}>
            ชั่วคราว {data.temporaryMembers} ราย
          </span>
        </div>
        <div className="bo-table-wrap">
          {data.recent.length === 0 ? (
            <div className="bo-empty">
              <strong>ยังไม่มีข้อมูลสมาชิก</strong>
              เมื่อมีใบสมัครใหม่จะแสดงที่นี่
            </div>
          ) : (
            <table className="bo-table">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>เลขสมาชิก</th>
                  <th>สถานะ</th>
                  <th>การชำระ</th>
                  <th>อัปเดต</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((row: QueueItem) => (
                  <tr key={row.memberId}>
                    <td>{row.fullName}</td>
                    <td>
                      <code>{row.memberId}</code>
                    </td>
                    <td>
                      <StatusBadge status={row.status} dataReview={row.dataReviewStatus} />
                    </td>
                    <td>{row.receiptNumber || row.paymentStatus || "—"}</td>
                    <td>{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
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

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
