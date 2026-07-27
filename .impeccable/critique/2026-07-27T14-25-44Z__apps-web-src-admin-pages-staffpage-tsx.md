---
target: StaffPage /admin/staff
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-07-27T14-25-44Z
slug: apps-web-src-admin-pages-staffpage-tsx
---
# 15 — Admin Staff (`/admin/staff`)

⚠️ DEGRADED: single-context (nested Multitask subagent; dual Assessment A/B spawn disallowed)

| Meta | Value |
|------|--------|
| **Score** | **22 / 40** · Acceptable |
| **P0** | 0 |
| **P1** | 3 |
| **Files** | `apps/web/src/admin/pages/StaffPage.tsx`, `apps/web/src/admin/admin.css` (`.bo-staff-*`, `.bo-modal*`), `apps/web/src/admin/ConfirmDialog.tsx` (exists, **not wired**) |
| **Detect** | `detect.mjs --json` → `[]` (clean) |
| **Browser** | Skipped — page requires admin Google auth; no reliable live overlay |
| **Date** | 2026-07-27 |

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 22/40 (Acceptable)

หน้าจัดการเจ้าหน้าที่โครงสร้างชัด — ตารางรายชื่อ + ฟอร์มเพิ่ม/แก้ไข ใช้ token Back Office (`--bo-*`) สอดคล้องกับหน้าอื่น ป้ายบทบาทเป็นภาษาไทย (แอดมิน / นายทะเบียน / เหรัญญิก) และมีโน้ตท้ายฟอร์มอธิบายว่าต้องใช้อีเมล Google

**จุดแข็ง**
1. แยก list / form ชัด โหมดเพิ่ม vs แก้ไขมีหัวข้อต่างกัน มีปุ่มยกเลิกตอนแก้ไข
2. Super-admin ล็อกเป็นอ่านอย่างเดียว — กันพลาดดี
3. Empty state บอกให้ไปเพิ่มด้านล่าง ไม่ทิ้งผู้ใช้ไว้เฉยๆ

**ปัญหาหลัก (เรียงตามความสำคัญ)**
1. **[P1] ลบใช้ `window.confirm`** — ขัด Design Principle «ยืนยันก่อนทำลาย» และ anti-reference ของ PRODUCT.md โดยตรง ทั้งที่โปรเจกต์มี `ConfirmDialog` (danger) ใช้อยู่แล้วใน Templates / Seminars / Broadcast / Member delete
2. **[P1] ลบตัวเองได้ใน UI แต่ API ปฏิเสธ** — ปุ่ม «ลบ» โผล่ที่แถวของตัวเอง → confirm → error ดิบ `cannot_delete_self` (อังกฤษ) ไม่มีใน `ERROR_LABEL`
3. **[P1] แถวคลิกได้แต่ไม่มีคีย์บอร์ด / semantics** — `<tr onClick>` ไม่มี `tabIndex` / `role` / Enter·Space; คอลัมน์ actions ไม่มีหัวตาราง; checkbox บทบาทไม่มี `fieldset`

**P0:** ไม่มี (งานหลักทำครบได้ แต่เสี่ยงพลาดและไม่สม่ำเสมอ)

**Top 3 ที่ควรแก้ก่อน**
1. เปลี่ยนลบเป็น `ConfirmDialog` variant danger + คำอธิบายผลกระทบ
2. ซ่อน/ปิดปุ่มลบแถวของตัวเอง + แปล error `cannot_delete_self` / `cannot_delete_super_admin`
3. ทำแถวแก้ไขเข้าถึงได้ด้วยคีย์บอร์ด + หัวคอลัมน์ «จัดการ» + `fieldset` สำหรับบทบาท

---

## English — Full critique for fix agents

### Method & evidence

- **Assessment A (design review):** source read of `StaffPage.tsx`, staff CSS, `ConfirmDialog.tsx`, staff API/handlers (`cannot_delete_self`).
- **Assessment B (detector):** `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/StaffPage.tsx apps/web/src/admin/ConfirmDialog.tsx` → **`[]`**.
- **Agreement:** Detector clean (no markup AI-slop). LLM issues are interaction / consistency / a11y — not visual slop rules.
- **Browser overlay:** not available (auth-gated BO).

### Heuristics scoring

