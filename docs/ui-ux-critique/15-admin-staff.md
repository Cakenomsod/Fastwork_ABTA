# 15 — Admin Staff (`/admin/staff`)

⚠️ **DEGRADED: single-context** (nested Multitask subagent — dual Assessment A/B spawn blocked; design review + `detect.mjs` ran inline)

| Meta | Value |
|------|--------|
| **Score** | **29 / 40** · Good |
| **Prior** | **22 / 40** · Acceptable → **+7** after fixes |
| **P0** | 0 |
| **P1** | 0 |
| **P2** | 3 |
| **P3** | 2 |
| **Files** | `StaffPage.tsx`, `ConfirmDialog.tsx`, `clickableRow.ts`, `AdminApp.tsx` (`me` prop), `admin.css` (`.bo-staff-*`, `.bo-row-clickable:focus-visible`) |
| **Detect** | `detect.mjs --json` → `[]` (clean, exit 0) |
| **Browser** | Skipped — page requires admin Google auth; no reliable live overlay |
| **Date** | 2026-07-27 (re-critique after fixes) |

**Fixes verified:** ConfirmDialog danger delete · self-delete disabled + Thai `ERROR_LABEL` · `clickableRowProps` keyboard rows · `<th>จัดการ</th>` · roles `fieldset`/`legend` · `me` from AdminApp

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 29/40 (Good) · เดิม 22/40

หน้าจัดการเจ้าหน้าที่ปิดช่องโหว่ความน่าเชื่อถือหลักแล้ว: ลบใช้ `ConfirmDialog` (danger + ผลลัพธ์ชัด + Escape/busy), ปุ่มลบแถวตัวเองถูกปิดพร้อมคำอธิบาย, error API เป็นภาษาไทย, แถวแก้ไขใช้คีย์บอร์ด Enter/Space และมีหัวคอลัมน์ «จัดการ»

**จุดแข็ง**
1. **ยืนยันก่อนทำลายตรง PRODUCT** — modal อธิบายว่าเข้า BO ไม่ได้อีก; busy กันกดซ้ำ
2. **กันลบตัวเองใน UI** — ไม่พาไป error ดิบอีก; มี `cannot_delete_self` / `cannot_delete_super_admin` ไทยสำรอง
3. **แถว + ฟอร์ม a11y พื้นฐาน** — `clickableRow` + focus-visible, fieldset บทบาท, โหมดเพิ่ม/แก้ไขชัด

**P0 / P1:** ไม่มี — งานหลักทำครบและสอดคล้อง Back Office อื่น

**Top 3 ที่เหลือ (P2)**
1. Busy label ปุ่มบันทึก + หลีกเลี่ยง flash «กำลังโหลด…» ทั้งแผงตอน soft reload หลังบันทึก/ลบ
2. ตารางยังไม่มี `bo-table--cards` + `data-label` — บีบบนแท็บเล็ต
3. สำเร็จ/error ฟอร์มยังไม่มี `aria-live` + hint ความสามารถของแต่ละบทบาท

---

## English — Full critique for fix agents

### Method & evidence

⚠️ DEGRADED: single-context (nested Multitask; dual A/B disallowed)

- **Assessment A:** source read of post-fix `StaffPage.tsx`, `ConfirmDialog.tsx`, `clickableRow.ts`, AdminApp `me` wiring, staff CSS / row focus styles.
- **Assessment B:** `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/StaffPage.tsx apps/web/src/admin/ConfirmDialog.tsx` → **`[]`**.
- **Agreement:** Detector clean. Remaining issues are polish / responsive / AT announcement — not visual slop or missing confirm.
- **Browser overlay:** not available (auth-gated BO).

### Heuristics scoring

| # | Heuristic | Score | Key issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | Delete/save success strings exist; Save label never → «กำลังบันทึก…»; soft reload still replaces list with full «กำลังโหลด…» |
| 2 | Match System / Real World | 3 | Thai roles + errors; badge text `super` / note «super-admin» still English jargon |
| 3 | User Control and Freedom | 3 | ConfirmDialog Escape/cancel/overlay; edit Cancel; no undo after delete (acceptable for rare staff CRUD) |
| 4 | Consistency and Standards | 3 | Confirm + `clickableRow` align with BO; Staff table still lacks `bo-table--cards` used elsewhere |
| 5 | Error Prevention | 3 | Danger confirm + consequence copy; self/super delete blocked in UI; zero-roles still only caught on save |
| 6 | Recognition Rather Than Recall | 3 | Actions labeled; role *capabilities* still unexplained |
| 7 | Flexibility and Efficiency | 3 | Row keyboard activate via shared helper; no search (OK if list stays tiny) |
| 8 | Aesthetic and Minimalist Design | 3 | Clean list+form; restrained BO; no card-grid / side-stripe slop |
| 9 | Error Recovery | 3 | Broad Thai `ERROR_LABEL` map; unknown codes may still surface raw |
| 10 | Help and Documentation | 2 | Bottom Google-email note; no one-line role capability hints |
| **Total** | | **29/40** | **Good** |

### Anti-patterns verdict

**LLM:** Does not look AI-generated. Prior failure mode (browser `window.confirm` vs branded ConfirmDialog) is **resolved**. Residual product gaps are polish density (busy/loading, tablet cards, AT live regions) and copy (`super` badge).

**Deterministic scan:** 0 findings on StaffPage / ConfirmDialog markup.

**Visual overlays:** none (auth).

### Overall impression

Staff management now feels trustworthy for access-control work: destroy path matches the rest of Back Office, self-harm is blocked before the API, and keyboard users can select a row like mouse users. Biggest remaining opportunity is **feedback polish** (busy labels + soft list refresh + `aria-live`) so status never blanks the panel.

