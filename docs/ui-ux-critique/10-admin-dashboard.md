# 10 — Admin Dashboard (`/admin`)

> **Method:** ⚠️ DEGRADED: single-context (critique running as nested Multitask subagent — dual Assessment A/B agents not spawned)  
> **Date:** 2026-07-27 (re-critique after fixes)  
> **Target:** `apps/web/src/admin/pages/DashboardPage.tsx` (+ `clickableRow.ts`, `admin.css`, shell `AdminApp.tsx`)  
> **Register:** product · queue-first BO · `--bo-*` green+gold  
> **Design health:** **26 / 40** — Acceptable  
> **Prior:** 24/40 → **26/40** (**+2**)  
> **P0:** 0 · **P1:** 2 · **P2:** 6 · **P3:** 3  
> **Detector:** 1 advisory (`design-system-font-size` @ inline `0.8rem`)  
> **Browser overlay:** skipped (auth-gated `/admin`; no reliable public preview in this subagent run)

---

## Delta since prior critique (24/40)

| Fix claimed | Verified in code | Impact |
|-------------|------------------|--------|
| Keyboard-activatable table rows | ✅ `clickableRowProps` — `role="button"`, `tabIndex={0}`, Enter/Space, `aria-label`; row `:focus-visible` in `admin.css` | **P0 closed** · H7 +1 |
| Thai actionable errors | ✅ `ERROR_LABEL` map (`search_failed` / `reload_failed` / `detail_failed` / auth codes) | **P1 closed** · H9 +1 |
| `.bo-btn:focus-visible` | ✅ green ring + danger variant in `admin.css` | **P1 closed** · H4 +1 |

**Still open (were P1):** hero-metric stats not queue actions · 8-way status filter wall.

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 26/40 (Acceptable) · เดิม 24 → 26 (+2)

หน้า Dashboard หลังแก้รอบนี้ **ปิดช่องว่าง a11y หลักของงาน “หาสมาชิกแล้วเปิดรายละเอียด”**: แถวตารางโฟกัสได้ กด Enter/Space เปิดได้ มีวง focus ชัด และ error เป็นภาษาไทยที่บอกขั้นถัดไปได้ — Sam ทำคีย์บอร์ดได้แล้ว แต่ยังไม่ “คิวเป็นศูนย์กลาง”: สี่การ์ดตัวเลขใหญ่ด้านบนยังดึงสายตา และตัวกรองสถานะ 8 ตัวเลือกยังหนาเกิน working memory

### จุดแข็ง

1. **คีย์บอร์ดแถวตารางใช้ได้แล้ว** — `clickableRow.ts` + `:focus-visible` บนแถวและปุ่มหลัก สอดคล้องเป้าหมาย WCAG AA ของ BO
2. **Error ไทย actionable** — ไม่โชว์ `search_failed` ดิบ; มีคำแนะนำ “ลองใหม่ / ลดเงื่อนไข / รีเฟรช”
3. **แบรนด์ BO + ตัวกรองพื้นฐานยังดี** — เขียว+ทอง, badge สถานะไทย, ล้างตัวกรอง, empty state มีทางออก, drawer มี Escape

### ปัญหาสำคัญ (สั้นๆ)

| ระดับ | ปัญหา |
|-------|--------|
| **P0** | — ไม่มี (แถวคีย์บอร์ดแก้แล้ว) |
| **P1** | การ์ดสถิติ 4 ใบแบบ hero-metric ไม่ลิงก์ไปคิว/ตัวกรอง — ขัดหลัก “คิวเป็นศูนย์กลาง” |
| **P1** | ตัวกรองสถานะ 8 ตัวเลือกพร้อมกัน — เกิน working memory ของนายทะเบียนที่รีบ |

### Top 3 ที่เหลือ

