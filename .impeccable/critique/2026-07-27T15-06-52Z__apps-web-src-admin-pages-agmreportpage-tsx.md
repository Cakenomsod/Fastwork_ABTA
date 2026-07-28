---
target: AgmReportPage after fixes
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-07-27T15-06-52Z
slug: apps-web-src-admin-pages-agmreportpage-tsx
---
# 19 — Admin AGM Report / สิทธิ์ประชุมใหญ่

⚠️ DEGRADED: single-context (nested Multitask subagent; A/B not dual-agent)  
**Method:** inline Assessment A (design) + Assessment B (`detect.mjs`)  
**Target:** `apps/web/src/admin/pages/AgmReportPage.tsx` + `.bo-agm*` in `admin.css`  
**Route:** `/admin/agm` · Title shell: «สิทธิ์ประชุมใหญ่»  
**Date:** 2026-07-27 (re-critique after fixes)  
**Prior:** 26/40 · Δ **+5**  
**Personas:** Alex (power user), Sam (a11y), นายทะเบียน (AGM prep)  
**detect.mjs:** `[]` (0 findings) · Browser overlay: skipped (auth-gated BO; no reliable injection session)

| Metric | Value |
|--------|-------|
| **Score** | **31 / 40** (Good) |
| **P0** | **0** |
| **P1** | **2** |
| **P2** | 3 |
| **P3** | 2 |

**Top 3 remaining**
1. **[P1]** สถิติ 4 ใบคลิกไม่ได้ — กรองสถานะ (ใกล้หมดอายุ / ชั่วคราว) ต้องพิมพ์ค้นหาเอง
2. **[P1]** โหลดทั้ง roster ลง DOM (สูงสุด ~25k) ไม่มี virtualization / server export — เสี่ยงค้างตอนสมาคมใหญ่
3. **[P2]** แถบสถิติแบบ hero-metric + pill แท็ก `rounded-full` — ยังดู SaaS admin ทั่วไป

### Fix verification (prior backlog)

| Prior | Issue | Status |
|-------|--------|--------|
| P0 | Silent pagination cap | **Fixed** — `truncated` warn + block CSV; progress `หน้า x/y`; `MAX_PAGES=500` |
| P1 | Refresh blanks table | **Fixed** — keep roster + refresh banner / `is-refreshing` |
| P1 | No print/PDF | **Fixed** — «พิมพ์ / PDF» + `@media print` |
| P1 | Weak CSV feedback / raw dates | **Fixed** — flash `role="status"`; CSV uses `formatDate` th-TH |
| P3 | Error without colocated retry | **Fixed** — «ลองใหม่» in `bo-error` |

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์: 31/40 — Good (พร้อมใช้งานประชุมได้หลังตรวจ P1 ที่เหลือ)

หน้านี้ทำหน้าที่ชัด: บัญชีสมาชิกสามัญที่มีสิทธิ์ออกเสียงปีปฏิทินไทย + ส่งออก/พิมพ์สำหรับเตรียมประชุมใหญ่  
หลังแก้รอบนี้ **ข้อมูลน่าเชื่อถือขึ้นมาก** — ไม่เงียบเมื่อโหลดไม่ครบ, รีเฟรชแล้วรายชื่อไม่หาย, มีพิมพ์/PDF และยืนยันหลังส่งออก CSV

### จุดแข็ง
- เงื่อนไขผู้มีสิทธิ์ (`aria-label`) + lead ตามฤดูกาล (มี.ค.–เม.ย.) อ่านแล้วรู้ทันทีว่าทำไมชื่อขึ้น
- Truncation: แจ้ง `โหลดได้ N จาก M` · ปิด CSV · ไม่โชว์ `matched` เป็นยอดครบเมื่อไม่ครบ
- Refresh เก็บตาราง + แบนเนอร์ progress; error มี «ลองใหม่» คู่ข้อความ
- พิมพ์ซ่อน sidebar/actions โชว์หัวข้อ + criteria; CSV มี BOM + วันที่ th-TH + flash จำนวนรายการ

### ปัญหาหลักที่เหลือ

