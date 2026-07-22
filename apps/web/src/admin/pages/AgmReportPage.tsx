import { useCallback, useEffect, useMemo, useState } from "react";
import {
  searchAdminMembers,
  type AdminMe,
  type QueueItem,
} from "../../lib/admin-api";

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
          q: q.trim() || undefined,
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
      setError(err instanceof Error ? err.message : "load_failed");
      setItems([]);
      setMatched(0);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  const yearLabel = useMemo(() => {
    const y = new Date().getFullYear() + 543;
    return String(y);
  }, []);

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
      ...items.map((m) => [
        m.memberId,
        m.firstName ?? "",
        m.lastName ?? "",
        m.phone ?? "",
        m.email ?? "",
        m.legalEntityName ?? "",
        "",
        m.status,
        m.expiryDate ?? "",
        (m.tags ?? []).join("; "),
      ]),
    ];
    downloadCsv(`agm-ordinary-active-${yearLabel}.csv`, rows);
  }

  return (
    <div className="bo-agm">
      <header className="bo-panel-head">
        <div>
          <h2>รายงานสิทธิ์ประชุมใหญ่</h2>
          <p className="bo-muted">
            สมาชิกสามัญที่ Active / ใกล้หมดอายุ / ชั่วคราว และยังไม่หมดอายุ —
            ใช้เป็นรายชื่อผู้มีสิทธิ์เข้าร่วมและออกเสียง (ปลายมี.ค.)
          </p>
        </div>
        <div className="bo-agm-actions">
          <button
            type="button"
            className="bo-btn bo-btn-ghost bo-btn-sm"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? "กำลังโหลด…" : "รีเฟรช"}
          </button>
          <button
            type="button"
            className="bo-btn bo-btn-primary bo-btn-sm"
            disabled={loading || items.length === 0}
            onClick={onExport}
          >
            ส่งออก CSV
          </button>
        </div>
      </header>

      <div className="bo-stats">
        <div className="bo-stat bo-stat--accent">
          <div className="num">{matched}</div>
          <div className="lbl">มีสิทธิ์ (สามัญ)</div>
        </div>
      </div>

      <div className="bo-toolbar">
        <label className="bo-field bo-agm-search">
          <span className="bo-filter-label">ค้นหา</span>
          <input
            type="search"
            value={q}
            placeholder="ชื่อ / เลขสมาชิก / โทร"
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      {error ? <div className="bo-error">{error}</div> : null}

      <div className="bo-table-wrap">
        <table className="bo-table">
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
            {loading ? (
              <tr>
                <td colSpan={6} className="bo-muted">
                  กำลังโหลด…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="bo-muted">
                  ไม่พบสมาชิกสามัญที่มีสิทธิ์
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.memberId}>
                  <td>
                    <code>{m.memberId}</code>
                  </td>
                  <td>{m.fullName}</td>
                  <td>{m.phone ?? "—"}</td>
                  <td>{m.status}</td>
                  <td>{m.expiryDate ?? "—"}</td>
                  <td>{(m.tags ?? []).join(", ") || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
