import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BROADCAST_STATUS_OPTIONS,
  BROADCAST_TYPE_OPTIONS,
  fetchBroadcastLogs,
  fetchBroadcastRecipients,
  fetchBroadcastTags,
  fetchMessageTemplates,
  sendBroadcast,
  type BroadcastLogItem,
  type BroadcastMemberStatus,
  type BroadcastMemberType,
  type BroadcastRecipient,
  type MessageTemplate,
} from "../../lib/admin-api";
import { ConfirmDialog } from "../ConfirmDialog";

const MAX_CHARS = 4500;

type WizardStep = 1 | 2 | 3 | 4;

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: "กรองกลุ่มผู้รับ" },
  { step: 2, label: "เลือกข้อความ" },
  { step: 3, label: "ตรวจรายชื่อ" },
  { step: 4, label: "ยืนยันและส่ง" },
];

const BOARD_MARCH_PRESET = [
  "แจ้งเตือนต่ออายุสมาชิก (กรรมการสมาคม)",
  "",
  "เพื่อรักษาสิทธิ์ก่อนประชุมใหญ่สามัญประจำปี",
  "กรุณาต่ออายุสมาชิกภายในช่วงกลางเดือนมีนาคมครับ",
  "",
  "ต่ออายุผ่าน LINE OA ของสมาคมได้เลยครับ",
].join("\n");

const ERROR_LABEL: Record<string, string> = {
  load_failed: "โหลดรายชื่อไม่สำเร็จ กรุณาลองใหม่",
  send_failed: "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  not_authorized: "ไม่มีสิทธิ์ส่งข้อความแบบกลุ่ม",
};

function errorMessage(err: unknown, fallback: string): string {
  const code = err instanceof Error ? err.message : fallback;
  return ERROR_LABEL[code] ?? code;
}

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

