import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  fetchDashboard,
  fetchMemberDetail,
  MEMBER_ID_T_FILTER_OPTIONS,
  MEMBER_SORT_OPTIONS,
  MEMBER_STATUS_FILTER_OPTIONS,
  memberNameParts,
  searchAdminMembers,
  type AdminMe,
  type DashboardData,
  type MemberDetail,
  type MemberIdTFilter,
  type MemberListSort,
  type MemberListStatusFilter,
  type QueueItem,
} from "../../lib/admin-api";
import MemberDetailDrawer from "../MemberDetailDrawer";

const DEFAULT_SORT: MemberListSort = "updated_desc";

export default function DashboardPage(props: {
  me: AdminMe;
  onCounts?: (c: { data: number; slips: number }) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | MemberListStatusFilter>(
    "",
  );
  const [memberIdTFilter, setMemberIdTFilter] = useState<"" | MemberIdTFilter>(
    "",
  );
  const [sort, setSort] = useState<MemberListSort>(DEFAULT_SORT);

  const [listRows, setListRows] = useState<QueueItem[]>([]);
  const [listMode, setListMode] = useState<"recent" | "filtered">("recent");
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filtersActive =
    Boolean(statusFilter) ||
    Boolean(memberIdTFilter) ||
    sort !== DEFAULT_SORT;

  const reloadDashboard = useCallback(async () => {
    const d = await fetchDashboard();
    setData(d);
    props.onCounts?.({
      data: d.pendingDataReviews,
      slips: d.pendingSlipReviews,
    });
    return d;
  }, [props.onCounts]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reloadDashboard()
      .then((d) => {
        if (!cancelled) {
          setListRows(d.recent);
          setListMode("recent");
        }
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
  }, [reloadDashboard]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    fetchMemberDetail(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function openMember(memberId: string) {
    setSelectedId(memberId);
    setError(null);
  }

  function closeDrawer() {
    setSelectedId(null);
    setDetail(null);
  }

  async function loadMemberList(opts: {
    q?: string;
    status?: "" | MemberListStatusFilter;
    memberIdT?: "" | MemberIdTFilter;
    sort: MemberListSort;
  }) {
    const q = opts.q?.trim() ?? "";
    const useApi =
      Boolean(q) ||
      Boolean(opts.status) ||
      Boolean(opts.memberIdT) ||
      opts.sort !== DEFAULT_SORT;

    if (!useApi) {
      const d = data ?? (await reloadDashboard());
      setListRows(d.recent);
      setListMode("recent");
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const items = await searchAdminMembers({
        q: q || undefined,
        status: opts.status || undefined,
        memberIdT: opts.memberIdT || undefined,
        sort: opts.sort,
        limit: q ? 30 : 50,
      });
      setListRows(items);
      setListMode("filtered");
      if (q && items.length === 1) {
        openMember(items[0].memberId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "search_failed");
    } finally {
      setSearching(false);
    }
  }

  async function onMemberDeleted(memberId: string) {
    closeDrawer();
    setListRows((prev) => prev.filter((row) => row.memberId !== memberId));
    try {
      await reloadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "reload_failed");
    }
  }

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await loadMemberList({
      q: query,
      status: statusFilter,
      memberIdT: memberIdTFilter,
      sort,
    });
  }

  async function onStatusChange(value: "" | MemberListStatusFilter) {
    setStatusFilter(value);
    await loadMemberList({
      q: query,
      status: value,
      memberIdT: memberIdTFilter,
      sort,
    });
  }

  async function onMemberIdTChange(value: "" | MemberIdTFilter) {
    setMemberIdTFilter(value);
    await loadMemberList({
      q: query,
      status: statusFilter,
      memberIdT: value,
      sort,
    });
  }

  async function onSortChange(value: MemberListSort) {
    setSort(value);
    await loadMemberList({
      q: query,
      status: statusFilter,
      memberIdT: memberIdTFilter,
      sort: value,
    });
  }

  async function clearFilters() {
    setQuery("");
    setStatusFilter("");
    setMemberIdTFilter("");
    setSort(DEFAULT_SORT);
    setSearching(true);
    setError(null);
    try {
      const d = await reloadDashboard();
      setListRows(d.recent);
      setListMode("recent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "reload_failed");
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

  const listTitle =
    listMode === "filtered"
      ? query.trim()
        ? "ผลการค้นหา"
        : "รายการที่กรอง"
      : "รายการล่าสุด";

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

      <div className="bo-panel" style={{ marginBottom: "1.25rem" }}>
        <div className="bo-panel-head">
          <h2>ค้นหาสมาชิก</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--bo-muted)" }}>
            คลิกแถวเพื่อเปิดรายละเอียด
          </span>
        </div>
        <form
          className="bo-form-grid"
          style={{ padding: "0.85rem 1rem 0.5rem" }}
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

        <div className="bo-list-toolbar">
          <div className="bo-field">
            <label htmlFor="bo-filter-status">สถานะสมาชิก</label>
            <select
              id="bo-filter-status"
              value={statusFilter}
              onChange={(e) =>
                void onStatusChange(
                  e.target.value as "" | MemberListStatusFilter,
                )
              }
              disabled={searching}
            >
              {MEMBER_STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bo-field">
            <label htmlFor="bo-filter-t">เลขสมาชิก (T)</label>
            <select
              id="bo-filter-t"
              value={memberIdTFilter}
              onChange={(e) =>
                void onMemberIdTChange(e.target.value as "" | MemberIdTFilter)
              }
              disabled={searching}
            >
              {MEMBER_ID_T_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bo-field">
            <label htmlFor="bo-sort">เรียงตาม</label>
            <select
              id="bo-sort"
              value={sort}
              onChange={(e) =>
                void onSortChange(e.target.value as MemberListSort)
              }
              disabled={searching}
            >
              {MEMBER_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bo-list-toolbar-actions">
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={searching || (!filtersActive && !query.trim())}
              onClick={() => void clearFilters()}
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {error ? (
          <div className="bo-error" style={{ margin: "0 1rem 0.75rem" }}>
            {error}
          </div>
        ) : null}
      </div>

      <div className="bo-panel">
        <div className="bo-panel-head">
          <h2>{listTitle}</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--bo-muted)" }}>
            {listMode === "recent"
              ? `ชั่วคราว ${data.temporaryMembers} ราย · `
              : `${listRows.length} รายการ · `}
            คลิกแถวเพื่อเปิดรายละเอียด
          </span>
        </div>
        <div className="bo-table-wrap">
          {searching ? (
            <div className="bo-empty">กำลังโหลดรายการ…</div>
          ) : listRows.length === 0 ? (
            <div className="bo-empty">
              <strong>
                {listMode === "filtered"
                  ? "ไม่พบสมาชิกตามเงื่อนไข"
                  : "ยังไม่มีข้อมูลสมาชิก"}
              </strong>
              {listMode === "filtered"
                ? "ลองเปลี่ยนตัวกรองหรือคำค้นหา"
                : "เมื่อมีใบสมัครใหม่จะแสดงที่นี่"}
            </div>
          ) : (
            <table className="bo-table">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>นามสกุล</th>
                  <th>เลขสมาชิก</th>
                  <th>ใบเสร็จ</th>
                  <th>สถานะ</th>
                  <th>อัปเดต</th>
                </tr>
              </thead>
              <tbody>
                {listRows.map((row: QueueItem) => {
                  const name = memberNameParts(row);
                  return (
                    <tr
                      key={row.memberId}
                      className={`bo-row-clickable${selectedId === row.memberId ? " selected" : ""}`}
                      onClick={() => openMember(row.memberId)}
                    >
                      <td>{name.firstName}</td>
                      <td>{name.lastName}</td>
                      <td>
                        <code>{row.memberId}</code>
                      </td>
                      <td>{row.receiptNumber || "—"}</td>
                      <td>
                        <StatusBadge
                          status={row.status}
                          dataReview={row.dataReviewStatus}
                          paymentStatus={row.paymentStatus}
                          receiptStatus={row.receiptStatus}
                        />
                      </td>
                      <td>{formatDate(row.updatedAt ?? row.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <MemberDetailDrawer
        open={selectedId !== null}
        loading={detailLoading}
        detail={detail}
        me={props.me}
        onClose={closeDrawer}
        onDeleted={(id) => void onMemberDeleted(id)}
      />
    </>
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
