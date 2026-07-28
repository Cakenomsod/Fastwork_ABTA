# 14 — Admin Legacy Import (`/admin/legacy/import`)

> **Method:** ⚠️ DEGRADED: single-context (critique already running as nested subagent under Multitask parent — dual Assessment A/B agents not spawned)  
> **Date:** 2026-07-27 (re-critique after dry-run + ConfirmDialog ship)  
> **Target:** `apps/web/src/admin/pages/LegacyImportPage.tsx` + `ConfirmDialog.tsx` + `admin-api.ts` (`importLegacyXlsx` / `LegacyImportResult`) + `apps/functions/src/legacy/import-xlsx.ts` (`dryRun`) + `admin.css`  
> **Register:** product · high-stakes data import · `--bo-*` green+gold  
> **Design health:** **28 / 40** — Good  
> **Prior:** 21/40 · **Delta:** **+7**  
> **P0:** 0 · **P1:** 2 · **P2:** 4 · **P3:** 2  
> **Detector:** clean (`[]`)  
> **Browser overlay:** skipped (admin auth-gated / no injection in this subagent run)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 28/40 (Good) — ขึ้นจาก 21 (+7)

รอบนี้ปิด **P0 ทั้งสอง** ของงานเสี่ยงสูง: มี **dry-run / ตัวอย่างก่อนเขียน** และ **ConfirmDialog** ก่อน commit พร้อมรายงานแถวที่ข้าม + คำอธิบายผลทับข้อมูลเป็นภาษาไทย หน้านี้รู้สึกปลอดภัยพอสำหรับนำเข้าสมาคมแล้ว แต่ยังขาดแยก created/updated, เทมเพลต Excel, และ progress ระหว่าง batch ยาว

### Delta vs prior (สิ่งที่แก้แล้ว)

| รายการ | Prior | Now |
|--------|-------|-----|
| กดแล้วนำเข้าทันที — ไม่มี confirm | **P0** | ✅ `ConfirmDialog` (danger) + ชื่อไฟล์/ขนาด/ยอดคาดการณ์/ผลทับ |
| ตัวอย่างแถวหลัง commit เท่านั้น | **P0** | ✅ `dryRun: true` → preview panel + sample ก่อนเขียน |
| แถวข้ามเงียบ | **P1** | ✅ `skippedMembers` / `skippedPayments` / `warnings[]` + `SkipReport` |
| Intro พูด collection + merge | **P1** | ✅ ภาษาไทยผลทับค่าเดิม + ขั้นตอน ตรวจสอบ→ยืนยัน→เขียน |
| หลังสำเร็จ CTA หลักยังเป็นนำเข้าซ้ำ | **P2** | ✅ “ไปหน้ารายชื่อ…” เป็น primary; “นำเข้าไฟล์อื่น” แยก |
| `aria-busy` / caption | — | ✅ form `aria-busy`; sample `<caption>` |
| คะแนน / P0 / P1 | 21 · 2 · 3 | **28 · 0 · 2** |

### จุดแข็ง

1. **Preview → confirm → commit** — สอดคล้องหลัก “ยืนยันก่อนทำลาย” และลดคลิกพลาด
2. **รายงานแถวข้าม** — Riley เห็นว่าไฟล์ไม่ครบแม้ UI บอกสำเร็จบางส่วน
3. **Role gate + client validation** — สิทธิ์แอดมิน, ชนิด/ขนาดไฟล์, ERROR_LABEL ไทย
4. **หลังสำเร็จมีทางออกชัด** — ลิงก์ไป `/admin/legacy` เป็นขั้นถัดไปหลัก

### ปัญหาที่เหลือ (สำคัญ)

| ระดับ | ปัญหา |
|-------|--------|
| **P1** | สำเร็จแล้วยังบอกแค่ยอดรวม — ไม่แยกสร้างใหม่ / อัปเดต / ไม่เปลี่ยน; ไม่มี undo |
| **P1** | ไม่มีเทมเพลต Excel / schema help — ยังต้องจำชื่อชีตและคอลัมน์จากนอกระบบ |
| **P2** | สถานะใน sample ยังเป็นอังกฤษดิบ (`Active`…) |
| **P2** | ตอน commit ยาว มีแค่ปุ่ม busy / `aria-busy` — ไม่มี progress ราย batch |
| **P2** | ไม่มี cancel กลางทางตอนเขียน Firestore |
| **P2** | Dropzone ยังไม่มี drag-active state ชัด |

### Top 3 ที่ควรแก้ก่อน

1. คืน `{ created, updated, unchanged }` (หรือเทียบเท่า) ใน API + แสดงใน success
2. ลิงก์ดาวน์โหลดเทมเพลต Excel (ชีต Member / Transaction + คอลัมน์จำเป็น)
3. Progress / live announce ตอน commit หลาย chunk + แปลสถานะใน sample เป็นไทย

