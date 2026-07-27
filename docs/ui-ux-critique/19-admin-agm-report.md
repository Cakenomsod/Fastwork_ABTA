# 19 — Admin AGM Report / สิทธิ์ประชุมใหญ่

⚠️ DEGRADED: single-context (nested Multitask subagent; A/B not dual-agent)  
**Method:** inline Assessment A (design) + Assessment B (`detect.mjs`)  
**Target:** `apps/web/src/admin/pages/AgmReportPage.tsx` + `.bo-agm*` in `admin.css`  
**Route:** `/admin/agm` · Title shell: «สิทธิ์ประชุมใหญ่»  
**Date:** 2026-07-27  
**Personas:** Alex (power user), Sam (a11y)  
**detect.mjs:** `[]` (0 findings) · Browser overlay: skipped (auth-gated BO; no reliable injection session)

| Metric | Value |
|--------|-------|
| **Score** | **26 / 40** (Acceptable) |
| **P0** | **1** |
| **P1** | **3** |
| **P2** | 3 |
| **P3** | 2 |

**Top 3 issues**
1. **[P0]** Silent pagination cap (`page > 200`) can leave `matched` ≠ loaded rows — incomplete AGM roster with wrong totals
2. **[P1]** Refresh/`loading` replaces the whole table with empty copy — list vanishes while data is still in memory
3. **[P1]** No print path / `@media print` — CSV-only export is weak for meeting-day paper workflows

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์: 26/40 — ใช้ได้ แต่ยังไม่พร้อมงานประชุมจริง

หน้านี้มีจุดประสงค์ชัด: รายชื่อสมาชิกสามัญที่มีสิทธิ์ออกเสียงปีปฏิทินไทย + ส่งออก CSV มีเงื่อนไขผู้มีสิทธิ์ อ่านง่าย สถานะ badge มีป้ายภาษาไทย และค้นหา/ล้างค้นหาใช้งานได้ — ทิศทางถูกต้องตามหลัก «สถานะชัดก่อนสวย»

แต่สำหรับงาน **นายทะเบียนเตรียมบัญชีผู้มีสิทธิ์ก่อนประชุมใหญ่** ยังมีช่องโหว่ความน่าเชื่อถือของข้อมูลและการส่งออก/พิมพ์

### จุดแข็ง
- Lead + รายการเงื่อนไข (`aria-label="เงื่อนไขผู้มีสิทธิ์"`) อธิบายเกณฑ์ได้ทันที ไม่ต้องเดา
- ส่งออก CSV มี BOM (`\uFEFF`) — เปิดใน Excel ภาษาไทยได้ดี; ปุ่มบอกจำนวนเมื่อค้นหาคัดกรองอยู่
- Empty / error / ไม่พบคำค้น มีข้อความภาษาไทย actionable; `aria-live="polite"` ที่จำนวนรายการ

### ปัญหาหลัก (จัดลำดับ)

| ระดับ | ปัญหา | ทำไมสำคัญ |
|-------|--------|-----------|
| **P0** | โหลดทีละหน้าแล้วตัดที่ `page > 200` โดยไม่แจ้ง — UI โชว์ `matched` จาก API แต่ตาราง/`filtered` อาจสั้นกว่า | บัญชีผู้มีสิทธิ์ประชุมใหญ่ต้องครบ; ตัวเลขกับรายชื่อไม่ตรง = ความเสี่ยงทางสมาคม |
| **P1** | ตอน `loading` ซ่อนตารางทั้งก้อน แม้ `items` ยังอยู่ | รีเฟรชแล้วรายชื่อหาย — เสียบริบท รู้สึกว่าระบบช้า/พัง |
| **P1** | ไม่มีปุ่มพิมพ์ / `@media print` | งาน AGM มักต้องพิมพ์หรือ PDF สำหรับเช็คชื่อหน้างาน — มีแค่ CSV |
| **P1** | ส่งออกแล้วไม่มี feedback; วันหมดอายุใน CSV เป็นค่าดิบ ขณะที่ตารางจัดรูปแบบ `th-TH` | ส่งออกผิดชุด / เปิดไฟล์แล้วอ่านยาก — ป้องกัน error อ่อน |
| **P2** | การ์ดสถิติ 4 ใบคลิกไม่ได้ (กรองสถานะไม่ได้) | Power user อยากดูเฉพาะใกล้หมดอายุโดยไม่พิมพ์ค้นหา |
| **P2** | ไม่มีลิงก์ไปรายละเอียดสมาชิก / ไม่มีเรียงคอลัมน์ | ตรวจสิทธิ์ทีละคนช้า |
| **P2** | แถบสถิติแบบ hero-metric + pill แท็ก `rounded-full` | ดูเป็น admin SaaS ทั่วไป ห่างจากโทนสมาคมเล็กน้อย |
| **P3** | Hardcode `#fafcfb` / `#e8f0ec` นอก token `--bo-*` | ไม่สอดคล้อง design system |
| **P3** | Error banner ไม่มีปุ่ม «ลองใหม่» ในที่ (มีแค่รีเฟรชมุมบน) | Sam/keyboard ต้องหาปุ่มไกลจากข้อความ error |

