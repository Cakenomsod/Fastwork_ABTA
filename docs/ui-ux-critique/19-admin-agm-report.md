# 19 — Admin AGM Report / สิทธิ์ประชุมใหญ่

⚠️ DEGRADED: single-context (nested Multitask subagent; dual-agent A/B spawn blocked)

> **Method:** inline Assessment A (design) + Assessment B (`detect.mjs`)  
> **Target:** `apps/web/src/admin/pages/AgmReportPage.tsx` + `.bo-agm*` in `admin.css`  
> **Route:** `/admin/agm` · Title shell: «สิทธิ์ประชุมใหญ่»  
> **Date:** 2026-07-27 (re-critique after fixes)  
> **Prior score:** 26/40 → **32/40**  
> **Personas:** Alex (power user), Sam (a11y), นายทะเบียน (AGM prep)  
> **detect.mjs:** `[]` (0 findings) · Browser overlay: skipped (auth-gated BO)

| Metric | Value |
|--------|-------|
| **Score** | **32 / 40** (Good) |
| **P0** | **0** |
| **P1** | **2** |
| **P2** | **3** |
| **P3** | **2** |

### Top 3 issues

1. **[P1]** Stats are display-only — cannot click «ใกล้หมดอายุ» to filter  
2. **[P1]** Full roster in DOM / client-only export — large associations risk freeze  
3. **[P2]** No column sort / member drill-in

### Fixes verified this run

| Prior issue | Status |
|-------------|--------|
| Silent pagination cap (`page > 200`) | ✅ Fixed — `truncated` warn + honest totals + CSV blocked; `MAX_PAGES=500` |
| Refresh replaces whole table | ✅ Fixed — `firstLoad` vs `refreshing`; keep `items` on error |
| No print / `@media print` | ✅ Fixed — «พิมพ์ / PDF» + print title + hide sidebar/topbar/tools |
| Export / CSV date polish | ✅ Fixed — export flash; CSV uses `formatDate` (th-TH) |
| Error retry distant | ✅ Fixed — inline «ลองใหม่» on error banner |

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์: 32/40 — Good (ขึ้นจาก 26)

หน้านี้มีจุดประสงค์ชัด: รายชื่อสมาชิกสามัญที่มีสิทธิ์ออกเสียงปีปฏิทินไทย + ส่งออก CSV / พิมพ์ มีเงื่อนไขผู้มีสิทธิ์ อ่านง่าย และตอนนี้ **แจ้งเมื่อโหลดไม่ครบ**, **รีเฟรชไม่ลบตาราง**, และ **พิมพ์/PDF ได้**

คะแนนขึ้นจาก **26 → 32/40** · **P0 = 0** · เหลืองาน triage (คลิกสถิติเพื่อกรอง) และ scale (ตารางทั้งก้อนใน DOM)

### จุดแข็ง

- Lead + รายการเงื่อนไข (`aria-label="เงื่อนไขผู้มีสิทธิ์"`) อธิบายเกณฑ์ได้ทันที  
- Truncation: แบนเนอร์เตือน + ตัวเลข «โหลดแล้ว (อาจไม่ครบ)» + ปิด CSV จนกว่าจะครบ  
- Refresh: ตารางค้าง + แบนเนอร์ progress + soft overlay (`is-refreshing`)  
- พิมพ์: ซ่อน sidebar/เครื่องมือ, แสดงหัวข้อพิมพ์ + เงื่อนไข  
- CSV มี BOM + วันหมดอายุแบบ th-TH + flash ยืนยันจำนวน

### ปัญหาหลัก (จัดลำดับ)

| ระดับ | ปัญหา | ทำไมสำคัญ |
|-------|--------|-----------|
| **P1** | การ์ดสถิติ 4 ใบคลิกไม่ได้ (กรองสถานะไม่ได้) | ก่อนประชุมใหญ่ต้องคัด «ใกล้หมดอายุ» เร็ว — พิมพ์ค้นหาช้าและพลาดง่าย |
| **P1** | โหลดทั้ง roster ลง DOM / export จาก client | สมาคมใหญ่เสี่ยงแท็บค้าง; พิมพ์หลายพันแถวเปราะ |
| **P2** | ไม่มีเรียงคอลัมน์ / ลิงก์ไปรายละเอียดสมาชิก | ตรวจสิทธิ์ทีละคนช้า |
| **P2** | แถบสถิติแบบ hero-metric เท่ากันทั้ง 4 | ลำดับชั้นอ่อน / สะท้อน admin SaaS ทั่วไป |
| **P2** | ส่งออกตอนมีคำค้นหาไม่มี confirm เพิ่ม | อาจส่ง Excel ไม่ครบโดยไม่ตั้งใจ |
| **P3** | Hardcode hex นอก token `--bo-*` | ไม่สอดคล้อง design system |
| **P3** | ชื่อไฟล์ CSV ไม่มี timestamp | ทับไฟล์เก่าง่าย |

### Personas (ย่อ)

- **Alex:** รีเฟรชไม่ลบรายชื่อแล้ว; มีพิมพ์; ยังคลิกสถิติกรองไม่ได้ / ไม่มี sort  
- **Sam:** heading + criteria + live region + retry ติด error — ดี; สถิติอยู่นอก live region  
- **นายทะเบียน:** เชื่อรายชื่อมากขึ้นเมื่อมี truncation warn + พิมพ์ได้; ยังช้าตอนคัด near-expiry

### Cognitive load

