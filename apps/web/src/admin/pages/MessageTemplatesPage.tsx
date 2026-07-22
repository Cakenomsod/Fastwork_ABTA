import { useCallback, useEffect, useState } from "react";
import {
  fetchMessageTemplates,
  saveMessageTemplate,
  type MessageTemplate,
} from "../../lib/admin-api";

const MAX_CHARS = 4500;

const ERROR_LABEL: Record<string, string> = {
  load_failed: "โหลดแม่แบบไม่สำเร็จ กรุณาลองใหม่",
  save_template_failed: "บันทึกแม่แบบไม่สำเร็จ",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  not_authorized: "ไม่มีสิทธิ์แก้ไขแม่แบบข้อความ",
};

function errorMessage(err: unknown, fallback: string): string {
  const code = err instanceof Error ? err.message : fallback;
  return ERROR_LABEL[code] ?? code;
}

function goBroadcast() {
  window.history.pushState({}, "", "/admin/broadcast");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function formatUpdatedAt(iso?: string): string {
  if (!iso) return "ยังไม่เคยบันทึก — ใช้ข้อความเริ่มต้นของระบบ";
  return `บันทึกล่าสุด ${new Date(iso).toLocaleString("th-TH")}`;
}

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const selected =
    templates.find((t) => t.id === selectedId) ?? templates[0] ?? null;

  const applyTemplate = useCallback((tpl: MessageTemplate) => {
    setSelectedId(tpl.id);
    setTitle(tpl.title);
    setBody(tpl.body);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMessageTemplates();
      setTemplates(list);
      const next =
        (selectedId && list.find((t) => t.id === selectedId)) ||
        list[0] ||
        null;
      if (next) {
        applyTemplate(next);
      } else {
        setSelectedId(null);
        setTitle("");
        setBody("");
      }
    } catch (err) {
      setError(errorMessage(err, "load_failed"));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [applyTemplate, selectedId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchMessageTemplates();
        setTemplates(list);
        const first = list[0] ?? null;
        if (first) applyTemplate(first);
      } catch (err) {
        setError(errorMessage(err, "load_failed"));
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [applyTemplate]);

  function selectTemplate(tpl: MessageTemplate) {
    applyTemplate(tpl);
    setError(null);
    setResult(null);
  }

  const dirty =
    selected != null &&
    (title.trim() !== selected.title.trim() ||
      body.trim() !== selected.body.trim());

  const charsLeft = MAX_CHARS - body.length;
  const nearLimit = charsLeft <= 200;
  const canSave = Boolean(selected && body.trim() && dirty && !saving);

  async function onSave() {
    if (!selected || !body.trim()) return;
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const saved = await saveMessageTemplate({
        id: selected.id,
        title: title.trim() || selected.title,
        body: body.trim(),
      });
      setTemplates((list) => {
        const rest = list.filter((t) => t.id !== saved.id);
        return [saved, ...rest];
      });
      applyTemplate(saved);
      setResult("บันทึกแม่แบบแล้ว — ใช้ได้จากหน้าส่งข้อความแบบกลุ่ม");
    } catch (err) {
      setError(errorMessage(err, "save_template_failed"));
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    if (!selected) return;
    applyTemplate(selected);
    setError(null);
    setResult(null);
  }

  return (
    <div className="bo-templates">
      <header className="bo-templates-hero">
        <div className="bo-templates-hero-copy">
          <p className="bo-templates-lead">
            แก้ไขและบันทึกข้อความแม่แบบสำหรับส่งผ่าน LINE OA
          </p>
          <p className="bo-muted bo-templates-lead-sub">
            หน้านี้สำหรับตั้งค่าเท่านั้น — การส่งข้อความอยู่ที่เมนูส่งข้อความแบบกลุ่ม
          </p>
        </div>
        <div className="bo-templates-hero-actions">
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
            className="bo-btn bo-btn-ghost bo-btn-sm"
            onClick={goBroadcast}
          >
            ไปส่งข้อความแบบกลุ่ม
          </button>
        </div>
      </header>

      {error ? (
        <div className="bo-error" role="alert">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="bo-success" role="status">
          {result}
        </div>
      ) : null}

      {loading && templates.length === 0 ? (
        <div className="bo-panel">
          <div className="bo-empty">กำลังโหลดแม่แบบ…</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bo-panel">
          <div className="bo-empty">
            <strong>ยังไม่มีแม่แบบ</strong>
            ระบบจะสร้างแม่แบบเชิญประชุมเมื่อพร้อมใช้งาน
          </div>
        </div>
      ) : (
        <div className="bo-templates-layout">
          <aside className="bo-panel bo-templates-list" aria-label="รายการแม่แบบ">
            <div className="bo-panel-head">
              <div>
                <h2>แม่แบบที่มี</h2>
                <p className="bo-muted bo-templates-head-sub">
                  เลือกเพื่อแก้ไข แล้วกดบันทึก
                </p>
              </div>
            </div>
            <ul className="bo-templates-nav">
              {templates.map((tpl) => {
                const active = tpl.id === selected?.id;
                return (
                  <li key={tpl.id}>
                    <button
                      type="button"
                      className={`bo-templates-nav-btn${active ? " is-active" : ""}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => selectTemplate(tpl)}
                    >
                      <span className="bo-templates-nav-title">{tpl.title}</span>
                      <span className="bo-templates-nav-meta">
                        {formatUpdatedAt(tpl.updatedAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section
            className="bo-panel bo-templates-editor"
            aria-label="แก้ไขแม่แบบ"
          >
            {selected ? (
              <>
                <div className="bo-panel-head bo-templates-editor-head">
                  <div>
                    <h2>{selected.title}</h2>
                    <p className="bo-muted bo-templates-head-sub">
                      {formatUpdatedAt(selected.updatedAt)}
                      {selected.updatedBy
                        ? ` · โดย ${selected.updatedBy}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="bo-templates-form">
                  <label className="bo-field">
                    <span>ชื่อแม่แบบ</span>
                    <input
                      type="text"
                      value={title}
                      maxLength={120}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setResult(null);
                      }}
                    />
                  </label>

                  <label className="bo-field">
                    <span>ข้อความ</span>
                    <textarea
                      rows={14}
                      value={body}
                      maxLength={MAX_CHARS}
                      placeholder="ข้อความที่จะใช้เป็นแม่แบบเมื่อส่งผ่าน LINE OA…"
                      onChange={(e) => {
                        setBody(e.target.value);
                        setResult(null);
                      }}
                    />
                    <span
                      className={`bo-hint${nearLimit ? " bo-templates-char-warn" : ""}`}
                    >
                      {body.length.toLocaleString("th-TH")} /{" "}
                      {MAX_CHARS.toLocaleString("th-TH")} ตัวอักษร
                    </span>
                  </label>

                  {body.trim() ? (
                    <div
                      className="bo-broadcast-preview-box"
                      aria-label="ตัวอย่างข้อความ"
                    >
                      <div className="bo-broadcast-preview-label">
                        ตัวอย่างใน LINE
                      </div>
                      <pre className="bo-broadcast-preview-body bo-templates-preview-body">
                        {body.trim()}
                      </pre>
                    </div>
                  ) : null}

                  <div className="bo-templates-actions">
                    <button
                      type="button"
                      className="bo-btn bo-btn-primary"
                      disabled={!canSave}
                      onClick={() => void onSave()}
                    >
                      {saving ? "กำลังบันทึก…" : "บันทึกแม่แบบ"}
                    </button>
                    <button
                      type="button"
                      className="bo-btn bo-btn-ghost"
                      disabled={!dirty || saving}
                      onClick={onReset}
                    >
                      คืนค่าที่บันทึกไว้
                    </button>
                  </div>
                  <p className="bo-hint">
                    หลังบันทึกแล้ว ไปที่ «ส่งข้อความแบบกลุ่ม» เพื่อเลือกผู้รับและส่ง
                  </p>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
