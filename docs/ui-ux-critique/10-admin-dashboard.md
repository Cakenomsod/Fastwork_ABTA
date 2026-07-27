# 10 — Admin Dashboard (`/admin`)

> **Method:** ⚠️ DEGRADED: single-context (critique already running as nested subagent under Multitask parent — dual Assessment A/B agents not spawned)  
> **Date:** 2026-07-27  
> **Target:** `apps/web/src/admin/pages/DashboardPage.tsx` (+ shell `AdminApp.tsx`, tokens `admin.css`)  
> **Register:** product · queue-first BO · `--bo-*` green+gold  
> **Design health:** **24 / 40** — Acceptable  
> **P0:** 1 · **P1:** 4 · **P2:** 5 · **P3:** 3  
> **Detector:** 1 advisory (`design-system-font-size` @ inline `0.8rem`)  
> **Browser overlay:** skipped (no live server / injection in this subagent run)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 24/40 (Acceptable)

หน้า Dashboard เป็นศูนย์กลางค้นหา/กรองสมาชิกของ Back Office — โทนเขียว+ทองชัด ไม่ใช่ admin เทา-น้ำเงินทั่วไป มีป้ายสถานะภาษาไทย ตัวกรองแบบ segment และ empty state ที่ชี้ทางได้ แต่ยังไม่ “คิวเป็นศูนย์กลาง” ตามหลักผลิตภัณฑ์: สี่การ์ดตัวเลขใหญ่ด้านบนดึงสายตาออกจากงานจริง และแถวตารางเปิดได้แค่เมาส์ ทำให้คีย์บอร์ด/screen reader ทำงานหลักไม่ได้

### จุดแข็ง

1. **แบรนด์ BO ชัด** — sidebar เขียวลึก + ทอง, paper surface, badge สถานะมีสี semantic ตาม `--bo-*`
2. **ค้นหา + กรองใช้งานได้จริง** — label ชัด, radiogroup/listbox มี ARIA พื้นฐาน, ล้างตัวกรอง, empty state มีคำแนะนำ
3. **Drawer รายละเอียด** — `role="dialog"`, Escape, focus ปุ่มปิด, overlay ปิดเมื่อคลิกพื้นหลัง

### ปัญหาสำคัญ (สั้นๆ)

| ระดับ | ปัญหา |
|-------|--------|
| **P0** | แถวสมาชิกในตารางคลิกได้แต่โฟกัส/Enter/Space ไม่ได้ — กีดขวางงานหลักของ Sam (คีย์บอร์ด) และ WCAG AA |
| **P1** | การ์ดสถิติ 4 ใบแบบ hero-metric ไม่ลิงก์ไปคิว/ตัวกรอง — ขัดหลัก “คิวเป็นศูนย์กลาง” |
| **P1** | ตัวกรองสถานะ 8 ตัวเลือกพร้อมกัน — เกิน working memory ของนายทะเบียนที่รีบ |
| **P1** | ข้อความ error เป็นรหัสดิบ (`search_failed`, `reload_failed`) |
| **P1** | ปุ่ม `.bo-btn` ไม่มี `focus-visible` ใน CSS — โฟกัสคีย์บอร์ดอ่อน/หายบน primary actions |

### Top 3 ที่ควรแก้ก่อน

1. ทำให้แถวตารางเปิดด้วยคีย์บอร์ด (และประกาศให้ screen reader)
2. แปลงสถิติให้เป็นทางลัดคิว (คลิกแล้วกรอง / ไปหน้าตรวจ) ไม่ใช่แค่ตัวเลขโชว์
3. ย่อหรือจัดกลุ่มตัวกรองสถานะ + แปล error เป็นภาษาไทยที่ actionable

### Personas (สรุป)

- **Alex (power):** ไม่มี shortcut, ต้อง Submit ค้นหาแต่ filter ยิงทันที (ไม่สม่ำเสมอ), ไม่มี bulk, stats กินพื้นที่โดยไม่เร่งงาน
- **Sam (a11y):** แถวตารางไม่โฟกัสได้; SortMenu ไม่ครบลูกศรใน listbox; บาง animation ไม่เคารพ reduced-motion
- **นายทะเบียน / เจ้าหน้าที่:** อยากเห็นคิวรอตรวจก่อน — ตอนนี้เจอตัวเลขใหญ่ + ฟอร์มค้นหาก่อนรายการงาน

