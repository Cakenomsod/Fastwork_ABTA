# 14 — Admin Legacy Import (`/admin/legacy/import`)

> **Method:** ⚠️ DEGRADED: single-context (nested sub-agents forbidden by parent Multitask router)  
> **Date:** 2026-07-27 · **Register:** product · **Detector:** clean (`[]`) · **Browser overlay:** skipped (no local admin server)  
> **Files:** `apps/web/src/admin/pages/LegacyImportPage.tsx`, `apps/web/src/admin/admin.css` (`.bo-legacy-*`, `.bo-file-drop`, `.bo-form-success`, `.bo-error`)  
> **Context:** Data import — high error risk; need prevention, clear feedback, recovery.

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Busy = button label only; no progress / % / chunk feedback during multi-batch write |
| 2 | Match System / Real World | 2 | Exposes `legacyMembers` / `legacyPayments`; “merge” without plain-language consequence |
| 3 | User Control and Freedom | 2 | Clear file / leave page OK; **no cancel mid-import**, **no undo after merge** |
| 4 | Consistency and Standards | 3 | Uses `bo-*` patterns; **skips `ConfirmDialog`** used elsewhere for high-stakes writes |
| 5 | Error Prevention | **1** | One click commits merge upsert — no confirm, no dry-run, sample only *after* write |
| 6 | Recognition Rather Than Recall | 2 | Must remember sheet names / column layout; no template download |
| 7 | Flexibility and Efficiency | 2 | No dry-run mode, no keyboard accelerator, no “re-run last file” with diff |
| 8 | Aesthetic and Minimalist Design | 3 | Focused single-panel flow; hierarchy mostly clear |
| 9 | Error Recovery | 2 | Thai `ERROR_LABEL` map is good; no skipped-row report, no created/updated split |
| 10 | Help and Documentation | 2 | Short bullets only; no schema help or sample file |
| **Total** | | **21/40** | **Acceptable — significant improvements needed before high-stakes use feels safe** |

---

## Anti-Patterns Verdict

**LLM assessment:** Not AI-slop. Looks like a restrained Back Office tool surface (dashed dropzone, paper panel, green primary). Failures are **safety / feedback**, not decoration. Absolute bans (side-stripe cards, gradient text, hero-metric) not present.

**Deterministic scan (`detect.mjs --json`):** `[]` — no antipattern hits on the TSX markup.

**Visual overlays:** Not available this run (no localhost admin session).

---

## Overall Impression

Clean, admin-only gate, client-side type/size checks, and Thai error codes are a solid base. The page still treats a **Firestore merge upsert of production membership data** like a casual file upload: preview comes *after* the write, there is no confirm, and silent row skips leave Riley (and the registrar) blind. Biggest opportunity: **preview → confirm → commit**, with a validation report.

---

## What's Working

1. **Role gate** — `canImportLegacy` empty state (“ไม่มีสิทธิ์”) prevents unauthorized staff from even seeing the form.
2. **Early client validation** — extension + 8 MB checks with Thai messages before network.
3. **Post-success path** — counts + sample table + link to `/admin/legacy` gives a concrete “what landed” check.

---

## สรุปสำหรับอ่าน (ภาษาไทย)

**คะแนน: 21/40 (Acceptable)** · **P0: 2** · **P1: 3**

หน้านี้เรียบและตรงงาน “อัปโหลดแล้วนำเข้า” แต่เป็นงานเสี่ยงสูง (merge ทับข้อมูลสมาชิกเก่า) โดยยังไม่มีเกราะป้องกันพอ

### จุดแข็ง
- จำกัดสิทธิ์แอดมินชัด
- ตรวจชนิดไฟล์ / ขนาดก่อนส่ง
- หลังสำเร็จมีตัวเลข + ตัวอย่างแถว + ลิงก์ไปหน้ารายชื่อ

### ปัญหาหลัก (P0–P1)
| Pri | ปัญหา | ทำไมสำคัญ |
|-----|--------|-----------|
| **P0** | กด “นำเข้าข้อมูล” แล้วเขียน Firestore ทันที — ไม่มี ConfirmDialog | ขัดหลัก “ยืนยันก่อนทำลาย”; คลิกพลาด = merge ทับจริง |
| **P0** | ตัวอย่างแถวโชว์หลัง commit เท่านั้น — ไม่มี dry-run / preview | รู้ว่าไฟล์ผิดเมื่อข้อมูลถูกเขียนแล้ว |
| **P1** | แถว parse ไม่ได้ถูกข้ามเงียบ — ไม่มีรายงาน skipped / warnings | ยอดสมาชิกในไฟล์ ≠ ยอดที่นำเข้า โดยไม่รู้สาเหตุ |
| **P1** | สำเร็จแล้วบอกแค่ยอดรวม ไม่แยกสร้างใหม่ / อัปเดต และไม่มี undo | กู้คืนยาก; ไม่รู้ผลกระทบจริง |
| **P1** | คำอธิบายใช้ชื่อ collection + คำว่า merge โดยไม่บอกผลต่อข้อมูลเดิม | เจ้าหน้าที่ต้องเดาว่าฟิลด์ไหนถูกทับ |

