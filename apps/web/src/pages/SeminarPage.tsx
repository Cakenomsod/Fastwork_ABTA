import { useEffect, useState, type FormEvent } from "react";
import { apiBase, fetchRenewDraft } from "../lib/api";
import { getIdToken, initLiff, type LiffPhase } from "../lib/liff";
import "./register.css";

type Seminar = {
  seminarId: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  pricing: Record<string, number>;
  pricingLabels?: Record<string, string>;
};

const PRICING_FALLBACK: Record<string, string> = {
  public_paid: "บุคคลทั่วไป (เสียเงิน)",
  member_free: "สมาชิก (ฟรี)",
  member_paid: "สมาชิก (เสียเงิน)",
};

export default function SeminarPage() {
  const [liff, setLiff] = useState<LiffPhase>({ phase: "loading" });
  const [isMember, setIsMember] = useState(false);
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
    void initLiff().then(async (phase) => {
      setLiff(phase);
      if (phase.phase !== "ready" && phase.phase !== "dev") return;
      try {
        const idToken =
          (await getIdToken()) ?? (phase.phase === "dev" ? "dev" : "");
        if (!idToken) return;
        const draft = await fetchRenewDraft(idToken);
        setIsMember(true);
        setForm((f) => ({
          ...f,
          firstName: draft.firstName || f.firstName,
          lastName: draft.lastName || f.lastName,
          applicantType: "member_free",
        }));
      } catch {
        setIsMember(false);
      }
    });
    void fetch(`${apiBase()}/api/seminars`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems(d.items ?? []);
      })
      .catch(() => setError("โหลดรายการสัมมนาไม่สำเร็จ"));
  }, []);

  const pricingOptions = selected
    ? Object.keys(selected.pricing).filter((k) => {
        if (isMember) return true;
        return k === "public_paid";
      })
    : [];

  const fee = selected
    ? Number(selected.pricing[form.applicantType] ?? 0) || 0
    : 0;

  function pricingLabel(key: string): string {
    return (
      selected?.pricingLabels?.[key] ??
      PRICING_FALLBACK[key] ??
      key
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (liff.phase === "error") {
      setError("กรุณาเปิดจาก LINE OA");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const idToken = await getIdToken();
      if (!idToken && liff.phase !== "dev") {
        throw new Error("invalid_id_token");
      }
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
          idToken: idToken ?? (liff.phase === "dev" ? "dev" : undefined),
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
      const msg = err instanceof Error ? err.message : "error";
      setError(
        msg === "slip_required"
          ? "กรุณาแนบสลิป"
          : msg === "member_required"
            ? "ประเภทนี้สำหรับสมาชิกเท่านั้น"
            : msg === "invalid_id_token"
              ? "เซสชัน LINE หมดอายุ กรุณาเปิดจาก LINE OA อีกครั้ง"
              : "สมัครไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reg-shell">
      <div className="reg-atmosphere" aria-hidden />
      <main className="reg-wrap">
        {done ? (
          <section className="reg-success">
            <p className="reg-kicker">ABTA</p>
            <h1>รับสมัครสัมมนาแล้ว</h1>
            <p className="reg-success__id">{done}</p>
            <p className="reg-lead">รอเจ้าหน้าที่ยืนยันสิทธิ์ครับ</p>
          </section>
        ) : (
          <>
            <header className="reg-hero">
              <p className="reg-kicker">ABTA</p>
              <h1>สมัครสัมมนา</h1>
              <p className="reg-lead">
                {isMember
                  ? "ดึงข้อมูลสมาชิกจากบัญชี LINE แล้ว"
                  : "เลือกงานแล้วกรอกข้อมูลผู้สมัคร"}
              </p>
            </header>

            {liff.phase === "error" ? (
              <div className="reg-warn">{liff.message}</div>
            ) : null}
            {error ? <p className="reg-form-error">{error}</p> : null}

            {!selected ? (
              <section className="reg-form">
                <h2 className="reg-section__title">รายการสัมมนา</h2>
                {items.length === 0 ? (
                  <p className="reg-lead" style={{ color: "inherit" }}>
                    ยังไม่มีงานสัมมนาที่เปิดรับสมัคร
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {items.map((s) => (
                      <li key={s.seminarId} style={{ marginBottom: "0.75rem" }}>
                        <button
                          type="button"
                          className="reg-btn reg-btn--ghost"
                          style={{ width: "100%", textAlign: "left" }}
                          onClick={() => {
                            setSelected(s);
                            const keys = Object.keys(s.pricing);
                            const preferred = isMember
                              ? keys.find((k) => k.startsWith("member")) ??
                                keys[0]
                              : keys.find((k) => k === "public_paid") ?? keys[0];
                            if (preferred) {
                              setForm((f) => ({
                                ...f,
                                applicantType: preferred,
                              }));
                            }
                          }}
                        >
                          <strong>{s.title}</strong>
                          {(s.eventDate || s.location) && (
                            <span>
                              {" "}
                              · {[s.eventDate, s.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : (
              <form className="reg-form" onSubmit={(e) => void onSubmit(e)}>
                <button
                  type="button"
                  className="reg-btn reg-btn--ghost"
                  style={{ marginBottom: "1rem" }}
                  onClick={() => setSelected(null)}
                >
                  ← กลับเลือกรายการ
                </button>
                <h2 className="reg-section__title">{selected.title}</h2>
                {selected.description ? (
                  <p style={{ marginTop: 0 }}>{selected.description}</p>
                ) : null}

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
                      setForm((f) => ({
                        ...f,
                        applicantType: e.target.value,
                      }))
                    }
                  >
                    {pricingOptions.map((k) => (
                      <option key={k} value={k}>
                        {pricingLabel(k)} ({selected.pricing[k]} บาท)
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
                    <span>สลิป ({fee.toLocaleString("th-TH")} บาท)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) =>
                        setSlipFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                ) : null}
                <button
                  type="submit"
                  className="reg-btn reg-btn--primary"
                  disabled={busy || liff.phase === "loading"}
                >
                  {busy ? "กำลังส่ง…" : "สมัครสัมมนา"}
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
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