Failures ≈ 2 (สถิติแข่งกับรายชื่อ; hierarchy ของ metrics) → moderate

---

## English — Full critique (for fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 4 | Progress, refresh banner, truncation alert, export flash |
| 2 | Match System / Real World | 4 | Thai AGM copy, BE year, th-TH dates in UI+CSV, print roll |
| 3 | User Control and Freedom | 3 | Clear search / retry / print; stats still not filter exits |
| 4 | Consistency and Standards | 3 | BO patterns solid; hardcoded AGM hex + pill tags remain |
| 5 | Error Prevention | 3 | Truncation warned + CSV blocked; filtered export lacks confirm |
| 6 | Recognition Rather Than Recall | 3 | Criteria + badges visible; stats not actionable |
| 7 | Flexibility and Efficiency | 3 | Print+CSV+search; no sort, drill-in, shortcuts, or virtualization |
| 8 | Aesthetic and Minimalist Design | 2 | Four equal hero-metric stats; otherwise focused report |
| 9 | Error Recovery | 4 | Thai alerts, colocated retry, roster kept on refresh failure |
| 10 | Help and Documentation | 3 | Eligibility criteria excellent; little print/export guidance beyond labels |
| **Total** | | **32/40** | **Good** |

### Anti-patterns verdict

**LLM:** Not loud AI slop. Product-appropriate report surface. Remaining tells: **hero-metric stat strip** (4 equal big numbers) and **pill tags**. Criteria dots are fine. Brand gold on accent total is on-token.

**Deterministic scan:** `[]` — 0 rules fired. No overlay (BO auth).

### Overall impression

AGM prep tool is now **trustworthy enough for meeting-day use**: incomplete loads are visible and non-exportable, refresh no longer erases the roster, and print/PDF + CSV confirmation close the paper/Excel loop. Biggest remaining gaps are **triage efficiency** (clickable status filters) and **scale** (full client DOM).

### What's working

1. Eligibility criteria + seasonal lead — staff know *why* names appear.  
2. Truncation honesty: warn, honest totals, block CSV until complete; page progress while fetching.  
3. Refresh keeps table + print stylesheet + export flash with filtered-count wording.

### Priority issues

#### [P1] Stats are display-only
- **What:** Four `bo-stat` cards show counts but do not filter the table.  
- **Why:** Near-expiry triage before April AGM is a primary staff job.  
- **Fix:** Make active / near_expiry / temporary clickable toggles (`aria-pressed`) + clear.  
- **Command:** `/impeccable distill`

#### [P1] Full roster in DOM / no authoritative server export
- **What:** Client loops up to `MAX_PAGES` (25k rows) into one table; print/CSV are client-only.  
- **Why:** Large associations can freeze the BO tab; print of 5k+ rows is fragile.  
- **Fix:** Virtualize tbody (or paginate UI); prefer server-generated CSV/PDF with authoritative `matched`.  
- **Command:** `/impeccable optimize` + `/impeccable harden`

#### [P2] No column sort / member drill-in
- **Fix:** Sort by expiry; row opens existing member drawer/route.  
- **Command:** `/impeccable shape` / harden

#### [P2] Hero-metric strip sameness
- **Fix:** Keep accent total large; demote secondary counts to compact chips.  
- **Command:** `/impeccable quieter` / `/impeccable layout`

#### [P2] Filtered export without confirm
- **Fix:** ConfirmDialog when `searchActive` before download.  
- **Command:** `/impeccable harden`

#### [P3] Token drift / CSV filename timestamp
- Map hex to `--bo-*`; add timestamp to filename.  
- **Command:** `/impeccable polish`

### Persona red flags

**Alex:** Fixed refresh blanking + print exist. Still cannot click «ใกล้หมดอายุ»; no expiry sort; large DOM risk.

**Sam:** Structure strong; retry adjacent; status badges include text. Stat numbers outside polite live region.

**นายทะเบียน:** Can print a roll and trust truncation warnings. Still slow to isolate near-expiry cohort.

### Cognitive load checklist

- [x] Single focus  
- [ ] Chunking (stats + criteria + tools + table compete)  
- [x] Grouping  
- [ ] Visual hierarchy (four equal metrics)  
- [x] One thing at a time  
- [x] Minimal choices  
- [x] Working memory (refresh keeps list — fixed)  
- [x] Progressive disclosure (partial)

**Failures: 2 → moderate**

### Minor observations

- Print still allowed when truncated (warn prints too) — consider disabling or stronger print-header warning.  
- Tag pills may overflow row height.  
- `_props.me` unused — fine if auth gated in shell.

### Questions to consider

- Should the **official** AGM artifact be a server-signed PDF roll, with CSV as secondary?  
- Should «ใกล้หมดอายุ» deep-link into a renewal nudge workflow?  
- Is 25k client rows ever realistic for ABTA?

### Trend

Prior **26/40** → now **32/40** (+6). P0 cleared; prior P1 fix set (truncation / refresh / print) verified.

---

## Concrete fix backlog (English)

| ID | Sev | Task | Files | Suggested command |
|----|-----|------|-------|-------------------|
| F1 | P1 | Clickable status stats → client filter + clear | `AgmReportPage.tsx`, `admin.css` | `distill` |
| F2 | P1 | Virtualize table and/or server CSV/PDF export | `AgmReportPage.tsx` (+ API) | `optimize` / `harden` |
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

Browser visualization: **not run** (Back Office requires staff session).

*End of report 19 — Admin AGM Report (re-critique after fixes)*
