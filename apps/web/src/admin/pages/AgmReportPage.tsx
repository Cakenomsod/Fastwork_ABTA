import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BROADCAST_STATUS_OPTIONS,
  searchAdminMembers,
  type AdminMe,
  type QueueItem,
} from "../../lib/admin-api";

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
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull all ordinary-active pages (pageSize max 50).
      const pageSize = 50;
      let page = 1;
      let pageCount = 1;
      const all: QueueItem[] = [];
      let total = 0;
      while (page <= pageCount) {
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
        if (page > 200) break;
      }
      setItems(all);
      setMatched(total);
    } catch (err) {
      setError(errorMessage(err));
      setItems([]);
      setMatched(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const yearLabel = useMemo(() => {
    const y = new Date().getFullYear() + 543;
    return String(y);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((m) => matchesQuery(m, needle));
  }, [items, q]);

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

  function onExport() {
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
        m.expiryDate ?? "",
        (m.tags ?? []).join("; "),
      ]),
    ];
    downloadCsv(`agm-ordinary-active-${yearLabel}.csv`, rows);
  }

  return (
    <div className="bo-agm">
      <header className="bo-agm-hero">
        <div className="bo-agm-hero-copy">
          <p className="bo-muted bo-agm-lead">
            รายชื่อสมาชิกสามัญที่มีสิทธิ์เข้าร่วมและออกเสียงในประชุมใหญ่ปี{" "}
            {yearLabel} — ใช้ช่วงปลายมีนาคมก่อนประชุมเมษายน
          </p>
          <ul className="bo-agm-criteria" aria-label="เงื่อนไขผู้มีสิทธิ์">
            <li>ประเภท <strong>สามัญ</strong></li>
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

      <div className="bo-stats bo-agm-stats">
        <div className="bo-stat bo-stat--accent">
          <div className="num">
            {loading ? "—" : matched.toLocaleString("th-TH")}
          </div>
          <div className="lbl">มีสิทธิ์ทั้งหมด</div>
        </div>
        <div className="bo-stat">
          <div className="num">
            {loading ? "—" : statusCounts.active.toLocaleString("th-TH")}
          </div>
          <div className="lbl">สมาชิกสมบูรณ์</div>
        </div>
        <div className="bo-stat">
          <div className="num">
            {loading ? "—" : statusCounts.nearExpiry.toLocaleString("th-TH")}
          </div>
          <div className="lbl">ใกล้หมดอายุ</div>
        </div>
        <div className="bo-stat">
          <div className="num">
            {loading ? "—" : statusCounts.temporary.toLocaleString("th-TH")}
          </div>
          <div className="lbl">สมาชิกชั่วคราว</div>
        </div>
      </div>

      <section className="bo-panel">
        <div className="bo-panel-head">
          <div>
            <h2>รายชื่อผู้มีสิทธิ์</h2>
            <p className="bo-muted bo-agm-head-sub" aria-live="polite">
              {loading
                ? "กำลังโหลด…"
                : searchActive
                  ? `แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${matched.toLocaleString("th-TH")} ราย`
                  : `${matched.toLocaleString("th-TH")} ราย · เรียงตามเลขสมาชิก`}
            </p>
          </div>
          <div className="bo-agm-actions">
            <button
              type="button"
              className="bo-btn bo-btn-primary bo-btn-sm"
              disabled={loading || filtered.length === 0}
              onClick={onExport}
            >
              ส่งออก CSV
              {searchActive && filtered.length > 0
                ? ` (${filtered.length.toLocaleString("th-TH")})`
                : ""}
            </button>
          </div>
        </div>

        <div className="bo-agm-list-tools">
          <label className="bo-field bo-agm-search">
            <span className="bo-filter-label">ค้นหาในรายชื่อ</span>
            <input
              type="search"
              value={q}
              placeholder="ชื่อ / เลขสมาชิก / โทร / แท็ก"
              disabled={loading && items.length === 0}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          {searchActive ? (
            <button
              type="button"
              className="bo-btn bo-btn-ghost bo-btn-sm"
              disabled={loading}
              onClick={() => setQ("")}
            >
              ล้างค้นหา
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="bo-error" role="alert" style={{ margin: "0 1rem 0.75rem" }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="bo-empty">กำลังโหลดรายชื่อ…</div>
        ) : items.length === 0 ? (
          <div className="bo-empty">
            <strong>ยังไม่มีสมาชิกสามัญที่มีสิทธิ์</strong>
            รายชื่อจะแสดงเมื่อมีสมาชิกสามัญที่ต่ออายุแล้วและยังไม่หมดอายุ
          </div>
        ) : filtered.length === 0 ? (
          <div className="bo-empty">
            <strong>ไม่พบรายชื่อที่ตรงกับการค้นหา</strong>
            ลองคำอื่น หรือล้างช่องค้นหา
          </div>
        ) : (
          <div className="bo-table-wrap">
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
