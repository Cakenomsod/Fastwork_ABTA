import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  LEGACY_BIND_FILTER_OPTIONS,
  LEGACY_STATUS_FILTER_OPTIONS,
  LEGACY_STATUS_LABEL,
  searchLegacyMembersAdmin,
  type LegacyBindFilter,
  type LegacyMemberListRow,
  type LegacyStatusFilter,
} from "../../lib/admin-api";

export default function LegacyMembersPage() {
  const [query, setQuery] = useState("");
  const [bindStatus, setBindStatus] = useState<LegacyBindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"" | LegacyStatusFilter>("");
  const [items, setItems] = useState<LegacyMemberListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [boundCount, setBoundCount] = useState(0);
  const [unboundCount, setUnboundCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: {
      q?: string;
      bindStatus?: LegacyBindFilter;
      status?: "" | LegacyStatusFilter;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const out = await searchLegacyMembersAdmin({
          q: opts?.q ?? query,
          bindStatus: opts?.bindStatus ?? bindStatus,
          status: opts?.status ?? statusFilter,
        });
        setItems(out.items);
        setTotal(out.total);
        setBoundCount(out.boundCount);
        setUnboundCount(out.unboundCount);
        setTruncated(out.truncated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "โหลดไม่สำเร็จ");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [bindStatus, query, statusFilter],
  );

  useEffect(() => {
    void load({ q: "", bindStatus: "all", status: "" });
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void load();
  }

  function onBindChange(next: LegacyBindFilter) {
    setBindStatus(next);
    void load({ bindStatus: next });
  }

  function onStatusChange(next: "" | LegacyStatusFilter) {
    setStatusFilter(next);
    void load({ status: next });
  }

  function clearFilters() {
    setQuery("");
    setBindStatus("all");
    setStatusFilter("");
    void load({ q: "", bindStatus: "all", status: "" });
  }

  const filtersActive =
    Boolean(query.trim()) || bindStatus !== "all" || Boolean(statusFilter);

  return (
    <div className="bo-legacy-page">
      <div className="bo-stats">
        <div className="bo-stat">
          <div className="num">{total.toLocaleString("th-TH")}</div>
          <div className="lbl">สมาชิกเก่าทั้งหมด</div>
        </div>
        <div className="bo-stat">
          <div className="num">{boundCount.toLocaleString("th-TH")}</div>
          <div className="lbl">ยืนยัน LINE แล้ว</div>
        </div>
        <div className="bo-stat">
          <div className="num">{unboundCount.toLocaleString("th-TH")}</div>
          <div className="lbl">ยังไม่ยืนยัน</div>
        </div>
      </div>

      <div className="bo-panel" style={{ marginBottom: "1.25rem" }}>
        <div className="bo-panel-head">
          <h2>ค้นหาสมาชิกเก่า</h2>
        </div>
        <form
          className="bo-form-grid"
          style={{ padding: "0.85rem 1rem 0.5rem" }}
          onSubmit={onSearch}
        >
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

        <div className="bo-list-filters">
          <div className="bo-filter-group">
            <span className="bo-filter-label">สถานะ LINE</span>
            <div className="bo-seg" role="group" aria-label="สถานะ LINE">
              {LEGACY_BIND_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`bo-seg-btn${bindStatus === opt.value ? " is-active" : ""}`}
                  disabled={loading}
                  onClick={() => onBindChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bo-filter-group">
            <span className="bo-filter-label">สถานะสมาชิกเก่า</span>
            <div className="bo-seg" role="group" aria-label="สถานะสมาชิกเก่า">
              {LEGACY_STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  className={`bo-seg-btn${statusFilter === opt.value ? " is-active" : ""}`}
                  disabled={loading}
                  onClick={() => onStatusChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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

        {error ? (
          <div className="bo-error" style={{ margin: "0 1rem 0.75rem" }}>
            {error}
          </div>
        ) : null}
        {truncated ? (
          <p className="bo-legacy-hint">
            แสดงสูงสุดตาม limit ของระบบ — ถ้าข้อมูลเยอะมากให้ใช้คำค้นหาเพิ่ม
          </p>
        ) : null}
      </div>

      <div className="bo-panel">
        <div className="bo-panel-head">
          <h2>รายชื่อสมาชิกเก่า</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--bo-muted)" }}>
            {items.length.toLocaleString("th-TH")} รายการ
          </span>
        </div>
        <div className="bo-table-wrap">
          {loading ? (
            <div className="bo-empty">กำลังโหลดรายการ…</div>
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
            <table className="bo-table bo-table--cards">
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
                {items.map((row) => (
                  <tr key={row.legacyMemberId}>
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
                      <span className={`bo-badge ${legacyStatusClass(row.status)}`}>
                        {LEGACY_STATUS_LABEL[row.status] ?? row.status}
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
                ))}
              </tbody>
            </table>
          )}
        </div>
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