### What's working

1. **ConfirmDialog danger** with consequence line (`white-space: pre-line`), busy gate, Escape/cancel — aligns with PRODUCT principle «ยืนยันก่อนทำลาย».
2. **Self-delete disabled** (title + `aria-label`) using `props.me.email`; Thai maps for `cannot_delete_self` / `cannot_delete_super_admin` / auth codes.
3. **Shared `clickableRowProps`** + focus-visible ring; actions `<th>จัดการ</th>`; roles in `fieldset`/`legend`; super-admin still read-only.

### Priority issues

#### [P2] Busy / soft-reload feedback gaps
- **What:** Primary Save stays labeled «บันทึก» while `busy`; after save/delete, `reload()` sets full-panel `loading` → flash empty «กำลังโหลด…». Form success/error lack `aria-live`.
- **Why:** Status disappears mid-task; AT may miss «บันทึกแล้ว» / delete success.
- **Fix:** Busy label on Save; soft refresh (keep rows, optional inline spinner); `aria-live="polite"` on success / `role="alert"` on form error.
- **Command:** `/impeccable polish StaffPage feedback`

#### [P2] Staff table not cardized on narrow viewports
- **What:** `<table className="bo-table">` without `bo-table--cards` + `data-label` (Dashboard pattern).
- **Why:** Tablet BO users get horizontal squeeze; actions column cramped next to badges.
- **Fix:** Add `bo-table--cards` and per-cell `data-label` matching headers.
- **Command:** `/impeccable adapt StaffPage table`

#### [P2] Role meaning still recall-heavy
- **What:** Checkboxes labeled แอดมิน / นายทะเบียน / เหรัญญิก only — no one-line capability hint.
- **Why:** First-time staff manager (Jordan / นายทะเบียน) must guess what each role unlocks; working-memory fail on cognitive checklist.
- **Fix:** Short note under fieldset (e.g. แอดมิน = จัดการเจ้าหน้าที่/ระบบ · นายทะเบียน = ตรวจข้อมูล · เหรัญญิก = ตรวจสลิป).
- **Command:** `/impeccable clarify StaffPage roles`

#### [P3] Copy polish
- Badge `super` → «ซูเปอร์แอดมิน»; note still says «super-admin» in English mix; optional microcopy when email locked in edit («อีเมลใช้ล็อกอิน แก้ไม่ได้»).
- **Command:** `/impeccable clarify StaffPage copy`

#### [P3] ConfirmDialog focus restore
- Focus moves into modal on open but does not return to the Delete trigger on close — shared component gap.
- **Command:** `/impeccable audit ConfirmDialog focus restore` (shared; out of Staff-only scope if desired)

### Cognitive load

| Checklist item | Pass? |
|----------------|-------|
| Single focus | Pass |
| Chunking | Pass |
| Grouping | Pass |
| Visual hierarchy | Pass |
| One thing at a time | Pass |
| Minimal choices | Pass (3 roles) |
| Working memory | Fail — role capabilities still not shown |
| Progressive disclosure | Pass — delete consequence in ConfirmDialog |

**Failures: 1 → low.** Extraneous load from inconsistent confirm / raw English errors is gone.

### Persona red flags

**Alex (power user / แอดมิน)**  
- Keyboard row edit works; Esc closes confirm.  
- Soft-reload flash still interrupts flow.  
- No search if staff list grows (defer unless >~20).

**Sam (a11y)**  
- Row is keyboard-activatable with focus-visible; Edit button remains a second path.  
- `role="button"` on `<tr>` is a mild table-semantics compromise (shared BO pattern).  
- Success/error may not be announced (`aria-live` missing).

**นายทะเบียน / Jordan (first-time staff manager)**  
- Self-delete no longer dead-ends in English codes.  
- «super» badge still unclear.  
- Role checkboxes lack capability hints.

**Riley (edge)**  
- Self / super delete blocked in UI; confirm race gated by `busy`.  
- Unchecking all roles still only fails on Save (client message exists).

### Minor observations

- Delete success lands in form panel (`formSuccess`) — visible on same page; OK for desktop BO.
- Disabled self-delete button kept visible (recognition) with Thai title — good choice vs hide.
- Detector clean; no AI-slop markup rules triggered.

### Questions to consider

- Soft-reload spinner in panel head vs keep last rows — which matches other BO lists?
- Is staff list expected to stay tiny (<20), or schedule search now?
- Role capability copy: one shared glossary component for Staff + sidebar foot badges?

### Detector summary

```text
detect.mjs targets: StaffPage.tsx, ConfirmDialog.tsx
result: [] (exit 0)
false positives: n/a
```

---

## Concrete fix backlog

| # | Sev | Task | Files | Suggested command |
|---|-----|------|-------|-------------------|
| 1 | P2 | Busy Save label; soft list refresh; `aria-live` / alert on form messages | `StaffPage.tsx` | `/impeccable polish` |
| 2 | P2 | `bo-table--cards` + `data-label` | `StaffPage.tsx` | `/impeccable adapt` |
| 3 | P2 | One-line role capability hints under fieldset | `StaffPage.tsx` | `/impeccable clarify` |
| 4 | P3 | Rename `super` badge + locked-email hint; Thai note wording | `StaffPage.tsx` | `/impeccable clarify` |
| 5 | P3 | Focus restore to trigger on ConfirmDialog close | `ConfirmDialog.tsx` | `/impeccable audit` |

**Recommended sequence:** `polish` (1) → `adapt` (2) → `clarify` (3–4) → optional shared `audit` (5).

---

## Trend / snapshot

Re-critique after P1 fixes. Prior docs score **22/40** → **29/40**. Impeccable storage slug: `apps-web-src-admin-pages-staffpage-tsx`.