### Personas (ย่อ)

- **Alex:** รีเฟรชแล้วตารางหาย; ไม่มีคีย์ลัด/กรองจากสถิติ/sort ตามวันหมดอายุ; ไม่มีพิมพ์
- **Sam:** โครงสร้าง heading จาก shell `h1` + หน้า `h2` ใช้ได้; criteria list มีชื่อ; แต่สถิติไม่ได้อยู่ใน live region, สถานะพึ่งสี+ข้อความ (ข้อความมี — ดี), focus ปุ่มมาตรฐาน BO

### Cognitive load
ล้มเหลว ~3 ข้อ (moderate): hierarchy ของสถิติ vs รายชื่อยังแข่งกัน; ไม่มี progressive disclosure ของเครื่องมือส่งออก/พิมพ์; refresh ทำให้เสียบริบท (working memory)

---

## English — Full critique (for fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Refresh swaps table for “กำลังโหลด…”; multi-page fetch has no progress; export has no confirmation |
| 2 | Match System / Real World | 3 | Thai AGM copy + Buddhist year fit staff; CSV expiry stays raw ISO |
| 3 | User Control and Freedom | 3 | Clear search works; no status filter exit from stats; no print |
| 4 | Consistency and Standards | 3 | BO tokens/patterns mostly; hardcoded AGM surfaces; date format UI≠CSV |
| 5 | Error Prevention | 2 | Silent `page > 200` cap; filtered CSV without post-export confirm |
| 6 | Recognition Rather Than Recall | 3 | Criteria + badges visible; stats not actionable filters |
| 7 | Flexibility and Efficiency | 2 | No sort, no row drill-in, no shortcuts, no print, full-list DOM |
| 8 | Aesthetic and Minimalist Design | 2 | Four identical hero-metric stats; otherwise single-purpose (good) |
| 9 | Error Recovery | 3 | Thai `role="alert"` errors; retry only via distant Refresh |
| 10 | Help and Documentation | 3 | Eligibility criteria are excellent contextual help; no export/print guidance |
| **Total** | | **26/40** | **Acceptable** |

### Anti-patterns verdict

**LLM:** Not loud AI slop. Composition is product-appropriate and queue/report-like. Closest tells: **hero-metric stat strip** (4 big numbers) and **pill tags** (`border-radius: 999px`). Criteria bullets use green dots (fine; not side-stripe cards). Brand green/gold accent on total is on-token.

**Deterministic scan (`detect.mjs --json AgmReportPage.tsx`):** `[]` — 0 rules fired. No overlay evidence (BO auth).

### Overall impression

Clear staff tool for “who can vote at AGM this year,” with honest empty states and a useful CSV path. Biggest gap is **data trust + meeting-day output**: silent fetch truncation, loading that blanks the roster, and CSV-only (no print). Fix those before visual polish.

### What's working
1. Eligibility criteria + seasonal lead copy — staff know *why* names appear.
2. CSV with UTF-8 BOM + filtered-count on primary CTA when search is active.
3. Responsive `bo-table--cards` + labeled empty/error paths.

### Priority issues

#### [P0] Silent pagination ceiling vs displayed totals
- **What:** `load()` loops pages until `pageCount` but `if (page > 200) break` with no UI warning. `matched` comes from API; table uses `items`.
- **Why:** Incomplete AGM voter list while UI claims full `matched` — association-grade failure.
- **Fix:** Remove arbitrary cap or raise with server-side bulk export; if truncated, set `error`/`warning` when `items.length < matched` and disable export until complete; show fetch progress (`หน้า x/y`).
- **Command:** `/impeccable harden AgmReportPage`

#### [P1] Loading state destroys the roster view
- **What:** `{loading ? <div className="bo-empty">…` replaces tbody even when `items.length > 0`.
- **Why:** Refresh feels like data loss; Alex can’t keep scanning.
- **Fix:** Keep table mounted; overlay/skeleton or disable controls + subtle banner “กำลังอัปเดต…”; only full empty loader on first load (`items.length === 0 && loading`).
- **Command:** `/impeccable polish AgmReportPage`

#### [P1] No print / paper workflow
- **What:** Export is CSV only; no `@media print` in `admin.css`, no Print button.
- **Why:** AGM check-in often needs printable name/status/expiry lists.
- **Fix:** Add “พิมพ์ / PDF” using browser print + print stylesheet (hide nav/stats chrome, show criteria + table); optional column subset for badge check-in.
- **Command:** `/impeccable harden` + `/impeccable layout` (print CSS)

#### [P1] Weak export feedback + CSV date inconsistency
- **What:** `onExport` downloads silently; CSV `expiryDate` raw vs table `formatDate` th-TH.
- **Why:** Easy to miss wrong filtered export; Excel dates ugly/ambiguous.
- **Fix:** Toast/inline “ส่งออก N รายแล้ว”; format expiry in CSV like UI (or ISO *and* Thai column); optional confirm when `searchActive`.
- **Command:** `/impeccable clarify AgmReportPage`