| # | Heuristic | Score | Key issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 2 | List loading + form success/error exist; delete has no success feedback; Save label never becomes “กำลังบันทึก…”; full-list reload flash after save |
| 2 | Match System / Real World | 3 | Thai role labels + Google email note; badge text `super` is English jargon |
| 3 | User Control and Freedom | 2 | Cancel on edit OK; delete uses browser dialog (no rich exit/context); no undo after delete |
| 4 | Consistency and Standards | 2 | BO tokens/buttons match shell; **confirm pattern diverges** from every other destructive BO flow |
| 5 | Error Prevention | 1 | `window.confirm` is PRODUCT anti-ref; self-delete offered then fails; no consequence copy in confirm |
| 6 | Recognition Rather Than Recall | 3 | Actions visible; role meanings not explained (what each role can do) |
| 7 | Flexibility and Efficiency | 2 | Row-click to edit helps; no search/filter; no keyboard row activation |
| 8 | Aesthetic and Minimalist Design | 3 | Clean list+form; not SaaS-gray; no card-grid slop |
| 9 | Error Recovery | 2 | Thai fallbacks for load/save/delete; API codes like `cannot_delete_self` leak as raw English |
| 10 | Help and Documentation | 2 | Bottom `bo-note` helps; roles lack capability hints |
| **Total** | | **22/40** | **Acceptable** |

### Anti-patterns verdict

**LLM:** Does not look “AI-generated” visually — restrained BO product UI. Failure mode is **product inconsistency**: inventing a browser confirm for a high-stakes staff delete while a branded `ConfirmDialog` already exists. That matches PRODUCT anti-reference *“Modal/confirm แบบ window.confirm ไม่มี context”* and principle *“ยืนยันก่อนทำลาย”*.

**Deterministic scan:** 0 findings on StaffPage / ConfirmDialog markup.

**Visual overlays:** none (auth).

### Overall impression

Solid CRUD skeleton for a rare admin task. The single biggest opportunity is **wiring destructive delete into the shared ConfirmDialog** and closing the self-delete / error-copy gaps so the page feels as trustworthy as member delete elsewhere.

### What's working

1. Clear add vs edit modes, disabled email when editing (identity key), cancel escape.
2. Super-admin row is read-only with explicit “อ่านอย่างเดียว”.
3. Empty state points to the form below; role badges use shared `bo-badge` vocabulary.

### Priority issues

#### [P1] Delete uses `window.confirm` instead of `ConfirmDialog`
- **What:** `onDelete` → `window.confirm(\`ลบเจ้าหน้าที่ ${row.email}?\`)` while `ConfirmDialog` (danger, Escape, focus trap pattern, busy label) is unused on this page.
- **Why:** Inconsistent with Templates/Seminars/Broadcast/MemberDelete; browser dialog has no consequence copy, no ABTA styling, easy to dismiss by habit; violates PRODUCT design principle #3.
- **Fix:** Local state `deleteTarget: StaffRow | null`; render `<ConfirmDialog open variant="danger" title="ลบเจ้าหน้าที่" description={…} confirmLabel="ลบเจ้าหน้าที่" busy={busy} />`.
- **Command:** `/impeccable harden StaffPage confirm dialog`

#### [P1] Self-delete affordance + untranslated API errors
- **What:** Non-super rows always show Delete, including the signed-in user. API throws `cannot_delete_self` / `cannot_delete_super_admin`; `ERROR_LABEL` only maps `load_failed|save_failed|delete_failed` → user sees raw code.
- **Why:** Support-ticket bait; feels broken after a confident confirm; undermines trust on an access-control page.
- **Fix:** Pass current user email (from AdminApp/`me`); hide or disable self-delete with “ไม่สามารถลบบัญชีของตัวเอง”; extend `ERROR_LABEL` with Thai strings for those codes; optional success toast after delete.
- **Command:** `/impeccable clarify StaffPage delete errors`

#### [P1] Clickable rows lack keyboard / table semantics
- **What:** `<tr className="bo-row-clickable" onClick={selectForEdit}>` only; empty `<th></th>` for actions; role checkboxes under a non-associated `<label>` (not `fieldset`/`legend`).
- **Why:** Sam (keyboard/SR) cannot activate row selection the same way as mouse; actions column unnamed; role group announced poorly.
- **Fix:** Prefer relying on the existing «แก้ไข» button (or add `tabIndex={0}` + Enter/Space + `aria-selected` on selected row); set `<th>จัดการ</th>`; wrap roles in `<fieldset><legend>บทบาท…</legend>`.
- **Command:** `/impeccable audit StaffPage table a11y`

