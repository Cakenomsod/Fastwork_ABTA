import { useCallback, useEffect, useState } from "react";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  fetchMessageTemplates,
  saveMessageTemplate,
  type MessageTemplate,
} from "../../lib/admin-api";

const MAX_CHARS = 4500;
const AGM_INVITE_ID = "agm_invite";

const ERROR_LABEL: Record<string, string> = {
  load_failed: "โหลดแม่แบบไม่สำเร็จ กรุณาลองใหม่",
  save_template_failed: "บันทึกแม่แบบไม่สำเร็จ",
  create_template_failed: "สร้างแม่แบบไม่สำเร็จ",
  delete_template_failed: "ลบแม่แบบไม่สำเร็จ",
  title_required: "กรุณาใส่ชื่อแม่แบบ",
  body_required: "กรุณาใส่ข้อความแม่แบบ",
  cannot_delete_system_template: "ไม่สามารถลบแม่แบบระบบ (เชิญประชุม) ได้",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  not_authorized: "ไม่มีสิทธิ์แก้ไขแม่แบบข้อความ",
  not_found: "ไม่พบแม่แบบ หรือ API ยังไม่อัปเดต — ลองรีเฟรชหรือแจ้งผู้ดูแลระบบ",
  route_not_found: "API ยังไม่รองรับคำขอนี้ — ต้อง deploy Cloud Functions เวอร์ชันใหม่",
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
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const selected =
    !creating && selectedId
      ? (templates.find((t) => t.id === selectedId) ?? null)
      : creating
        ? null
        : (templates[0] ?? null);

  const applyTemplate = useCallback((tpl: MessageTemplate) => {
    setCreating(false);
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
      if (creating) return;
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
  }, [applyTemplate, creating, selectedId]);

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

  function startCreate() {
    setCreating(true);
    setSelectedId(null);
    setTitle("");
    setBody("");
    setError(null);
    setResult(null);
  }

  function cancelCreate() {
    setCreating(false);
    setError(null);
    setResult(null);
    const fallback =
      (selectedId && templates.find((t) => t.id === selectedId)) ||
      templates[0] ||
      null;
    if (fallback) applyTemplate(fallback);
    else {
      setSelectedId(null);
      setTitle("");
      setBody("");
    }
  }

  const dirty = creating
    ? Boolean(title.trim() || body.trim())
    : selected != null &&
      (title.trim() !== selected.title.trim() ||
        body.trim() !== selected.body.trim());

  const charsLeft = MAX_CHARS - body.length;
  const nearLimit = charsLeft <= 200;
  const canSave =
    Boolean(title.trim() && body.trim() && dirty && !saving && !deleting);

  const canDelete =
    Boolean(selected && selected.id !== AGM_INVITE_ID && !saving && !deleting);

  async function onSave() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      if (creating) {
        const saved = await createMessageTemplate({
          title: title.trim(),
          body: body.trim(),
        });
        setTemplates((list) => [saved, ...list.filter((t) => t.id !== saved.id)]);
        applyTemplate(saved);
        setResult("สร้างแม่แบบแล้ว — ใช้ได้จากหน้าส่งข้อความแบบกลุ่ม");
      } else if (selected) {
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
      }
    } catch (err) {
      setError(
        errorMessage(
          err,
          creating ? "create_template_failed" : "save_template_failed",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    if (creating) {
      setTitle("");
      setBody("");
      setError(null);
      setResult(null);
      return;
    }
    if (!selected) return;
    applyTemplate(selected);
    setError(null);
    setResult(null);
  }

  async function onDelete() {
    if (!selected || selected.id === AGM_INVITE_ID) return;
    const ok = window.confirm(
      `ลบแม่แบบ «${selected.title}» ใช่หรือไม่?\nการลบนี้ไม่สามารถกู้คืนได้`,
    );
    if (!ok) return;

    setDeleting(true);
    setError(null);
    setResult(null);
    try {
      const deletedId = selected.id;
      await deleteMessageTemplate(deletedId);
      const nextList = templates.filter((t) => t.id !== deletedId);
      setTemplates(nextList);
      const next = nextList[0] ?? null;
      if (next) applyTemplate(next);
      else {
        setCreating(false);
        setSelectedId(null);
        setTitle("");
        setBody("");
      }
      setResult("ลบแม่แบบแล้ว");
    } catch (err) {
      setError(errorMessage(err, "delete_template_failed"));
    } finally {
      setDeleting(false);
    }
  }

  const editorTitle = creating
    ? "แม่แบบใหม่"
    : selected?.title ?? "แก้ไขแม่แบบ";

  return (
    <div className="bo-templates">
      <header className="bo-templates-hero">
        <div className="bo-templates-hero-copy">
          <p className="bo-templates-lead">
            สร้างและจัดการแม่แบบข้อความหลายชุด สำหรับส่งผ่าน LINE OA
          </p>
          <p className="bo-muted bo-templates-lead-sub">
            บันทึกข้อความที่ใช้บ่อยไว้ที่นี่ แล้วเลือกใช้ตอนส่งข้อความแบบกลุ่ม —
            แม่แบบเชิญประชุมเป็นค่าเริ่มต้นของระบบ สามารถเพิ่มแม่แบบอื่นได้ไม่จำกัด
          </p>
        </div>
        <div className="bo-templates-hero-actions">
          <button
            type="button"
            className="bo-btn bo-btn-primary bo-btn-sm"
            disabled={loading || creating}
            onClick={startCreate}
          >
            สร้างแม่แบบใหม่
          </button>
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

      {loading && templates.length === 0 && !creating ? (
        <div className="bo-panel">
          <div className="bo-empty">กำลังโหลดแม่แบบ…</div>
        </div>
      ) : templates.length === 0 && !creating ? (
        <div className="bo-panel">
          <div className="bo-empty">
            <strong>ยังไม่มีแม่แบบ</strong>
            กด «สร้างแม่แบบใหม่» เพื่อเพิ่มข้อความที่ใช้ส่งบ่อย
            <div className="bo-templates-empty-actions">
              <button
                type="button"
                className="bo-btn bo-btn-primary bo-btn-sm"
                onClick={startCreate}
              >
                สร้างแม่แบบใหม่
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bo-templates-layout">
          <aside className="bo-panel bo-templates-list" aria-label="รายการแม่แบบ">
            <div className="bo-panel-head">
              <div>
                <h2>แม่แบบที่มี ({templates.length})</h2>
                <p className="bo-muted bo-templates-head-sub">
                  เลือกเพื่อแก้ไข หรือสร้างชุดใหม่
                </p>
              </div>
              <button
                type="button"
                className="bo-btn bo-btn-ghost bo-btn-sm"
                disabled={creating}
                onClick={startCreate}
              >
                + ใหม่
              </button>
            </div>
            <ul className="bo-templates-nav">
              {creating ? (
                <li>
                  <button
                    type="button"
                    className="bo-templates-nav-btn is-active is-draft"
                    aria-current="true"
                  >
                    <span className="bo-templates-nav-title">แม่แบบใหม่</span>
                    <span className="bo-templates-nav-meta">ยังไม่บันทึก</span>
                  </button>
                </li>
              ) : null}
              {templates.map((tpl) => {
                const active = !creating && tpl.id === selected?.id;
                return (
                  <li key={tpl.id}>
                    <button
                      type="button"
                      className={`bo-templates-nav-btn${active ? " is-active" : ""}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => selectTemplate(tpl)}
                    >
                      <span className="bo-templates-nav-title">
                        {tpl.title}
                        {tpl.id === AGM_INVITE_ID ? (
                          <span className="bo-templates-nav-badge">ระบบ</span>
                        ) : null}
                      </span>
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
            aria-label={creating ? "สร้างแม่แบบใหม่" : "แก้ไขแม่แบบ"}
          >
            {creating || selected ? (
              <>
                <div className="bo-panel-head bo-templates-editor-head">
                  <div>
                    <h2>{editorTitle}</h2>
                    <p className="bo-muted bo-templates-head-sub">
                      {creating
                        ? "ใส่ชื่อและข้อความ แล้วกดบันทึกเพื่อเพิ่มเข้าคลังแม่แบบ"
                        : `${formatUpdatedAt(selected?.updatedAt)}${
                            selected?.updatedBy
                              ? ` · โดย ${selected.updatedBy}`
                              : ""
                          }`}
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
                      placeholder="เช่น แจ้งเตือนต่ออายุ / นัดหมายสัมมนา"
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
                      {saving
                        ? "กำลังบันทึก…"
                        : creating
                          ? "สร้างแม่แบบ"
                          : "บันทึกแม่แบบ"}
                    </button>
                    <button
                      type="button"
                      className="bo-btn bo-btn-ghost"
                      disabled={(!dirty && !creating) || saving || deleting}
                      onClick={creating ? cancelCreate : onReset}
                    >
                      {creating ? "ยกเลิก" : "คืนค่าที่บันทึกไว้"}
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        className="bo-btn bo-btn-danger-ghost"
                        disabled={deleting || saving}
                        onClick={() => void onDelete()}
                      >
                        {deleting ? "กำลังลบ…" : "ลบแม่แบบ"}
                      </button>
                    ) : null}
                  </div>
                  <p className="bo-hint">
                    {selected?.id === AGM_INVITE_ID
                      ? "แม่แบบเชิญประชุมเป็นค่าเริ่มต้นของระบบ — แก้ไขได้ แต่ลบไม่ได้ และยังใช้เป็นทางลัดในหน้าส่งข้อความแบบกลุ่ม"
                      : "หลังบันทึกแล้ว ไปที่ «ส่งข้อความแบบกลุ่ม» เพื่อเลือกผู้รับและส่งจากแม่แบบใดก็ได้"}
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