### Personas (ย่อ)

- **Alex:** dry-run + confirm ได้แล้ว; ยังอยาก progress %, ไม่มี shortcut, อยากเห็น created vs updated
- **Riley:** silent skip ดีขึ้นมาก; re-import เดิมยัง “สำเร็จ” อีกรอบโดยไม่บอกว่าทับกี่แถว; ไม่มี template → ชีตชื่อผิดยังเกิดได้
- **Sam:** `role="alert"` / `status` / `aria-busy` ดี; busy ยังพึ่งข้อความปุ่ม; file input opacity:0 ต้องพึ่ง focus-within

### Cognitive load

Failures: **1–2 → low–moderate** (ดีขึ้นจาก 3)

- One thing at a time — ส่วนใหญ่ผ่านแล้ว (ตรวจสอบ → ยืนยัน → เขียน)
- Working memory — ยัง fail เล็กน้อย (schema Excel อยู่นอก UI)
- Progressive disclosure — ดีขึ้น (preview แยกจาก commit)

---

## English — Fix-agent brief

### Provenance

`Method: ⚠️ DEGRADED: single-context (nested Multitask critique subagent; A/B not dual-spawned)`

Sources reviewed: `LegacyImportPage.tsx`, `ConfirmDialog.tsx`, `admin-api.ts` (`importLegacyXlsx`, `LegacyImportResult`, warnings), `apps/functions/src/legacy/import-xlsx.ts` (`dryRun` early return + skip telemetry), `admin/handlers.ts` (body `dryRun`), `admin.css` (`.bo-legacy-*`, `.bo-file-drop`).  
CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/LegacyImportPage.tsx apps/web/src/admin/ConfirmDialog.tsx` → `[]`

### Design health score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Preview + success + skip report + `aria-busy`; no %/chunk progress on long commit |
| 2 | Match System / Real World | 3 | Plain-Thai overwrite consequences; sample `status` still raw English |
| 3 | User Control and Freedom | 3 | Clear file / cancel confirm / staged flow; no mid-write cancel; no undo |
| 4 | Consistency and Standards | 4 | Reuses `ConfirmDialog` + `bo-*`; aligns with high-stakes BO pattern |
| 5 | Error Prevention | 3 | Dry-run + confirm before merge; still irreversible; no typed confirm for huge N |
| 6 | Recognition Rather Than Recall | 2 | Must still remember sheet/column layout; no template download |
| 7 | Flexibility and Efficiency | 2 | Dry-run helps; no keyboard accel / last-file re-diff |
| 8 | Aesthetic and Minimalist Design | 3 | Focused single-panel; hierarchy clear |
| 9 | Error Recovery | 3 | Thai errors + skip/warning report; no created/updated split; no undo path |
| 10 | Help and Documentation | 2 | Step bullets good; no schema help or sample workbook |
| **Total** | | **28/40** | **Good** |

### Anti-patterns verdict

**LLM assessment:** Not AI-slop. Restrained Back Office tool surface. Prior failure mode was **safety**; that is largely fixed. Remaining gaps are **ops telemetry** (created vs updated) and **schema scaffolding** (template), not decoration. Absolute bans not present.

**Deterministic scan (`detect.mjs --json`):** `[]` — no antipattern hits.

**Visual overlays:** Not available this run (admin auth-gated).

### Overall impression

This now feels like a **responsible import tool**: parse first, show projected impact, confirm with consequence copy, then write — with skip telemetry when rows fail. Biggest remaining opportunity: tell the registrar **what changed** (create vs overwrite) and give them a **template** so first-time imports don’t fail on sheet names.

### What's working

1. **Two-phase API + UI** — `dryRun: true` returns counts/sample/warnings without `batch.set`; commit path sets `dryRun: false`.
2. **ConfirmDialog** — file name, size, projected counts, overwrite consequence, irreversible warning; danger variant; busy locks cancel.
3. **SkipReport** — skipped member/payment counts + capped warning list with Thai reasons.
4. **Post-success primary path** — “ไปหน้ารายชื่อสมาชิกเก่า”; re-import requires explicit “นำเข้าไฟล์อื่น” / clear.
5. **Client guards** — extension, 8 MB, role gate, Thai `ERROR_LABEL`.

### Priority issues

#### [P1] Success is still totals-only — no created/updated, no recovery story

- **What:** API/UI show `members` / `payments` / `feeMasters` written counts only. Merge upserts do not expose how many docs were new vs overwritten. No undo / export of changed IDs.
- **Why:** Staff cannot answer “ทับ 3 หรือเพิ่ม 300?” after a re-import of the same year file. Product principle wants status clarity.
- **Fix:** Extend result with `{ created, updated, unchanged }` (or pre-read existence in write path); show in success banner; document recovery = restore backup / re-import prior export.
- **Command:** `/impeccable harden` + `/impeccable clarify`

#### [P1] No Excel template / in-UI schema help

- **What:** Intro requires sheets `Member` / `Transaction` but there is no downloadable template or column checklist.
- **Why:** Recognition vs recall still fails for first-time or infrequent importers; `missing_member_sheet` / `no_members_parsed` remain likely support tickets.
- **Fix:** Link “ดาวน์โหลดไฟล์ตัวอย่าง” with required headers; optional collapsed column list under intro.
- **Command:** `/impeccable onboard` / `/impeccable clarify`

#### [P2] Sample status English + commit progress gaps

- **What:** Sample table shows raw `row.status` (Active/…). Long multi-chunk write only flips button to busy.
- **Why:** Inconsistent with Thai BO voice; Alex/Sam get weak feedback on long imports.
- **Fix:** Map status via Thai `LEGACY_STATUS_LABEL` (once localized); indeterminate progress or chunk announce; keep `aria-busy`.
- **Command:** `/impeccable clarify` + `/impeccable harden`

### Persona red flags

**Alex (Power User)**  
- Dry-run/confirm landed — core path is now efficient enough.  
- Still wants created/updated and progress for big workbooks.  
- No keyboard shortcut; re-check button exists (good).

**Riley (Stress Tester)**  
- Silent skips largely closed.  
- Re-import same file still celebrates full success without “N updated / 0 created”.  
- Wrong sheet → Thai error (good). Empty parseable members → `no_members_parsed` (good).  
- Sample capped with expand — better than before; still not a full audit export.

**Sam (Accessibility)**  
- `role="alert"` / `status`, form `aria-busy`, table caption — solid baseline.  
- ConfirmDialog busy prevents cancel (good).  
- File control still full-area opacity:0 — verify focus ring on dropzone chrome.  
- Preview/success regions should remain polite live without stealing focus.

### Minor observations (P2–P3)

| Sev | Item | Fix hint | Command |
|-----|------|----------|---------|
| P2 | No mid-write cancel | Document “อย่าปิดหน้าต่าง”; optional AbortController if feasible | `/impeccable harden` |
| P2 | No drag-active dropzone style | `dragover` class on `.bo-file-drop` | `/impeccable polish` |
| P2 | Denied state has no link back to list | Link to `/admin/legacy` | `/impeccable onboard` |
| P3 | Unknown error fallback is generic Thai (good) — keep mapping new codes | Extend `ERROR_LABEL` when API adds codes | `/impeccable clarify` |
| P3 | Confirm description uses newlines — verify ConfirmDialog renders multiline | Preserve `\n` → `<br>` / white-space | `/impeccable polish` |

### Emotional journey

- **Peak:** Preview “ยังไม่ได้เขียน” + confirm with counts — trust moment. Preserve.  
- **Valley residual:** Long silent commit; success without create/update split.  
- **End:** Primary CTA to legacy list — good close.

### Questions to consider

- Is typed confirm required above N members (e.g. 500+)?
- Should dry-run block “ยืนยันนำเข้า” when skipped ratio exceeds a threshold?
- Who owns the canonical Excel template — ops or engineering?

### Detector summary

```text
detect.mjs --json LegacyImportPage.tsx ConfirmDialog.tsx
findings: []
```

### Suggested command sequence

1. `/impeccable harden` — created/updated counts + commit progress/announce  
2. `/impeccable onboard` / `clarify` — Excel template + Thai sample status  
3. `/impeccable polish` — drag-active, denied-state link, multiline confirm  

### Concrete fix backlog (for coding agents)

| ID | Sev | File(s) | Change |
|----|-----|---------|--------|
| I1 | P1 | `import-xlsx.ts`, handlers, `admin-api.ts`, `LegacyImportPage.tsx` | Return/show created vs updated (and optionally unchanged) per collection |
| I2 | P1 | static asset + `LegacyImportPage.tsx` | Template `.xlsx` download + short column help |
| I3 | P2 | `LegacyImportPage.tsx`, `admin-api.ts` labels | Thai status in sample table |
| I4 | P2 | `LegacyImportPage.tsx` (+ API progress if needed) | Progress / live region during commit chunks |
| I5 | P2 | `admin.css`, page | Drag-active dropzone state |
| I6 | P2 | page | Mid-write guidance copy; denied-state link to list |
| I7 | P3 | `ConfirmDialog` / page | Ensure multiline confirm description renders |

### Trend / snapshot

Re-critique: **21 → 28** (+7). Prior P0s closed.  
Slug: `apps-web-src-admin-pages-legacyimportpage-tsx`

---

*End of report — Thai summary above; English tables/backlog for fix agents.*