1. แปลงสถิติรอตรวจให้เป็นทางลัดคิว (คลิกแล้วกรอง / ไป `/admin/data` · `/admin/slips`) และลดน้ำหนัก “สมาชิกทั้งหมด / สมบูรณ์”
2. ย่อหรือจัดกลุ่มตัวกรองสถานะ (คิวก่อน — รอตรวจข้อมูล/สลิป; ที่เหลือซ่อนใน “เพิ่มเติม”)
3. เติมคีย์บอร์ด SortMenu (ลูกศรใน listbox) + เปลี่ยนชื่อหน้า `Dashboard` เป็นไทย

### Personas (สรุป)

- **Alex (power):** คีย์บอร์ดแถวได้แล้ว แต่ยังไม่มี shortcut ค้นหา/`j`–`k`; stats ยังกินพื้นที่โดยไม่เร่งคิว
- **Sam (a11y):** แถวเปิดได้แล้ว; SortMenu ยังไม่ครบลูกศร; `role="button"` บน `<tr>` + `aria-selected` ยังไม่ใช่ pattern ที่สมบูรณ์; rise animation ของ stat/panel ยังไม่ชัด under reduced-motion
- **นายทะเบียน:** อยากเห็นคิวรอตรวจเป็นทางลัด — ตอนนี้ยังเจอตัวเลขใหญ่ก่อนรายการงาน

---

## English — Fix-agent brief

### Provenance

`Method: ⚠️ DEGRADED: single-context (nested Multitask critique subagent; A/B not dual-spawned)`

