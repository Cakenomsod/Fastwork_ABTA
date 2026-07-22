import { useEffect, useMemo, useState } from "react";
import {
  createAdminSeminar,
  deactivateAdminSeminar,
  decideSeminarRegistration,
  fetchAdminSeminarRegistrations,
  fetchAdminSeminars,
  updateAdminSeminar,
} from "../../lib/admin-api";
import { ConfirmDialog } from "../ConfirmDialog";

type Seminar = {
  seminarId: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  pricing?: Record<string, number>;
  active?: boolean;
};

type Registration = {
  registrationId: string;
  seminarId: string;
  firstName: string;
  lastName: string;
  applicantType: string;
  feeThb: number;
  status: string;
};

type SeminarForm = {
  title: string;
  description: string;
  eventDate: string;
  location: string;
  allowPublic: boolean;
  allowMember: boolean;
  publicFee: string;
  memberFee: string;
};

const PRICING_LABEL: Record<string, string> = {
  public_paid: "บุคคลทั่วไป",
  member_free: "สมาชิก · ฟรี",
  member_paid: "สมาชิก · เสียเงิน",
};

const emptyForm: SeminarForm = {
  title: "",
  description: "",
  eventDate: "",
  location: "",
  allowPublic: true,
  allowMember: true,
  publicFee: "0",
  memberFee: "0",
};

function formatFee(n: number): string {
  if (n <= 0) return "ฟรี";
  return `${n.toLocaleString("th-TH")} บาท`;
}

function pricingSummary(pricing?: Record<string, number>): string {
  if (!pricing || Object.keys(pricing).length === 0) return "ยังไม่กำหนดราคา";
  const parts: string[] = [];
  if (pricing.public_paid != null) {
    parts.push(`ทั่วไป ${formatFee(Number(pricing.public_paid))}`);
  }
  if (pricing.member_free != null) {
    parts.push("สมาชิกฟรี");
  }
  if (pricing.member_paid != null) {
    parts.push(`สมาชิก ${formatFee(Number(pricing.member_paid))}`);
  }
  return parts.join(" · ");
}

function seminarToForm(s: Seminar): SeminarForm {
  const pricing = s.pricing ?? {};
  const allowPublic = pricing.public_paid != null;
  const allowMember =
    pricing.member_free != null || pricing.member_paid != null;
  let memberFee = "0";
  if (pricing.member_paid != null) memberFee = String(pricing.member_paid);
  else if (pricing.member_free != null) memberFee = "0";
  return {
    title: s.title ?? "",
    description: s.description ?? "",
    eventDate: s.eventDate ?? "",
    location: s.location ?? "",
    allowPublic: allowPublic || (!allowPublic && !allowMember),
    allowMember: allowMember || (!allowPublic && !allowMember),
    publicFee:
      pricing.public_paid != null ? String(pricing.public_paid) : "0",
    memberFee,
  };
}

function formPayload(form: SeminarForm) {
  const memberFee = Math.max(0, Number(form.memberFee) || 0);
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    eventDate: form.eventDate.trim() || undefined,
    location: form.location.trim() || undefined,
    publicPaid: form.allowPublic
      ? Math.max(0, Number(form.publicFee) || 0)
      : undefined,
    memberFree: form.allowMember && memberFee === 0 ? 0 : undefined,
    memberPaid: form.allowMember && memberFee > 0 ? memberFee : undefined,
  };
}