### Top 3 ที่ควรแก้ก่อน
1. Confirm ก่อน commit (ใช้ `ConfirmDialog` แบบหน้าอื่น)
2. Preview / dry-run ก่อนเขียน (หรืออย่างน้อย parse แล้วโชว์ sample + warnings)
3. รายงานแถวที่ข้าม / ไม่ผ่าน + แยก created vs updated

### Personas (ย่อ)
- **Alex:** อยาก dry-run + progress; รอกดแล้วเงียบนาน = หงุดหงิด; ไม่มี shortcut
- **Riley:** re-import ทับซ้ำ, ชีตชื่อผิด, แถวว่างถูกข้ามเงียบ — UI บอกว่า “สำเร็จ” ทั้งที่ข้อมูลไม่ครบ
- **Sam:** `role="alert"` / `status` ดี; แต่ `busy` ไม่ประกาศชัด, file input `opacity:0` ต้องพึ่ง focus-within

---

## Priority Issues (English)

### [P0] One-click commits irreversible merge — no confirm
- **What:** Primary CTA runs `importLegacyXlsx` immediately. Elsewhere BO uses `ConfirmDialog` for high-stakes writes; this page does not.
- **Why it matters:** Violates PRODUCT principle “ยืนยันก่อนทำลาย”. Accidental click / wrong file = real upserts into `legacyMembers` / `legacyPayments`.
- **Fix:** Before submit, open `ConfirmDialog` with file name, size, and plain-Thai consequence (“จะอัปเดตข้อมูลสมาชิกเก่าตามเลขสมาชิก — ไม่สามารถยกเลิกทีละแถวได้”). Require explicit confirm; optional typed confirm for large N.
- **Suggested command:** `/impeccable harden` (then `clarify` for copy)

### [P0] Sample / preview only after write — no dry-run
- **What:** `result.sample` renders only after successful server import. No parse-only step.
- **Why it matters:** Wrong sheet layout, wrong workbook, or unexpected member set is discovered **after** data is already merged.
- **Fix:** Two-step flow: (1) upload → server/client parse → show sample + counts + warnings, (2) “ยืนยันนำเข้า” commits. Or `?dryRun=1` endpoint returning the same shape without `batch.set`.
- **Suggested command:** `/impeccable shape` (flow) → `/impeccable harden`

### [P1] Silent row skips — no validation / skip report
- **What:** Backend skips unparseable Member/Transaction rows; UI only shows final written counts.
- **Why it matters:** Staff assume Excel row count ≈ imported count. Silent drops are the classic legacy-migration failure mode.
- **Fix:** Return `skippedMembers`, `skippedPayments`, `warnings[]` (row index + reason). Surface as alert list under success/error. Block commit in dry-run if critical warnings exceed threshold (optional).
- **Suggested command:** `/impeccable harden` + `/impeccable clarify`

### [P1] Success feedback is counts-only — no created/updated, no recovery
- **What:** Success shows `members · payments · feeMasters` totals only. No undo, no export of what changed, re-import button stays armed.
- **Why it matters:** Cannot answer “did we overwrite 3 or insert 300?” Cannot recover without Firestore ops.
- **Fix:** Return `{ created, updated, unchanged }` per collection; after success, disable re-submit until clear/new file; link “ดูรายชื่อที่เพิ่งนำเข้า” with filter/sourceFile; document that undo = restore from backup / re-import prior file.
- **Suggested command:** `/impeccable harden` + `/impeccable clarify`

### [P1] Copy talks collections + merge — not consequences
- **What:** Intro: “collection `legacyMembers` / `legacyPayments` (อัปเดทแบบ merge…)”.
- **Why it matters:** Registrars think in สมาชิกเก่า / ประวัติชำระ, not Firestore. “Merge” does not say which fields win.
- **Fix:** Rewrite: “ระบบจะเพิ่มหรืออัปเดตสมาชิกเก่าตามเลขสมาชิกเก่า หากมีข้อมูลอยู่แล้ว ฟิลด์จากไฟล์จะทับค่าเดิม” + keep sheet-name requirements. Move collection names to a collapsed “สำหรับนักพัฒนา” if needed.
- **Suggested command:** `/impeccable clarify`