| ระดับ | ปัญหา | ทำไมสำคัญ |
|-------|--------|-----------|
| **P1** | การ์ดสถิติคลิกไม่ได้ (กรองสถานะไม่ได้) | นายทะเบียนอยากดูเฉพาะใกล้หมดอายุก่อนประชุมโดยไม่พิมพ์ค้นหา |
| **P1** | Client ดึงทั้งรายชื่อลง DOM (เพดาน 25k) | สมาคมใหญ่ → เบราว์เซอร์ช้า/ค้างตอนเตรียม AGM; ยังไม่มี server PDF/CSV ทางการ |
| **P2** | ไม่มีเรียงคอลัมน์ / ลิงก์ไปรายละเอียดสมาชิก | ตรวจสิทธิ์ทีละคนช้า |
| **P2** | แถบสถิติ hero-metric 4 ใบเท่ากัน + pill แท็ก | โทน SaaS ทั่วไป ห่างสมาคมเล็กน้อย |
| **P2** | ส่งออกตอนค้นหาคัดกรอง — มี flash แต่ไม่มี confirm | ยังเสี่ยงส่งออกชุดผิดถ้าไม่ได้อ่าน flash |
| **P3** | Hardcode `#fafcfb` / `#e8f0ec` นอก `--bo-*` | ไม่สอดคล้อง design system |
| **P3** | ชื่อไฟล์ CSV ไม่มีวันเวลา | เขียนทับไฟล์เก่าได้ง่าย |

### Personas (ย่อ)

- **Alex:** พิมพ์/CSV/รีเฟรชดีขึ้นมาก; ยังอยากคลิกสถิติ + sort วันหมดอายุ + คีย์ลัด
- **Sam:** heading/search/criteria/live progress ดี; retry คู่ error; สถิติยังไม่อยู่ใน live region
- **นายทะเบียน:** บัญชีครบ+พิมพ์ได้แล้ว — เหลือกรองใกล้หมดอายุและประสิทธิภาพเมื่อรายชื่อยาว

### Cognitive load
ล้มเหลว ~2 ข้อ (moderate→ต่ำ): hierarchy สถิติยังแข่งกับรายชื่อ; ไม่มี progressive disclosure ของตัวกรองขั้นสูง — **working memory จาก refresh หายแล้ว**

---

## English — Full critique (for fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Progress + refresh banner + export flash + truncation alert; no “last updated” stamp |
| 2 | Match System / Real World | 4 | Thai AGM copy, BE year, th-TH dates in UI+CSV, print roll for meeting day |
| 3 | User Control and Freedom | 3 | Clear search / retry / print; stats still not filter exits |
| 4 | Consistency and Standards | 3 | BO patterns solid; hardcoded AGM hex + pill tags remain |
| 5 | Error Prevention | 3 | Truncation warned + CSV blocked; filtered export lacks confirm |
| 6 | Recognition Rather Than Recall | 3 | Criteria + badges visible; stats not actionable |
| 7 | Flexibility and Efficiency | 3 | Print+CSV+search; no sort, drill-in, shortcuts, or virtualization |
| 8 | Aesthetic and Minimalist Design | 2 | Four equal hero-metric stats; otherwise focused report |
| 9 | Error Recovery | 4 | Thai alerts, colocated retry, roster kept on refresh failure |
| 10 | Help and Documentation | 3 | Eligibility criteria excellent; little print/export guidance beyond labels |
| **Total** | | **31/40** | **Good** |

### Anti-patterns verdict

**LLM:** Not loud AI slop. Product-appropriate report surface. Remaining tells: **hero-metric stat strip** (4 equal big numbers) and **pill tags** (`border-radius: 999px`). Criteria dots are fine (not side-stripe cards). Brand gold on accent total is on-token.

**Deterministic scan (`detect.mjs --json AgmReportPage.tsx`):** `[]` — 0 rules fired. No overlay (BO auth).

### Overall impression

AGM prep tool is now **trustworthy enough for meeting-day use**: incomplete loads are visible and non-exportable, refresh no longer erases the roster, and print/PDF + CSV confirmation close the paper/Excel loop. Biggest remaining gaps are **triage efficiency** (clickable status filters / sort) and **scale** (full client DOM).

### What's working
1. Eligibility criteria + seasonal lead — staff know *why* names appear.
2. Truncation honesty: warn, honest totals, block CSV until complete; page progress while fetching.
3. Refresh keeps table + print stylesheet + export flash with filtered-count wording.

### Priority issues

#### [P1] Stats are display-only
- **What:** Four `bo-stat` cards show counts but do not filter the table.
- **Why:** Near-expiry triage before April AGM is a primary staff job; forcing free-text search is slow and error-prone.
- **Fix:** Make active / near_expiry / temporary clickable toggles (aria-pressed) + clear; sync head-sub count.
- **Command:** `/impeccable distill AgmReportPage` (or small feature pass)

#### [P1] Full roster in DOM / no authoritative server export
- **What:** Client loops up to `MAX_PAGES` (25k rows) into one table; print/CSV are client-only.
- **Why:** Large associations can freeze the BO tab during crunch week; print of 5k+ rows is fragile.
- **Fix:** Virtualize tbody (or paginate UI after load); prefer server-generated CSV/PDF with authoritative `matched` count for official rolls.
- **Command:** `/impeccable optimize` + `/impeccable harden` (server export if in scope)

