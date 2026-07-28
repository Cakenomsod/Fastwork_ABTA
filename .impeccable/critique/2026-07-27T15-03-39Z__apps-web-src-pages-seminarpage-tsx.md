---
target: /seminar SeminarPage
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-07-27T15-03-39Z
slug: apps-web-src-pages-seminarpage-tsx
---
# 06 — Seminar (`/seminar`) — re-critique after fixes

⚠️ **DEGRADED: single-context** (nested Multitask subagent — dual Assessment A/B spawn blocked by harness; design review + `detect.mjs` ran inline)

**Method:** single-context · **Target:** `apps/web/src/pages/SeminarPage.tsx` + `TransferBank.tsx` + `register.css` (`.reg-seminar-*`, `.reg-bank*`, `.reg-confirm*`)  
**Product brief:** สมัครสัมมนาผ่าน LINE LIFF — เลือกรายการ → กรอกข้อมูล → (ถ้าเสียเงินและมีบัญชี) โอน+แนบสลิป+ยืนยัน → รอยืนยัน · clear status · mobile-first · WCAG AA  
**Constraint:** บัญชีรับโอนตั้งใจว่าง (`ASSOCIATION_TRANSFER_ACCOUNT = {}`) — ไม่ invent ข้อมูลธนาคาร; ต้อง hard-block การอัปโหลด/ส่งเมื่อไม่มีบัญชี  
**detect.mjs:** TSX `SeminarPage.tsx` + `TransferBank.tsx` → `[]` (exit 0) · `register.css` advisory (shared DESIGN.md drift) · **Browser overlay:** skipped (LIFF-gated; Vite up but no reliable public preview without LINE session)  
**Prior:** 22/40 · P0=1 · P1=3 (2026-07-27)  
**Date:** 2026-07-27 (re-run)

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | List still flashes empty before fetch; busy/confirm OK |
| 2 | Match System / Real World | 3 | Clear Thai; empty-bank copy honest; shirt/food free-text |
| 3 | User Control and Freedom | 3 | Back + confirm「แก้ไข」; members-only hides submit; no clear-slip |
| 4 | Consistency and Standards | 3 | Shared `TransferBank` / `PaymentConfirmPanel` with renew path |
| 5 | Error Prevention | 3 | Paid confirm + hard-block when no bank; phone still loose |
| 6 | Recognition Rather Than Recall | 3 | Confirm summary; list meta; optional fields lack examples |
| 7 | Flexibility and Efficiency | 2 | Fine single LIFF path; member autofill |
| 8 | Aesthetic and Minimalist Design | 3 | On-brand; progressive list→form→pay→confirm |
| 9 | Error Recovery | 2 | Good Thai copy; form error still no `role="alert"` |
| 10 | Help and Documentation | 2 | Empty-bank + upload hints good; success thin (no LINE next step) |
| **Total** | | **26/40** | **Acceptable → Good band edge** |

**P0:** 0 · **P1:** 2 · **P2:** 4 · **P3:** 2  
**Delta vs prior:** +4 (22→26) · P0 cleared (bank handled as intentional empty + hard-block) · confirm shipped

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คำตัดสินสั้นๆ
หลังแก้ หน้า `/seminar` **ไม่ชวนอัปโหลดสลิปตอนบัญชีว่าง** และมีขั้น `PaymentConfirmPanel` ก่อนส่งเมื่อมีค่าธรรมเนียม — สอดคล้องข้อจำกัด「บัญชียังไม่มีข้อมูล」และหลักยืนยันก่อนทำรายการเงิน โครง list→form ยังดี แต่**รายการสัมมนายังแว็บ empty ก่อนโหลด** และ**จบสำเร็จยังบาง** (ไม่มีชื่องาน / คาดหวัง LINE)

**คะแนน: 26/40 (Acceptable / ขอบ Good)** · P0 = 0 · P1 = 2  
**เทียบรอบก่อน:** 22→26 · เคลียร์ P0 บัญชี + P1 ยืนยันก่อนส่ง

