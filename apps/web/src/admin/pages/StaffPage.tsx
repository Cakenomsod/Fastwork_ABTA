import { useEffect, useState } from "react";
import {
  ROLE_LABEL,
  deleteStaff,
  fetchStaffList,
  upsertStaff,
  type StaffRole,
  type StaffRow,
} from "../../lib/admin-api";

const ALL_ROLES: StaffRole[] = ["admin", "registrar", "treasurer"];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roles, setRoles] = useState<StaffRole[]>(["registrar"]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setStaff(await fetchStaffList());
    } catch (err) {
      setError(err instanceof Error ? err.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function toggleRole(role: StaffRole) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function onSave() {
    if (!email.trim() || !roles.length) {
      setError("กรุณากรอกอีเมลและเลือกอย่างน้อย 1 บทบาท");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await upsertStaff({
        email: email.trim(),
        roles,
        displayName: displayName.trim() || undefined,
      });
      setEmail("");
      setDisplayName("");
      setRoles(["registrar"]);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row: StaffRow) {
    if (row.isSuperAdmin) return;
    if (!window.confirm(`ลบเจ้าหน้าที่ ${row.email}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteStaff(row.email);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "delete_failed");
    } finally {
      setBusy(false);
    }
  }

  function onEdit(row: StaffRow) {
    setEmail(row.email);
    setDisplayName(row.displayName ?? "");
    setRoles([...row.roles]);
  }

  return (
    <div className="bo-split">
      <div className="bo-panel">
        <div className="bo-panel-head">
          <h2>รายชื่อเจ้าหน้าที่</h2>
          <button
            type="button"
            className="bo-btn bo-btn-ghost bo-btn-sm"
            onClick={() => void reload()}
          >
            รีเฟรช
          </button>
        </div>
        {error ? <div className="bo-error" style={{ margin: "0.75rem" }}>{error}</div> : null}
        {loading ? (
          <div className="bo-empty">กำลังโหลด…</div>
        ) : (
          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead>
                <tr>
                  <th>อีเมล</th>
                  <th>ชื่อ</th>
                  <th>บทบาท</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr key={row.email}>
                    <td>
                      {row.email}
                      {row.isSuperAdmin ? (
                        <>
                          {" "}
                          <span className="bo-badge role-admin">super</span>
                        </>
                      ) : null}
                    </td>
                    <td>{row.displayName || "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {row.roles.map((r) => (
                          <span key={r} className={`bo-badge role-${r}`}>
                            {ROLE_LABEL[r]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          type="button"
                          className="bo-btn bo-btn-ghost bo-btn-sm"
                          disabled={busy}
                          onClick={() => onEdit(row)}
                        >
                          แก้ไข
                        </button>
                        {!row.isSuperAdmin ? (
                          <button
                            type="button"
                            className="bo-btn bo-btn-danger bo-btn-sm"
                            disabled={busy}
                            onClick={() => void onDelete(row)}
                          >
                            ลบ
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="bo-detail">
        <h3>เพิ่ม / แก้ไขเจ้าหน้าที่</h3>
        <div className="bo-form-grid">
          <div className="bo-field">
            <label htmlFor="staff-email">อีเมล Google</label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com"
              autoComplete="email"
            />
          </div>
          <div className="bo-field">
            <label htmlFor="staff-name">ชื่อแสดง (ไม่บังคับ)</label>
            <input
              id="staff-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="เช่น คุณตุ๊กตา"
            />
          </div>
          <div className="bo-field">
            <label>บทบาท (เลือกได้หลายอัน)</label>
            <div className="bo-check-row">
              {ALL_ROLES.map((r) => (
                <label key={r} className="bo-check">
                  <input
                    type="checkbox"
                    checked={roles.includes(r)}
                    onChange={() => toggleRole(r)}
                  />
                  {ROLE_LABEL[r]}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="bo-btn bo-btn-primary"
            disabled={busy}
            onClick={() => void onSave()}
          >
            บันทึก
          </button>
        </div>
        <div className="bo-note">
          เฉพาะแอดมิน / super-admin จัดการเจ้าหน้าที่ได้ · อีเมลต้องตรงกับบัญชี Google ที่ใช้ล็อกอิน
        </div>
      </aside>
    </div>
  );
}
