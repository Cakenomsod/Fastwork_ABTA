import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BROADCAST_STATUS_OPTIONS,
  BROADCAST_TYPE_OPTIONS,
  fetchBroadcastLogs,
  fetchBroadcastRecipients,
  fetchBroadcastTags,
  fetchMessageTemplates,
  saveMessageTemplate,
  sendBroadcast,
  type BroadcastLogItem,
  type BroadcastMemberStatus,
  type BroadcastMemberType,
  type BroadcastRecipient,
  type MessageTemplate,
} from "../../lib/admin-api";
import { ConfirmDialog } from "../ConfirmDialog";

const MAX_CHARS = 4500;

const BOARD_MARCH_PRESET = [
  "แจ้งเตือนต่ออายุสมาชิก (กรรมการสมาคม)",
  "",
  "เพื่อรักษาสิทธิ์ก่อนประชุมใหญ่สามัญประจำปี",
  "กรุณาต่ออายุสมาชิกภายในช่วงกลางเดือนมีนาคมครับ",
  "",
  "ต่ออายุผ่าน LINE OA ของสมาคมได้เลยครับ",
].join("\n");

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
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
    case "pending_review":
    case "registered":
      return "pending";
    default:
      return "pending";
  }
}

function statusLabel(status: string): string {
  return (
    BROADCAST_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export default function BroadcastPage() {
  const [memberTypes, setMemberTypes] = useState<BroadcastMemberType[]>([]);
  const [statuses, setStatuses] = useState<BroadcastMemberStatus[]>([]);
  const [boardOnly, setBoardOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [skippedNoLine, setSkippedNoLine] = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<BroadcastLogItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLogs(await fetchBroadcastLogs(15));
    } catch {
      /* non-blocking */
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const [tags, tpls] = await Promise.all([
        fetchBroadcastTags(),
        fetchMessageTemplates(),
      ]);
      setKnownTags(tags);
      setTemplates(tpls);
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
        tags: selectedTags.length ? selectedTags : undefined,
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
  }, [memberTypes, statuses, boardOnly, selectedTags]);

  useEffect(() => {
    void loadRecipients();
    void loadLogs();
    void loadMeta();
  }, [loadRecipients, loadLogs, loadMeta]);

  const filtersActive =
    memberTypes.length > 0 ||
    statuses.length > 0 ||
    boardOnly ||
    selectedTags.length > 0;

  const filteredRecipients = useMemo(() => {
    const q = recipientQuery.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => {
      const hay = [
        r.memberId,
        r.fullName,
        r.firstName,
        r.lastName,
        r.memberTypeLabel,
        r.memberType,
        r.phone,
        ...(r.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [recipients, recipientQuery]);

  const allFilteredSelected =
    filteredRecipients.length > 0 &&
    filteredRecipients.every((r) => selected.has(r.memberId));

  const selectedCount = selected.size;
  const messageLen = message.length;
  const charsLeft = MAX_CHARS - messageLen;
  const nearLimit = charsLeft <= 200;
  const canSend = message.trim().length > 0 && selectedCount > 0 && !sending;

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
    } else {
      parts.push("ทุกประเภท");
    }
    if (statuses.length) {
      parts.push(
        statuses
          .map(
            (s) =>
              BROADCAST_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
          )
          .join(", "),
      );
    } else {
      parts.push("ทุกสถานภาพ");
    }
    if (boardOnly) parts.push("เฉพาะกรรมการ");
    if (selectedTags.length) parts.push(`แท็ก: ${selectedTags.join(", ")}`);
    return parts;
  }, [memberTypes, statuses, boardOnly, selectedTags]);

  function clearFilters() {
    setMemberTypes([]);
    setStatuses([]);
    setBoardOnly(false);
    setSelectedTags([]);
    setTagDraft("");
  }

  function applyBoardMarchPreset() {
    setMemberTypes([]);
    setStatuses(["active", "near_expiry", "temporary"]);
    setBoardOnly(true);
    setSelectedTags([]);
    setMessage(BOARD_MARCH_PRESET);
  }

  function applyAgmInvitePreset() {
    const tpl =
      templates.find((t) => t.id === "agm_invite") ?? templates[0];
    setMemberTypes(["ordinary"]);
    setStatuses(["active", "near_expiry", "temporary"]);
    setBoardOnly(false);
    setSelectedTags([]);
    if (tpl?.body) setMessage(tpl.body);
  }

  function addTagFromDraft() {
    const t = tagDraft.trim().toLowerCase();
    if (!t) return;
    setSelectedTags((list) => (list.includes(t) ? list : [...list, t]));
    setTagDraft("");
  }

  async function onSaveAgmTemplate() {
    if (!message.trim()) return;
    setSavingTemplate(true);
    setError(null);
    try {
      const saved = await saveMessageTemplate({
        id: "agm_invite",
        title: "เชิญประชุมใหญ่สามัญประจำปี",
        body: message.trim(),
      });
      setTemplates((list) => {
        const rest = list.filter((t) => t.id !== saved.id);
        return [saved, ...rest];
      });
      setResult("บันทึกแม่แบบเชิญประชุมแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_template_failed");
    } finally {
      setSavingTemplate(false);
    }
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const r of filteredRecipients) next.delete(r.memberId);
      } else {
        for (const r of filteredRecipients) next.add(r.memberId);
      }
      return next;
    });
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
        tags: selectedTags.length ? selectedTags : undefined,
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

  return (
    <div className="bo-broadcast">
      <header className="bo-broadcast-hero">
        <p className="bo-muted bo-broadcast-lead">
          กรองสมาชิก → เลือกผู้รับที่ผูก LINE แล้ว → ส่งผ่าน LINE OA
        </p>
        <button
          type="button"
          className="bo-btn bo-btn-ghost bo-btn-sm"
          disabled={loading}
          onClick={() => void loadRecipients()}
        >
          {loading ? "กำลังโหลด…" : "รีเฟรชรายชื่อ"}
        </button>
      </header>

      <div className="bo-stats bo-broadcast-stats">
        <div className="bo-stat">
          <div className="num">{recipients.length}</div>
          <div className="lbl">ส่งได้ (มี LINE)</div>
        </div>
        <div className="bo-stat bo-stat--accent">
          <div className="num">{selectedCount}</div>
          <div className="lbl">เลือกแล้ว</div>
        </div>
        <div className="bo-stat">
          <div className="num">{totalMatched}</div>
          <div className="lbl">จับคู่ฟิลเตอร์</div>
        </div>
        <div className="bo-stat">
          <div className="num">{skippedNoLine}</div>
          <div className="lbl">ไม่มี LINE</div>
        </div>
      </div>

      <div className="bo-broadcast-layout">
        <div className="bo-broadcast-main">
          <section className="bo-panel">
            <div className="bo-panel-head">
              <div>
                <h2>1. กรองผู้รับ</h2>
                <p className="bo-muted bo-broadcast-head-sub">
                  ไม่เลือก = รวมทุกค่าในกลุ่มนั้น
                </p>
              </div>
              <button
                type="button"
                className="bo-btn bo-btn-ghost bo-btn-sm"
                disabled={!filtersActive || loading}
                onClick={clearFilters}
              >
                ล้างตัวกรอง
              </button>
            </div>

            <div className="bo-broadcast-filters">
              <div className="bo-filter-group">
                <span className="bo-filter-label" id="bc-type-label">
                  ประเภทสมาชิก
                </span>
                <div
                  className="bo-seg"
                  role="group"
                  aria-labelledby="bc-type-label"
                >
                  {BROADCAST_TYPE_OPTIONS.map((opt) => {
                    const active = memberTypes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`bo-seg-btn${active ? " is-active" : ""}`}
                        aria-pressed={active}
                        disabled={loading}
                        onClick={() =>
                          setMemberTypes((list) =>
                            toggleInList(list, opt.value),
                          )
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bo-filter-group">
                <span className="bo-filter-label" id="bc-status-label">
                  สถานภาพ
                </span>
                <div
                  className="bo-seg"
                  role="group"
                  aria-labelledby="bc-status-label"
                >
                  {BROADCAST_STATUS_OPTIONS.map((opt) => {
                    const active = statuses.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`bo-seg-btn${active ? " is-active" : ""}`}
                        aria-pressed={active}
                        disabled={loading}
                        onClick={() =>
                          setStatuses((list) => toggleInList(list, opt.value))
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bo-broadcast-filter-footer">
                <button
                  type="button"
                  className={`bo-seg-btn bo-broadcast-board-btn${boardOnly ? " is-active" : ""}`}
                  aria-pressed={boardOnly}
                  disabled={loading}
                  onClick={() => setBoardOnly((v) => !v)}
                >
                  เฉพาะกรรมการสมาคม
                </button>
                <p className="bo-hint bo-broadcast-filter-summary">
                  {filterSummary.join(" · ")}
                </p>
              </div>

              <div className="bo-filter-group">
                <span className="bo-filter-label" id="bc-tag-label">
                  แท็ก (มีอย่างน้อยหนึ่งค่า)
                </span>
                <div className="bo-broadcast-tag-row">
                  <input
                    type="text"
                    value={tagDraft}
                    placeholder="พิมพ์แท็กแล้ว Enter"
                    aria-labelledby="bc-tag-label"
                    disabled={loading}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagFromDraft();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="bo-btn bo-btn-ghost bo-btn-sm"
                    disabled={loading || !tagDraft.trim()}
                    onClick={addTagFromDraft}
                  >
                    เพิ่ม
                  </button>
                </div>
                {(knownTags.length > 0 || selectedTags.length > 0) && (
                  <div
                    className="bo-seg bo-broadcast-tag-seg"
                    role="group"
                    aria-labelledby="bc-tag-label"
                  >
                    {[...new Set([...selectedTags, ...knownTags])].map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`bo-seg-btn${active ? " is-active" : ""}`}
                          aria-pressed={active}
                          disabled={loading}
                          onClick={() =>
                            setSelectedTags((list) => toggleInList(list, tag))
                          }
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bo-broadcast-presets">
                <span className="bo-filter-label">ทางลัด</span>
                <div className="bo-broadcast-preset-btns">
                  <button
                    type="button"
                    className="bo-btn bo-btn-ghost bo-btn-sm"
                    disabled={loading}
                    onClick={applyBoardMarchPreset}
                  >
                    แจ้งเตือนกรรมการ (มี.ค.)
                  </button>
                  <button
                    type="button"
                    className="bo-btn bo-btn-ghost bo-btn-sm"
                    disabled={loading}
                    onClick={applyAgmInvitePreset}
                  >
                    เชิญประชุมใหญ่ (สามัญ)
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bo-panel">
            <div className="bo-panel-head">
              <div>
                <h2>2. เลือกรายชื่อ</h2>
                <p className="bo-muted bo-broadcast-head-sub">
                  แสดงเฉพาะสมาชิกที่ผูก LINE แล้ว
                </p>
              </div>
              <button
                type="button"
                className="bo-btn bo-btn-ghost bo-btn-sm"
                disabled={!filteredRecipients.length}
                onClick={toggleAllFiltered}
              >
                {allFilteredSelected ? "ยกเลิกที่แสดง" : "เลือกทั้งหมดที่แสดง"}
              </button>
            </div>

            <div className="bo-broadcast-list-tools">
              <label className="bo-field bo-broadcast-search">
                <span className="bo-filter-label">ค้นหาในรายชื่อ</span>
                <input
                  type="search"
                  value={recipientQuery}
                  placeholder="ชื่อ, เลขสมาชิก, หรือเบอร์โทร"
                  onChange={(e) => setRecipientQuery(e.target.value)}
                />
              </label>
              <div className="bo-broadcast-selection-meta" aria-live="polite">
                เลือกแล้ว <strong>{selectedCount}</strong> จาก{" "}
                <strong>{recipients.length}</strong>
                {recipientQuery.trim() ? (
                  <>
                    {" "}
                    · แสดง {filteredRecipients.length}
                  </>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className="bo-empty">กำลังโหลดรายชื่อ…</div>
            ) : recipients.length === 0 ? (
              <div className="bo-empty">
                <strong>ไม่พบผู้รับที่ผูก LINE</strong>
                ลองเปลี่ยนตัวกรอง หรือทำเครื่องหมายกรรมการในโปรไฟล์สมาชิก
              </div>
            ) : filteredRecipients.length === 0 ? (
              <div className="bo-empty">
                <strong>ไม่พบรายชื่อที่ตรงกับการค้นหา</strong>
                ลองคำอื่น หรือล้างช่องค้นหา
              </div>
            ) : (
              <div className="bo-table-wrap bo-broadcast-table-wrap">
                <table className="bo-table">
                  <thead>
                    <tr>
                      <th className="bo-broadcast-col-check">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleAllFiltered}
                          aria-label="เลือกทั้งหมดที่แสดง"
                        />
                      </th>
                      <th>เลขสมาชิก</th>
                      <th>ชื่อ</th>
                      <th>ประเภท</th>
                      <th>สถานภาพ</th>
                      <th>แท็ก</th>
                      <th>กรรมการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipients.map((r) => {
                      const isOn = selected.has(r.memberId);
                      return (
                        <tr
                          key={r.memberId}
                          className={
                            isOn ? "bo-broadcast-row is-selected" : "bo-broadcast-row"
                          }
                          onClick={() => toggleOne(r.memberId)}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isOn}
                              onChange={() => toggleOne(r.memberId)}
                              aria-label={`เลือก ${r.fullName}`}
                            />
                          </td>
                          <td>
                            <code>{r.memberId}</code>
                          </td>
                          <td>{r.fullName || "—"}</td>
                          <td>{r.memberTypeLabel || r.memberType || "—"}</td>
                          <td>
                            <span
                              className={`bo-badge ${statusBadgeClass(r.status)}`}
                            >
                              {statusLabel(r.status)}
                            </span>
                          </td>
                          <td>{(r.tags ?? []).join(", ") || "—"}</td>
                          <td>
                            {r.isBoardMember ? (
                              <span className="bo-badge slip">กรรมการ</span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="bo-broadcast-compose-panel" aria-label="เขียนและส่งข้อความ">
          <div className="bo-panel bo-broadcast-compose-card">
            <div className="bo-panel-head">
              <div>
                <h2>3. เขียนข้อความ</h2>
                <p className="bo-muted bo-broadcast-head-sub">
                  ส่งผ่าน LINE OA ไปยังผู้ที่เลือก
                </p>
              </div>
            </div>

            <div className="bo-broadcast-compose">
              {error ? <div className="bo-error">{error}</div> : null}
              {result ? <div className="bo-success">{result}</div> : null}

              <div className="bo-broadcast-compose-summary">
                <div className="bo-broadcast-compose-count">
                  <span className="bo-broadcast-compose-count-num">
                    {selectedCount}
                  </span>
                  <span className="bo-broadcast-compose-count-lbl">ผู้รับ</span>
                </div>
                <div className="bo-broadcast-compose-chips">
                  {filterSummary.map((part) => (
                    <span key={part} className="bo-broadcast-chip">
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              <label className="bo-field">
                <span>ข้อความ</span>
                <textarea
                  rows={10}
                  value={message}
                  maxLength={MAX_CHARS}
                  placeholder="พิมพ์หรือวางข้อความที่จะส่งผ่าน LINE OA…"
                  onChange={(e) => setMessage(e.target.value)}
                />
                <span
                  className={`bo-hint bo-broadcast-char${nearLimit ? " is-warn" : ""}`}
                >
                  {messageLen.toLocaleString("th-TH")} /{" "}
                  {MAX_CHARS.toLocaleString("th-TH")} ตัวอักษร
                  {nearLimit
                    ? ` · เหลือ ${charsLeft.toLocaleString("th-TH")}`
                    : ""}
                </span>
              </label>

              <div className="bo-broadcast-template-actions">
                <button
                  type="button"
                  className="bo-btn bo-btn-ghost bo-btn-sm"
                  disabled={!message.trim() || savingTemplate}
                  onClick={() => void onSaveAgmTemplate()}
                >
                  {savingTemplate
                    ? "กำลังบันทึกแม่แบบ…"
                    : "บันทึกเป็นแม่แบบเชิญประชุม"}
                </button>
              </div>

              {message.trim() ? (
                <div className="bo-broadcast-preview-box" aria-label="ตัวอย่างข้อความ">
                  <div className="bo-broadcast-preview-label">ตัวอย่างใน LINE</div>
                  <pre className="bo-broadcast-preview-body">
                    {message.trim()}
                  </pre>
                </div>
              ) : null}

              <div className="bo-broadcast-compose-actions">
                <button
                  type="button"
                  className="bo-btn bo-btn-primary bo-broadcast-send"
                  disabled={!canSend}
                  onClick={() => setConfirmOpen(true)}
                >
                  {sending
                    ? "กำลังส่ง…"
                    : selectedCount > 0
                      ? `ส่งข้อความ (${selectedCount} คน)`
                      : "เลือกผู้รับก่อนส่ง"}
                </button>
                {!canSend && !sending ? (
                  <p className="bo-hint bo-broadcast-send-hint">
                    {selectedCount === 0
                      ? "เลือกอย่างน้อย 1 คนจากรายชื่อทางซ้าย"
                      : "พิมพ์ข้อความก่อนกดส่ง"}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="bo-panel">
        <div className="bo-panel-head">
          <div>
            <h2>ประวัติการส่งล่าสุด</h2>
            <p className="bo-muted bo-broadcast-head-sub">
              15 รายการล่าสุดจากระบบ
            </p>
          </div>
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
                {logs.map((log) => {
                  const failed = Boolean(log.failed);
                  return (
                    <tr key={log.logId}>
                      <td className="bo-broadcast-log-time">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("th-TH")
                          : "—"}
                      </td>
                      <td>{log.actorEmail}</td>
                      <td className="bo-broadcast-preview">
                        {log.messagePreview}
                      </td>
                      <td>
                        <span
                          className={`bo-badge ${failed ? "near-expiry" : "active"}`}
                        >
                          ส่ง {log.sent}/{log.targetCount}
                          {failed ? ` · ล้ม ${log.failed}` : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
