import { useEffect, useState, type FormEvent } from "react";
import {
  fetchDashboard,
  fetchMemberDetail,
  searchAdminMembers,
  type AdminMe,
  type DashboardData,
  type MemberDetail,
  type QueueItem,
} from "../../lib/admin-api";
import MemberIdsEditor from "../MemberIdsEditor";

export default function DashboardPage(props: {
  me: AdminMe;
  onCounts?: (c: { data: number; slips: number }) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<QueueItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);

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

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetchMemberDetail(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setSearchHits([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const items = await searchAdminMembers(q);
      setSearchHits(items);
      if (items.length === 1) {
        setSelectedId(items[0].memberId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "search_failed");
    } finally {
      setSearching(false);
    }
  }

  if (loading) {
    return <div className="bo-empty">กำลังโหลด Dashboard…</div>;
  }
  if (error && !data) {
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

      <div className="bo-split" style={{ marginBottom: "1.25rem" }}>
        <div className="bo-panel">
          <div className="bo-panel-head">
            <h2>ค้นหาสมาชิก</h2>
          </div>
          <form
            className="bo-form-grid"
            style={{ padding: "0.85rem 1rem" }}
            onSubmit={(e) => void onSearch(e)}
          >
            <div className="bo-field">
              <label htmlFor="bo-member-search">ชื่อ / เลขสมาชิก / โทร / อีเมล</label>
              <input
                id="bo-member-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="เช่น ABTA-2026-0001 หรือ สมชาย"
              />
            </div>
            <button
              type="submit"
              className="bo-btn bo-btn-primary"
              disabled={searching}
            >
              {searching ? "กำลังค้นหา…" : "ค้นหา"}
            </button>
          </form>
          {error ? (
            <div className="bo-error" style={{ margin: "0 1rem 0.75rem" }}>
              {error}
            </div>
          ) : null}
          {searchHits.length > 0 ? (
            <div className="bo-table-wrap">
              <table className="bo-table">
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th>เลขสมาชิก</th>
                    <th>ใบเสร็จ</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {searchHits.map((row) => (
                    <tr
                      key={row.memberId}
                      className={selectedId === row.memberId ? "selected" : ""}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedId(row.memberId)}
                    >
                      <td>{row.fullName}</td>
                      <td>
                        <code>{row.memberId}</code>
                      </td>
                      <td>{row.receiptNumber || "—"}</td>
                      <td>
                        <StatusBadge
                          status={row.status}
                          dataReview={row.dataReviewStatus}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <aside className="bo-detail">
          {!detail ? (
            <div className="bo-empty" style={{ padding: "1.5rem 0" }}>
              <strong>รายละเอียดสมาชิก</strong>
              ค้นหาแล้วคลิกแถวเพื่อแก้ไขเลขสมาชิก / ใบเสร็จ
            </div>
          ) : (
            <>
              <h3>{detail.fullName}</h3>
              <div className="bo-detail-row">
                <span>เลขสมาชิก</span>
                <strong>{detail.memberId}</strong>
              </div>
              <div className="bo-detail-row">
                <span>เลขใบเสร็จ</span>
                <strong>{detail.receiptNumber || "—"}</strong>
              </div>
              <div className="bo-detail-row">
                <span>สถานะ</span>
                <strong>
                  <StatusBadge
                    status={detail.status}
                    dataReview={detail.dataReviewStatus}
                  />
                </strong>
              </div>
              <div className="bo-detail-row">
                <span>โทร</span>
                <strong>{detail.phone || "—"}</strong>
              </div>
              <div className="bo-detail-row">
                <span>อีเมล</span>
                <strong>{detail.email || "—"}</strong>
              </div>

              <MemberIdsEditor
                detail={detail}
                me={props.me}
                onSaved={(m) => {
                  const prevId = detail.memberId;
                  setDetail(m);
                  setSelectedId(m.memberId);
                  setSearchHits((prev) =>
                    prev.map((row) =>
                      row.memberId === prevId || row.memberId === m.memberId
                        ? {
                            ...row,
                            memberId: m.memberId,
                            tempMemberId: m.tempMemberId,
                            receiptNumber: m.receiptNumber,
                            receiptStatus: m.receiptStatus,
                            status: m.status,
                          }
                        : row,
                    ),
                  );
                }}
              />
            </>
          )}
        </aside>
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
                  <tr
                    key={row.memberId}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedId(row.memberId)}
                  >
                    <td>{row.fullName}</td>
                    <td>
                      <code>{row.memberId}</code>
                    </td>
                    <td>
                      <StatusBadge
                        status={row.status}
                        dataReview={row.dataReviewStatus}
                      />
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
