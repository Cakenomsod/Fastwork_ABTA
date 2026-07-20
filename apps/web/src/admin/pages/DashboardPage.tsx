import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  fetchDashboard,
  fetchMemberDetail,
  MEMBER_SORT_OPTIONS,
  MEMBER_STATUS_FILTER_OPTIONS,
  RECEIPT_ID_T_FILTER_OPTIONS,
  memberNameParts,
  searchAdminMembers,
  type AdminMe,
  type DashboardData,
  type MemberDetail,
  type MemberListSort,
  type MemberListStatusFilter,
  type QueueItem,
  type ReceiptIdTFilter,
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
  const [receiptIdTFilter, setReceiptIdTFilter] = useState<"" | ReceiptIdTFilter>(
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
    Boolean(receiptIdTFilter) ||
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
    receiptIdT?: "" | ReceiptIdTFilter;
    sort: MemberListSort;
  }) {
    const q = opts.q?.trim() ?? "";
    const useApi =
      Boolean(q) ||
      Boolean(opts.status) ||
      Boolean(opts.receiptIdT) ||
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
        receiptIdT: opts.receiptIdT || undefined,
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
      receiptIdT: receiptIdTFilter,
      sort,
    });
  }

  async function onStatusChange(value: "" | MemberListStatusFilter) {
    setStatusFilter(value);
    await loadMemberList({
      q: query,
      status: value,
      receiptIdT: receiptIdTFilter,
      sort,
    });
  }

  async function onReceiptIdTChange(value: "" | ReceiptIdTFilter) {
    setReceiptIdTFilter(value);
    await loadMemberList({
      q: query,
      status: statusFilter,
      receiptIdT: value,
      sort,
    });
  }

  async function onSortChange(value: MemberListSort) {
    setSort(value);
    await loadMemberList({
      q: query,
      status: statusFilter,
      receiptIdT: receiptIdTFilter,
      sort: value,
    });
  }

  async function clearFilters() {
    setQuery("");
    setStatusFilter("");
    setReceiptIdTFilter("");
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

        <div className="bo-list-filters">
          <FilterSegGroup
            label="สถานะสมาชิก"
            options={MEMBER_STATUS_FILTER_OPTIONS}
            value={statusFilter}
            disabled={searching}
            onChange={(v) => void onStatusChange(v)}
          />
          <FilterSegGroup
            label="เลขใบเสร็จ (T)"
            options={RECEIPT_ID_T_FILTER_OPTIONS}
            value={receiptIdTFilter}
            disabled={searching}
            onChange={(v) => void onReceiptIdTChange(v)}
            compact
          />
          <div className="bo-filter-group bo-filter-group--sort">
            <span className="bo-filter-label" id="bo-sort-label">
              เรียงตาม
            </span>
            <SortMenu
              value={sort}
              disabled={searching}
              labelledBy="bo-sort-label"
              onChange={(v) => void onSortChange(v)}
            />
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

function FilterSegGroup<T extends string>(props: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: T) => void;
}) {
  const labelId = useId();
  return (
    <div
      className={`bo-filter-group${props.compact ? " bo-filter-group--compact" : ""}`}
    >
      <span className="bo-filter-label" id={labelId}>
        {props.label}
      </span>
      <div
        className="bo-seg"
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {props.options.map((opt) => {
          const active = props.value === opt.value;
          return (
            <button
              key={opt.value || "all"}
              type="button"
              role="radio"
              aria-checked={active}
              className={`bo-seg-btn${active ? " is-active" : ""}`}
              disabled={props.disabled}
              onClick={() => {
                if (!active) props.onChange(opt.value);
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SortMenu(props: {
  value: MemberListSort;
  disabled?: boolean;
  labelledBy: string;
  onChange: (value: MemberListSort) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected =
    MEMBER_SORT_OPTIONS.find((o) => o.value === props.value) ??
    MEMBER_SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div className="bo-menu" ref={rootRef}>
      <button
        type="button"
        className={`bo-menu-trigger${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={props.labelledBy}
        disabled={props.disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="bo-menu-trigger-text">{selected.label}</span>
        <span className="bo-menu-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          id={listId}
          className="bo-menu-list"
          role="listbox"
          aria-labelledby={props.labelledBy}
        >
          {MEMBER_SORT_OPTIONS.map((opt) => {
            const active = opt.value === props.value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`bo-menu-option${active ? " is-active" : ""}`}
                  onClick={() => {
                    setOpen(false);
                    if (!active) props.onChange(opt.value);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
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
