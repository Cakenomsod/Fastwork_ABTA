import { useEffect, useMemo, useState } from "react";
import {
  createAdminSeminar,
  decideSeminarRegistration,
  fetchAdminSeminarRegistrations,
  fetchAdminSeminars,
} from "../../lib/admin-api";

type Seminar = {
  seminarId: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  pricing?: Record<string, number>;
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

const PRICING_LABEL: Record<string, string> = {
  public_paid: "บุคคลทั่วไป",
  member_free: "สมาชิก · ฟรี",
  member_paid: "สมาชิก · เสียเงิน",
};

const emptyForm = {
  title: "",
  description: "",
  eventDate: "",
  location: "",
  allowPublic: true,
  allowMember: true,
  publicFee: "500",
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

export default function SeminarsPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function createSeminar() {
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
      const memberFee = Math.max(0, Number(form.memberFee) || 0);
      await createAdminSeminar({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        eventDate: form.eventDate.trim() || undefined,
        location: form.location.trim() || undefined,
        publicPaid: form.allowPublic
          ? Math.max(0, Number(form.publicFee) || 0)
          : undefined,
        memberFree:
          form.allowMember && memberFee === 0 ? 0 : undefined,
        memberPaid:
          form.allowMember && memberFee > 0 ? memberFee : undefined,
      });
      setForm(emptyForm);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create_failed");
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
    <div className="bo-page">
      <header className="bo-page-head">
        <h1>สัมมนา</h1>
      </header>
      {error ? <div className="bo-error">{error}</div> : null}

      <section className="bo-panel bo-seminar-create">
        <div className="bo-panel-head">
          <div>
            <h2>สร้างงานสัมมนา</h2>
            <p className="bo-seminar-create__hint">
              กำหนดรายละเอียด แล้วเลือกกลุ่มผู้เข้าพร้อมค่าธรรมเนียม
            </p>
          </div>
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
              กดเลือกกลุ่มที่เปิดรับสมัคร แล้วตั้งค่าธรรมเนียมแต่ละกลุ่ม
            </p>

            <div className="bo-seminar-audience__grid">
              <button
                type="button"
                className={`bo-seminar-audience__card${form.allowPublic ? " is-on" : ""}`}
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
                  <em>ผู้ที่ยังไม่เป็นสมาชิก ABTA</em>
                </span>
              </button>

              <button
                type="button"
                className={`bo-seminar-audience__card${form.allowMember ? " is-on" : ""}`}
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
                  <em>สมาชิกที่ผูก LINE แล้ว</em>
                </span>
              </button>
            </div>

            <div className="bo-seminar-fees">
              {form.allowPublic ? (
                <div className="bo-seminar-fees__item">
                  <label htmlFor="sem-public-fee">
                    <span>ค่าธรรมเนียม · บุคคลทั่วไป</span>
                    <span className="bo-seminar-fees__unit">บาท</span>
                  </label>
                  <div className="bo-seminar-fees__input">
                    <input
                      id="sem-public-fee"
                      type="number"
                      min={0}
                      step={50}
                      value={form.publicFee}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, publicFee: e.target.value }))
                      }
                    />
                  </div>
                  <p className="bo-seminar-fees__note">
                    ใส่ 0 หากให้เข้าฟรี
                  </p>
                </div>
              ) : null}

              {form.allowMember ? (
                <div className="bo-seminar-fees__item">
                  <label htmlFor="sem-member-fee">
                    <span>ค่าธรรมเนียม · สมาชิก</span>
                    <span className="bo-seminar-fees__unit">บาท</span>
                  </label>
                  <div className="bo-seminar-fees__input">
                    <input
                      id="sem-member-fee"
                      type="number"
                      min={0}
                      step={50}
                      value={form.memberFee}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, memberFee: e.target.value }))
                      }
                    />
                  </div>
                  <p className="bo-seminar-fees__note">
                    ใส่ 0 = สมาชิกเข้าฟรี · มากกว่า 0 = สมาชิกเสียเงิน
                  </p>
                </div>
              ) : null}
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
              className="bo-btn bo-btn-primary"
              disabled={busy || !audienceOk}
              onClick={() => void createSeminar()}
            >
              {busy ? "กำลังบันทึก…" : "สร้างงานสัมมนา"}
            </button>
          </div>
        </div>
      </section>

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2>งานที่เปิดอยู่</h2>
        </div>
        {seminars.length === 0 ? (
          <p className="bo-seminar-empty">ยังไม่มีงานสัมมนา — สร้างงานแรกด้านบนได้เลย</p>
        ) : (
          <ul className="bo-seminar-list">
            {seminars.map((s) => (
              <li key={s.seminarId} className="bo-seminar-list__item">
                <div>
                  <strong>{s.title}</strong>
                  <p>
                    {[s.eventDate, s.location].filter(Boolean).join(" · ") ||
                      s.seminarId}
                  </p>
                </div>
                <span className="bo-seminar-list__pricing">
                  {pricingSummary(s.pricing)}
                </span>
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
    </div>
  );
}
