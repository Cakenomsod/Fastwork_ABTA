# 13 — Admin Legacy Members (`/admin/legacy`)

> **Method:** ⚠️ DEGRADED: single-context (critique already running as nested subagent under Multitask parent — dual Assessment A/B agents not spawned)  
> **Date:** 2026-07-27 (re-critique after Legacy Members + Legacy Import fix round)  
> **Target:** `apps/web/src/admin/pages/LegacyMembersPage.tsx` + `ListPager.tsx` + `admin-api.ts` (`LEGACY_*`) + `admin.css`  
> **Related (not wired here):** `MemberDetailDrawer.tsx`, `LegacyPaymentsPanel.tsx` — Dashboard / bound-member only  
> **Register:** product · queue/ops BO · `--bo-*` green+gold  
> **Design health:** **19 / 40** — Poor  
> **Prior:** 19/40 · **Delta:** **0** (no material fixes on this surface)  
> **P0:** 1 · **P1:** 3 · **P2:** 5 · **P3:** 2  
> **Detector:** 1 advisory (`design-system-font-size` @ inline `0.8rem`)  
> **Browser overlay:** skipped (admin auth-gated / no injection in this subagent run)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 19/40 (Poor) — ไม่เปลี่ยนจาก 19

รอบแก้โฟกัสที่ **Legacy Import** (dry-run + ConfirmDialog) — **หน้าสมาชิกเก่ายังไม่แตะ** ยังเป็นรายการค้นหา/กรองที่ layout สอดคล้อง Back Office แต่เป็น **รายการตัน (dead-end)**: แถวคลิกไม่ได้ ไม่มี drawer และ API ส่ง `phone` / `email` / `expiryDate` มาแล้ว UI ไม่แสดง — เจ้าหน้าที่ยืนยันตัวตนหลังค้นหาด้วยโทร/อีเมลไม่ได้ สถานะสมาชิกเก่ายังเป็นอังกฤษ (`Active` / `Expired` / `NonActive` / `Pending`)

**คะแนน: 19/40 (Poor)** · P0 = 1 · P1 = 3 · **Delta 0** (ไม่มี fix บน `LegacyMembersPage` / `LEGACY_STATUS_*`)

### Delta vs prior

| รายการ | Prior | Now |
|--------|-------|-----|
| Detail / drawer สำหรับแถว | **P0** ไม่มี | ❌ ยังไม่มี |
| แสดง phone / email / expiry | **P0** ซ่อน | ❌ ยังซ่อน |
| สถานะไทย | **P1** EN | ❌ ยัง EN |
| สถิติคลิกกรอง + grid 3 คอลัมน์ | **P1** | ❌ ยัง vanity + `.bo-stats` 4-col |
| Seg ARIA / live region | **P1** | ❌ ยัง `role="group"` + class only |
| คะแนน / P0 / P1 | 19 · 1 · 3 | **19 · 1 · 3** |

### จุดแข็ง (2–3)

1. **โครงสร้างค้นหาใช้งานได้** — label ชัด, filter LINE + สถานะ, ปุ่มล้างตัวกรอง, ช่วงรายการ + pager ภาษาไทย
2. **Empty state แยกเคส** — กรองไม่เจอ vs ยังไม่มีข้อมูล (ชี้ไปนำเข้า Excel)
3. **แบรนด์ BO สอดคล้อง** — `.bo-stats` / `.bo-panel` / `.bo-badge` / `.bo-table--cards`; focus-visible บนปุ่ม/seg มีใน `admin.css` แล้ว (shared)

### ปัญหาที่เหลือ (สำคัญ)

| ระดับ | ปัญหา |
|-------|--------|
| **P0** | รายการตัน — ไม่มี detail/drawer; ซ่อน phone/email/วันหมดอายุทั้งที่ API มี → ยืนยันตัวตนไม่ได้ |
| **P1** | ตัวกรอง/แบดจ์สถานะเป็นอังกฤษ (`Active`, `NonActive`…) ใน BO ภาษาไทย |
| **P1** | การ์ดสถิติ 3 ใบไม่คลิกกรองได้ + grid 4 คอลัมน์เหลือช่องว่าง |
| **P1** | Segment filter ไม่มี `aria-pressed` / radiogroup; loading แทนที่ตารางทั้งก้อนไม่มี live region |

### Top 3 ที่ควรแก้ก่อน

1. เปิด detail (drawer หรือแถวขยาย) แสดง phone/email/expiry + ลิงก์ไปสมาชิกใหม่ถ้าผูกแล้ว — reuse Dashboard drawer ถ้าเป็นไปได้
2. แปลสถานะ legacy เป็นไทยที่เจ้าหน้าที่เข้าใจ (และนิยาม NonActive)
3. ทำให้สถิติ “ยังไม่ยืนยัน / ยืนยัน LINE แล้ว” เป็นทางลัดตัวกรอง + แก้ grid 3 การ์ด