#### [P2] Busy / success feedback gaps
- Save stays labeled «บันทึก» while `busy`; delete has no success message; `reload()` sets full-list `loading` and flashes «กำลังโหลด…».
- **Fix:** Button busy labels; soft list refresh without replacing with empty loading; optional `aria-live` region for form success.
- **Command:** `/impeccable polish StaffPage feedback`

#### [P2] Narrow viewports — table not cardized
- Other BO tables use `bo-table--cards` + `data-label`; Staff table does not → horizontal squeeze on tablet.
- **Command:** `/impeccable adapt StaffPage table`

#### [P3] Copy polish
- Badge `super` → «ซูเปอร์แอดมิน» or «บัญชีหลัก»; one-line role capability hint under checkboxes.
- **Command:** `/impeccable clarify StaffPage roles copy`

### Cognitive load

| Checklist item | Pass? |
|----------------|-------|
| Single focus | Pass (list then form) |
| Chunking | Pass |
| Grouping | Pass |
| Visual hierarchy | Pass |
| One thing at a time | Pass |
| Minimal choices | Pass (3 roles) |
| Working memory | Fail — role capabilities not shown; must recall what “แอดมิน” unlocks |
| Progressive disclosure | Fail — delete consequence only in tiny browser dialog |

**Failures: 2 → moderate.** Decision points ≤4. Extraneous load mainly from inconsistent confirm + error codes.

### Persona red flags

**Alex (power user / แอดมิน)**  
- Row click is fine; still no Esc-to-cancel edit (only Cancel button).  
- Browser confirm interrupts flow differently than in-app modals elsewhere.  
- No search if staff list grows.

**Sam (a11y)**  
- Row click not keyboard-equivalent.  
- Empty actions header.  
- Role group not a fieldset.  
- Live success/error may not be announced (`aria-live` missing).

**นายทะเบียน / Jordan (first-time staff manager)**  
- «super» badge unclear.  
- Unchecking all roles → validation only on save; no live hint.  
- Self-delete path ends in English error code — confidence collapse.

**Riley (edge)**  
- Confirms self-delete → `cannot_delete_self` raw.  
- Double-click delete while busy partially gated (`disabled={busy}`) but confirm race still possible with `window.confirm` before busy set.

### Minor observations

- After successful save, `resetForm()` then `setFormSuccess` works (last write wins) — OK.
- Email locked when editing with no microcopy (“อีเมลใช้เป็นคีย์ล็อกอิน แก้ไม่ได้”).
- `ConfirmDialog` focus returns imperfectly (no focus restore to trigger) — fix when wiring, if time.

### Questions to consider

- Should removing the last non-super `admin` role be blocked in UI, or only by policy later?
- Is staff list expected to stay tiny (<20), or do we need search soon?
- Typed confirm (email) for delete — overkill for Phase 1, or match member-delete severity?

### Detector summary

```text
detect.mjs targets: StaffPage.tsx, ConfirmDialog.tsx
result: [] (exit 0)
false positives: n/a
```

---

## Concrete fix backlog

Ordered for a follow-up fix chat. Do not expand scope beyond Staff page + shared ConfirmDialog wiring.

| # | Sev | Task | Files | Suggested command |
|---|-----|------|-------|-------------------|
| 1 | P1 | Replace `window.confirm` with `ConfirmDialog` danger; state for pending delete row; busy + Escape | `StaffPage.tsx` | `/impeccable harden` |
| 2 | P1 | Hide/disable delete for current user; map `cannot_delete_self`, `cannot_delete_super_admin` to Thai in `ERROR_LABEL`; show delete success | `StaffPage.tsx` (+ `me` from shell if needed) | `/impeccable clarify` |
| 3 | P1 | Actions `<th>จัดการ</th>`; keyboard parity for edit; `fieldset`/`legend` for roles | `StaffPage.tsx` | `/impeccable audit` |
| 4 | P2 | Busy labels on Save/Delete; avoid full-panel loading flash on soft reload; `aria-live` for form messages | `StaffPage.tsx` | `/impeccable polish` |
| 5 | P2 | Apply `bo-table--cards` + `data-label` for ≤700px | `StaffPage.tsx`, `admin.css` if needed | `/impeccable adapt` |
| 6 | P3 | Rename `super` badge; short role capability note under checkboxes; email-locked hint when editing | `StaffPage.tsx` | `/impeccable clarify` |

**Recommended sequence:** `harden` (1) → `clarify` (2, 6) → `audit` (3) → `adapt` (5) → `polish` (4).

---

## Trend / snapshot

First docs critique for this page. Impeccable storage slug: `apps-web-src-admin-pages-staffpage-tsx`.