---

## English — Fix-agent brief

### Provenance

`Method: ⚠️ DEGRADED: single-context (nested Multitask critique subagent; A/B not dual-spawned)`

Sources reviewed: `DashboardPage.tsx`, `AdminApp.tsx` (shell/nav/title), `admin.css` (stats/table/filters/focus/motion), `ListPager.tsx`, `MemberDetailDrawer.tsx` (drawer a11y shell).  
CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/DashboardPage.tsx`

### Design health score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Loading / searching / selected row OK; no live region for result count changes |
| 2 | Match system / real world | 3 | Thai domain copy strong; title still English “Dashboard”; raw error codes |
| 3 | User control & freedom | 3 | Clear filters + Esc drawer; auto-open on single search hit can surprise |
| 4 | Consistency & standards | 2 | Search requires Submit; status/receipt filters apply immediately; EN/TH mix |
| 5 | Error prevention | 2 | Dense 8-way status seg; auto-open drawer on 1 match |
| 6 | Recognition over recall | 3 | Filters/badges visible; multi-field status logic still hard to parse |
| 7 | Flexibility & efficiency | 2 | No row keyboard path; no queue deep-links from stats; no shortcuts |
| 8 | Aesthetic & minimalist | 2 | Hero-metric 4-stat grid (absolute ban / SaaS reflex); competes with queue |
| 9 | Error recovery | 2 | Empty states good; API errors often untranslated codes |
| 10 | Help & documentation | 1 | No help for “สิทธิ์ประชุมใหญ่ (สามัญ)” / T filters beyond labels |
| **Total** | | **24/40** | **Acceptable** |

### Anti-patterns verdict

**LLM assessment:** Not generic gray-blue SaaS — green+gold identity holds. Still fails the product-register “earned familiarity” bar in places: **hero-metric stat strip** (big number + small label ×4), identical elevated cards, and a filter wall that feels template-admin rather than queue-ops. Active nav gold inset is intentional per DESIGN.md (sidebar only) — not scored as the banned content-card side-stripe.

**Deterministic scan:** 1 finding, severity `advisory`:

| Rule | File | Line | Notes |
|------|------|------|-------|
| `design-system-font-size` | `DashboardPage.tsx` | ~438 | Inline `fontSize: "0.8rem"` off DESIGN.md type ramp (list meta) |

False positives: none material. Detector does **not** catch the keyboard-row or hero-metric issues — those are review-only.

**Visual overlays:** Not injected this run.

### Cognitive load

Checklist failures (6 → **high**):

- [x] Single focus — FAIL (stats + search + segs + table)
- [x] Chunking — FAIL (8 status options)
- [ ] Grouping — OK (panels)
- [x] Visual hierarchy — FAIL (stats equal weight to work list)
- [x] One thing at a time — FAIL
- [x] Minimal choices — FAIL (8 status + 3 receipt + 6 sort visible)
- [x] Working memory — FAIL (composite badge logic)
- [ ] Progressive disclosure — FAIL (all filters always expanded)

Decision points >4 options: status radiogroup (8), sort listbox (6).

### Overall impression

Solid BO craft and Thai ops language, but the page still opens like a **metrics dashboard** instead of a **queue console**. Biggest opportunity: make “รอตรวจข้อมูล / รอตรวจสลิป” the primary path (clickable, keyboardable, filter-linked) and demote vanity totals.

### What's working

1. Association tokens + sidebar brand (not AI purple/gray).
2. Filter UX primitives: labeled segs, clear-filters, ARIA radiogroup/listbox basics, pager labels in Thai.
3. Empty states with next-step copy; member drawer has dialog semantics + Escape.

### Priority issues

#### [P0] Table rows are mouse-only for the primary open action

- **What:** `tr.bo-row-clickable` uses `onClick` only — no `tabIndex`, no `onKeyDown` (Enter/Space), no row `role` / accessible name.
- **Why:** Blocks keyboard completion of the core task (find → open member). Violates product WCAG AA + Sam persona. Screen readers may not expose rows as actionable.
- **Fix:** Prefer `<button>` / link in first cell, or `tabIndex={0}` + Enter/Space + `aria-label` including name+memberId; ensure selected state is announced; add `:focus-visible` row style in `admin.css`.
- **Command:** `/impeccable audit` then `/impeccable harden` scoped to `DashboardPage.tsx` + row styles.

#### [P1] Hero-metric stats are not queue actions

- **What:** Four `.bo-stat` cards (`totalMembers`, `pendingDataReviews`, `pendingSlipReviews`, `activeMembers`) — classic big-num/small-label grid; not interactive; duplicate nav badge counts mentally.
- **Why:** Product principle is queue-first. นายทะเบียน needs pending queues, not vanity “สมาชิกทั้งหมด” at equal weight. Absolute ban: hero-metric template.
- **Fix:** Make pending stats buttons that set status filter (`pending_data` / `pending_slip`) or `navigate` to `/admin/data` / `/admin/slips`; demote total/active to muted secondary or remove from first viewport; optional one “คิววันนี้” strip.
- **Command:** `/impeccable distill` + `/impeccable layout` on dashboard header.

#### [P1] Status filter wall (8 options)

- **What:** `MEMBER_STATUS_FILTER_OPTIONS` renders all chips at once.
- **Why:** >4 visible choices at one decision point → mis-taps under time pressure; cognitive overload for registrar.
- **Fix:** Split “งานคิว” (รอตรวจข้อมูล / รอตรวจสลิป) as primary toggles; park the rest under “เพิ่มเติม” disclosure or a compact select; keep defaults queue-oriented.
- **Command:** `/impeccable distill` (filters) / `/impeccable shape` if IA rethink.

#### [P1] Raw / non-actionable errors

- **What:** `setError(... "search_failed" | "reload_failed" | err.message)` rendered in `.bo-error`.
- **Why:** Heuristic 9 — staff cannot recover from English snake_case codes; support tickets increase.
- **Fix:** Map codes → Thai actionable strings (“ค้นหาไม่สำเร็จ — ลองใหม่หรือลดเงื่อนไข”); keep technical detail in `console` only.
- **Command:** `/impeccable clarify` + `/impeccable harden`.

#### [P1] Weak keyboard focus on primary buttons

- **What:** `.bo-btn` has hover/active/disabled but **no** `:focus-visible` rule (unlike `.bo-seg-btn` / nav). Inputs use focus outline; primary Search may rely on UA default only.
- **Why:** Inconsistent focus system; AA risk on BO primary actions.
- **Fix:** Add shared `.bo-btn:focus-visible` using green ring (match seg/menu tokens).
- **Command:** `/impeccable audit` (focus pass).

### Persona red flags

**Alex (Power User)**  
- No `/` or shortcuts to focus search; no `j/k` or arrows for rows.  
- Search Submit vs instant filter apply feels inconsistent.  
- Stats burn vertical space without accelerating queue work.  
- No bulk open / multi-select (acceptable for Phase 1, but Alex will feel slow).

**Sam (Accessibility)**  
- **P0:** cannot open member rows by keyboard.  
- SortMenu: Escape + open keys OK; missing ArrowUp/Down/Home/End among options, no `aria-activedescendant`.  
- `bo-rise` on `.bo-stat` / `.bo-panel` not clearly killed under a page-level `prefers-reduced-motion` for dashboard (other regions have partial coverage).  
- Nav active via class only — missing `aria-current="page"` on `NavBtn`.  
- Status meaning partly color+text (badges have text — OK) but selected row is background-only cue.

**นายทะเบียน / เจ้าหน้าที่ (project)**  
- First viewport does not answer “คิวค้างเท่าไรที่ฉันต้องทำตอนนี้” as an actionable queue.  
- Must translate between Dashboard list status badges and dedicated Data/Slip review pages.  
- Title “Dashboard” breaks Thai ops voice (anti-jargon / brand personality).

### Minor observations (P2–P3)

| Sev | Item | Fix hint | Command |
|-----|------|----------|---------|
| P2 | EN title `Dashboard` in `titleMap` / nav label | Rename to `ภาพรวมสมาชิก` or `ค้นหาสมาชิก` | `/impeccable clarify` |
| P2 | Inline `style={{ fontSize: "0.8rem" }}` on list meta (detector hit) | Move to CSS class / token | `/impeccable typeset` |
| P2 | SortMenu listbox incomplete keyboard pattern | Arrow keys + focus trap in menu | `/impeccable harden` |
| P2 | Auto-open drawer when `matched === 1` | Optional; announce via live region or require Enter | `/impeccable clarify` |
| P2 | Dual `fetchDashboard` (shell counts + page) | Share loader / SWR-style cache | `/impeccable optimize` |
| P3 | Table header `text-transform: uppercase` on Thai th | Prefer sentence case for Thai | `/impeccable typeset` |
| P3 | Nav count pill `#e11d48` outside `--bo-*` | Use danger token | `/impeccable colorize` |
| P3 | Phase 1 eyebrow in sidebar | Drop or move to about | `/impeccable quieter` |

