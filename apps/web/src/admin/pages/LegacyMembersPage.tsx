import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import {
  LEGACY_BIND_FILTER_OPTIONS,
  LEGACY_STATUS_EXCEL_CODE,
  LEGACY_STATUS_FILTER_OPTIONS,
  LEGACY_STATUS_LABEL,
  LIST_PAGE_SIZE_OPTIONS,
  searchLegacyMembersAdmin,
  type LegacyBindFilter,
  type LegacyMemberListRow,
  type LegacyStatusFilter,
  type ListPageSize,
} from "../../lib/admin-api";
import { clickableRowProps } from "../clickableRow";
import LegacyMemberDetailDrawer from "../LegacyMemberDetailDrawer";
import { ListPager } from "../ListPager";

const DEFAULT_PAGE_SIZE: ListPageSize = 10;

export default function LegacyMembersPage() {
  const [query, setQuery] = useState("");
  const [bindStatus, setBindStatus] = useState<LegacyBindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"" | LegacyStatusFilter>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_PAGE_SIZE);
  const [items, setItems] = useState<LegacyMemberListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [matched, setMatched] = useState(0);
  const [boundCount, setBoundCount] = useState(0);
  const [unboundCount, setUnboundCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: {
      q?: string;
      bindStatus?: LegacyBindFilter;
      status?: "" | LegacyStatusFilter;
      page?: number;
      pageSize?: ListPageSize;
    }) => {
      const nextPage = opts?.page ?? page;
      const nextSize = opts?.pageSize ?? pageSize;
      setLoading(true);
      setError(null);
      try {
        const out = await searchLegacyMembersAdmin({
          q: opts?.q ?? query,
          bindStatus: opts?.bindStatus ?? bindStatus,
          status: opts?.status ?? statusFilter,
          page: nextPage,
          pageSize: nextSize,
        });
        setItems(out.items);
        setTotal(out.total);
        setMatched(out.matched ?? out.items.length);
        setBoundCount(out.boundCount);
        setUnboundCount(out.unboundCount);
        setTruncated(out.truncated);
        setPageCount(out.pageCount ?? 1);
        setPage(out.page ?? nextPage);
        setPageSize(
          (LIST_PAGE_SIZE_OPTIONS.includes(out.pageSize as ListPageSize)
            ? out.pageSize
            : nextSize) as ListPageSize,
        );
        setSelectedId((prev) =>
          prev && out.items.some((r) => r.legacyMemberId === prev)
            ? prev
            : null,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "โหลดไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    },
    [bindStatus, page, pageSize, query, statusFilter],
  );

  useEffect(() => {
    void load({
      q: "",
      bindStatus: "all",
      status: "",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    void load({ page: 1 });
  }

  function onBindChange(next: LegacyBindFilter) {
    if (next === bindStatus) return;
    setBindStatus(next);
    setPage(1);
    void load({ bindStatus: next, page: 1 });
  }

  function onStatusChange(next: "" | LegacyStatusFilter) {
    if (next === statusFilter) return;
    setStatusFilter(next);
    setPage(1);
    void load({ status: next, page: 1 });
  }

  function onPageSizeChange(next: ListPageSize) {
    setPageSize(next);
    setPage(1);
    void load({ page: 1, pageSize: next });
  }

  function clearFilters() {
    setQuery("");
    setBindStatus("all");
    setStatusFilter("");
    setPage(1);
    void load({ q: "", bindStatus: "all", status: "", page: 1 });
  }

  function goPrev() {
    if (page <= 1 || loading) return;
    const next = page - 1;
    setPage(next);
    void load({ page: next });
  }

  function goNext() {
    if (page >= pageCount || loading) return;
    const next = page + 1;
    setPage(next);
    void load({ page: next });
  }

  const filtersActive =
    Boolean(query.trim()) || bindStatus !== "all" || Boolean(statusFilter);

  const rangeStart = matched === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, matched);
  const rangeLabel =
    matched === 0
      ? "0 รายการ"
      : `${rangeStart.toLocaleString("th-TH")}–${rangeEnd.toLocaleString("th-TH")} จาก ${matched.toLocaleString("th-TH")}`;

  const selectedRow =
    selectedId != null
      ? (items.find((r) => r.legacyMemberId === selectedId) ?? null)
      : null;

  const showInitialLoading = loading && items.length === 0;

  return (
    <div className="bo-legacy-page">
      <div className="bo-stats bo-stats--3" role="group" aria-label="สถิติสมาชิกเก่า">
        <button
          type="button"
          className={`bo-stat bo-stat--btn${bindStatus === "all" ? " is-active" : ""}`}
          aria-pressed={bindStatus === "all"}
          disabled={loading}
          onClick={() => onBindChange("all")}
        >
          <div className="num">{total.toLocaleString("th-TH")}</div>
          <div className="lbl">สมาชิกเก่าทั้งหมด</div>
        </button>
        <button
          type="button"
          className={`bo-stat bo-stat--btn${bindStatus === "bound" ? " is-active" : ""}`}
          aria-pressed={bindStatus === "bound"}
          disabled={loading}
          onClick={() => onBindChange("bound")}
        >
          <div className="num">{boundCount.toLocaleString("th-TH")}</div>
          <div className="lbl">ยืนยัน LINE แล้ว</div>
        </button>
        <button
          type="button"
          className={`bo-stat bo-stat--btn${bindStatus === "unbound" ? " is-active" : ""}`}
          aria-pressed={bindStatus === "unbound"}
          disabled={loading}
          onClick={() => onBindChange("unbound")}
        >
          <div className="num">{unboundCount.toLocaleString("th-TH")}</div>
          <div className="lbl">ยังไม่ยืนยัน</div>
        </button>
      </div>

      <div className="bo-panel bo-legacy-search-panel">
        <div className="bo-panel-head">
          <h2>ค้นหาสมาชิกเก่า</h2>
        </div>
        <form className="bo-legacy-search-form" onSubmit={onSearch}>
          <div className="bo-field">
            <label htmlFor="bo-legacy-search">
              ชื่อ / เลขสมาชิกเก่า / โทร / อีเมล / เลขสมาชิกใหม่
            </label>
            <input
              id="bo-legacy-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="เช่น 3-001 หรือ เพชญเกล้า"
            />
          </div>
          <button
            type="submit"
            className="bo-btn bo-btn-primary"
            disabled={loading}
          >
            {loading ? "กำลังค้นหา…" : "ค้นหา"}
          </button>
        </form>

        <div className="bo-list-filters bo-legacy-filters">
          <FilterSegGroup
            label="สถานะ LINE"
            options={LEGACY_BIND_FILTER_OPTIONS}
            value={bindStatus}
            disabled={loading}
            onChange={onBindChange}
          />
          <FilterSegGroup
            label="สถานะสมาชิกเก่า"
            options={LEGACY_STATUS_FILTER_OPTIONS}
            value={statusFilter}
            disabled={loading}
            onChange={onStatusChange}
            titles
          />
          <div className="bo-list-toolbar-actions">
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              disabled={loading || !filtersActive}
              onClick={clearFilters}
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {error ? <div className="bo-error bo-legacy-inline-error">{error}</div> : null}
        {truncated ? (
          <p className="bo-legacy-hint">
            แสดงสูงสุดตาม limit ของระบบ — ถ้าข้อมูลเยอะมากให้ใช้คำค้นหาเพิ่ม
          </p>
        ) : null}
      </div>

      <div className="bo-panel" aria-busy={loading || undefined}>
        <div className="bo-panel-head">
          <h2>รายชื่อสมาชิกเก่า</h2>
          <span className="bo-list-meta" aria-live="polite">
            {loading && items.length > 0 ? `กำลังอัปเดต… ${rangeLabel}` : rangeLabel}
          </span>
        </div>
        <div className="bo-table-wrap">
          {showInitialLoading ? (
            <div className="bo-empty" role="status">
              กำลังโหลดรายการ…
            </div>
          ) : items.length === 0 ? (
            <div className="bo-empty">
              <strong>
                {filtersActive
                  ? "ไม่พบสมาชิกเก่าตามเงื่อนไข"
                  : "ยังไม่มีข้อมูลสมาชิกเก่า"}
              </strong>
              {filtersActive
                ? "ลองเปลี่ยนตัวกรองหรือคำค้นหา"
                : "นำเข้าไฟล์ Excel จากเมนูนำเข้า Excel ก่อน"}
            </div>
          ) : (
            <table
              className={`bo-table bo-table--cards${loading ? " is-refreshing" : ""}`}
            >
              <thead>
                <tr>
                  <th>เลขสมาชิกเก่า</th>
                  <th>ชื่อ</th>
                  <th>ประเภท</th>
                  <th>สถานะ</th>
                  <th>LINE</th>
                  <th>เลขสมาชิกใหม่</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const selected = selectedId === row.legacyMemberId;
                  const statusLabel =
                    LEGACY_STATUS_LABEL[row.status] ?? row.status;
                  const statusCode = LEGACY_STATUS_EXCEL_CODE[row.status];
                  return (
                    <tr
                      key={row.legacyMemberId}
                      className={`bo-row-clickable${selected ? " selected" : ""}`}
                      {...clickableRowProps({
                        onActivate: () => setSelectedId(row.legacyMemberId),
                        label: `เปิดรายละเอียด ${row.fullName || row.legacyMemberId}`,
                        selected,
                      })}
                    >
                      <td data-label="เลขสมาชิกเก่า">
                        <code>{row.legacyMemberId}</code>
                      </td>
                      <td data-label="ชื่อ">
                        <div className="bo-legacy-name">
                          <strong>{row.fullName || "—"}</strong>
                          {row.buildingName ? (
                            <span>{row.buildingName}</span>
                          ) : null}
                        </div>
                      </td>
                      <td data-label="ประเภท">{row.memberTypeLabel || "—"}</td>
                      <td data-label="สถานะ">
                        <span
                          className={`bo-badge ${legacyStatusClass(row.status)}`}
                          title={statusCode}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td data-label="LINE">
                        {row.lineBound ? (
                          <span className="bo-badge active">ยืนยันแล้ว</span>
                        ) : (
                          <span className="bo-badge pending">ยังไม่ยืนยัน</span>
                        )}
                      </td>
                      <td data-label="เลขสมาชิกใหม่">
                        {row.boundMemberId ? (
                          <code>{row.boundMemberId}</code>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {matched > 0 ? (
          <ListPager
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            disabled={loading}
            onPrev={goPrev}
            onNext={goNext}
            onPageSizeChange={onPageSizeChange}
          />
        ) : null}
      </div>

      <LegacyMemberDetailDrawer
        open={selectedId !== null}
        row={selectedRow}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function FilterSegGroup<T extends string>(props: {
  label: string;
  options: Array<{ value: T; label: string; code?: string }>;
  value: T;
  disabled?: boolean;
  titles?: boolean;
  onChange: (value: T) => void;
}) {
  const labelId = useId();
  return (
    <div className="bo-filter-group">
      <span className="bo-filter-label" id={labelId}>
        {props.label}
      </span>
      <div className="bo-seg" role="group" aria-labelledby={labelId}>
        {props.options.map((opt) => {
          const active = props.value === opt.value;
          return (
            <button
              key={opt.value || "all"}
              type="button"
              className={`bo-seg-btn${active ? " is-active" : ""}`}
              aria-pressed={active}
              title={props.titles ? opt.code : undefined}
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

function legacyStatusClass(status: string): string {
  if (status === "active") return "active";
  if (status === "expired") return "expired";
  if (status === "pending") return "pending";
  return "temp";
}