#### [P2] No column sort / member drill-in
- **What:** Fixed `member_asc`; rows are not links to member detail.
- **Why:** Verifying one borderline member requires leaving context or inventing search.
- **Fix:** Sort by expiry; row opens existing member drawer/route.
- **Command:** `/impeccable shape` if scope grows else harden

#### [P2] Hero-metric strip sameness
- **What:** Four identical large numbers compete with the roster.
- **Why:** Visual noise; AI/SaaS reflex; weak hierarchy.
- **Fix:** Keep accent total large; demote secondary counts to compact chips.
- **Command:** `/impeccable quieter` / `/impeccable layout`

#### [P2] Filtered export without confirm
- **What:** Flash says “ตามการค้นหา” but no confirm step.
- **Why:** Easy to miss and ship a partial Excel to the secretary.
- **Fix:** ConfirmDialog when `searchActive` before download.
- **Command:** `/impeccable harden`

#### [P3] Token drift (`#fafcfb`, `#e8f0ec`)
- Map to `--bo-paper` / mist tokens.
- **Command:** `/impeccable polish`

#### [P3] CSV filename lacks timestamp
- `agm-ordinary-active-{BE}-{yyyyMMdd-HHmm}.csv` to avoid overwrite confusion.
- **Command:** `/impeccable polish`

### Persona red flags

**Alex (Power User)**
- Fixed: refresh no longer blanks the list; print exists; export confirms.
- Still: cannot click “ใกล้หมดอายุ”; no expiry sort; no keyboard accelerators; large DOM risk.

**Sam (Accessibility)**
- Shell `h1` + panel `h2` OK; search labeled; criteria named; refresh `aria-live`; error retry adjacent — strong.
- Stat numbers still outside a polite live region (only head-sub + banners).
- Status badges include text — pass.
- `prefers-reduced-motion` softens refresh overlay — good.

**Project — นายทะเบียน (AGM prep)**
- Can now print a roll and trust truncation warnings — aligns with “เอกสารน่าเชื่อถือ.”
- Still slow to isolate near-expiry cohort and to handle very large membership sets.

### Cognitive load checklist
- [x] Single focus
- [ ] Chunking (stats + criteria + tools + table still compete)
- [x] Grouping
- [ ] Visual hierarchy (four equal metrics)
- [x] One thing at a time
- [x] Minimal choices (≤4 primary actions: refresh, print, CSV, search)
- [x] Working memory (refresh keeps list — fixed)
- [x] Progressive disclosure (export/print present; advanced filters still absent → partial)

**Failures: 2 → moderate** (address remaining P1s).

### Minor observations
- `_props.me` unused — fine if auth gated in shell.
- Print still allowed when truncated (warn prints too) — intentional for partial drafts; consider disabling print with same title as CSV or stronger print-header warning.
- Tag pills may overflow row height — truncate + `title`.
- `statusCounts` ignores unexpected statuses still shown in table.

### Questions to consider
- Should the **official** AGM artifact be a server-signed PDF roll, with CSV as secondary?
- Should “ใกล้หมดอายุ” on this page deep-link into a renewal nudge workflow?
- Is 25k client rows ever realistic for ABTA, or is server pagination UI enough?

### Trend
Prior **26/40** → now **31/40** (+5). P0 cleared; prior P1 fix set verified.

---

## Concrete fix backlog (English)

Ordered for a follow-up chat. Stay on this page unless noted.

| ID | Sev | Task | Files | Suggested command |
|----|-----|------|-------|-------------------|
| F1 | P1 | Clickable status stats → client filter + clear (`aria-pressed`) | `AgmReportPage.tsx`, `admin.css` | `distill` |
| F2 | P1 | Virtualize table and/or server CSV/PDF export with authoritative count | `AgmReportPage.tsx` (+ API if needed) | `optimize` / `harden` |
| F3 | P2 | Sort by expiry; optional row → member detail | `AgmReportPage.tsx` | `shape` / feature |
| F4 | P2 | Quiet hero metrics — one accent total, compact secondary | `admin.css`, markup | `quieter` |
| F5 | P2 | ConfirmDialog when exporting with active search | `AgmReportPage.tsx` | `harden` |
| F6 | P3 | Replace hardcoded AGM hex with `--bo-*` | `admin.css` | `polish` |
| F7 | P3 | Timestamp CSV filename | `AgmReportPage.tsx` | `polish` |

**Suggested sequence:** `distill` (F1) → `optimize`/`harden` (F2, F5) → `quieter` (F4) → `polish` (F6, F7) → re-`critique`.

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