---

## Persona Red Flags

### Alex (Power User) — selected (admin / data tool)
- No dry-run / keyboard path; core task is always full write.
- During import, only “กำลังนำเข้า…” — no progress for multi-chunk batches; feels stuck.
- After success, primary CTA still available for same file → easy accidental double-merge.
- Will look for template download / last-import history — neither exists.

### Riley (Deliberate Stress Tester) — selected (high error-risk import)
- Re-uploads same file: UI celebrates success again; no “already imported / N updated” signal.
- Wrong sheet name → Thai error (good); empty parseable members → `no_members_parsed` (good); **partial bad rows → silent skip (bad)**.
- Refresh mid-busy loses in-flight feedback; selected file cleared (expected) with no “resume” guidance.
- Success sample capped (UI 5 / API 100) with no note that sample ≠ full audit.

### Sam (Accessibility-Dependent) — selected (admin a11y goal WCAG AA)
- Errors use `role="alert"`; success uses `role="status"` — good baseline.
- Busy state is button text only — screen reader may not hear ongoing work unless focus moves / `aria-busy` on form.
- File control is full-area `opacity: 0` input — works with focus-within styling, but no visible focus ring on the dropzone chrome itself beyond border color; verify keyboard + SR name (“เลือกไฟล์ Excel”).
- Sample `<table>` has no `<caption>` / summary tying it to “ตัวอย่างหลังนำเข้า”.
- Status column in sample is raw status string — meaning may rely on color elsewhere; here text-only (OK) but jargon risk.

---

## Cognitive Load

| Checklist item | Pass? |
|----------------|-------|
| Single focus | Pass — one panel, one task |
| Chunking | Pass — intro + dropzone + actions |
| Grouping | Pass |
| Visual hierarchy | Pass — primary CTA clear |
| One thing at a time | **Fail** — decide file quality and commit in one step |
| Minimal choices | Pass — ≤4 actions |
| Working memory | **Fail** — must recall Excel schema from outside the UI |
| Progressive disclosure | **Fail** — technical merge details upfront; safety steps missing |

**Failures: 3 → moderate cognitive load** (extraneous load from jargon + missing staged confirm).

---

## Minor Observations

- Trailing space in `className="bo-legacy-intro "` — harmless, clean up.
- Dropzone copy “ลากไฟล์มาวาง” relies on native transparent `<input type="file">` hit target (OK if tested); no explicit drag-active visual state (`dragover` class).
- Denied state is minimal — fine, but could link back to Legacy Members list.
- `errorMessage` fallback returns raw `code` string if unknown — better always map to Thai + support code.
- No `aria-busy` / live region for long imports.
- Panel head is only `<h2>` — no breadcrumb tie to “สมาชิกเก่า” beyond sidebar (sidebar OK if active state correct).

---

## Questions to Consider

- Should import ever be one-shot, or always **preview → confirm** for association data?
- What is the recovery story when the wrong year file is merged — re-import prior export, or support ticket only?
- Would a downloadable **Excel template** (Member + Transaction headers) cut 80% of `missing_member_sheet` / `no_members_parsed` tickets?

---

## Concrete fix backlog (English — for next chat)

Ordered for `/impeccable polish` / implementers:

1. **[P0] ConfirmDialog before commit** — file name, size, consequence copy; reuse `ConfirmDialog.tsx`.
2. **[P0] Dry-run / preview step** — parse without write OR two-phase UI; show sample + projected counts **before** `batch.set`.
3. **[P1] Validation report API + UI** — `warnings` / `skipped*` with row hints; show under result.
4. **[P1] Created vs updated counts** — extend `LegacyImportResult`; show in success banner.
5. **[P1] Clarify intro copy** — plain Thai consequences; demote collection names.
6. **[P2] After success** — disable submit until new file; stronger “ไปหน้ารายชื่อสมาชิกเก่า” as primary next step.
7. **[P2] Progress** — `aria-busy` on form, optional indeterminate progress; announce completion to SR.
8. **[P2] Template download** — link to sample `.xlsx` with required sheets/columns.
9. **[P3]** Drag-active styles; table `<caption>`; trim `bo-legacy-intro` class typo; map unknown errors to Thai.

**Suggested command sequence:**  
`/impeccable harden LegacyImportPage` → `/impeccable clarify` (copy) → `/impeccable polish`

---

## Detector & evidence notes

- CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/LegacyImportPage.tsx` → `[]`
- Browser live overlay: skipped (no running web/admin server in terminals)
- Backend confirms merge upserts (`import-xlsx.ts` `batch.set(..., { merge: true })`) with no skip telemetry returned to UI — UX critique of silent skips is grounded in API shape, not speculation
