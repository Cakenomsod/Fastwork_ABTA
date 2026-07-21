import { useEffect, useState } from "react";
import {
  createAdminSeminar,
  decideSeminarRegistration,
  fetchAdminSeminarRegistrations,
  fetchAdminSeminars,
} from "../../lib/admin-api";

type Seminar = {
  seminarId: string;
  title: string;
  eventDate?: string;
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

export default function SeminarsPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createAdminSeminar({
        title: title.trim(),
        publicPaid: 500,
        memberFree: 0,
        memberPaid: 300,
      });
      setTitle("");
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

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2>สร้างงานสัมมนา</h2>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", padding: "1rem" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ชื่องาน"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="bo-btn bo-btn-primary"
            disabled={busy}
            onClick={() => void createSeminar()}
          >
            เพิ่ม
          </button>
        </div>
        <ul style={{ padding: "0 1rem 1rem", margin: 0 }}>
          {seminars.map((s) => (
            <li key={s.seminarId}>
              {s.title}{" "}
              <span style={{ color: "var(--bo-muted)" }}>
                {s.eventDate ?? s.seminarId}
              </span>
            </li>
          ))}
        </ul>
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
              {regs.map((r) => (
                <tr key={r.registrationId}>
                  <td>
                    {r.firstName} {r.lastName}
                  </td>
                  <td>{r.seminarId}</td>
                  <td>
                    {r.applicantType} ({r.feeThb})
                  </td>
                  <td>{r.status}</td>
                  <td>
                    {r.status !== "confirmed" && r.status !== "rejected" ? (
                      <>
                        <button
                          type="button"
                          className="bo-btn bo-btn-primary"
                          disabled={busy}
                          onClick={() => void decide(r.registrationId, true)}
                        >
                          อนุมัติ
                        </button>{" "}
                        <button
                          type="button"
                          className="bo-btn bo-btn-ghost"
                          disabled={busy}
                          onClick={() => void decide(r.registrationId, false)}
                        >
                          ปฏิเสธ
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
