import { useEffect, useState, type MouseEvent } from "react";
import {
  ROLE_LABEL,
  deleteStaff,
  fetchStaffList,
  upsertStaff,
  type StaffRole,
  type StaffRow,
} from "../../lib/admin-api";

const ALL_ROLES: StaffRole[] = ["admin", "registrar", "treasurer"];

const ERROR_LABEL: Record<string, string> = {
  load_failed: "โหลดรายชื่อไม่สำเร็จ",
  save_failed: "บันทึกไม่สำเร็จ",
  delete_failed: "ลบไม่สำเร็จ",
};

function errorMessage(err: unknown, fallback: string): string {
  const code = err instanceof Error ? err.message : fallback;
  return ERROR_LABEL[code] ?? code;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roles, setRoles] = useState<StaffRole[]>(["registrar"]);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const isEditing = editingEmail !== null;

  function resetForm() {
    setEditingEmail(null);
    setEmail("");
    setDisplayName("");
    setRoles(["registrar"]);
    setFormError(null);
    setFormSuccess(null);
  }

  async function reload() {
    setLoading(true);
    setListError(null);
    try {
      setStaff(await fetchStaffList());
    } catch (err) {
      setListError(errorMessage(err, "load_failed"));
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
    setFormSuccess(null);
  }

  function selectForEdit(row: StaffRow) {
    if (row.isSuperAdmin) return;
    setEditingEmail(row.email);
    setEmail(row.email);
    setDisplayName(row.displayName ?? "");
    setRoles([...row.roles]);
    setFormError(null);
    setFormSuccess(null);
  }

  async function onSave() {
    if (!email.trim() || !roles.length) {
      setFormError("กรุณากรอกอีเมลและเลือกอย่างน้อย 1 บทบาท");
      setFormSuccess(null);
      return;
    }
    setBusy(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await upsertStaff({
        email: email.trim(),
        roles,
        displayName: displayName.trim() || undefined,
      });
      resetForm();
      setFormSuccess("บันทึกแล้ว");
      await reload();
    } catch (err) {
      setFormError(errorMessage(err, "save_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row: StaffRow, e: MouseEvent) {
    e.stopPropagation();
    if (row.isSuperAdmin) return;
    if (!window.confirm(`ลบเจ้าหน้าที่ ${row.email}?`)) return;
    setBusy(true);
    setListError(null);
    try {
      await deleteStaff(row.email);
      if (editingEmail === row.email) resetForm();
      await reload();
    } catch (err) {
      setListError(errorMessage(err, "delete_failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-staff-page">
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
        {listError ? (
          <div className="bo-error" style={{ margin: "0.75rem" }}>
            {listError}
          </div>
        ) : null}
        {loading ? (
          <div className="bo-empty">กำลังโหลด…</div>
        ) : staff.length === 0 ? (
          <div className="bo-empty">
            <strong>ยังไม่มีเจ้าหน้าที่</strong>
            เพิ่มเจ้าหน้าที่ใหม่ด้านล่าง
          </div>
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
                  <tr
                    key={row.email}
                    className={[
                      row.isSuperAdmin ? "" : "bo-row-clickable",
                      editingEmail === row.email ? "selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => selectForEdit(row)}
                  >
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
                      <div className="bo-staff-roles">
                        {row.roles.map((r) => (
                          <span key={r} className={`bo-badge role-${r}`}>
                            {ROLE_LABEL[r]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="bo-staff-row-actions">
                        {row.isSuperAdmin ? (
                          <span className="bo-staff-readonly">อ่านอย่างเดียว</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="bo-btn bo-btn-ghost bo-btn-sm"
                              disabled={busy}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectForEdit(row);
                              }}
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              className="bo-btn bo-btn-danger bo-btn-sm"
                              disabled={busy}
                              onClick={(e) => void onDelete(row, e)}
                            >
                              ลบ
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bo-staff-form">
        <h3>{isEditing ? "แก้ไขเจ้าหน้าที่" : "เพิ่มเจ้าหน้าที่"}</h3>
        {formSuccess ? <div className="bo-form-success">{formSuccess}</div> : null}
        {formError ? <div className="bo-error">{formError}</div> : null}
        <div className="bo-form-grid">
          <div className="bo-field">
            <label htmlFor="staff-email">อีเมล Google</label>
            <input
              id="staff-email"
              type="email"
              value={email}
              disabled={isEditing}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormSuccess(null);
              }}
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
              onChange={(e) => {
                setDisplayName(e.target.value);
                setFormSuccess(null);
              }}
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
          <div className="bo-staff-form-actions">
            <button
              type="button"
              className="bo-btn bo-btn-primary"
              disabled={busy}
              onClick={() => void onSave()}
            >
              บันทึก
            </button>
            {isEditing ? (
              <button
                type="button"
                className="bo-btn bo-btn-ghost"
                disabled={busy}
                onClick={resetForm}
              >
                ยกเลิก
              </button>
            ) : null}
          </div>
        </div>
        <div className="bo-note">
          เฉพาะแอดมิน / super-admin จัดการเจ้าหน้าที่ได้ · อีเมลต้องตรงกับบัญชี Google ที่ใช้ล็อกอิน
        </div>
      </div>
    </div>
  );
}