Sources reviewed: `DashboardPage.tsx`, `clickableRow.ts`, `admin.css` (stats/table/filters/focus/motion), `AdminApp.tsx` (shell/nav/title).  
CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/DashboardPage.tsx apps/web/src/admin/clickableRow.ts`

### Design health score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Loading / searching / selected row OK; no live region for result-count changes |
| 2 | Match system / real world | 3 | Thai domain + Thai errors; page/nav title still English “Dashboard” |
| 3 | User control & freedom | 3 | Clear filters + Esc drawer; auto-open on single search hit can surprise |
| 4 | Consistency & standards | 3 | Focus rings aligned on btn/row/seg; Search Submit vs instant filter apply still split |
| 5 | Error prevention | 2 | Dense 8-way status seg; auto-open drawer on 1 match |
| 6 | Recognition over recall | 3 | Filters/badges visible; composite badge logic still hard to parse |
| 7 | Flexibility & efficiency | 3 | Rows keyboard-OK; no queue deep-links from stats; no `/` or row `j/k` shortcuts |
| 8 | Aesthetic & minimalist | 2 | Hero-metric 4-stat grid (absolute ban / SaaS reflex); competes with queue |
| 9 | Error recovery | 3 | Mapped Thai errors + empty next-steps; unknown `err.message` may still leak EN |
| 10 | Help and documentation | 1 | No help for “สิทธิ์ประชุมใหญ่ (สามัญ)” / T filters beyond labels |
| **Total** | | **26/40** | **Acceptable** |

### Anti-patterns verdict

**LLM assessment:** Not generic gray-blue SaaS — green+gold identity holds. Keyboard + focus pass removes the worst “broken tool” feel for Sam. Still fails product-register “earned familiarity” on first viewport: **hero-metric stat strip** (big number + small label ×4) and a filter wall that reads template-admin rather than queue-ops. Active nav gold inset is intentional per DESIGN.md (sidebar only).

**Deterministic scan:** 1 finding, severity `advisory`:

| Rule | File | Line | Notes |
|------|------|------|-------|
| `design-system-font-size` | `DashboardPage.tsx` | ~452 | Inline `fontSize: "0.8rem"` off DESIGN.md type ramp (list meta) |

False positives: none material. Detector does **not** catch hero-metric or filter IA — those are review-only.

**Visual overlays:** Not injected this run (auth-gated admin).

### Cognitive load

Checklist failures (5 → **high**, improved from 6):

- [x] Single focus — FAIL (stats + search + segs + table)
- [x] Chunking — FAIL (8 status options)
- [ ] Grouping — OK (panels)
- [x] Visual hierarchy — FAIL (stats equal weight to work list)
- [x] One thing at a time — FAIL
- [x] Minimal choices — FAIL (8 status + 3 receipt + 6 sort visible)
- [ ] Working memory — OK-ish for primary open path now (keyboard + labels)
- [x] Progressive disclosure — FAIL (all filters always expanded)

Decision points >4 options: status radiogroup (8), sort listbox (6).

### Overall impression

A11y of the primary open path is now credible; the page still **opens like a metrics dashboard** instead of a **queue console**. Biggest remaining opportunity: make “รอตรวจข้อมูล / รอตรวจสลิป” the primary, actionable path and demote vanity totals.

### What's working

1. **Keyboard rows + focus system** — shared `clickableRowProps`, row/button `:focus-visible`, Thai `aria-label` including name + memberId.
2. **Thai error map** — staff can recover without decoding snake_case.
3. Association tokens, filter primitives, empty states, drawer Escape — preserve these.

### Priority issues

#### [P1] Hero-metric stats are not queue actions

- **What:** Four `.bo-stat` cards (`totalMembers`, `pendingDataReviews`, `pendingSlipReviews`, `activeMembers`) — classic big-num/small-label grid; not interactive; duplicate nav badge counts mentally.
- **Why:** Product principle is queue-first. นายทะเบียน needs pending queues, not vanity “สมาชิกทั้งหมด” at equal weight. Absolute ban: hero-metric template.
- **Fix:** Make pending stats buttons that set status filter (`pending_data` / `pending_slip`) or `navigate` to `/admin/data` / `/admin/slips`; demote total/active to muted secondary or remove from first viewport.
- **Command:** `/impeccable distill` + `/impeccable layout` on dashboard header.

#### [P1] Status filter wall (8 options)

- **What:** `MEMBER_STATUS_FILTER_OPTIONS` renders all chips at once (ทั้งหมด + 7 statuses).
- **Why:** >4 visible choices at one decision point → mis-taps under time pressure; cognitive overload for registrar.
- **Fix:** Split “งานคิว” (รอตรวจข้อมูล / รอตรวจสลิป) as primary toggles; park the rest under “เพิ่มเติม” disclosure or a compact select; keep defaults queue-oriented.
- **Command:** `/impeccable distill` (filters) / `/impeccable shape` if IA rethink.

### Persona red flags

**Alex (Power User)**  
- Rows are keyboard-activatable now — good.  
- Still no `/` to focus search; no `j/k` between rows.  
- Search Submit vs instant filter apply feels inconsistent.  
- Stats burn vertical space without accelerating queue work.

**Sam (Accessibility)**  
- **Prior P0 closed:** can open member rows by keyboard with visible focus.  
- SortMenu: Escape + open keys OK; missing ArrowUp/Down/Home/End among options, no `aria-activedescendant`.  
- `role="button"` on `<tr>` + `aria-selected` is a pragmatic patch — prefer button/link in first cell or grid pattern long-term.  
- `bo-rise` on `.bo-stat` / `.bo-panel` not clearly killed under `prefers-reduced-motion` (other regions have partial coverage).  
- Nav active via class only — missing `aria-current="page"` on `NavBtn`.

**นายทะเบียน / เจ้าหน้าที่ (project)**  
- First viewport still does not answer “คิวค้างเท่าไรที่ฉันต้องทำตอนนี้” as an **actionable** queue.  
- Title “Dashboard” breaks Thai ops voice.

### Minor observations (P2–P3)

| Sev | Item | Fix hint | Command |
|-----|------|----------|---------|
| P2 | EN title `Dashboard` in `titleMap` / nav / loading copy | Rename to `ภาพรวมสมาชิก` or `ค้นหาสมาชิก` | `/impeccable clarify` |
| P2 | Inline `style={{ fontSize: "0.8rem" }}` on list meta (detector hit) | Move to CSS class / token | `/impeccable typeset` |
| P2 | SortMenu listbox incomplete keyboard pattern | Arrow keys + focus management in menu | `/impeccable harden` |
| P2 | Auto-open drawer when `matched === 1` | Optional; announce via live region or require Enter | `/impeccable clarify` |
| P2 | Dual `fetchDashboard` (shell counts + page) | Share loader / SWR-style cache | `/impeccable optimize` |
| P2 | `bo-rise` on `.bo-stat` / `.bo-panel` ignores reduced-motion | Kill animation under `prefers-reduced-motion` | `/impeccable harden` |
| P3 | Table header `text-transform: uppercase` on Thai th | Prefer sentence case for Thai | `/impeccable typeset` |
| P3 | Nav count pill `#e11d48` outside `--bo-*` | Use danger token | `/impeccable colorize` |
| P3 | Phase 1 eyebrow in sidebar | Drop or move to about | `/impeccable quieter` |