### Emotional journey

- **Peak needed:** “เจอสมาชิก / เคลียร์คิว” — currently delayed by metrics + filter chrome.  
- **Valley:** cryptic errors; keyboard dead-end on rows.  
- **End:** drawer is relatively reassuring (Esc, clear title) — preserve that.

### Questions to consider

- Should `/admin` be a **queue home** (pending work only) with search as secondary, instead of a general CRM list?
- Do “สมาชิกทั้งหมด / สมาชิกสมบูรณ์” earn first-viewport pixels for registrar daily work?
- Should opening a member from search jump straight into the matching review workspace when status is pending?

### Detector summary

```text
detect.mjs --json apps/web/src/admin/pages/DashboardPage.tsx
exit findings: 1 advisory
- design-system-font-size @ DashboardPage.tsx:438 (0.8rem inline)
```

No P0/P1 from detector; human review owns keyboard + queue IA.

### Suggested command sequence

1. `/impeccable audit apps/web/src/admin/pages/DashboardPage.tsx` — keyboard rows, focus rings, live regions  
2. `/impeccable distill` — demote stats; compress status filters  
3. `/impeccable clarify` — Thai errors + page title  
4. `/impeccable layout` — queue-first hierarchy  
5. `/impeccable harden` — SortMenu a11y, reduced-motion on rise animations  
6. `/impeccable polish` — sweep remaining P2/P3  

