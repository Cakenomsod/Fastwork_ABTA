---
target: Admin SeminarsPage
total_score: 20
p0_count: 1
p1_count: 3
timestamp: 2026-07-27T14-25-33Z
slug: apps-web-src-admin-pages-seminarspage-tsx
---
# UI/UX Critique: Admin Seminars (Back Office)

> Method: ⚠️ DEGRADED: single-context (nested under Multitask parent; no further sub-agents) · Detector: detect.mjs · Date: 2026-07-27  
> Target: `apps/web/src/admin/pages/SeminarsPage.tsx` + seminar rules in `apps/web/src/admin/admin.css`  
> Score: **20/40** · P0: **1** · P1: **3** · Band: Acceptable

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์

| # | Heuristic | คะแนน | ประเด็นหลัก |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 2 | ไม่มี skeleton ตอนโหลด; ไม่มี toast สำเร็จ; สถานะใบสมัครเป็นอังกฤษดิบ |
| 2 | Match System / Real World | 2 | ฟอร์มสร้างงานภาษาไทยดี แต่ตารางใบสมัครใช้ `seminarId` + status ดิบ |
| 3 | User Control and Freedom | 3 | มียกเลิกฟอร์ม + ConfirmDialog ปิดงาน; แต่ reject ใช้ `window.prompt` |
| 4 | Consistency and Standards | 2 | ปิดงานใช้ ConfirmDialog แต่ปฏิเสธใช้ prompt — ขัดหลัก BO |
| 5 | Error Prevention | 2 | ยืนยันก่อนปิดงานดี; ปฏิเสธไม่มี UI เหตุผลที่ปลอดภัย |
| 6 | Recognition Rather Than Recall | 1 | บังคับจำ/แมป UUID ของงานในตารางใบสมัคร |
| 7 | Flexibility and Efficiency | 1 | `busy` ล็อกทั้งหน้า; ไม่มีกรองคิวรอ / bulk |
| 8 | Aesthetic and Minimalist Design | 3 | บล็อกเลือกกลุ่มผู้เข้าชัด; ตารางใบสมัครยังดูเป็น CRUD ดิบ |
| 9 | Error Recovery | 2 | error ฟอร์มไทยดี; API error อาจเป็น `save_failed` |
| 10 | Help and Documentation | 2 | มี hint ในฟอร์มสร้าง; ไม่มีคำแนะนำคิวอนุมัติใบสมัคร |
| **รวม** | | **20/40** | **Acceptable — ต้องแก้ก่อน staff ใช้จริงเป็นคิวงาน** |

### ความประทับใจรวม

ฟอร์มสร้าง/แก้สัมมนา (โดยเฉพาะตัวเลือกกลุ่มผู้เข้า + ราคา + สรุปสิทธิ์) ออกแบบมาดีและตรงเสียงสมาคม แต่หน้าที่ “งานจริง” ของเจ้าหน้าที่คือ **คิวใบสมัคร** ยังเป็นตาราง CRUD ที่บังคับจำ UUID, แสดงสถานะอังกฤษ, และปฏิเสธด้วย `window.prompt` ซึ่งขัด PRODUCT.md โดยตรง โอกาสใหญ่ที่สุดคือทำให้แผงใบสมัครเป็น queue-first เหมือน Data/Slip Review

### จุดแข็ง

1. **Audience picker** — toggle กลุ่มทั่วไป/สมาชิก, ช่องราคาโผล่เมื่อเลือก, preview `aria-live`, copy ไทยชัด  
2. **ConfirmDialog ปิดงาน** — อธิบายผลกระทบต่อรายการรับสมัคร; danger variant ถูกต้อง  
3. **Empty state สร้างงาน** — บอกให้กด “สร้างงานสัมมนา”; responsive + `prefers-reduced-motion` ใน CSS seminar

### ปัญหาเรียงตามความสำคัญ (P0–P3)

#### [P0] ปฏิเสธใบสมัครใช้ `window.prompt`
- **อะไร**: `decide(..., false)` เรียก `window.prompt("เหตุผลที่ปฏิเสธ")`
- **ทำไมสำคัญ**: ขัด anti-reference ของโปรเจกต์; ไม่มี context, a11y แย่, ยกเลิก/ว่างเงียบ ๆ; การปฏิเสธเป็น high-stakes
- **แก้**: แทนด้วย ConfirmDialog / inline reason field + ปุ่มยืนยัน (แบบเดียวกับ BO อื่น)
- **คำสั่ง**: `/impeccable harden` + `/impeccable clarify`

