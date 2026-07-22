import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BROADCAST_STATUS_OPTIONS,
  BROADCAST_TYPE_OPTIONS,
  fetchBroadcastLogs,
  fetchBroadcastRecipients,
  sendBroadcast,
  type BroadcastLogItem,
  type BroadcastMemberStatus,
  type BroadcastMemberType,
  type BroadcastRecipient,
} from "../../lib/admin-api";
import { ConfirmDialog } from "../ConfirmDialog";

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  BROADCAST_STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

const MAX_CHARS = 4500;

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export default function BroadcastPage() {
  const [memberTypes, setMemberTypes] = useState<BroadcastMemberType[]>([]);
  const [statuses, setStatuses] = useState<BroadcastMemberStatus[]>([]);
  const [boardOnly, setBoardOnly] = useState(false);
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [skippedNoLine, setSkippedNoLine] = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<BroadcastLogItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLogs(await fetchBroadcastLogs(15));
    } catch {
      /* non-blocking */
    }
  }, []);

  const loadRecipients = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchBroadcastRecipients({
        memberTypes: memberTypes.length ? memberTypes : undefined,
        statuses: statuses.length ? statuses : undefined,
        boardOnly: boardOnly || undefined,
      });
      setRecipients(data.recipients);
      setSkippedNoLine(data.skippedNoLine);
      setTotalMatched(data.totalMatched);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "load_failed");
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  }, [memberTypes, statuses, boardOnly]);

  useEffect(() => {
    void loadRecipients();
    void loadLogs();
  }, [loadRecipients, loadLogs]);

  const allSelected =
    recipients.length > 0 && selected.size === recipients.length;

  const selectedCount = selected.size;

  const canSend = message.trim().length > 0 && selectedCount > 0 && !sending;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(recipients.map((r) => r.memberId)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function doSend() {
    setConfirmOpen(false);
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const selectAll =
        selected.size === recipients.length && recipients.length > 0;
      const res = await sendBroadcast({
        message: message.trim(),
        selectAll,
        memberIds: selectAll ? undefined : [...selected],
        memberTypes: memberTypes.length ? memberTypes : undefined,
        statuses: statuses.length ? statuses : undefined,
        boardOnly: boardOnly || undefined,
      });
      setResult(
        `ส่งแล้ว ${res.sent} คน` +
          (res.failed ? ` · ล้มเหลว ${res.failed}` : "") +
          (res.skipped ? ` · ข้าม ${res.skipped}` : ""),
      );
      setMessage("");
      setSelected(new Set());
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "send_failed");
    } finally {
      setSending(false);
    }
  }

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (memberTypes.length) {
      parts.push(
        memberTypes
          .map(
            (t) =>
              BROADCAST_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t,
          )
          .join(", "),
      );
    } else parts.push("ทุกประเภท");
    if (statuses.length) {
      parts.push(
        statuses
          .map(
            (s) =>
              BROADCAST_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
          )
          .join(", "),
      );
    } else parts.push("ทุกสถานภาพ");
    if (boardOnly) parts.push("เฉพาะกรรมการ");
    return parts.join(" · ");
  }, [memberTypes, statuses, boardOnly]);

  return (
    <div className="bo-broadcast">
      <section className="bo-panel">
        <div className="bo-panel-head">
          <div>
            <h2>ส่งข้อความแบบกลุ่ม</h2>
            <p className="bo-muted">
              กรองประเภทสมาชิกและสถานภาพ แล้วเลือกผู้รับที่ผูก LINE แล้ว
            </p>
          </div>
          <button
            type="button"
            className="bo-btn bo-btn-ghost bo-btn-sm"
            disabled={loading}
            onClick={() => void loadRecipients()}
          >
            รีเฟรชรายชื่อ
          </button>
        </div>

        <div className="bo-broadcast-filters">
          <fieldset className="bo-broadcast-fieldset">
            <legend>ประเภทสมาชิก</legend>
            <div className="bo-broadcast-checks">
              {BROADCAST_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="bo-check">
                  <input
                    type="checkbox"
                    checked={memberTypes.includes(opt.value)}
                    onChange={() =>
                      setMemberTypes((list) => toggleInList(list, opt.value))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="bo-hint">ไม่เลือก = ทุกประเภท</p>
          </fieldset>

          <fieldset className="bo-broadcast-fieldset">
            <legend>สถานภาพ</legend>
            <div className="bo-broadcast-checks">
              {BROADCAST_STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="bo-check">
                  <input
                    type="checkbox"
                    checked={statuses.includes(opt.value)}
                    onChange={() =>
                      setStatuses((list) => toggleInList(list, opt.value))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="bo-hint">ไม่เลือก = ทุกสถานภาพ</p>
          </fieldset>

          <label className="bo-check bo-broadcast-board">
            <input
              type="checkbox"
              checked={boardOnly}
              onChange={(e) => setBoardOnly(e.target.checked)}
            />
            เฉพาะกรรมการสมาคม
          </label>
        </div>

        <div className="bo-broadcast-stats">
          <span>
            ส่งได้ <strong>{recipients.length}</strong> คน
          </span>
          <span>
            จับคู่ฟิลเตอร์ <strong>{totalMatched}</strong>
          </span>
          <span>
            ไม่มี LINE <strong>{skippedNoLine}</strong>
          </span>
          <span className="bo-muted">{filterSummary}</span>
        </div>

        {error ? <div className="bo-error">{error}</div> : null}
        {result ? <div className="bo-success">{result}</div> : null}

        <div className="bo-broadcast-compose">
          <label className="bo-field">
            <span>ข้อความ</span>
            <textarea
              rows={6}
              value={message}
              maxLength={MAX_CHARS}
              placeholder="พิมพ์หรือวางข้อความที่จะส่งผ่าน LINE OA…"
              onChange={(e) => setMessage(e.target.value)}
            />
            <span className="bo-hint">
              {message.length.toLocaleString("th-TH")} /{" "}
              {MAX_CHARS.toLocaleString("th-TH")} ตัวอักษร · เลือกแล้ว{" "}
              {selectedCount} คน
            </span>
          </label>
          <div className="bo-broadcast-compose-actions">
            <button
              type="button"
              className="bo-btn bo-btn-primary"
              disabled={!canSend}
              onClick={() => setConfirmOpen(true)}
            >
              {sending ? "กำลังส่ง…" : `ส่งข้อความ (${selectedCount})`}
            </button>
          </div>
        </div>
      </section>

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2>รายชื่อผู้รับ</h2>
          <button
            type="button"
            className="bo-btn bo-btn-ghost bo-btn-sm"
            disabled={!recipients.length}
            onClick={toggleAll}
          >
            {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมดที่ส่งได้"}
          </button>
        </div>

        {loading ? (
          <div className="bo-empty">กำลังโหลดรายชื่อ…</div>
        ) : recipients.length === 0 ? (
          <div className="bo-empty">
            <strong>ไม่พบผู้รับที่ผูก LINE</strong>
            ลองเปลี่ยนตัวกรอง หรือทำเครื่องหมายกรรมการในโปรไฟล์สมาชิก
          </div>
        ) : (
          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead>
                <tr>
                  <th className="bo-broadcast-col-check">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="เลือกทั้งหมด"
                    />
                  </th>
                  <th>เลขสมาชิก</th>
                  <th>ชื่อ</th>
                  <th>ประเภท</th>
                  <th>สถานภาพ</th>
                  <th>กรรมการ</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.memberId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(r.memberId)}
                        onChange={() => toggleOne(r.memberId)}
                        aria-label={`เลือก ${r.fullName}`}
                      />
                    </td>
                    <td>
                      <code>{r.memberId}</code>
                    </td>
                    <td>{r.fullName || "—"}</td>
                    <td>{r.memberTypeLabel || r.memberType || "—"}</td>
                    <td>{STATUS_LABEL[r.status] || r.status}</td>
                    <td>{r.isBoardMember ? "ใช่" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2>ประวัติการส่งล่าสุด</h2>
        </div>
        {logs.length === 0 ? (
          <div className="bo-empty">ยังไม่มีประวัติการส่ง</div>
        ) : (
          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead>
                <tr>
                  <th>เวลา</th>
                  <th>ผู้ส่ง</th>
                  <th>ข้อความ</th>
                  <th>ผล</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.logId}>
                    <td>
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString("th-TH")
                        : "—"}
                    </td>
                    <td>{log.actorEmail}</td>
                    <td className="bo-broadcast-preview">
                      {log.messagePreview}
                    </td>
                    <td>
                      ส่ง {log.sent}/{log.targetCount}
                      {log.failed ? ` · ล้ม ${log.failed}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="ยืนยันส่งข้อความแบบกลุ่ม"
        description={`จะส่งข้อความไปยังสมาชิก ${selectedCount} คนผ่าน LINE OA\n\n${message.trim().slice(0, 200)}${message.trim().length > 200 ? "…" : ""}`}
        confirmLabel="ส่งเลย"
        cancelLabel="ยกเลิก"
        onConfirm={() => void doSend()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
