---
target: Message Templates /admin/message-templates
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-07-27T14-26-52Z
slug: apps-web-src-admin-pages-messagetemplatespage-tsx
---
# 18 — Admin Message Templates (`/admin/message-templates`)

> **Method:** Assessment A via subagent (`2c277878`) · Assessment B parent-inline (`detect.mjs`; browser overlay skipped — no live admin server / auth in this run)  
> **Date:** 2026-07-27  
> **Target:** `apps/web/src/admin/pages/MessageTemplatesPage.tsx` + `.bo-templates*` in `admin.css`  
> **Register:** product · Back Office · LINE OA template library  
> **Design health:** **26 / 40** — Acceptable  
> **P0:** 0 · **P1:** 3 · **P2:** 3 · **P3:** 2  
> **Detector:** clean (`[]`)  
> **Focus lens:** clarity of variables · preview fidelity · edit safety

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 26/40 (Acceptable)

หน้าแม่แบบข้อความเป็นเครื่องมือ CRUD ชัดเจน โทนเขียวสมาคม ไม่ดู AI-slop มีรายการซ้าย–แก้ไขขวา ป้าย «ระบบ» สำหรับเชิญประชุม และ `ConfirmDialog` ตอนลบ/สลับแม่แบบตอนยังไม่บันทึก แต่ยังไม่พร้อมให้เจ้าหน้าที่มั่นใจกับข้อความ LINE จริง: ตัวอย่างเขียนว่า «ตัวอย่างใน LINE» ทั้งที่แค่กล่อง mist ธรรมดา ไม่มีคำอธิบายเรื่องตัวแปร/ข้อความตรง ๆ และทางออกบางทาง (ยกเลิก / รีเฟรช / ไปส่งแบบกลุ่ม) ทิ้งงานที่แก้ค้างโดยไม่ถาม — ขัดหลัก «ยืนยันก่อนทำลาย»

### จุดแข็ง

1. **Intent ด้าน edit safety มีจริง** — สลับแม่แบบ / กดสร้างใหม่ตอน dirty จะขึ้น «ทิ้งการแก้ไข?» และลบมี dialog อันตรายพร้อมชื่อแม่แบบ
2. **แม่แบบระบบชัด** — `agm_invite` มี badge «ระบบ» ลบไม่ได้ มี footer อธิบายว่าแก้ได้แต่ลบไม่ได้ + ทางลัดในหน้า broadcast
3. **ครบ state ปฏิบัติงาน** — โหลด / โหลดล้ม / ว่าง / ร่างใหม่ / นับตัวอักษรใกล้ลิมิต / sticky ปุ่มบันทึก / error ภาษาไทยส่วนใหญ่

### ปัญหาสำคัญ (สั้นๆ)

| ระดับ | ปัญหา |
|-------|--------|
| **P1** | «ตัวอย่างใน LINE» overclaim — ไม่เหมือนบับเบิล LINE จริง ทำให้ตัดสินใจส่งผิดพลาดได้ |
| **P1** | ไม่มีคำอธิบายตัวแปร / personalization — textarea ว่าง ไม่บอกว่าส่งข้อความตรง ๆ หรือมี merge field |
| **P1** | ช่องโหว่ edit safety — «ยกเลิก» / «รีเฟรช» / «ไปส่งข้อความแบบกลุ่ม» ข้าม dirty guard; ไม่มี `beforeunload` |
| **P2** | สถานะยังไม่บันทึกไม่ชัดตอนแก้ไข (มีแค่ตอนสร้างใหม่) |
| **P2** | workflow แยกจาก broadcast — บันทึกแล้วต้องกระโดดเอง ไม่พกแม่แบบไปหน้าส่ง |

### Top 3 ที่ควรแก้ก่อน

1. ปรับป้าย/สไตล์ preview ให้ซื่อสัตย์ (หรือทำให้ใกล้ LINE จริง + บอกข้อจำกัด)
2. ใส่สัญญาชัดเรื่องตัวแปร: chips แทรก token **หรือ** บรรทัดเดียวว่า «ข้อความตรง ๆ ไม่แทนชื่อสมาชิก»
3. ให้ทุกทางทิ้งงาน (ยกเลิก / รีเฟรช / ออกไป broadcast / ปิดแท็บ) ใช้ discard dialog ชุดเดียว

### Personas (สรุป)