#### [P1] ตารางใบสมัครโชว์ `seminarId` แทนชื่องาน
- **อะไร**: คอลัมน์ “งาน” เป็น `<code>{r.seminarId}</code>`
- **ทำไมสำคัญ**: บังคับ recall — เจ้าหน้าที่ต้องจำ UUID; ช้าและผิดพลาดง่ายเมื่อมีหลายงาน
- **แก้**: join กับ `seminars` แสดง `title` (+ วันที่); เก็บ id เป็น secondary / tooltip
- **คำสั่ง**: `/impeccable clarify` + `/impeccable layout`

#### [P1] สถานะใบสมัครเป็นอังกฤษดิบ (`pending` / `confirmed` / `rejected`)
- **อะไร**: เรนเดอร์ `r.status` ตรง ๆ ไม่มี badge/label ไทย
- **ทำไมสำคัญ**: ขัดหลัก “สถานะชัดก่อนสวย”; staff ต้องแปลเอง; ไม่มี semantic color
- **แก้**: map เป็นไทย + `.bo-badge` success/warn/danger
- **คำสั่ง**: `/impeccable clarify` + `/impeccable colorize`

#### [P1] ไม่ใช่ queue-first — ไม่กรองคิวรอ, `busy` ล็อกทั้งหน้า
- **อะไร**: แสดงใบสมัครทั้งหมดคละสถานะ; ปุ่มทุกอัน `disabled={busy}` รวมกัน
- **ทำไมสำคัญ**: หลัก BO คือคิวเป็นศูนย์กลาง; staff หาของที่ต้องทำยาก; อนุมัติทีละใบช้า
- **แก้**: default filter “รอพิจารณา”; นับ badge; busy ต่อแถว; (ถ้าเหมาะ) bulk approve
- **คำสั่ง**: `/impeccable distill` + `/impeccable harden`

#### [P2] ไม่มี feedback สำเร็จ / loading เริ่มต้น
- **อะไร**: โหลดครั้งแรกไม่มี skeleton; บันทึกสำเร็จแค่ปิดฟอร์ม
- **แก้**: skeleton หรือ “กำลังโหลด…”; toast/inline success สั้น ๆ
- **คำสั่ง**: `/impeccable polish`

#### [P2] API / fallback error เป็นรหัสอังกฤษ
- **อะไร**: `"save_failed"`, `"deactivate_failed"`, `"decide_failed"`; list fallback เป็น `seminarId`
- **แก้**: ข้อความไทยที่ actionable; list ใช้ “ไม่มีวัน/สถานที่” แทน UUID
- **คำสั่ง**: `/impeccable clarify`

#### [P3] ตารางไม่ใช้ pattern การ์ดบนมือถือ; `<th />` ว่าง; inline style
- **แก้**: `bo-table--cards` หรือ actions label; ย้ายสีไป class
- **คำสั่ง**: `/impeccable adapt`

### ธงแดงตาม Persona

**Alex (Power User / เจ้าหน้าที่ประจำ)**  
- ไม่มี bulk / คีย์ลัด; `busy` ล็อกทั้งหน้าหลังอนุมัติใบเดียว  
- ต้องสแกน UUID ในตาราง — ช้ากว่า Data Review มาก  
- `window.prompt` ตัด flow คีย์บอร์ด

**Sam (Accessibility)**  
- `window.prompt` ไม่ใช่ dialog ที่ควบคุมโฟกัส/ประกาศได้ดี  
- คอลัมน์ actions เป็น `<th />` ว่าง — screen reader ไม่รู้ชื่อคอลัมน์  
- สถานะพึ่งข้อความดิบ ไม่มี `aria` / badge ที่มีชื่อ

**นายทะเบียน ABTA (persona โปรเจกต์)**  
- ต้องการอนุมัติ/ปฏิเสธเร็วและไม่ผิดงาน — ตอนนี้ต้องแมป id กับชื่องานเอง  
- เหตุผลปฏิเสธไม่มี UI ที่บันทึก/ทบทวนชัดก่อนส่ง  
- ภาษาสถานะอังกฤษไม่ตรงเสียง “สุภาพ ตรงไปตรงมา” ของสมาคม

### ข้อสังเกตเล็กน้อย

