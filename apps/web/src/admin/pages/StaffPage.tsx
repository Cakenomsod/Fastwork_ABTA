import {
  useEffect,
  useState,
  type MouseEvent,
} from "react";
import {
  ROLE_LABEL,
  deleteStaff,
  fetchStaffList,
  type AdminMe,
  type StaffRole,
  type StaffRow,
  upsertStaff,
} from "../../lib/admin-api";
import { ConfirmDialog } from "../ConfirmDialog";
import { clickableRowProps } from "../clickableRow";

const ALL_ROLES: StaffRole[] = ["admin", "registrar", "treasurer"];

const ERROR_LABEL: Record<string, string> = {
  load_failed: "โหลดรายชื่อไม่สำเร็จ",
  save_failed: "บันทึกไม่สำเร็จ",
  delete_failed: "ลบไม่สำเร็จ",
  cannot_delete_self: "ไม่สามารถลบบัญชีของตัวเองได้",
  cannot_delete_super_admin: "ไม่สามารถลบบัญชีซูเปอร์แอดมินได้",
  invalid_email: "รูปแบบอีเมลไม่ถูกต้อง",
  roles_required: "กรุณาเลือกอย่างน้อย 1 บทบาท",
  auth_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  not_authorized: "ไม่มีสิทธิ์จัดการเจ้าหน้าที่",
};

function errorMessage(err: unknown, fallback: string): string {
  const code = err instanceof Error ? err.message : fallback;
  return ERROR_LABEL[code] ?? code;
}

function staffLabel(row: StaffRow): string {
  return row.displayName?.trim() || row.email;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export default function StaffPage(props: { me: AdminMe }) {
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
  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);

  const isEditing = editingEmail !== null;
  const currentEmail = normalizeEmail(props.me.email);

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

  function requestDelete(row: StaffRow, e: MouseEvent) {
    e.stopPropagation();
    if (row.isSuperAdmin) return;
    if (normalizeEmail(row.email) === currentEmail) return;
    setListError(null);
    setDeleteTarget(row);
  }

  async function confirmDelete() {
    if (!deleteTarget || busy) return;
    setBusy(true);
    setListError(null);
    try {
      await deleteStaff(deleteTarget.email);
      if (editingEmail === deleteTarget.email) resetForm();
      setDeleteTarget(null);
      setFormSuccess(`ลบเจ้าหน้าที่ «${staffLabel(deleteTarget)}» แล้ว`);
      await reload();
    } catch (err) {
      setListError(errorMessage(err, "delete_failed"));
      setDeleteTarget(null);
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
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => {
                  const isSelf =
                    normalizeEmail(row.email) === currentEmail;
                  const clickable = !row.isSuperAdmin;
                  const selected = editingEmail === row.email;
                  return (
                    <tr
                      key={row.email}
                      className={[
                        clickable ? "bo-row-clickable" : "",
                        selected ? "selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      {...(clickable
                        ? clickableRowProps({
                            onActivate: () => selectForEdit(row),
                            label: `แก้ไขเจ้าหน้าที่ ${staffLabel(row)}`,
                            selected,
                          })
                        : {})}
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
                            <span className="bo-staff-readonly">
                              อ่านอย่างเดียว
                            </span>
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
                              {isSelf ? (
                                <button
                                  type="button"
                                  className="bo-btn bo-btn-danger bo-btn-sm"
                                  disabled
                                  title="ไม่สามารถลบบัญชีของตัวเองได้"
                                  aria-label="ไม่สามารถลบบัญชีของตัวเองได้"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  ลบ
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="bo-btn bo-btn-danger bo-btn-sm"
                                  disabled={busy}
                                  onClick={(e) => requestDelete(row, e)}
                                >
                                  ลบ
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              placeholder="เช่น เพชญเกล้า"
            />
          </div>
          <fieldset className="bo-field bo-staff-roles-fieldset">
            <legend>บทบาท (เลือกได้หลายอัน)</legend>
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
          </fieldset>
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

      <ConfirmDialog
        open={deleteTarget != null}
        title="ลบเจ้าหน้าที่"
        description={
          deleteTarget
            ? `ลบเจ้าหน้าที่ «${staffLabel(deleteTarget)}» (${deleteTarget.email}) ใช่หรือไม่?\nบัญชีนี้จะเข้าสู่ระบบ Back Office ไม่ได้อีก`
            : undefined
        }
        confirmLabel="ลบเจ้าหน้าที่"
        cancelLabel="ยกเลิก"
        variant="danger"
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!busy) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