function goMessageTemplates() {
  window.history.pushState({}, "", "/admin/message-templates");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function BroadcastPage() {
  const [step, setStep] = useState<WizardStep>(1);
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
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<BroadcastLogItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

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
      setError(errorMessage(err, "load_failed"));
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
  const hasSearch = recipientQuery.trim().length > 0;

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

  const activeTemplate =
    templates.find((t) => t.id === templateId) ?? null;

  function clearFilters() {
    setMemberTypes([]);
    setStatuses([]);
    setBoardOnly(false);
    setSelectedTags([]);
    setTagDraft("");
  }

  function applyBoardMarchFilters() {
    setMemberTypes([]);
    setStatuses(["active", "near_expiry", "temporary"]);
    setBoardOnly(true);
    setSelectedTags([]);
    setMessage(BOARD_MARCH_PRESET);
    setTemplateId(null);
  }

  function applyAgmInviteFilters() {
    setMemberTypes(["ordinary"]);
    setStatuses(["active", "near_expiry", "temporary"]);
    setBoardOnly(false);
    setSelectedTags([]);
    const agm =
      templates.find((t) => t.id === "agm_invite") ?? templates[0] ?? null;
    if (agm?.body) {
      setMessage(agm.body);
      setTemplateId(agm.id);
    }
  }

  function loadTemplateIntoMessage(tpl: MessageTemplate) {
    setMessage(tpl.body);
    setTemplateId(tpl.id);
    setError(null);
    setResult(null);
  }

  function addTagFromDraft() {
    const t = tagDraft.trim().toLowerCase();
    if (!t) return;
    setSelectedTags((list) => (list.includes(t) ? list : [...list, t]));
    setTagDraft("");
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

  function goNext() {
    setError(null);
    setResult(null);
    setStep((s) => (s < 4 ? ((s + 1) as WizardStep) : s));
  }

  function goBack() {
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
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
      setTemplateId(null);
      setSelected(new Set());
      setStep(1);
      await loadLogs();
    } catch (err) {
      setError(errorMessage(err, "send_failed"));
    } finally {
      setSending(false);
    }
  }

  const canProceedFrom1 = recipients.length > 0 && !loading;
  const canProceedFrom2 = message.trim().length > 0;
  const canProceedFrom3 = selectedCount > 0;

  return (
    <div className="bo-broadcast">
      <header className="bo-broadcast-hero">
        <div className="bo-broadcast-hero-copy">
          <p className="bo-broadcast-lead">
            ส่งข้อความแบบกลุ่มผ่าน LINE OA — ทำทีละขั้น
          </p>
          <p className="bo-muted bo-broadcast-lead-sub">
            กรองกลุ่ม → เลือกข้อความจากแม่แบบ → ตรวจรายชื่อ → ยืนยันแล้วส่ง
          </p>
        </div>
        <button
          type="button"
          className="bo-btn bo-btn-ghost bo-btn-sm"
          onClick={goMessageTemplates}
        >
          ตั้งค่าแม่แบบ
        </button>
      </header>

      <nav className="bo-wizard-steps" aria-label="ขั้นตอนการส่ง">
        {STEPS.map(({ step: s, label }) => {
          const done = step > s;
          const current = step === s;
          return (
            <button
              key={s}
              type="button"
              className={`bo-wizard-step${current ? " is-current" : ""}${done ? " is-done" : ""}`}
              aria-current={current ? "step" : undefined}
              disabled={s > step}
              onClick={() => {
                if (s <= step) {
                  setError(null);
                  setStep(s);
                }
              }}
            >
              <span className="bo-wizard-step-num" aria-hidden="true">
                {done ? "✓" : s}
              </span>
              <span className="bo-wizard-step-label">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="bo-stats bo-broadcast-stats" aria-live="polite">
        <div className="bo-stat">
          <div className="num">{recipients.length}</div>
          <div className="lbl">ส่งได้ (มี LINE)</div>
        </div>
        <div
          className={`bo-stat bo-stat--accent${selectedCount > 0 ? " is-hot" : ""}`}
        >
          <div className="num">{selectedCount}</div>
          <div className="lbl">เลือกแล้ว</div>
        </div>
        <div className="bo-stat">
          <div className="num">{totalMatched}</div>
          <div className="lbl">ตรงเงื่อนไข</div>
        </div>
        <div className="bo-stat">
          <div className="num">{skippedNoLine}</div>
          <div className="lbl">ไม่มี LINE</div>
        </div>
      </div>

      {error && step !== 4 ? (
        <div className="bo-error" role="alert">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="bo-success" role="status">
          {result}
        </div>
      ) : null}

      {step === 1 ? (
        <section className="bo-panel">
          <div className="bo-panel-head bo-broadcast-panel-head">
            <div>
              <h2>1. กรองกลุ่มผู้รับ</h2>
              <p className="bo-muted bo-broadcast-head-sub">
                ไม่เลือก = รวมทุกค่าในกลุ่มนั้น · เปลี่ยนตัวกรองแล้วรายชื่อจะโหลดใหม่
              </p>
            </div>
            <div className="bo-broadcast-step-actions">
              <button
                type="button"
                className="bo-btn bo-btn-ghost bo-btn-sm"
                disabled={!filtersActive || loading}
                onClick={clearFilters}
              >
                ล้างตัวกรอง
              </button>
              <button
                type="button"
                className="bo-btn bo-btn-ghost bo-btn-sm"
                disabled={loading}
                onClick={() => void loadRecipients()}
              >
                {loading ? "กำลังโหลด…" : "รีเฟรชรายชื่อ"}
              </button>
            </div>
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
                        setMemberTypes((list) => toggleInList(list, opt.value))
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

            <div className="bo-filter-group">
              <span className="bo-filter-label" id="bc-board-label">
                กลุ่มพิเศษ
              </span>
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
              </div>
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

            <div className="bo-broadcast-active-filters" aria-live="polite">
              <span className="bo-filter-label">กำลังใช้</span>
              <div className="bo-broadcast-compose-chips">
                {filterSummary.map((part) => (
                  <span key={part} className="bo-broadcast-chip">
                    {part}
                  </span>
                ))}
              </div>
            </div>

            <div className="bo-broadcast-presets">
              <span className="bo-filter-label">ทางลัดตัวกรอง</span>
              <p className="bo-hint bo-broadcast-preset-hint">
                ตั้งตัวกรองให้พร้อม — ข้อความเชิญประชุมดึงจากแม่แบบที่บันทึกไว้
              </p>
              <div className="bo-broadcast-preset-btns">
                <button
                  type="button"
                  className="bo-btn bo-btn-ghost bo-btn-sm"
                  disabled={loading}
                  onClick={applyBoardMarchFilters}
                >
                  แจ้งเตือนกรรมการ (มี.ค.)
                </button>
                <button
                  type="button"
                  className="bo-btn bo-btn-ghost bo-btn-sm"
                  disabled={
                    loading ||
                    !templates.some(
                      (t) => t.id === "agm_invite" && t.body.trim(),
                    )
                  }
                  onClick={applyAgmInviteFilters}
                  title="กรองสมาชิกสามัญ + โหลดข้อความจากแม่แบบ"
                >
                  ใช้แม่แบบเชิญประชุม
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bo-empty">กำลังโหลดรายชื่อตามตัวกรอง…</div>
            ) : recipients.length === 0 ? (
              <div className="bo-empty">
                <strong>ไม่พบผู้รับที่ผูก LINE</strong>
                ลองเปลี่ยนตัวกรอง หรือทำเครื่องหมายกรรมการในโปรไฟล์สมาชิก
                {filtersActive ? (
                  <div className="bo-broadcast-empty-actions">
                    <button
                      type="button"
                      className="bo-btn bo-btn-ghost bo-btn-sm"
                      onClick={clearFilters}
                    >
                      ล้างตัวกรอง
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="bo-hint">
                พบ {recipients.length.toLocaleString("th-TH")} คนที่ส่งได้ —
                กดถัดไปเพื่อเลือกข้อความ
              </p>
            )}
          </div>

          <div className="bo-wizard-footer">
            <span className="bo-hint">ขั้นตอนที่ 1 จาก 4</span>
            <button
              type="button"
              className="bo-btn bo-btn-primary"
              disabled={!canProceedFrom1}
              onClick={goNext}
            >
              ถัดไป — เลือกข้อความ
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="bo-panel">
          <div className="bo-panel-head bo-broadcast-panel-head">
            <div>
              <h2>2. เลือกข้อความจากแม่แบบ</h2>
              <p className="bo-muted bo-broadcast-head-sub">
                ดึงจากแม่แบบที่บันทึกไว้ แล้วปรับข้อความครั้งนี้ได้โดยไม่ต้องบันทึกกลับ
              </p>
            </div>
            <button
              type="button"
              className="bo-btn bo-btn-ghost bo-btn-sm"
              onClick={goMessageTemplates}
            >
              แก้ไขแม่แบบ
            </button>
          </div>

          <div className="bo-broadcast-compose">
            {templates.length === 0 ? (
              <div className="bo-empty">
                <strong>ยังไม่มีแม่แบบ</strong>
                ไปตั้งค่าแม่แบบก่อน หรือพิมพ์ข้อความด้านล่างเอง
                <div className="bo-broadcast-empty-actions">
                  <button
                    type="button"
                    className="bo-btn bo-btn-ghost bo-btn-sm"
                    onClick={goMessageTemplates}
                  >
                    ไปตั้งค่าแม่แบบ
                  </button>
                </div>
              </div>
            ) : (
              <div className="bo-broadcast-template-pick" role="list">
                {templates.map((tpl) => {
                  const active = templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      role="listitem"
                      className={`bo-broadcast-template-card${active ? " is-active" : ""}`}
                      onClick={() => loadTemplateIntoMessage(tpl)}
                    >
                      <strong>{tpl.title}</strong>
                      <span className="bo-hint">
                        {tpl.updatedAt
                          ? `บันทึกล่าสุด ${new Date(tpl.updatedAt).toLocaleString("th-TH")}`
                          : "ข้อความเริ่มต้นของระบบ"}
                      </span>
                      <span className="bo-broadcast-template-card-preview">
                        {tpl.body.slice(0, 120)}
                        {tpl.body.length > 120 ? "…" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <label className="bo-field">
              <span>
                ข้อความที่จะส่ง
                {activeTemplate
                  ? ` (จาก: ${activeTemplate.title} — แก้ได้)`
                  : ""}
              </span>
              <textarea
                rows={10}
                value={message}
                maxLength={MAX_CHARS}
                placeholder="เลือกแม่แบบด้านบน หรือพิมพ์ข้อความเอง…"
                onChange={(e) => {
                  setMessage(e.target.value);
                  setResult(null);
                }}
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

            {message.trim() ? (
              <div
                className="bo-broadcast-preview-box"
                aria-label="ตัวอย่างข้อความ"
              >
                <div className="bo-broadcast-preview-label">ตัวอย่างใน LINE</div>
                <pre className="bo-broadcast-preview-body">
                  {message.trim()}
                </pre>
              </div>
            ) : null}

            <p className="bo-hint">
              ต้องการแก้แม่แบบถาวร?{" "}
              <button
                type="button"
                className="bo-link-btn"
                onClick={goMessageTemplates}
              >
                ไปหน้าแม่แบบข้อความ
              </button>
            </p>
          </div>

          <div className="bo-wizard-footer">
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              onClick={goBack}
            >
              ย้อนกลับ
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-primary"
              disabled={!canProceedFrom2}
              onClick={goNext}
            >
              ถัดไป — ตรวจรายชื่อ
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="bo-panel" aria-busy={loading}>
          <div className="bo-panel-head bo-broadcast-panel-head">
            <div>
              <h2>3. ตรวจรายชื่อที่เลือก</h2>
              <p className="bo-muted bo-broadcast-head-sub">
                แสดงเฉพาะสมาชิกที่ผูก LINE แล้ว — คลิกแถวเพื่อเลือก/ยกเลิก
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
              <div className="bo-broadcast-search-row">
                <input
                  type="search"
                  value={recipientQuery}
                  placeholder="ชื่อ, เลขสมาชิก, หรือเบอร์โทร"
                  onChange={(e) => setRecipientQuery(e.target.value)}
                />
                {hasSearch ? (
                  <button
                    type="button"
                    className="bo-btn bo-btn-ghost bo-btn-sm"
                    onClick={() => setRecipientQuery("")}
                  >
                    ล้าง
                  </button>
                ) : null}
              </div>
            </label>
            <div
              className={`bo-broadcast-selection-meta${selectedCount > 0 ? " is-selected" : ""}`}
              aria-live="polite"
            >
              <span className="bo-broadcast-selection-count">
                {selectedCount}
              </span>
              <span className="bo-broadcast-selection-text">
                เลือกแล้วจาก {recipients.length} คน
                {hasSearch ? ` · แสดง ${filteredRecipients.length}` : ""}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="bo-empty">กำลังโหลดรายชื่อ…</div>
          ) : recipients.length === 0 ? (
            <div className="bo-empty">
              <strong>ไม่พบผู้รับที่ผูก LINE</strong>
              ย้อนกลับไปปรับตัวกรอง
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="bo-empty">
              <strong>ไม่พบรายชื่อที่ตรงกับการค้นหา</strong>
              ลองคำอื่น หรือล้างช่องค้นหา
              <div className="bo-broadcast-empty-actions">
                <button
                  type="button"
                  className="bo-btn bo-btn-ghost bo-btn-sm"
                  onClick={() => setRecipientQuery("")}
                >
                  ล้างการค้นหา
                </button>
              </div>
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
                          isOn
                            ? "bo-broadcast-row is-selected"
                            : "bo-broadcast-row"
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
                        <td>
                          {(r.tags ?? []).length ? (
                            <span className="bo-broadcast-row-tags">
                              {(r.tags ?? []).join(", ")}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
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

          <div className="bo-wizard-footer">
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              onClick={goBack}
            >
              ย้อนกลับ
            </button>
            <button
              type="button"
              className="bo-btn bo-btn-primary"
              disabled={!canProceedFrom3}
              onClick={goNext}
            >
              ถัดไป — ยืนยันและส่ง
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="bo-panel">
          <div className="bo-panel-head bo-broadcast-panel-head">
            <div>
              <h2>4. ยืนยันแล้วส่ง LINE</h2>
              <p className="bo-muted bo-broadcast-head-sub">
                ตรวจสรุปอีกครั้งก่อนส่งผ่าน LINE OA
              </p>
            </div>
          </div>

          <div className="bo-broadcast-compose">
            {error ? (
              <div className="bo-error" role="alert">
                {error}
              </div>
            ) : null}

            <div
              className={`bo-broadcast-compose-summary${selectedCount > 0 ? " is-ready" : ""}`}
            >
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

            <div
              className="bo-broadcast-preview-box"
              aria-label="ข้อความที่จะส่ง"
            >
              <div className="bo-broadcast-preview-label">
                ข้อความที่จะส่ง
                {activeTemplate ? ` · จากแม่แบบ «${activeTemplate.title}»` : ""}
              </div>
              <pre className="bo-broadcast-preview-body bo-templates-preview-body">
                {message.trim() || "—"}
              </pre>
            </div>

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
                    ? "ย้อนกลับไปเลือกผู้รับอย่างน้อย 1 คน"
                    : "ย้อนกลับไปใส่ข้อความก่อนกดส่ง"}
                </p>
              ) : null}
            </div>
          </div>

          <div className="bo-wizard-footer">
            <button
              type="button"
              className="bo-btn bo-btn-ghost"
              onClick={goBack}
              disabled={sending}
            >
              ย้อนกลับ
            </button>
          </div>
        </section>
      ) : null}

      <section className="bo-panel">
        <div className="bo-panel-head bo-broadcast-panel-head">
          <div>
            <h2>ประวัติการส่งล่าสุด</h2>
            <p className="bo-muted bo-broadcast-head-sub">
              15 รายการล่าสุดจากระบบ
            </p>
          </div>
        </div>
        {logs.length === 0 ? (
          <div className="bo-empty">
            <strong>ยังไม่มีประวัติการส่ง</strong>
            เมื่อส่งข้อความสำเร็จ รายการจะแสดงที่นี่
          </div>
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