#### [P2] Stats are display-only
- Clickable filters for active / near_expiry / temporary (and clear).
- **Command:** `/impeccable distill` or small feature pass

#### [P2] No member drill-in / column sort
- Row → member drawer; sort by expiry for near-expiry triage.
- **Command:** `/impeccable shape` (if scope grows) else harden

#### [P2] Hero-metric strip sameness
- Demote secondary stats or make accent total the only large number; rest as compact chips.
- **Command:** `/impeccable quieter` / `/impeccable layout`

#### [P3] Token drift (`#fafcfb`, `#e8f0ec`)
- Map to `--bo-paper` / mist tokens.
- **Command:** `/impeccable polish`

#### [P3] Error without colocated retry
- Put «ลองใหม่» inside `bo-error`.
- **Command:** `/impeccable harden`

### Persona red flags

**Alex (Power User)**
- Refresh blanks the table → abandons trust in &lt;60s task loop.
- Cannot click “ใกล้หมดอายุ” stat to filter; must invent search terms.
- No keyboard accelerators for export/refresh; no print; no bulk beyond CSV.
- Silent 10k-row DOM render risk if association is large.

**Sam (Accessibility)**
- Shell `h1` + panel `h2` OK; search has visible label.
- Criteria `ul` named — good.
- Stat numbers not in a polite live region (only head-sub count).
- Status badges include text (not color-only) — pass.
- Decorative `li::before` dots are empty CSS — OK for SR.
- Error `role="alert"` good; recovery control not adjacent.
- Prefer reduced-motion: shared `bo-rise` has some reduce rules elsewhere — verify AGM stats still animate under reduce.

**Project — นายทะเบียน (AGM prep)**
- Needs complete roster + printable sheet before April meeting; current CSV-only + truncation risk fails the “เอกสารสอดคล้อง/น่าเชื่อถือ” principle.

### Cognitive load checklist
- [x] Single focus (mostly)
- [ ] Chunking (stats + criteria + tools + table compete)
- [x] Grouping
- [ ] Visual hierarchy (four equal metrics)
- [x] One thing at a time (read vs export OK)
- [x] Minimal choices (≤4 primary actions)
- [ ] Working memory (refresh blanks list)
- [ ] Progressive disclosure (export/print advanced options absent)

**Failures: 4 → high-moderate** (address P0/P1 first).

### Minor observations
- `_props.me` unused — fine if auth gated in shell.
- Filename `agm-ordinary-active-{BE year}.csv` — add date stamp to avoid overwrite confusion.
- Tag pills may overflow row height on many tags — truncate + title.
- `statusCounts` ignores unexpected statuses still shown in table.

### Questions to consider
- Should AGM export be a **server-generated** file (authoritative count) instead of client-stitched pages?
- Is the primary artifact CSV for Excel, or a **signed printable roll** for the meeting secretary?
- Should “ใกล้หมดอายุ” on this list trigger a renewal nudge workflow, or stay report-only?

### Trend
First critique run for this target — no prior trend.

---

## Concrete fix backlog (English)

Ordered for a follow-up chat. Do not expand scope beyond this page unless noted.

| ID | Sev | Task | Files | Suggested command |
|----|-----|------|-------|-------------------|
| F1 | P0 | Detect `items.length !== matched` after load; warn + block export; remove or raise silent `page > 200` cap; show page progress while fetching | `AgmReportPage.tsx` | `harden` |
| F2 | P1 | First-load-only full empty loader; keep table visible on refresh | `AgmReportPage.tsx` | `polish` |
| F3 | P1 | Add Print button + `@media print` rules for `.bo-agm` (hide sidebar/actions, show criteria + table) | `AgmReportPage.tsx`, `admin.css` | `harden` + `layout` |
| F4 | P1 | Post-export toast; format CSV expiry with th-TH (or dual columns); confirm when search filtered | `AgmReportPage.tsx` | `clarify` |
| F5 | P2 | Clickable status stats → client filter + clear | `AgmReportPage.tsx`, `admin.css` | `distill` |
| F6 | P2 | Optional: open member detail from row; sort by expiry | `AgmReportPage.tsx` + drawer hook | `shape` / feature |
| F7 | P2 | Quiet hero metrics — one accent total, compact secondary counts | `admin.css`, markup | `quieter` |
| F8 | P3 | Replace hardcoded AGM hex with `--bo-*` tokens | `admin.css` | `polish` |
| F9 | P3 | Retry button inside error alert | `AgmReportPage.tsx` | `harden` |

**Suggested sequence for next agent:** `harden` (F1,F3,F9) → `polish` (F2,F8) → `clarify` (F4) → `quieter`/`layout` (F7) → re-`critique`.

---

## Detector snapshot

```json
{
  "target": "apps/web/src/admin/pages/AgmReportPage.tsx",
  "findings": [],
  "exitCode": 0
}
```

Browser visualization: **not run** (Back Office requires staff session; no mutable tab available in this subagent pass).