### จุดแข็ง (2–3)
1. **Hard-block เงินเมื่อไม่มีบัญชี** — `hasTransferAccount()` · ซ่อนอัปโหลด · ปิดปุ่ม · `NO_TRANSFER_ACCOUNT_SUBMIT_HINT` / `.reg-bank--empty` ชัด ไม่ invent เลขบัญชี
2. **ยืนยันก่อนส่งเมื่อ `fee > 0`** — CTA「ตรวจสอบก่อนส่ง」→ สรุปงาน/ผู้สมัคร/ประเภท/ยอด + ตัวอย่างสลิป +「ยืนยันสมัคร」/「แก้ไข」
3. **Progressive disclosure + สิทธิ์สมาชิก** — เลือกงาน→ฟอร์ม; `membersOnly` ซ่อนปุ่มส่ง; autofill ชื่อเมื่อเป็นสมาชิก

### ปัญหาเรียงตามความสำคัญ

| ระดับ | ปัญหา | ทำไมสำคัญ |
|-------|--------|-----------|
| **P1** | รายการสัมมนาไม่มี loading — แว็บ「ยังไม่มีงาน…」แล้วค่อยโผล่ | Casey คิดว่างานปิด; ผิดหลักสถานะชัด |
| **P1** | a11y + peak-end อ่อน: `.reg-form-error` ไม่มี `role="alert"`; success ไม่มีชื่องาน / next step LINE | WCAG AA; จบแล้วไม่รู้จะรออะไร |
| **P2** | ไซส์เสื้อ/อาหารเป็น free text | พิมพ์ผิด ยากจัดกลุ่ม |
| **P2** | ไม่มีปุ่มลบ/เปลี่ยนสลิปชัด | มือถือต้องแตะโซนเดิมซ้ำ |
| **P2** | เบอร์ยัง `<input type="tel">` ธรรมดา (validate ตอนส่ง) | พิมพ์เกิน/ผิดรูปแบบง่าย |
| **P2** | Fetch fail ตั้ง error แต่ empty list ยังโชว์คู่กันได้ | สับสนว่าโหลดพลาดหรือไม่มีงาน |
| **P3** | `.reg-kicker` uppercase tracked | ระบบแบรนด์ร่วม |
| **P3** | `register.css` drift vs DESIGN.md (detector) | advisory ร่วมหลายหน้า |

### Cognitive load

| Checklist | ผ่าน? |
|-----------|-------|
| Single focus | ✅ |
| Chunking | ✅ |
| Grouping | ✅ |
| Visual hierarchy | ✅ (empty bank ไม่ชวนอัปโหลดแล้ว) |
| One thing at a time | ✅ (+ confirm step) |
| Minimal choices | ✅ |
| Working memory | ⚠️ (success ไม่เก็บชื่องาน; optional ไม่มีตัวอย่าง) |
| Progressive disclosure | ✅ |

**Failures: ~1–2 → ต่ำ–ปานกลาง** (ดีขึ้นชัดจากรอบก่อนบน paid path)

### Personas (สั้นๆ)
- **Casey (มือถือ LINE):** confirm + back ดี; ยังเสี่ยงทิ้งจาก empty-flash รายการ
- **Jordan:** empty-bank ข้อความชัด; success id ดิบยังงง
- **Sam:** confirm มี `role="alert"`; error หลักยังไม่มี; ไม่มี `aria-busy` / list `aria-live`
- **สมาชิก ABTA:** hard-block บัญชีว่างน่าเชื่อถือกว่า stub ชวนโอนผิด

### Anti-patterns / AI slop
- **LLM:** ไม่ใช่ cream/purple SaaS — เขียว-ทองสมาคม · ไม่ identical icon-card grid
- **Detector:** TSX สะอาด; CSS advisory เป็น shared token drift

### Top 3 remaining
1. รายการสัมมนาไม่มี loading / แยก error vs empty (P1)
2. Success บาง + form error ไม่ announce (P1)
3. เบอร์/เสื้อ/อาหาร/ลบสลิป — soft constraints (P2)

### สรุปหนึ่งประโยค
เส้นทางเสียเงิน**ปลอดภัยขึ้นแล้ว**ภายใต้บัญชีว่างตั้งใจ + confirm แต่ยังต้องแก้**สถานะโหลดรายการ**และ**จบสำเร็จ/a11y** ก่อนถือว่าพร้อมใช้งานจริงบน LINE