### Personas (สรุป)

- **Alex (power):** ค้นหาแล้วจบ — คัดลอกเลข/เปิดรายละเอียด/คลิกสถิติกรองไม่ได้; ไม่มี shortcut; Submit ค้นหาแต่ filter ยิงทันที
- **Sam (a11y):** ตารางอ่านได้อย่างเดียว; seg ไม่ประกาศ selected state; loading กลืน content โดยไม่ announce; `bo-rise` บน panel/stat ยังไม่เคลียร์ reduced-motion ทั้งหน้า
- **นายทะเบียน:** ต้องการยืนยัน “คนนี้ใช่ไหม” จากโทร/อีเมลหลังค้นหา — ตอนนี้เห็นแค่ชื่อ + เลขเก่า

### Cognitive load

Checklist failures (6 → **high**):

- [x] Single focus — FAIL (stats + search + two seg groups + table)
- [x] Chunking — FAIL (search label lists 5 field types; status seg = 5 chips)
- [ ] Grouping — OK
- [x] Visual hierarchy — FAIL (stats compete with find-member task)
- [x] One thing at a time — FAIL
- [x] Minimal choices — FAIL
- [x] Working memory — FAIL (phone/email match not visible in row)
- [x] Progressive disclosure — FAIL (no detail layer)

Decision points >4 options: legacy status segment (5).

---

## English — Fix-agent brief

### Provenance

`Method: ⚠️ DEGRADED: single-context (nested Multitask critique subagent; A/B not dual-spawned)`