- ปุ่มยกเลิกซ้ำ (หัวฟอร์ม + ท้ายฟอร์ม) — ใช้ได้ แต่ซ้ำ  
- `openEdit` scroll ไปบนสุดขณะฟอร์มเปิดทับรายการ — OK แต่รายการด้านล่างยังแข่งโฟกัส  
- Detector: ส่วนใหญ่เป็น font-size/radius/color นอก DESIGN.md (advisory) ในบล็อก `.bo-seminar-*` — ไม่ใช่ AI-slop รุนแรง; มี eyebrow เล็กที่ “สรุปสิทธิ์” (uppercase tracked) หนึ่งจุด  
- สี tag “ทั่วไป” (`#8a6540`, `#f3e7d4`) นอก palette — ตั้งใจแยกจากเขียวสมาชิกได้ แต่ควรเป็น token

### คำถามที่ควรคิด

- หน้าที่หลักของหน้านี้คือ “สร้างงาน” หรือ “เคลียร์คิวใบสมัคร”? ถ้าเป็นคิว ทำไมสร้างฟอร์มอยู่บนสุดเสมอ?
- ถ้ามีงานเปิดพร้อมกัน 3+ งาน การโชว์ UUID ยังยอมรับได้หรือไม่?
- ควรแยก “งานที่ปิดแล้ว” ออกจากรายการเปิด หรือ soft-delete แล้วซ่อนทั้งหมด?

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No initial loading UI; no success confirmation; raw English statuses |
| 2 | Match System / Real World | 2 | Create form Thai is strong; registration table speaks IDs/codes |
| 3 | User Control and Freedom | 3 | Form cancel + close ConfirmDialog OK; reject trapped in native prompt |
| 4 | Consistency and Standards | 2 | ConfirmDialog for close vs `window.prompt` for reject |
| 5 | Error Prevention | 2 | Close guarded; reject reason UX unsafe / easy to abandon silently |
| 6 | Recognition Rather Than Recall | 1 | Registration “งาน” column is opaque `seminarId` |
| 7 | Flexibility and Efficiency | 1 | Page-wide `busy`; no pending filter / bulk |
| 8 | Aesthetic and Minimalist Design | 3 | Audience composer is intentional; regs table is bare CRUD |
| 9 | Error Recovery | 2 | Thai field errors good; API fallbacks are English codes |
| 10 | Help and Documentation | 2 | Create hints good; no guidance for approval queue |
| **Total** | | **20/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM assessment**: Not generic SaaS gray-blue. The create/edit composer (audience cards, fee reveal, preview) feels product-specific and on-brand. The failure mode is **strangeness without purpose on the queue surface**: `<code>` IDs, raw statuses, and `window.prompt` — exactly the anti-references PRODUCT.md calls out. One mild uppercase tracked label (“สรุปสิทธิ์”) — not a page-wide eyebrow scaffold.

**Deterministic scan (`detect.mjs`)**: Exit code 2. **191** advisory hits when scanning `SeminarsPage.tsx` + full `admin.css` (mostly global admin.css drift). **~31** hits in the `.bo-seminar-*` block (~lines 2629–3100): `design-system-font-size`, `design-system-radius` (`10px`, `999px`), `design-system-color` (warm public-tag browns `#5b4630` / `#8a6540` / `#f3e7d4`, greens `#d8eee3`, etc.). **No** absolute bans (side-stripe, gradient text, glassmorphism, hero-metric). Treat token drift as P3 documentation/`document` follow-up, not the UX blockers.

**Visual overlays**: Skipped — no reliable browser mutation/injection in this Multitask subagent run (source + detector only).

### Overall Impression

Strong **create/edit** craft; weak **operations queue**. Biggest opportunity: make registrations queue-first (title, Thai status badges, proper reject dialog, pending filter) so staff trust this like Slip/Data Review.

### What's Working

1. Audience + pricing progressive disclosure with live summary (`aria-live="polite"`, `aria-pressed`).
2. Destructive close uses shared `ConfirmDialog` with consequence copy.
3. Empty create CTA, labeled fields, mobile collapse of audience grid, reduced-motion on seminar animations.

### Priority Issues

1. **[P0] Reject via `window.prompt`**  
   - **What**: `decide()` uses native prompt for reject reason.  
   - **Why**: Product bans context-free native confirms; a11y + error-prevention failure on a high-stakes action.  
   - **Fix**: Reason field in `ConfirmDialog` or inline panel; require non-empty reason; Esc/cancel without silent failure confusion.  
   - **Suggested command**: `/impeccable harden`

