import { useEffect, useState, type FormEvent } from "react";
import { apiBase } from "../lib/api";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import "./register.css";

type Seminar = {
  seminarId: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  pricing: Record<string, number>;
};

export default function SeminarPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [items, setItems] = useState<Seminar[]>([]);
  const [selected, setSelected] = useState<Seminar | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "0",
    email: "",
    shirtSize: "",
    foodType: "",
    notes: "",
    applicantType: "public_paid",
  });
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initLiff().then(setLiff);
    void fetch(`${apiBase()}/api/seminars`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems(d.items ?? []);
      })
      .catch(() => setError("โหลดรายการสัมมนาไม่สำเร็จ"));
  }, []);

  const fee = selected
    ? Number(selected.pricing[form.applicantType] ?? 0) || 0
    : 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await getIdToken();
      let slipContentType: string | undefined;
      let slipBase64: string | undefined;
      if (fee > 0) {
        if (!slipFile) throw new Error("slip_required");
        slipContentType = slipFile.type;
        slipBase64 = await fileToBase64(slipFile);
      }
      const res = await fetch(`${apiBase()}/api/seminars/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          seminarId: selected.seminarId,
          ...form,
          slipContentType,
          slipBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "error");
      setDone(data.registrationId);
    } catch (err) {
      setError(
        err instanceof Error && err.message === "slip_required"
          ? "กรุณาแนบสลิป"
          : "สมัครไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="reg-page">
        <section className="reg-card">
          <h1>รับสมัครสัมมนาแล้ว</h1>
          <p>รหัสใบสมัคร {done}</p>
          <p>รอเจ้าหน้าที่ยืนยันสิทธิ์ครับ</p>
        </section>
      </main>
    );
  }

  return (
    <main className="reg-page">
      <section className="reg-card">
        <h1>สมัครสัมมนา</h1>
        {liff.phase === "error" ? (
          <p className="reg-muted">{liff.message}</p>
        ) : null}
        {error ? <p className="reg-error">{error}</p> : null}

        {!selected ? (
          <ul className="reg-list">
            {items.map((s) => (
              <li key={s.seminarId}>
                <button
                  type="button"
                  className="reg-btn-ghost"
                  onClick={() => setSelected(s)}
                >
                  <strong>{s.title}</strong>
                  <span className="reg-muted">
                    {" "}
                    {s.eventDate ?? ""} {s.location ?? ""}
                  </span>
                </button>
              </li>
            ))}
            {items.length === 0 ? (
              <li className="reg-muted">ยังไม่มีงานสัมมนา</li>
            ) : null}
          </ul>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)}>
            <button
              type="button"
              className="reg-btn-ghost"
              onClick={() => setSelected(null)}
            >
              ← กลับ
            </button>
            <h2>{selected.title}</h2>
            <p className="reg-muted">{selected.description}</p>
            <label className="reg-field">
              <span>ชื่อ</span>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                required
              />
            </label>
            <label className="reg-field">
              <span>นามสกุล</span>
              <input
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                required
              />
            </label>
            <label className="reg-field">
              <span>เบอร์โทร</span>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                required
              />
            </label>
            <label className="reg-field">
              <span>ประเภทผู้สมัคร</span>
              <select
                value={form.applicantType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, applicantType: e.target.value }))
                }
              >
                {Object.keys(selected.pricing).map((k) => (
                  <option key={k} value={k}>
                    {k} ({selected.pricing[k]} บาท)
                  </option>
                ))}
              </select>
            </label>
            <label className="reg-field">
              <span>ไซส์เสื้อ</span>
              <input
                value={form.shirtSize}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shirtSize: e.target.value }))
                }
              />
            </label>
            <label className="reg-field">
              <span>ประเภทอาหาร</span>
              <input
                value={form.foodType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, foodType: e.target.value }))
                }
              />
            </label>
            {fee > 0 ? (
              <label className="reg-field">
                <span>สลิป ({fee} บาท)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
                />
              </label>
            ) : null}
            <button type="submit" className="reg-btn-primary" disabled={busy}>
              {busy ? "กำลังส่ง…" : "สมัครสัมมนา"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