### Emotional journey

- **Peak needed:** “เจอสมาชิก / เคลียร์คิว” — keyboard path no longer a valley; metrics chrome still delays the peak.  
- **Valley:** filter overload; vanity stats before work.  
- **End:** drawer remains relatively reassuring (Esc, clear title) — preserve that. Errors no longer dump users into English codes.

### Questions to consider

- Should `/admin` be a **queue home** (pending work only) with search as secondary, instead of a general CRM list?
- Do “สมาชิกทั้งหมด / สมาชิกสมบูรณ์” earn first-viewport pixels for registrar daily work?
- Prefer pending stats → set filter on this page, or deep-link to dedicated Data/Slip review workspaces?

### Detector summary

```text
detect.mjs --json apps/web/src/admin/pages/DashboardPage.tsx apps/web/src/admin/clickableRow.ts
exit findings: 1 advisory
- design-system-font-size @ DashboardPage.tsx:452 (0.8rem inline)
```

No P0/P1 from detector; human review owns queue IA + filter density.

### Suggested command sequence

1. `/impeccable distill` — demote stats; compress status filters  
2. `/impeccable layout` — queue-first hierarchy  
3. `/impeccable clarify` — Thai page/nav title; optional live region on result count  
4. `/impeccable harden` — SortMenu a11y, reduced-motion on rise animations  
5. `/impeccable polish` — sweep remaining P2/P3  

### Concrete fix backlog (for coding agents)

| ID | Sev | File(s) | Change | Status |
|----|-----|---------|--------|--------|
| D1 | P0 | `DashboardPage.tsx`, `clickableRow.ts`, `admin.css` | Keyboard-activatable rows (+ focus-visible) | ✅ Done |
| D4 | P1 | `DashboardPage.tsx` | Map API errors to Thai actionable copy | ✅ Done |
| D5 | P1 | `admin.css` | `.bo-btn:focus-visible` (+ danger) | ✅ Done |
| D2 | P1 | `DashboardPage.tsx`, `AdminApp.tsx` | Pending stats → filter or route to `/admin/data` / `/admin/slips`; demote total/active | Open |
| D3 | P1 | `DashboardPage.tsx`, optionally `admin-api.ts` labels | Progressive disclosure for status filters (queue-first chips) | Open |
| D6 | P2 | `AdminApp.tsx` | Thai page/nav title; `aria-current="page"` on active `NavBtn` | Open |
| D7 | P2 | `DashboardPage.tsx` | Remove inline `0.8rem`; use class (fixes detector) | Open |
| D8 | P2 | `DashboardPage.tsx` `SortMenu` | Full listbox keyboard + focus management | Open |
| D9 | P2 | `admin.css` | `prefers-reduced-motion` disables `.bo-stat` / `.bo-panel` `bo-rise` | Open |
| D10 | P3 | `admin.css` | Align `.bo-nav-count` with `--bo-danger`; soften Thai table headers | Open |

### Trend / snapshot

Re-critique after keyboard / Thai errors / focus-visible fixes.  
Slug: `apps-web-src-admin-pages-dashboardpage-tsx`  
Score trend: **24 → 26**

---

*End of report — Thai summary above; English tables/backlog for fix agents.*