2. **[P1] Registrations show `seminarId` not title**  
   - **What**: `<code>{r.seminarId}</code>` in “งาน” column.  
   - **Why**: Forces recall across seminars; slows approval and invites wrong-seminar decisions.  
   - **Fix**: Resolve title from `seminars` state; show date as secondary.  
   - **Suggested command**: `/impeccable clarify`

3. **[P1] Raw English registration status**  
   - **What**: `r.status` rendered verbatim.  
   - **Why**: Breaks “สถานะชัดก่อนสวย”; no semantic badge system.  
   - **Fix**: Thai labels + status chips (pending/confirmed/rejected).  
   - **Suggested command**: `/impeccable clarify` + `/impeccable colorize`

4. **[P1] Not queue-first; global `busy`**  
   - **What**: All regs mixed; every button disabled while any request runs.  
   - **Why**: Staff primary job is clearing pending applications; current IA treats create form as equal weight.  
   - **Fix**: Default “รอพิจารณา” filter + counts; per-row busy; optional bulk approve.  
   - **Suggested command**: `/impeccable distill`

5. **[P2] Weak success/loading + English error codes**  
   - **Fix**: Initial loading state; short success feedback; Thai API error strings; never fall back list meta to raw id.  
   - **Suggested command**: `/impeccable polish` + `/impeccable clarify`

### Persona Red Flags

**Alex**: No batch approve; full-page busy lock; UUID scanning; prompt interrupts keyboard flow.  
**Sam**: Native prompt; empty actions `<th>`; status not announced as structured status.  
**นายทะเบียน**: High mis-approve risk when multiple open seminars; reject reason not reviewable in a proper dialog.

### Minor Observations

- Duplicate Cancel in create panel header/footer.
- Inline `style={{ color: "var(--bo-muted)" }}` on empty regs cell.
- Table lacks `bo-table--cards` pattern used elsewhere in admin.
- Public audience warm browns should become `--bo-*` tokens if kept.

### Questions to Consider

- Is the primary job create-seminar or clear-registration-queue?
- Should closed seminars be browsable in an archive tab?
- Does reject need audit-visible reason UI beyond a one-line field?

### Detector Findings (JSON summary)

```json
{
  "exitCode": 2,
  "targets": [
    "apps/web/src/admin/pages/SeminarsPage.tsx",
    "apps/web/src/admin/admin.css"
  ],
  "totalFindings": 191,
  "byAntipattern": {
    "design-system-font-size": 118,
    "design-system-radius": 43,
    "design-system-color": 29,
    "design-system-font": 1
  },
  "seminarBlockApproxFindings": 31,
  "severity": "all advisory",
  "absoluteBans": 0,
  "note": "Most hits are admin.css global drift; seminar block adds warm public-tag colors and dense rem sizes/radii outside DESIGN.md"
}
```

### Concrete fix backlog for next chat

Scoped to `SeminarsPage.tsx` + seminar section of `admin.css` (and shared `ConfirmDialog` if extended):

1. **Replace `window.prompt` reject** with ConfirmDialog (or inline) reason field; block confirm when empty; keep approve one-click or soft-confirm.
2. **Map `seminarId → title`** in registrations table (lookup from `seminars`); show date/location secondary; hide raw id behind title or copy affordance.
3. **Thai status labels + badges** for `pending` / `confirmed` / `rejected` (reuse existing `.bo-badge*` / semantic tokens if present).
4. **Queue defaults**: filter tabs or chips — รอพิจารณา (default) / ทั้งหมด / อนุมัติแล้ว / ปฏิเสธ; show counts in panel head.
5. **Per-row / per-action busy** instead of page-wide `disabled={busy}` on every control.
6. **Initial load state**: skeleton or “กำลังโหลดงานสัมมนา…”; don’t flash empty then populate without cue.
7. **Success feedback**: toast or inline banner after save / approve / reject / close.
8. **Localize error fallbacks**: replace `save_failed` / `deactivate_failed` / `decide_failed` with Thai actionable copy; keep `err.message` when already human.
9. **List meta fallback**: if no date/location, show “ยังไม่ระบุวัน/สถานที่” — never raw `seminarId` as the only subtitle.
10. **Table a11y/adapt**: label actions column (`การดำเนินการ`); consider `bo-table--cards` under 720px; move empty-cell color to CSS class.
11. **Optional P3**: tokenise public-tag browns; align radii to DESIGN.md scale; document intentional rem steps.

**Suggested command sequence**: `/impeccable harden` → `/impeccable clarify` → `/impeccable distill` → `/impeccable colorize` → `/impeccable adapt` → `/impeccable polish`