Sources reviewed: `LegacyMembersPage.tsx`, `ListPager.tsx`, `admin-api.ts` (`LEGACY_*` labels + `LegacyMemberListRow`), `admin.css` (`.bo-legacy-*`, stats, filters, table cards, pager, motion). Related unused-on-page: `MemberDetailDrawer.tsx`, `LegacyPaymentsPanel.tsx`.  
Git/code check: no material UX fix on this surface since prior 19/40 (Import page fixed separately).  
CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/LegacyMembersPage.tsx apps/web/src/admin/ListPager.tsx`

### Design health score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 2 | Loading / truncated hint exist; table replaced wholesale; no `aria-live` / `aria-busy` |
| 2 | Match system / real world | 1 | Legacy status filters & badges in English (`NonActive`, etc.) inside Thai BO |
| 3 | User control & freedom | 3 | Clear filters + pager exits OK; no trapped modal (none present) |
| 4 | Consistency & standards | 2 | Dashboard has row→drawer; this page has none; search Submit vs instant segs |
| 5 | Error prevention | 2 | English status chips invite wrong filter; long multi-field search label |
| 6 | Recognition over recall | 1 | Search supports phone/email but results hide those fields — memory bridge |
| 7 | Flexibility & efficiency | 1 | No row action, no clickable stats, no shortcuts, no copy-ID affordance |
| 8 | Aesthetic and minimalist | 2 | Clean panels; hero-metric stats + 3 cards in 4-col `.bo-stats` grid |
| 9 | Error recovery | 2 | `.bo-error` shown; empty copy OK; no CTA link to `/admin/legacy/import` |
| 10 | Help and documentation | 1 | No glossary for Excel status values; only truncation hint |
| **Total** | | **19/40** | **Poor** |

### Anti-patterns verdict

**LLM assessment:** Not purple/gray SaaS slop — association green holds. Failure mode remains **ops incompleteness**: a familiar admin list that looks finished but does not complete the registrar’s job (identity check after search). Hero-metric `.bo-stat` strip (big num + small label) repeats the dashboard SaaS reflex. Table headers use uppercase tracking on Thai labels (shared `.bo-table th` — polish, not unique).

**Deterministic scan:** 1 finding, severity `advisory`:

| Rule | File | Line | Notes |
|------|------|------|-------|
| `design-system-font-size` | `LegacyMembersPage.tsx` | ~247 | Inline `fontSize: "0.8rem"` off DESIGN.md type ramp (list meta) |

False positives: none. Detector misses dead-end IA, EN status copy, and a11y on segs — review-only.

**Visual overlays:** Not injected (admin auth-gated).

### Overall impression

Competent **browse chrome**, incomplete **work tool**. Biggest opportunity unchanged: turn each row into an identity-confirm surface (show match fields + open detail / bound member), and speak status in Thai. **Do not invent sample PII** in mocks — use empty/placeholder fields only.

### What's working

1. Shared BO primitives (filters, badges, card-table, pager) — staff already trained on Dashboard patterns.
2. Bind filter labels are Thai and align with stats copy (“ยืนยัน LINE แล้ว / ยังไม่ยืนยัน”).
3. Empty states distinguish “no import yet” vs “filters miss”; truncation hint when dataset capped.

### Priority issues

#### [P0] Dead-end list — cannot verify identity or open detail

- **What:** Rows are non-interactive. `LegacyMemberListRow` includes `phone`, `email`, `expiryDate`, `boundFullName`, etc., but the table only shows legacy ID, name, type, EN status, LINE badge, bound member ID. No `MemberDetailDrawer` / legacy detail panel / payments panel on this route.
- **Why:** Primary staff job after search is “คนนี้ใช่ไหม?” — especially when searching by phone/email. Hidden match fields force recall or a hop to another tool. Product principle: status/identity clarity before polish.
- **Fix:** (Preferred) Row open → legacy detail drawer/sheet showing contact, expiry, source file, LINE bind, link to bound `memberId` (reuse drawer patterns + `LegacyPaymentsPanel` when legacy ID present). Minimum: show phone + email columns (or under name) and make bound ID a link to Dashboard/member detail. Keyboard-openable.
- **Command:** `/impeccable shape` (detail IA) then `/impeccable harden` / `/impeccable layout`.

#### [P1] English legacy status in a Thai back office

- **What:** `LEGACY_STATUS_FILTER_OPTIONS` / `LEGACY_STATUS_LABEL` use `Active`, `Expired`, `NonActive`, `Pending` in chips and badges.
- **Why:** Heuristic 2 + brand voice (สุภาพ ตรงไปตรงมา ภาษาไทย). `NonActive` is especially opaque; wrong filter → wasted lookups.
- **Fix:** Thai labels (e.g. ใช้งาน / หมดอายุ / ไม่ใช้งาน / รอดำเนินการ) with optional Excel-code subtitle in tooltip or secondary text for power users who know the sheet.
- **Command:** `/impeccable clarify` scoped to `admin-api.ts` labels + badge render.

#### [P1] Stats are vanity metrics, not filter shortcuts (+ broken 4-col grid)

- **What:** Three `.bo-stat` cards; `.bo-stats` CSS is `repeat(4, …)` → empty fourth track on desktop. Cards are not buttons; “ยังไม่ยืนยัน” does not set `bindStatus=unbound`.
- **Why:** Same queue-first miss as Dashboard — counts that don’t accelerate the next click. Absolute ban adjacent: hero-metric template.
- **Fix:** Make bound/unbound (and optionally total) toggle the existing bind filter; use `grid-template-columns: repeat(3, 1fr)` for this page (e.g. `.bo-legacy-page .bo-stats`) or a shared `bo-stats--3` modifier.
- **Command:** `/impeccable distill` + `/impeccable layout`.

#### [P1] Filter / loading accessibility gaps (Sam)

- **What:** Bind/status segs use `role="group"` + `is-active` class only — no `aria-pressed` / `radiogroup`+`aria-checked` (Dashboard status segs use radiogroup). Loading swaps the whole table for “กำลังโหลดรายการ…” with no `aria-live` / `aria-busy` on the results panel.
- **Why:** Screen readers may not announce which filter is selected or that results refreshed. Keyboard focus exists on buttons, but state is visual-only.
- **Fix:** Match Dashboard radiogroup pattern (or `aria-pressed` on each seg); set `aria-busy` on list panel while loading; announce result count via polite live region; prefer skeleton/opacity over wiping rows when refreshing.
- **Command:** `/impeccable audit` then `/impeccable harden`.

### Persona red flags

**Alex (Power User)**  
- Search → stare; cannot open row, copy fields in one click, or jump to bound member.  
- Stats waste a scroll without acting as filters.  
- Inconsistent apply model: segs refetch immediately; text search needs Submit (Enter works via `<form>`).  
- No `/` to focus search; no export/bulk for unbound follow-up lists.

**Sam (Accessibility)**  
- No interactive row semantics (nothing to activate — also no alternative “view details” control).  
- Selected filter state not exposed accessibly.  
- Loading replaces content; may lose focus context.  
- Shared `.bo-btn` / `.bo-seg-btn` have `:focus-visible` (global).  
- `.bo-stat` / `.bo-panel` `bo-rise` still not clearly disabled under `prefers-reduced-motion` for this page.

**นายทะเบียน / เจ้าหน้าที่ (project)**  
- After Excel import, needs “หาเลขเก่า → ยืนยันเบอร์ → ดูว่าผูก LINE หรือยัง”. Page covers step 1 and part of step 3 only.  
- English status chips break Thai ops voice and Excel→UI mental model unless codes are explained.  
- Empty “ยังไม่มีข้อมูล” mentions import menu but offers no button to `/admin/legacy/import`.

### Minor observations (P2–P3)

| Sev | Item | Fix hint | Command |
|-----|------|----------|---------|
| P2 | Empty state mentions Excel import with no CTA | Button → `go("legacy-import")` / link `/admin/legacy/import` | `/impeccable onboard` / `clarify` |
| P2 | Inline `style={{ marginBottom }}` + `fontSize: 0.8rem` | Move to `.bo-legacy-page` / meta class (fixes detector) | `/impeccable typeset` / `layout` |
| P2 | `.bo-list-filters` desktop grid assumes ~4 tracks (Dashboard) | Page-specific 2-filter + actions layout | `/impeccable layout` |
| P2 | Error may surface raw `err.message` | Map to Thai actionable copy | `/impeccable clarify` |
| P2 | `bo-rise` on stats/panels vs reduced-motion | Global kill for `.bo-stat`/`.bo-panel` animations | `/impeccable harden` |
| P3 | Uppercase Thai `th` via shared table CSS | Sentence case for Thai headers | `/impeccable typeset` |
| P3 | Truncation hint only when `truncated` | Always show soft help for large sets near search | `/impeccable clarify` |

### Emotional journey

- **Peak needed:** “เจอคนถูก + มั่นใจว่าใช่” — blocked by missing contact fields.  
- **Valley:** English status; empty import guidance without CTA; loading flash.  
- **End:** Pager works; clear filters recovers — preserve that.

### Questions to consider

- Is this page meant only as an **import audit list**, or the **primary identity lookup** before helping a member bind LINE?
- Should unbound rows deep-link into member search / review with prefilled legacy ID?
- Keep Excel English codes as secondary text, or fully localize?

### Detector summary

```text
detect.mjs --json LegacyMembersPage.tsx ListPager.tsx
exit findings: 1 advisory
- design-system-font-size @ LegacyMembersPage.tsx:247 (0.8rem inline)
```

No P0/P1 from detector; human review owns dead-end IA + EN status + filter a11y.

### Suggested command sequence

1. `/impeccable shape` — legacy row detail / drawer IA (reuse Dashboard drawer patterns)  
2. `/impeccable clarify` — Thai status labels + errors + empty CTA  
3. `/impeccable layout` — 3-col stats; clickable bind shortcuts; filter grid  
4. `/impeccable audit` — seg ARIA, live regions, focus rings  
5. `/impeccable harden` — loading/`aria-busy`, reduced-motion  
6. `/impeccable polish` — P2/P3 sweep  

### Concrete fix backlog (for coding agents)

| ID | Sev | File(s) | Change |
|----|-----|---------|--------|
| L1 | P0 | `LegacyMembersPage.tsx`, new/reuse drawer, `LegacyPaymentsPanel.tsx`, `admin.css` | Add detail path: show phone/email/expiry at minimum; prefer drawer with bind + payments + link to bound member. Keyboard-openable. Do not invent PII in fixtures. |
| L2 | P1 | `admin-api.ts` (`LEGACY_STATUS_*`), badges in page | Thai status labels; optional Excel-code hint. |
| L3 | P1 | `LegacyMembersPage.tsx`, `admin.css` | Clickable stats → set `bindStatus`; `.bo-stats` 3-column on this page. |
| L4 | P1 | `LegacyMembersPage.tsx` | Seg `radiogroup`/`aria-pressed`; `aria-busy` + live region for results; avoid full-table wipe when refreshing. |
| L5 | P2 | `LegacyMembersPage.tsx`, `AdminApp` nav helper | Empty-state CTA to `/admin/legacy/import`. |
| L6 | P2 | `LegacyMembersPage.tsx`, `admin.css` | Remove inline styles; class for list meta `0.8rem` (detector). |
| L7 | P2 | `admin.css` | Legacy-specific filter toolbar grid (2 groups + actions). |
| L8 | P2 | `LegacyMembersPage.tsx` | Thai actionable error mapping. |
| L9 | P2 | `admin.css` | `prefers-reduced-motion` disables `.bo-stat` / `.bo-panel` `bo-rise`. |
| L10 | P3 | `admin.css` | Soften uppercase Thai table headers (shared). |

### Trend / snapshot

Re-critique: **19 → 19** (no surface fixes).  
Slug: `apps-web-src-admin-pages-legacymemberspage-tsx`

---

*End of report — Thai summary above; English tables/backlog for fix agents.*