---

## English — Full critique for next agent

### Overall impression
Seminar paid-path UX is now **honest under an intentionally empty bank**: no invented account numbers, no invite-to-upload against a void, and a real confirm step when `fee > 0` and a slip is ready. The remaining gap is **status honesty on first paint** (list empty flash) and a **thin success / incomplete live-region story** — not payment trust.

### Anti-patterns verdict

**LLM assessment:** Not generic AI cream/purple/glow. Association green + gold matches DESIGN.md. Composition stays product-appropriate (list → form → pay → confirm). Residual shared grammar: `.reg-kicker`, pill CTAs — system-level, not page-unique slop.

**Deterministic scan:**
- `detect.mjs --json apps/web/src/pages/SeminarPage.tsx apps/web/src/pages/TransferBank.tsx` → `[]` (exit 0)
- Secondary: `register.css` → advisory DESIGN.md drift (color / font-size / radius) — shared shell, not seminar-specific antipatterns

**Visual overlays:** Not shown — LIFF-gated; mutation/injection skipped even though Vite is running locally.

### What's working (post-fix)
1. **`TransferBankBlock` + `hasTransferAccount()`** — empty state copy; hides slip; disables submit; submit hint `role="status"`.
2. **`PaymentConfirmPanel`** for paid path — title, applicant, type, fee, slip thumb, warn, confirm/back.
3. **`membersOnly`** hides primary submit (shows message + back only).
4. Shared payment primitives with Renew/Register reduce inconsistency debt.

### Intentional non-issue (do not re-P0)
**Empty bank data** — `ASSOCIATION_TRANSFER_ACCOUNT = {}` by product constraint. Do **not** invent bank name/number. Score the **UX handling** (hard-block) as fixed; treat “wire real account when association supplies data” as a **product/config task**, not a Seminar UI defect.

### Priority issues

#### [P1] Seminar list has no loading / conflates empty with pending
- **What:** `items` starts `[]`; UI immediately shows 「ยังไม่มีงานสัมมนาที่เปิดรับสมัคร」 until `/api/seminars` resolves. Fetch failure sets `error` but empty UI can still appear.
- **Why:** Casey on slow LINE webview assumes no events and leaves. Violates “สถานะชัดก่อนสวย.”
- **Fix:** `listPhase: loading | ready | error`; 「กำลังโหลดรายการ…」 or skeleton + `aria-live="polite"`; empty only when `ready && length === 0`; keep fetch error distinct from empty.
- **Suggested command:** `/impeccable polish` (+ `/impeccable clarify`)

#### [P1] a11y live regions + thin success (peak-end)
- **What:** Top-level `.reg-form-error` still lacks `role="alert"` / focus move (confirm panel already has alert). Busy is button text only (no `aria-busy` on form). Success shows raw `registrationId` + 「รอเจ้าหน้าที่ยืนยันสิทธิ์ครับ」 — no seminar title, no “แจ้งผลทาง LINE”, no OA/status CTA.
- **Why:** WCAG AA goal; peak-end under-reassures after effort (and after money when bank later goes live).
- **Fix:** `role="alert"` on form error; `aria-busy={busy}`; success: title + labeled id + LINE expectation (+ optional status/OA link).
- **Suggested command:** `/impeccable audit` + `/impeccable clarify`

#### [P2] Shirt size / food type are free text
- **Fix:** Selects/chips (S–XXL; ทั่วไป/มังสวิรัติ/ฮาลาล) + “อื่นๆ”.
- **Suggested command:** `/impeccable clarify`

#### [P2] No explicit clear/replace slip control
- **Fix:** When `slip.kind === "ready"`, ghost 「ลบรูป / เลือกใหม่」.
- **Suggested command:** `/impeccable adapt`

#### [P2] Phone field under-constrained
- **Fix:** `PhoneDigitInput` or `maxLength={10}` + digit filter; inline field error.
- **Suggested command:** `/impeccable harden`