export default function SeminarsPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [form, setForm] = useState<SeminarForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState<Seminar | null>(null);

  const isEditing = editingId != null;
  const audienceOk = form.allowPublic || form.allowMember;

  const previewLines = useMemo(() => {
    const lines: string[] = [];
    if (form.allowPublic) {
      lines.push(`บุคคลทั่วไป · ${formatFee(Number(form.publicFee) || 0)}`);
    }
    if (form.allowMember) {
      lines.push(`สมาชิก · ${formatFee(Number(form.memberFee) || 0)}`);
    }
    return lines;
  }, [form.allowPublic, form.allowMember, form.publicFee, form.memberFee]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(s: Seminar) {
    setEditingId(s.seminarId);
    setForm(seminarToForm(s));
    setFormError(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function reload() {
    const [s, r] = await Promise.all([
      fetchAdminSeminars(),
      fetchAdminSeminarRegistrations(),
    ]);
    setSeminars((s.items as Seminar[]) ?? []);
    setRegs((r.items as Registration[]) ?? []);
  }

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
  }, []);

  async function saveSeminar() {
    if (!form.title.trim()) {
      setFormError("กรุณาระบุชื่องาน");
      return;
    }
    if (!audienceOk) {
      setFormError("เลือกอย่างน้อยหนึ่งกลุ่มผู้เข้าได้");
      return;
    }
    setBusy(true);
    setError(null);
    setFormError(null);
    try {
      const payload = formPayload(form);
      if (editingId) {
        await updateAdminSeminar({ seminarId: editingId, ...payload });
      } else {
        await createAdminSeminar(payload);
      }
      closeForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCloseSeminar() {
    if (!closing) return;
    setBusy(true);
    setError(null);
    try {
      await deactivateAdminSeminar(closing.seminarId);
      if (editingId === closing.seminarId) closeForm();
      setClosing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "deactivate_failed");
    } finally {
      setBusy(false);
    }
  }

  async function decide(registrationId: string, approve: boolean) {
    const reason = approve ? undefined : window.prompt("เหตุผลที่ปฏิเสธ") ?? "";
    if (!approve && !reason.trim()) return;
    setBusy(true);
    try {
      await decideSeminarRegistration({ registrationId, approve, reason });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "decide_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-seminar-page">
      {error ? <div className="bo-error">{error}</div> : null}

      {formOpen ? (
        <section className="bo-panel bo-seminar-create">
          <div className="bo-panel-head">
            <div>
              <h2>{isEditing ? "แก้ไขงานสัมมนา" : "สร้างงานสัมมนา"}</h2>
              <p className="bo-seminar-create__hint">
                {isEditing
                  ? "ปรับรายละเอียด กลุ่มผู้เข้า หรือค่าธรรมเนียมได้"
                  : "กำหนดรายละเอียด แล้วเลือกกลุ่มผู้เข้าพร้อมค่าธรรมเนียม"}
              </p>
            </div>
            <button
              type="button"
              className="bo-btn bo-btn-ghost bo-btn-sm"
              disabled={busy}
              onClick={closeForm}
            >
              ยกเลิก
            </button>
          </div>

          <div className="bo-seminar-create__body">
            <div className="bo-seminar-create__main">
              <div className="bo-field">
                <label htmlFor="sem-title">ชื่องาน</label>
                <input
                  id="sem-title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="เช่น สัมมนาผู้ประกอบการห้องเช่า 2569"
                  autoFocus
                />
              </div>

              <div className="bo-field">
                <label htmlFor="sem-desc">รายละเอียด</label>
                <textarea
                  id="sem-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="สรุปสั้น ๆ เกี่ยวกับงาน สิทธิประโยชน์ หรือหมายเหตุ"
                />
              </div>

              <div className="bo-seminar-create__row">
                <div className="bo-field">
                  <label htmlFor="sem-date">วันที่งาน</label>
                  <input
                    id="sem-date"
                    type="date"
                    value={form.eventDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, eventDate: e.target.value }))
                    }
                  />
                </div>
                <div className="bo-field">
                  <label htmlFor="sem-loc">สถานที่</label>
                  <input
                    id="sem-loc"
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="เช่น โรงแรม / ออนไลน์"
                  />
                </div>
              </div>
            </div>

            <fieldset className="bo-seminar-audience">
              <legend>ใครเข้างานนี้ได้บ้าง</legend>
              <p className="bo-seminar-audience__lead">
                กดเลือกกลุ่ม แล้วใส่ราคาในช่องของกลุ่มนั้นเลย
              </p>

              <div className="bo-seminar-audience__grid">
                <div
                  className={`bo-seminar-audience__option bo-seminar-audience__option--public${form.allowPublic ? " is-on" : ""}`}
                >
                  <button
                    type="button"
                    className="bo-seminar-audience__card"
                    aria-pressed={form.allowPublic}
                    onClick={() =>
                      setForm((f) => ({ ...f, allowPublic: !f.allowPublic }))
                    }
                  >
                    <span className="bo-seminar-audience__check" aria-hidden>
                      {form.allowPublic ? "✓" : ""}
                    </span>
                    <span className="bo-seminar-audience__meta">
                      <strong>บุคคลทั่วไป</strong>
                      <em>ยังไม่เป็นสมาชิก</em>
                    </span>
                    <span className="bo-seminar-audience__tag" aria-hidden>
                      ทั่วไป
                    </span>
                  </button>

                  {form.allowPublic ? (
                    <div className="bo-seminar-audience__price">
                      <label
                        className="bo-seminar-audience__price-label"
                        htmlFor="sem-public-fee"
                      >
                        <span className="bo-seminar-audience__price-who">
                          ราคา · ทั่วไป
                        </span>
                        <span className="bo-seminar-audience__price-hint">
                          0 = ฟรี
                        </span>
                      </label>
                      <div className="bo-seminar-audience__price-row">
                        <input
                          id="sem-public-fee"
                          type="number"
                          min={0}
                          step={50}
                          value={form.publicFee}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              publicFee: e.target.value,
                            }))
                          }
                          aria-label="ค่าธรรมเนียมบุคคลทั่วไป (บาท)"
                        />
                        <span className="bo-seminar-audience__price-unit">
                          บาท
                        </span>
                        {Number(form.publicFee) === 0 ? (
                          <span className="bo-seminar-audience__free">ฟรี</span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div
                  className={`bo-seminar-audience__option bo-seminar-audience__option--member${form.allowMember ? " is-on" : ""}`}
                >
                  <button
                    type="button"
                    className="bo-seminar-audience__card"
                    aria-pressed={form.allowMember}
                    onClick={() =>
                      setForm((f) => ({ ...f, allowMember: !f.allowMember }))
                    }
                  >
                    <span className="bo-seminar-audience__check" aria-hidden>
                      {form.allowMember ? "✓" : ""}
                    </span>
                    <span className="bo-seminar-audience__meta">
                      <strong>สมาชิก ABTA</strong>
                      <em>ผูก LINE แล้ว</em>
                    </span>
                    <span className="bo-seminar-audience__tag" aria-hidden>
                      สมาชิก
                    </span>
                  </button>

                  {form.allowMember ? (
                    <div className="bo-seminar-audience__price">
                      <label
                        className="bo-seminar-audience__price-label"
                        htmlFor="sem-member-fee"
                      >
                        <span className="bo-seminar-audience__price-who">
                          ราคา · สมาชิก
                        </span>
                        <span className="bo-seminar-audience__price-hint">
                          0 = ฟรี
                        </span>
                      </label>
                      <div className="bo-seminar-audience__price-row">
                        <input
                          id="sem-member-fee"
                          type="number"
                          min={0}
                          step={50}
                          value={form.memberFee}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              memberFee: e.target.value,
                            }))
                          }
                          aria-label="ค่าธรรมเนียมสมาชิก (บาท)"
                        />
                        <span className="bo-seminar-audience__price-unit">
                          บาท
                        </span>
                        {Number(form.memberFee) === 0 ? (
                          <span className="bo-seminar-audience__free">ฟรี</span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {previewLines.length > 0 ? (
                <div className="bo-seminar-preview" aria-live="polite">
                  <span className="bo-seminar-preview__label">สรุปสิทธิ์</span>
                  <ul>
                    {previewLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bo-seminar-preview bo-seminar-preview--empty">
                  ยังไม่ได้เลือกกลุ่มผู้เข้า
                </div>
              )}
            </fieldset>

            {formError ? (
              <div className="bo-error bo-seminar-create__error">{formError}</div>
            ) : null}

            <div className="bo-seminar-create__actions">
              <button
                type="button"
                className="bo-btn bo-btn-ghost"
                disabled={busy}
                onClick={closeForm}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="bo-btn bo-btn-primary"
                disabled={busy || !audienceOk}
                onClick={() => void saveSeminar()}
              >
                {busy
                  ? "กำลังบันทึก…"
                  : isEditing
                    ? "บันทึกการแก้ไข"
                    : "บันทึกงานสัมมนา"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2>งานที่เปิดอยู่</h2>
          {!formOpen ? (
            <button
              type="button"
              className="bo-btn bo-btn-primary bo-btn-sm"
              onClick={openCreate}
            >
              สร้างงานสัมมนา
            </button>
          ) : null}
        </div>
        {seminars.length === 0 ? (
          <p className="bo-seminar-empty">
            ยังไม่มีงานสัมมนา — กด “สร้างงานสัมมนา” เพื่อเปิดรับสมัคร
          </p>
        ) : (
          <ul className="bo-seminar-list">
            {seminars.map((s) => (
              <li
                key={s.seminarId}
                className={`bo-seminar-list__item${editingId === s.seminarId ? " is-editing" : ""}`}
              >
                <div className="bo-seminar-list__main">
                  <strong>{s.title}</strong>
                  <p>
                    {[s.eventDate, s.location].filter(Boolean).join(" · ") ||
                      s.seminarId}
                  </p>
                  <span className="bo-seminar-list__pricing">
                    {pricingSummary(s.pricing)}
                  </span>
                </div>
                <div className="bo-seminar-list__actions">
                  <button
                    type="button"
                    className="bo-btn bo-btn-ghost bo-btn-sm"
                    disabled={busy}
                    onClick={() => openEdit(s)}
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    className="bo-btn bo-btn-danger-ghost bo-btn-sm"
                    disabled={busy}
                    onClick={() => setClosing(s)}
                  >
                    ปิดงาน
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2>ใบสมัคร</h2>
        </div>
        <div className="bo-table-wrap">
          <table className="bo-table">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>งาน</th>
                <th>ประเภท</th>
                <th>สถานะ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {regs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "var(--bo-muted)" }}>
                    ยังไม่มีใบสมัคร
                  </td>
                </tr>
              ) : (
                regs.map((r) => (
                  <tr key={r.registrationId}>
                    <td>
                      {r.firstName} {r.lastName}
                    </td>
                    <td>
                      <code>{r.seminarId}</code>
                    </td>
                    <td>
                      {PRICING_LABEL[r.applicantType] ?? r.applicantType} (
                      {formatFee(r.feeThb)})
                    </td>
                    <td>{r.status}</td>
                    <td>
                      {r.status !== "confirmed" && r.status !== "rejected" ? (
                        <div className="bo-seminar-reg-actions">
                          <button
                            type="button"
                            className="bo-btn bo-btn-primary bo-btn-sm"
                            disabled={busy}
                            onClick={() => void decide(r.registrationId, true)}
                          >
                            อนุมัติ
                          </button>
                          <button
                            type="button"
                            className="bo-btn bo-btn-ghost bo-btn-sm"
                            disabled={busy}
                            onClick={() => void decide(r.registrationId, false)}
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={closing != null}
        title="ปิดงานสัมมนานี้?"
        description={
          closing
            ? `“${closing.title}” จะไม่แสดงในรายการรับสมัครอีก ใบสมัครที่มีอยู่แล้วยังดูได้`
            : undefined
        }
        confirmLabel="ปิดงาน"
        variant="danger"
        busy={busy}
        onCancel={() => {
          if (!busy) setClosing(null);
        }}
        onConfirm={() => void confirmCloseSeminar()}
      />
    </div>
  );
}