- **Alex (power):** ไม่มี Cmd/Ctrl+S, duplicate, ค้นหารายการ; รีเฟรชทิ้งงานเงียบ ๆ รู้สึกพัง; อยาก one-click ไปส่งด้วยแม่แบบนี้
- **Sam (a11y):** preview เป็น `<pre>` ยาว; label ใช้สี muted; ลบไม่มี typed confirm
- **นายทะเบียน ABTA:** กลัวส่งผิดทั้งสมาคม — preview ไม่น่าเชื่อ; กลัวแก้ `agm_invite` พลาด; กลัวเสียข้อความไทยที่พิมพ์ดีแล้วเพราะยกเลิก/รีเฟรชไม่ถาม

---

## English — Fix-agent brief

### Provenance

`Method: Assessment A subagent (2c277878) · Assessment B parent-inline (detect.mjs clean; browser skipped)`

Sources: `MessageTemplatesPage.tsx`, `admin.css` (`.bo-templates*`), `ConfirmDialog.tsx` (pattern), `admin-api.ts` (`MessageTemplate` = `{ id, title, body }` — **no merge variables in API**), cross-check `BroadcastPage.tsx` (consumes templates as plain body).

CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/MessageTemplatesPage.tsx` → `[]`

### Design health score

| # | Heuristic | Score | Key issue |
|---|-----------|------:|-----------|
| 1 | Visibility of system status | 3 | Load/save/success/error/active nav OK; no persistent “unsaved” on edit |
| 2 | Match system / real world | 3 | Thai LINE OA copy clear; «ตัวอย่างใน LINE» overclaims fidelity |
| 3 | User control & freedom | 3 | Discard + delete dialogs; cancel/refresh/broadcast bypass dirty |
| 4 | Consistency & standards | 4 | Matches BO `bo-btn` / `bo-panel` / `ConfirmDialog` |
| 5 | Error prevention | 2 | Dirty select/create guarded; AGM edit casual; leave paths wipe work |
| 6 | Recognition rather than recall | 2 | No variable palette or explicit “plain text only” contract |
| 7 | Flexibility & efficiency | 2 | No duplicate, search, insert chips, Ctrl+S |
| 8 | Aesthetic & minimalist design | 3 | Clean editor; hero packs 3 CTAs vs sticky Save |
| 9 | Error recovery | 3 | Mapped Thai `ERROR_LABEL`; some ops jargon (`route_not_found`) |
| 10 | Help & documentation | 2 | Lead + AGM footer; no LINE limits / formatting / personalization help |
| **Total** | | **26/40** | **Acceptable** |

### Anti-patterns verdict

**LLM assessment:** Not AI marketing slop. Restrained association green, master–detail tool layout, purposeful `ระบบ` badge and dashed draft row. Passes product-register “earned familiarity” for CRUD chrome. Failures are **task-trust** failures (preview honesty, variable clarity, incomplete confirm paths) — not decorative overreach.

**Deterministic scan:** 0 findings.

```text
detect.mjs --json apps/web/src/admin/pages/MessageTemplatesPage.tsx
[]
```

False positives: n/a. Detector does **not** catch preview overclaim, missing variable UX, or dirty-guard holes — human review owns those.

**Visual overlays:** Not injected (no authenticated admin URL / live server this run).

### Cognitive load

Checklist failures (**3 → moderate**):

- [x] Single focus — FAIL (hero create / refresh / go-broadcast compete with editor)
- [ ] Chunking — OK (title + body + actions)
- [ ] Grouping — OK (list | editor panels)
- [x] Visual hierarchy — FAIL (two primary-weight CTAs: hero create vs sticky save)
- [ ] One thing at a time — OK inside editor
- [ ] Minimal choices — OK (≤3 editor actions)
- [x] Working memory — FAIL (must infer LINE fidelity + post-save broadcast handoff; no variable reference)
- [ ] Progressive disclosure — OK (AGM tip when relevant)

Decision points >4: template nav list grows unbounded (“เพิ่มได้ไม่จำกัด”) with no search/filter once count >4.

### Overall impression

Solid BO craft and real safety *intent*, undermined by three trust gaps for high-stakes LINE copy: **dishonest preview label**, **silent plain-text contract**, and **leaky discard paths**. Biggest opportunity: make “what members will see / what can be personalized / what happens to unsaved work” impossible to misunderstand.

### What's working

1. Dirty-nav discard + named delete confirm — product principle “ยืนยันก่อนทำลาย” starts here.
2. System template (`agm_invite`) visually and behaviorally protected from delete.
3. Operational states: loading, load-fail with retry+create, empty CTA, char warn, sticky actions, Thai error map.

### Priority issues

#### [P1] «ตัวอย่างใน LINE» is a fidelity overclaim

- **What:** `bo-templates-preview-label` says «ตัวอย่างใน LINE»; `bo-templates-preview-bubble` is a mist rounded `<pre>` of `body.trim()` — not LINE green bubble, chat chrome, wrap/emoji/link rendering.
- **Why:** Staff may ship copy that “looked fine” in preview; high blast radius on broadcast.
- **Fix:** Relabel to «ตัวอย่างข้อความ» **or** restyle toward LINE chat chrome + one-line limitation note («แสดงข้อความอย่างเดียว ไม่รวม emoji แบบ LINE / ลิงก์พรีวิว»).
- **Command:** `/impeccable clarify` (+ light `/impeccable layout` if restyling bubble).

#### [P1] Zero variable / personalization clarity

- **What:** API/model is plain `{ title, body }` only. UI never states that. No chips, examples, or “ไม่แทนค่าสมาชิกอัตโนมัติ”.
- **Why:** นายทะเบียน either invents fake `{{name}}` syntax that ships literally, or never learns personalization is unsupported — recognition failure (H6) + help failure (H10).
- **Fix:** Under «ข้อความ», add either (a) insertable tokens if product will add merge later, or (b) explicit contract: «ข้อความตรง ๆ — ไม่แทนชื่อ/เลขสมาชิกอัตโนมัติ». Optional example snippet in placeholder.
- **Command:** `/impeccable clarify` (copy) · `/impeccable shape` if adding real tokens.

#### [P1] Edit-safety holes undermine ConfirmDialog work

- **What:** `selectTemplate` / `startCreate` respect `dirty` → `discardOpen`. But `cancelCreate` (ยกเลิก), hero «รีเฟรช» (`load`), and «ไปส่งข้อความแบบกลุ่ม» (`goBroadcast`) ignore dirty. No `beforeunload`. AGM save has no elevated confirm.
- **Why:** Users learn “ทิ้งการแก้ไข?” then lose work via other exits — inconsistent prevention (H5) and broken trust for careful Thai drafting.
- **Fix:** Route all leave/discard paths through the same discard dialog; soft-confirm (or typed) when saving `agm_invite`; optional `beforeunload` when dirty.
- **Command:** `/impeccable harden`.

#### [P2] Dirty state under-signaled on edit

- **What:** Creating shows nav «ยังไม่บันทึก»; editing dirty only enables Save / Reset — no badge in `bo-templates-editor-head` or active nav.
- **Why:** Easy to miss unsaved changes before accidental refresh/navigation.
- **Fix:** Unsaved pill on editor head + active list item when `dirty`.
- **Command:** `/impeccable clarify` / `/impeccable polish`.

#### [P2] Split-brain workflow with Broadcast

- **What:** Library page; send happens on `/admin/broadcast`. Success copy + ghost CTA help, but no deep-link carrying `templateId`.
- **Why:** Power users bounce manually; peak-end after save is weak.
- **Fix:** Post-save primary action «ไปส่งด้วยแม่แบบนี้» → `/admin/broadcast` with template preselected (query or session).
- **Command:** `/impeccable harden` (+ small Broadcast wiring).

#### [P2] Unbounded template list without search

- **What:** Copy promises unlimited templates; nav is a flat scroll list.
- **Why:** >4 items → wall of options; Alex/registrar slowdown.
- **Fix:** Filter input above `bo-templates-nav` when `templates.length > 5`.
- **Command:** `/impeccable distill` / `/impeccable polish`.

### Persona red flags

**Alex (Power User)**  
- No Cmd/Ctrl+S, no duplicate template, no list filter.  
- «รีเฟรช» silently nukes dirty work after they already accepted discard modals elsewhere — feels broken.  
- Wants one-click edit → broadcast with this template.

**Sam (Accessibility)**  
- Preview region `aria-label` only; long Thai in scrollable `<pre>` is awkward for SR.  
- Field labels muted (`.bo-templates-form .bo-field > span`) — verify ≥4.5:1 vs white.  
- Delete uses danger `ConfirmDialog` but not `requireTypedConfirm` — easier misclick.  
- Char warn recolors hint — check warn contrast.

**นายทะเบียน ABTA (careful LINE editor)**  
- Fear: wrong text hits all members — preview doesn’t look like LINE → low trust.  
- Fear: breaking `agm_invite` — editable with only soft footer, no extra confirm.  
- Fear: losing careful wording — ยกเลิก / refresh / jump to broadcast drop unsaved copy without the discard dialog they already learned.  
- Needs certainty: name merge? links? real LINE char limit? — only local `MAX_CHARS` 4500 shown.

### Minor observations (P2–P3)

| Sev | Item | Fix hint | Command |
|-----|------|----------|---------|
| P2 | Sticky actions + list `max-height` on ≤900px may bury preview | Reorder: preview nearer textarea; tighten list | `/impeccable adapt` |
| P2 | Unused CSS `.bo-templates-preview-body` | Remove or wire if sharing with broadcast preview | `/impeccable polish` |
| P3 | Hero three equal CTAs | Demote refresh/broadcast to secondary; keep create primary | `/impeccable quieter` |
| P3 | `route_not_found` / deploy CF copy is ops-jargony | Softer staff-facing recovery | `/impeccable clarify` |
| P3 | Delete success only «ลบแม่แบบแล้ว» | Mention next step / list focus | `/impeccable clarify` |

### Emotional journey

- **Peak:** Save success pointing to broadcast — good.  
- **Valley:** Load fail; discard; delete — handled.  
- **High-stakes gap:** Editing AGM + dishonest preview + silent discard via refresh — undermines careful end state.  
- **End:** Delete end is abrupt; save end is stronger.

### Questions to consider

1. If personalization doesn’t exist, why doesn’t the page say so — and if it should, why is the editor a blank textarea with no token UI?
2. Would you bet a member’s LINE thread that «ตัวอย่างใน LINE» matches production?
3. Why protect template-switch with «ทิ้งการแก้ไข?» but let «รีเฟรช» and «ไปส่งข้อความแบบกลุ่ม» discard without asking?
4. Should editing «แม่แบบเชิญประชุม · ระบบ» feel as casual as a one-off seminar reminder?

### Detector summary

```text
detect.mjs --json apps/web/src/admin/pages/MessageTemplatesPage.tsx
exit 0 · findings: []
```

No detector P0/P1; human review owns preview, variables, and dirty-guard gaps.

### Suggested command sequence

1. `/impeccable clarify` — preview label + plain-text/variable contract + AGM save copy  
2. `/impeccable harden` — unify discard on cancel/refresh/broadcast/`beforeunload`; optional AGM save confirm; broadcast deep-link  
3. `/impeccable layout` — honest LINE-ish preview chrome (if keeping LINE claim)  
4. `/impeccable quieter` — demote hero secondary CTAs  
5. `/impeccable polish` — unsaved badge, list filter, dead CSS, success copy  

### Concrete fix backlog (for coding agents)

| ID | Sev | File(s) | Change |
|----|-----|---------|--------|
| MT1 | P1 | `MessageTemplatesPage.tsx`, optionally `admin.css` | Honest preview: rename «ตัวอย่างใน LINE» → «ตัวอย่างข้อความ» **or** LINE-chrome restyle + limitation note. |
| MT2 | P1 | `MessageTemplatesPage.tsx` | Under body field: explicit plain-text contract («ไม่แทนชื่อ/เลขสมาชิกอัตโนมัติ») **or** insertable variable chips if product adds merge. Align with API (`title`/`body` only today). |
| MT3 | P1 | `MessageTemplatesPage.tsx` | Route `cancelCreate`, `load`, `goBroadcast` (and `beforeunload`) through same dirty → `discardOpen` path as `selectTemplate` / `startCreate`. |
| MT4 | P1 | `MessageTemplatesPage.tsx` | Soft/typed confirm when saving `agm_invite` (ระบบ). |
| MT5 | P2 | `MessageTemplatesPage.tsx`, `admin.css` | Unsaved badge on editor head + active nav when `dirty`. |
| MT6 | P2 | `MessageTemplatesPage.tsx`, `BroadcastPage.tsx`, `AdminApp.tsx` | Post-save / CTA: open broadcast with this template preselected (`?template=` or shared state). |
| MT7 | P2 | `MessageTemplatesPage.tsx` | Search/filter on template list when count > 5. |
| MT8 | P2 | `admin.css` | Mobile: keep preview adjacent to textarea; avoid list burying editor; remove unused `.bo-templates-preview-body` if orphaned. |
| MT9 | P3 | `MessageTemplatesPage.tsx` | Demote hero «รีเฟรช» / «ไปส่ง…» visual weight; richer delete/save success copy; soften `route_not_found` wording. |
| MT10 | P3 | `MessageTemplatesPage.tsx` | Optional Cmd/Ctrl+S to save when `canSave`; optional duplicate template action for Alex. |

### Trend / snapshot

First documented critique for this target in `docs/ui-ux-critique/`.  
Slug: `apps-web-src-admin-pages-messagetemplatespage-tsx` (for `.impeccable/critique` storage if written).

---

*End of report — Thai summary above; English tables/backlog for fix agents.*