#### [P2] Error + empty list can co-appear
- **Fix:** Gate list body on `listPhase`; don’t show empty copy while error is set.
- **Suggested command:** `/impeccable polish`

#### [P3] Shared kicker / pill grammar + DESIGN.md drift
- System quieter/document pass; don’t special-case seminar alone.
- **Suggested command:** `/impeccable quieter` / `/impeccable document`

### Persona red flags

**Jordan (confused first-timer)**  
List→form clear; empty-bank message readable. Success id without seminar title still feels like an error code. Optional shirt/food with no examples → skips or invents.

**Casey (distracted mobile LIFF)**  
Thumb CTA + confirm/back good. Empty-flash on open remains high abandon risk. Slip lost on reload mid-upload.

**Sam (accessibility)**  
- Confirm errors announced; main form errors not  
- List/success swaps visual-only  
- No `aria-busy` on submitting form  

**Project — สมาชิก ABTA (LINE)**  
Hard-block when bank empty matches association trust better than inviting a wrong transfer. When real account lands, copy/QR affordances in `TransferBankBlock` become the next product step.

### Cognitive load (English)
~1–2 checklist failures (working memory on success; optional examples). Paid path no longer spikes extraneous load via empty-bank invitation. Decision points ≤4.

### Emotional journey
- **Start:** List — still a valley if false empty.  
- **Middle:** Form — calm; members-only recoverable.  
- **High stakes:** Payment — honest empty or confirm when payable; trust recovered vs prior stub.  
- **End:** Success — polite but thin; strengthen LINE follow-up.

### Minor observations
- `eventDate` still raw — format `th-TH` if ISO.
- Default `applicantType` before select OK once list loading is honest.
- `reg-rise` / reduced-motion on shared shell — keep.
- Detector clean on TSX ≠ a11y clean.

### Questions to consider
1. When association supplies bank data, wire only `ASSOCIATION_TRANSFER_ACCOUNT` or load from API/config?
2. After success, is there a member surface for seminar registrations, or LINE push only?
3. Shirt/food: global defaults or per-seminar from admin?

### Detector summary

```
PRIMARY:  detect.mjs --json SeminarPage.tsx TransferBank.tsx → [] exit 0
SECONDARY: register.css → advisory DESIGN.md drift (shared)
Browser overlay: skipped (LIFF)
False positives: shared token drift; not seminar slop
```

### Trend / snapshot

| Run | Score | P0 | P1 | Note |
|-----|------:|---:|---:|------|
| Prior | 22 | 1 | 3 | Empty bank invited upload; no confirm |
| **This** | **26** | **0** | **2** | Hard-block + confirm; list/success remain |

---

## Concrete fix backlog (English)

| Priority | ID | Action | Files | Command | Status |
|----------|-----|--------|-------|---------|--------|
| — | S1 | Real bank details **or** hard-block empty | `TransferBank.tsx`, `SeminarPage.tsx` | harden | **Done (empty + hard-block)** |
| — | S3 | Confirm before paid submit | `SeminarPage.tsx`, `TransferBank.tsx` | harden | **Done** |
| — | S6 | Hide submit when `membersOnly` | `SeminarPage.tsx` | distill | **Done** |
| P1 | S4 | List loading / error / empty phases + `aria-live` | `SeminarPage.tsx` | polish, clarify | Open |
| P1 | S5 | `role="alert"`; `aria-busy`; richer success | `SeminarPage.tsx` | audit, clarify | Open |
| P2 | S7 | Shirt/food selects/chips | `SeminarPage.tsx` | clarify | Open |
| P2 | S8 | Clear/replace slip | `SeminarPage.tsx` | adapt | Open |
| P2 | S9 | Constrain phone | `SeminarPage.tsx` | harden | Open |
| P3 | S10 | Format `eventDate`; DESIGN.md sync | page + docs | polish / document | Open |

**Done when:** List states are honest; success announces LINE follow-up; AA live/focus on happy path; bank remains empty until product fills `ASSOCIATION_TRANSFER_ACCOUNT` (then confirm + upload already wired).

**Suggested sequence:** `polish` (S4) → `audit`/`clarify` (S5) → `harden`/`adapt`/`clarify` (S7–S9) → re-run critique.
