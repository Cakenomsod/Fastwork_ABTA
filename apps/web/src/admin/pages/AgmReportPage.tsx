import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BROADCAST_STATUS_OPTIONS,
  searchAdminMembers,
  type AdminMe,
  type QueueItem,
} from "../../lib/admin-api";

/** Safety ceiling: 50 × 500 = 25,000 rows. Beyond this we warn instead of looping forever. */
const MAX_PAGES = 500;
/** Soft warn when full roster is in the DOM — nudge staff to filter before print/export. */
const LARGE_ROSTER_WARN = 400;

type AgmStatusFilter = "" | "active" | "near_expiry" | "temporary";

const ERROR_LABEL: Record<string, string> = {
  load_failed: "โหลดรายงานไม่สำเร็จ",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  not_authorized: "ไม่มีสิทธิ์ดูรายงานนี้",
};

function errorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : "load_failed";
  return ERROR_LABEL[code] ?? code;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const bom = "\uFEFF";
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([bom + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("th-TH", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "active";
    case "temporary":
      return "temp";
    case "near_expiry":
      return "near-expiry";
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}

function statusLabel(status: string): string {
  return (
    BROADCAST_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

function matchesQuery(m: QueueItem, q: string): boolean {
  const hay = [
    m.memberId,
    m.fullName,
    m.firstName,
    m.lastName,
    m.phone,
    m.email,
    m.legalEntityName,
    m.buildingName,
    ...(m.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export default function AgmReportPage(_props: { me: AdminMe }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [matched, setMatched] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [loadProgress, setLoadProgress] = useState<{
    page: number;
    pageCount: number;
  } | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgmStatusFilter>("");
  const [exportFlash, setExportFlash] = useState<string | null>(null);
  const exportFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTruncated(false);
    setLoadProgress(null);
    try {
      const pageSize = 50;
      let page = 1;
      let pageCount = 1;
      const all: QueueItem[] = [];
      let total = 0;
      let hitCap = false;

      while (page <= pageCount) {
        if (page > MAX_PAGES) {
          hitCap = true;
          break;
        }
        setLoadProgress({ page, pageCount: Math.max(pageCount, 1) });
        const res = await searchAdminMembers({
          status: "ordinary_active",
          page,
          pageSize,
          sort: "member_asc",
        });
        all.push(...res.items);
        total = res.matched;
        pageCount = Math.max(res.pageCount, 1);
        page += 1;
      }

      const incomplete = hitCap || all.length < total;
      setItems(all);
      setMatched(total);
      setTruncated(incomplete);
    } catch (err) {
      setError(errorMessage(err));
      // Keep prior roster on refresh failure — do not clear table.
    } finally {
      setLoading(false);
      setLoadProgress(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (exportFlashTimer.current) clearTimeout(exportFlashTimer.current);
    };
  }, []);

  const yearLabel = useMemo(() => {
    const y = new Date().getFullYear() + 543;
    return String(y);
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter) {
      list = list.filter((m) => m.status === statusFilter);
    }
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((m) => matchesQuery(m, needle));
    }
    return list;
  }, [items, q, statusFilter]);

  const statusCounts = useMemo(() => {
    let active = 0;
    let nearExpiry = 0;
    let temporary = 0;
    for (const m of items) {
      if (m.status === "active") active += 1;
      else if (m.status === "near_expiry") nearExpiry += 1;
      else if (m.status === "temporary") temporary += 1;
    }
    return { active, nearExpiry, temporary };
  }, [items]);

  const searchActive = Boolean(q.trim());
  const statusFilterActive = Boolean(statusFilter);
  const listFilterActive = searchActive || statusFilterActive;
  const hasRoster = items.length > 0;
  const firstLoad = loading && !hasRoster;
  const refreshing = loading && hasRoster;
  /** Count shown as “complete roster” — never claim matched when truncated. */
  const loadedCount = items.length;
  const totalDisplay = truncated ? loadedCount : matched;
  const showLargeRosterWarn =
    !firstLoad &&
    !listFilterActive &&
    loadedCount >= LARGE_ROSTER_WARN;

  function toggleStatusFilter(next: Exclude<AgmStatusFilter, "">) {
    setStatusFilter((cur) => (cur === next ? "" : next));
  }

  function clearListFilters() {
    setQ("");
    setStatusFilter("");
  }

  function onExport() {
    if (truncated || filtered.length === 0) return;
    const rows: string[][] = [
      [
        "เลขสมาชิก",
        "ชื่อ",
        "นามสกุล",
        "โทร",
        "อีเมล",
        "นิติบุคคล",
        "หน่วยงาน",
        "สถานภาพ",
        "วันหมดอายุ",
        "แท็ก",
      ],
      ...filtered.map((m) => [
        m.memberId,
        m.firstName ?? "",
        m.lastName ?? "",
        m.phone ?? "",
        m.email ?? "",
        m.legalEntityName ?? "",
        m.buildingName ?? "",
        statusLabel(m.status),
        formatDate(m.expiryDate),
        (m.tags ?? []).join("; "),
      ]),
    ];
    downloadCsv(`agm-ordinary-active-${yearLabel}.csv`, rows);
    const msg = listFilterActive
      ? `ส่งออก ${filtered.length.toLocaleString("th-TH")} รายแล้ว (ตามตัวกรอง)`
      : `ส่งออก ${filtered.length.toLocaleString("th-TH")} รายแล้ว`;
    setExportFlash(msg);
    if (exportFlashTimer.current) clearTimeout(exportFlashTimer.current);
    exportFlashTimer.current = setTimeout(() => setExportFlash(null), 4000);
  }

  function onPrint() {
    window.print();
  }

  const progressLabel =
    loadProgress != null
      ? `กำลังโหลดหน้า ${loadProgress.page.toLocaleString("th-TH")}/${Math.max(loadProgress.pageCount, loadProgress.page).toLocaleString("th-TH")}…`
      : "กำลังอัปเดตรายชื่อ…";

  return (
    <div className="bo-agm">
      <header className="bo-agm-hero bo-agm-no-print">
        <div className="bo-agm-hero-copy">
          <p className="bo-muted bo-agm-lead">
            รายงานรายชื่อสมาชิกสามัญที่มีสิทธิ์<strong>เข้าร่วม</strong>
            ประชุมใหญ่ปี {yearLabel} — ใช้เตรียมบัญชีรายชื่อช่วงปลายมีนาคมก่อนประชุมเมษายน
            (ไม่ใช่ระบบเช็คอินหรือลงคะแนน)
          </p>
          <ul className="bo-agm-criteria" aria-label="เงื่อนไขผู้มีสิทธิ์เข้าร่วม">
            <li>สมาชิกประเภท <strong>สามัญ</strong></li>
            <li>
              สถานภาพ <strong>สมบูรณ์</strong> / <strong>ใกล้หมดอายุ</strong> /{" "}
              <strong>ชั่วคราว</strong>
            </li>
            <li>ยังไม่หมดอายุ</li>
          </ul>
        </div>
        <button
          type="button"
          className="bo-btn bo-btn-ghost bo-btn-sm"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? "กำลังโหลด…" : "รีเฟรช"}
        </button>
      </header>

      <div className="bo-agm-print-title" aria-hidden="true">
        <h2>รายชื่อผู้มีสิทธิ์เข้าร่วมประชุมใหญ่ ปี {yearLabel}</h2>
        <ul className="bo-agm-criteria" aria-label="เงื่อนไขผู้มีสิทธิ์เข้าร่วม">
          <li>สมาชิกประเภท <strong>สามัญ</strong></li>
          <li>
            สถานภาพ <strong>สมบูรณ์</strong> / <strong>ใกล้หมดอายุ</strong> /{" "}
            <strong>ชั่วคราว</strong>
          </li>
          <li>ยังไม่หมดอายุ</li>
        </ul>
      </div>

      <div
        className="bo-stats bo-agm-stats bo-agm-no-print"
        role="group"
        aria-label="สถิติสถานภาพ — คลิกเพื่อกรองรายชื่อ"
      >
        <div className="bo-stat bo-stat--accent">
          <div className="num">
            {firstLoad ? "—" : totalDisplay.toLocaleString("th-TH")}
          </div>
          <div className="lbl">
            {truncated ? "โหลดแล้ว (อาจไม่ครบ)" : "ผู้มีสิทธิ์ทั้งหมด"}
          </div>
        </div>
        <button
          type="button"
          className={`bo-stat bo-stat--btn${statusFilter === "active" ? " is-active" : ""}`}
          aria-pressed={statusFilter === "active"}
          disabled={firstLoad}
          onClick={() => toggleStatusFilter("active")}
        >
          <div className="num">
            {firstLoad ? "—" : statusCounts.active.toLocaleString("th-TH")}
          </div>
          <div className="lbl">สมาชิกสมบูรณ์</div>
          <span className="bo-stat-hint">กรองรายชื่อ</span>
        </button>
        <button
          type="button"
          className={`bo-stat bo-stat--btn${statusFilter === "near_expiry" ? " is-active" : ""}`}
          aria-pressed={statusFilter === "near_expiry"}
          disabled={firstLoad}
          onClick={() => toggleStatusFilter("near_expiry")}
        >
          <div className="num">
            {firstLoad ? "—" : statusCounts.nearExpiry.toLocaleString("th-TH")}
          </div>
          <div className="lbl">ใกล้หมดอายุ</div>
          <span className="bo-stat-hint">กรองรายชื่อ</span>
        </button>
        <button
          type="button"
          className={`bo-stat bo-stat--btn${statusFilter === "temporary" ? " is-active" : ""}`}
          aria-pressed={statusFilter === "temporary"}
          disabled={firstLoad}
          onClick={() => toggleStatusFilter("temporary")}
        >
          <div className="num">
            {firstLoad ? "—" : statusCounts.temporary.toLocaleString("th-TH")}
          </div>
          <div className="lbl">สมาชิกชั่วคราว</div>
          <span className="bo-stat-hint">กรองรายชื่อ</span>
        </button>
      </div>

      <section className="bo-panel" aria-busy={loading || undefined}>
        <div className="bo-panel-head">
          <div>
            <h2>รายชื่อผู้มีสิทธิ์เข้าร่วม</h2>
            <p className="bo-muted bo-agm-head-sub" aria-live="polite">
              {firstLoad
                ? progressLabel
                : refreshing
                  ? progressLabel
                  : listFilterActive
                    ? `แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${loadedCount.toLocaleString("th-TH")} รายที่โหลดแล้ว`
                    : truncated
                      ? `แสดง ${loadedCount.toLocaleString("th-TH")} รายที่โหลดแล้ว · เรียงตามเลขสมาชิก`
                      : `${matched.toLocaleString("th-TH")} ราย · เรียงตามเลขสมาชิก`}
            </p>
          </div>
          <div className="bo-agm-actions bo-agm-no-print">
            <button
              type="button"
              className="bo-btn bo-btn-ghost bo-btn-sm"
              disabled={firstLoad || filtered.length === 0}
              onClick={onPrint}
            >
              พิมพ์ / PDF
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-primary bo-btn-sm"
              disabled={
                loading || truncated || filtered.length === 0
              }
              onClick={onExport}
              title={
                truncated
                  ? "ไม่สามารถส่งออกได้จนกว่าจะโหลดรายชื่อครบ"
                  : undefined
              }
            >
              ส่งออก CSV
              {listFilterActive && filtered.length > 0 && !truncated
                ? ` (${filtered.length.toLocaleString("th-TH")})`
                : ""}
            </button>
          </div>
        </div>

        <div className="bo-agm-list-tools bo-agm-no-print">
          <label className="bo-field bo-agm-search">
            <span className="bo-filter-label">ค้นหาในรายชื่อ</span>
            <input
              type="search"
              value={q}
              placeholder="ชื่อ / เลขสมาชิก / โทร / แท็ก"
              disabled={firstLoad}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          {listFilterActive ? (
            <button
              type="button"
              className="bo-btn bo-btn-ghost bo-btn-sm"
              disabled={loading}
              onClick={clearListFilters}
            >
              ล้างตัวกรอง
            </button>
          ) : null}
        </div>

        {exportFlash ? (
          <div
            className="bo-flash-ok bo-agm-flash bo-agm-no-print"
            role="status"
          >
            {exportFlash}
          </div>
        ) : null}

        {showLargeRosterWarn ? (
          <div className="bo-flash-warn bo-agm-flash bo-agm-no-print" role="status">
            รายชื่อมีจำนวนมาก ({loadedCount.toLocaleString("th-TH")} ราย) —
            คลิกสถิติสถานภาพหรือใช้ค้นหาเพื่อกรองก่อนพิมพ์/ส่งออก จะช่วยให้เบราว์เซอร์ทำงานลื่นขึ้น
          </div>
        ) : null}

        {truncated && !loading ? (
          <div className="bo-flash-warn bo-agm-flash" role="alert">
            รายชื่ออาจไม่ครบ — โหลดได้{" "}
            {loadedCount.toLocaleString("th-TH")} จาก{" "}
            {matched.toLocaleString("th-TH")} รายตามระบบ
            {matched > loadedCount
              ? " (ถึงขีดจำกัดการดึงข้อมูลทีละหน้า)"
              : ""}
            {" "}กรุณารีเฟรชหรือติดต่อผู้ดูแลระบบก่อนใช้เป็นบัญชีรายชื่อผู้มีสิทธิ์เข้าร่วมประชุมใหญ่
            ปุ่มส่งออก CSV ถูกปิดจนกว่าจะโหลดครบ
          </div>
        ) : null}

        {error ? (
          <div className="bo-error bo-agm-flash" role="alert">
            {error}
            <button
              type="button"
              className="bo-btn bo-btn-ghost bo-btn-sm bo-agm-no-print"
              style={{ marginLeft: "0.65rem" }}
              disabled={loading}
              onClick={() => void load()}
            >
              ลองใหม่
            </button>
          </div>
        ) : null}

        {refreshing ? (
          <div
            className="bo-agm-refresh-banner bo-agm-no-print"
            role="status"
            aria-live="polite"
          >
            {progressLabel}
          </div>
        ) : null}

        {firstLoad ? (
          <div className="bo-empty">{progressLabel}</div>
        ) : items.length === 0 ? (
          <div className="bo-empty">
            <strong>ยังไม่มีสมาชิกสามัญที่มีสิทธิ์เข้าร่วม</strong>
            รายชื่อจะแสดงเมื่อมีสมาชิกสามัญที่ต่ออายุแล้วและยังไม่หมดอายุ
          </div>
        ) : filtered.length === 0 ? (
          <div className="bo-empty bo-agm-no-print">
            <strong>ไม่พบรายชื่อที่ตรงกับเงื่อนไข</strong>
            {statusFilterActive
              ? "ลองสถานภาพอื่น หรือล้างตัวกรอง"
              : "ลองคำอื่น หรือล้างช่องค้นหา"}
          </div>
        ) : (
          <div
            className={`bo-table-wrap bo-agm-table-wrap${refreshing ? " is-refreshing" : ""}`}
          >
            <table className="bo-table bo-table--cards">
              <thead>
                <tr>
                  <th>เลขสมาชิก</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>โทร</th>
                  <th>สถานภาพ</th>
                  <th>หมดอายุ</th>
                  <th>แท็ก</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.memberId}>
                    <td data-label="เลขสมาชิก">
                      <code>{m.memberId}</code>
                    </td>
                    <td data-label="ชื่อ-นามสกุล">
                      <div className="bo-agm-name">
                        <strong>{m.fullName || "—"}</strong>
                        {m.legalEntityName || m.buildingName ? (
                          <span>
                            {m.legalEntityName || m.buildingName}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="โทร">{m.phone ?? "—"}</td>
                    <td data-label="สถานภาพ">
                      <span className={`bo-badge ${statusBadgeClass(m.status)}`}>
                        {statusLabel(m.status)}
                      </span>
                    </td>
                    <td data-label="หมดอายุ">{formatDate(m.expiryDate)}</td>
                    <td data-label="แท็ก">
                      {(m.tags ?? []).length > 0 ? (
                        <div className="bo-agm-tags">
                          {(m.tags ?? []).map((tag) => (
                            <span key={tag} className="bo-agm-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