### Concrete fix backlog (for coding agents)

| ID | Sev | File(s) | Change |
|----|-----|---------|--------|
| D1 | P0 | `DashboardPage.tsx`, `admin.css` | Keyboard-activatable rows (+ focus-visible). Prefer button/link affordance over bare `tr.onClick`. |
| D2 | P1 | `DashboardPage.tsx`, `AdminApp.tsx` | Pending stats → filter or route to `/admin/data` / `/admin/slips`; demote total/active. |
| D3 | P1 | `DashboardPage.tsx`, optionally `admin-api.ts` labels | Progressive disclosure for status filters (queue-first chips). |
| D4 | P1 | `DashboardPage.tsx` | Map `search_failed` / `reload_failed` / API messages to Thai actionable copy. |
| D5 | P1 | `admin.css` | `.bo-btn:focus-visible` (and ghost/danger variants). |
| D6 | P2 | `AdminApp.tsx` | Thai page/nav title; `aria-current="page"` on active `NavBtn`. |
| D7 | P2 | `DashboardPage.tsx` | Remove inline `0.8rem`; use class (fixes detector). |
| D8 | P2 | `DashboardPage.tsx` `SortMenu` | Full listbox keyboard + focus management. |
| D9 | P2 | `admin.css` | `prefers-reduced-motion` disables `.bo-stat` / `.bo-panel` `bo-rise`. |
| D10 | P3 | `admin.css` | Align `.bo-nav-count` with `--bo-danger`; soften Thai table headers. |

### Trend / snapshot

First documented critique for this target in `docs/ui-ux-critique/`.  
Slug: `apps-web-src-admin-pages-dashboardpage-tsx` (for `.impeccable/critique` storage if written).

---

*End of report — Thai summary above; English tables/backlog for fix agents.*
