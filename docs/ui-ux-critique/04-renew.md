# 04 — Renew (`/renew`)

⚠️ **DEGRADED: single-context** (critique nested under parent Multitask subagent — dual Assessment A/B spawn blocked; design review + `detect.mjs` ran inline)

> **Score:** 31/40 · **Band:** Good  
> **P0:** 0 · **P1:** 3 · **P2:** 3 · **P3:** 1  
> **Route:** `/renew`  
> **Files:** `apps/web/src/pages/RenewPage.tsx`, `TransferBank.tsx`, `register.css` (import), `shared.css` (tokens)  
> **Method:** single-context (A: design review · B: detector)  
> **Detector:** `detect.mjs --json` on `RenewPage.tsx` + `TransferBank.tsx` → `[]` (clean, exit 0)  
> **Browser overlay:** skipped (LIFF auth + no reliable local renew session for injection)  
> **Note:** Bank intentionally empty — **not** scored as “invent bank data.” Confirm-before-submit **exists**.  
> **Prior:** 23/40 Acceptable (2026-07-27) → **31/40 Good** (re-run after fixes)  
> **Date:** 2026-07-27

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์

**31/40 — Good** — หลังแก้แล้ว โฟลว์ต่ออายุมีขั้นยืนยันก่อนส่ง และบัญชีว่างถูกเกตอย่างซื่อสัตย์ (ปิดอัปโหลด/ส่ง + บอกติดต่อเจ้าหน้าที่) โดยไม่ต้อง invent ข้อมูลธนาคาร เหลือช่องโหว่สถานะ/ทางออก และ a11y เป็นหลัก

| # | Heuristic | คะแนน | ประเด็นหลัก |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 2 | โหลดเป็นข้อความเปล่า; ไม่มี `aria-live`; `draft.status` ไม่แสดง; pending อ่อน |
| 2 | Match System / Real World | 4 | ภาษาไทยชัด ค่าธรรมเนียมเป็นบาท; บัญชีว่าง = สถานะ ops จริง ไม่ใช่ placeholder หลอก |
| 3 | User Control and Freedom | 3 | Confirm มี「แก้ไข」; pending ยังไม่มี CTA ออก; ลบสลิปไม่ชัด |
| 4 | Consistency and Standards | 4 | `TransferBank` + `PaymentConfirmPanel` ร่วมกับ register/seminar |
| 5 | Error Prevention | 4 | ยืนยันก่อนส่งมีแล้ว; ปิดส่งเมื่อไม่มีบัญชี/ไม่มีสลิป; กันไฟล์ผิด |
| 6 | Recognition Rather Than Recall | 3 | ค่าธรรมเนียม/บัญชีอยู่บนหน้า; ไม่มี days-left / สถานะสมาชิกแบบ `/status` |
| 7 | Flexibility and Efficiency | 2 | เส้นทางเดียวเหมาะ LIFF; สลิปถูกปฏิเสธบังคับไป `/slip` |
| 8 | Aesthetic and Minimalist Design | 3 | เขียว+ทองชัด โฟกัสงานเดียว; กล่อง fee/bank ซ้อนเล็กน้อย |
| 9 | Error Recovery | 3 | `errorCopy` ไทย actionable; confirm มี `role="alert"`; ฟอร์มหลักยังไม่ announce |
| 10 | Help and Documentation | 3 | hint อัปโหลด + บัญชีว่าง + คำเตือน confirm; ไม่บอกขั้นตอนหลังส่งชัด |
| **รวม** | | **31/40** | **Good** |

### จุดแข็ง

1. **ยืนยันก่อนส่งมีแล้ว** — `PaymentConfirmPanel` สรุปชื่อ/เลขสมาชิก/ค่าธรรมเนียม + พรีวิวสลิป + 「แก้ไข」 ตามหลัก PRODUCT
2. **บัญชีว่างถูกเกตอย่างซื่อสัตย์** — `hasTransferAccount()` ปิดอัปโหลด/ส่ง + `NO_TRANSFER_ACCOUNT_SUBMIT_HINT` (ไม่ชวนอัปโหลดทับบัญชีว่าง)
3. **โฟกัสงานเดียวบนมือถือ** — hero → ค่าธรรมเนียม → ธนาคาร/อัปโหลด → CTA; สำเร็จมีเลขใบเสร็จ +「ดูสถานะ」

### ปัญหาเรียงตามความสำคัญ

| ระดับ | ปัญหา | ทำไมสำคัญ |
|-------|--------|-----------|
| **P1** | `pendingRenewal` เป็น dead-end — มีแค่ warn ไม่มี「ดูสถานะ」 | ผิดหลัก「สถานะชัดก่อนสวย」; สมาชิกรู้สึกติด |
| **P1** | a11y: ไม่มี `aria-live` / `aria-busy`; `.reg-upload` ไม่มี `:focus-within` | เป้า WCAG AA; keyboard/SR พลาดสถานะ |
| **P1** | ไม่ใช้ `draft.status` + หมดอายุแบนๆ ไม่มี urgency/days-left | เทียบ `/status` อ่อน; ไม่กระตุ้นต่ออายุ |
| **P2** | โหลดเป็นข้อความอย่างเดียว ไม่มี skeleton | รู้สึกช้า/ว่างบนพื้นเขียว |
| **P2** | ไม่มีปุ่มลบ/เปลี่ยนสลิปชัด | ต้องแตะโซนไฟล์ทึบซ้ำ |
| **P2** | สลิปถูกปฏิเสธบังคับไป `/slip` | ขั้นพิเศษโดยไม่จำเป็น |
| **P3** | `.reg-kicker` uppercase tracked | ระบบแบรนด์ — อย่าเพิ่ม eyebrow ซ้ำ |

**ไม่ใช่บั๊กที่ต้องแก้ในรอบนี้:** บัญชีรับโอนว่างโดยเจตนา — อย่า invent ข้อมูลธนาคาร

### Cognitive load

ล้มเหลว ~1 ข้อ (pending ไม่มี next step เป็น distraction) → **ต่ำ–ปานกลาง**

### Personas (สั้นๆ)

- **Casey (มือถือ LINE):** Confirm + CTA ล่างดี; pending ไม่มีทางออก; focus อัปโหลดไม่ชัด
- **Jordan (ต่ออายุครั้งแรก):** ขั้นยืนยันช่วย; ถ้าบัญชีว่างรู้ว่าติดต่อเจ้าหน้าที่; ไม่รู้ urgency จากวันหมดอายุ
- **Sam (a11y):** โหลด/error/busy ไม่อ่านผ่าน live region; focus บน upload หาย

### Top 3 ที่เหลือ

1. Pending renewal ไม่มี CTA ไปสถานะ (P1)
2. WCAG live region + focus อัปโหลด (P1)
3. ไม่โชว์ `draft.status` / ความเร่งด่วนวันหมดอายุ (P1)

### สรุปหนึ่งประโยค

หน้าต่ออายุพร้อมเป็นเงินจริงเมื่อมีบัญชี — ตอนนี้เกตว่าง + ยืนยันก่อนส่งครบแล้ว; เหลือทำให้สถานะเดินต่อได้และผ่าน AA

---

## English (for fix agents)

⚠️ DEGRADED: single-context (nested dual-agent disallowed under parent subagent). Assessment A (design review) + B (detector) completed inline in one context.

### Scoring note (ops constraints)

- **Empty bank is intentional.** `ASSOCIATION_TRANSFER_ACCOUNT = {}` + empty `TransferBankBlock` + disabled submit is correct ops UX. Do **not** treat “ship invented bank details” as a required fix or P0.
- **Confirm-before-submit exists** via `PaymentConfirmPanel` (`confirmOpen` → review → `onConfirmSubmit`). Do not re-open that as a missing P1.

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Plain loading; no `aria-live`; `draft.status` unused; pending weak |
| 2 | Match System / Real World | 4 | Clear Thai + fee; empty bank = honest ops state |
| 3 | User Control and Freedom | 3 | Confirm has「แก้ไข」; pending no exit CTA; no explicit slip clear |
| 4 | Consistency and Standards | 4 | Shared `TransferBank` + `PaymentConfirmPanel` with register/seminar |
| 5 | Error Prevention | 4 | Confirm step + submit gated on bank + slip + file checks |
| 6 | Recognition Rather Than Recall | 3 | Fee/bank on-page when available; no days-left vs StatusPage |
| 7 | Flexibility and Efficiency | 2 | Fine single path; rejection forces `/slip` hop |
| 8 | Aesthetic and Minimalist Design | 3 | On-brand green+gold; slight fee/bank box stacking |
| 9 | Error Recovery | 3 | Thai `errorCopy` + confirm `role="alert"`; main form less announced |
| 10 | Help and Documentation | 3 | Upload + empty-bank + confirm warn; thin post-submit guidance |
| **Total** | | **31/40** | **Good** |

### Anti-patterns verdict

**LLM:** Not generic SaaS cream/purple. Association green + gold matches DESIGN.md. Uppercase `.reg-kicker` remains intentional brand mark (one kicker). Pill CTAs are shared member-shell convention. Main remaining failures are **status exits** and **a11y feedback**, not visual slop or invented bank debt.

**Detector:** `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/RenewPage.tsx apps/web/src/pages/TransferBank.tsx` → `[]` (0 findings, exit 0). Scanning shared `register.css` yields many advisory design-system-color/font-size/radius hits (shared shell debt) — treat as **out of renew scope / advisory**, not renew regressions.

**Overlays:** Not injected — LIFF session required; no reliable local renew view for live detect.js.

### Overall impression

Renew is now a trustworthy money-flow shell for when bank data arrives: honest empty gate, confirm step, shared transfer/confirm components. Biggest remaining opportunity: **status clarity and exits** (pending + membership/expiry) and **AA live/focus**, not payment invention.

### What's working

1. Inline confirm before `submitRenewal` with member, fee, slip preview, and「แก้ไข」back.
2. Empty transfer account correctly blocks upload/submit with contact-staff copy (`NO_TRANSFER_ACCOUNT_SUBMIT_HINT`).
3. Mobile single-column happy path; success shows receipt number +「ดูสถานะ」.

### Priority issues

#### [P1] Pending renewal is a dead-end

- **What:** `draft.pendingRenewal` → `.reg-warn` only (“มีคำขอต่ออายุรอตรวจอยู่แล้ว”). No primary「ดูสถานะคำขอ」despite success path already using `memberStatusHrefFromUrl`.
- **Why:** PRODUCT “สถานะชัดก่อนสวย.” Members feel trapped and contact support.
- **Fix:** Pending: warn + primary CTA to `/status` (need memberId/token from draft or known link helper). Optional secondary back to OA.
- **Suggested command:** `/impeccable clarify`

#### [P1] WCAG AA gaps — live regions & upload focus

- **What:** Loading/errors/busy lack page-level `aria-live` / `aria-busy` (unlike Status/Receipt/SlipResubmit). File input remains `opacity: 0` over `.reg-upload` with **no** `:focus-within` ring. Confirm panel announces errors via `role="alert"` but draft-load and form errors do not.
- **Why:** Stated AA goal; keyboard/SR miss state changes; invisible focus on file control.
- **Fix:** `aria-live="polite"` for draft load/errors; `aria-busy` while submitting; `.reg-upload:focus-within { outline… }`; announce slip-ready.
- **Suggested command:** `/impeccable audit` then `/impeccable polish`

#### [P1] Membership status & expiry urgency unused

- **What:** `draft.status` fetched but never rendered. Expiry is flat `หมดอายุ {date}` without near/expired tone or days-left (StatusPage has `expiryDaysLeft` / tones).
- **Why:** Principle “สถานะชัดก่อนสวย”; expired members don’t feel urgency to renew.
- **Fix:** Hero status pill from `draft.status` + expiry urgency aligned with StatusPage labels/tones (API may need days-left field if missing).
- **Suggested command:** `/impeccable clarify` (+ `/impeccable layout`)

#### [P2] Loading UX is bare lead text

- **What:** 「กำลังเชื่อมต่อ LINE…」 / 「กำลังโหลดข้อมูลสมาชิก…」 only — Status/Receipt use skeletons.
- **Fix:** Reuse skeleton pattern from StatusPage for draft load.
- **Suggested command:** `/impeccable polish`

#### [P2] No explicit replace/remove slip control

- **What:** Replacing requires re-tapping the opaque file hit area; no「ลบรูป」/「เลือกใหม่」.
- **Fix:** When `slip.kind === "ready"`, show ghost button to clear + re-open picker.
- **Suggested command:** `/impeccable adapt`

#### [P2] Rejected slip forces navigation to `/slip`

- **What:** Rejected state only links to `liffPageUrl("/slip")` instead of allowing re-upload on `/renew`.
- **Fix:** Prefer inline resubmit on renew (same form) or deep-link with shared upload component.
- **Suggested command:** `/impeccable distill`

#### [P3] Brand kicker / soft inner boxes

- Keep single ABTA kicker; don’t add more uppercase eyebrows. Optional flatten fee vs bank hierarchy later.
- **Suggested command:** `/impeccable quieter` only if kickers proliferate

### Persona red flags

**Casey (Distracted Mobile — primary LIFF):**
- Confirm at bottom is good; pending state has nowhere to go with a thumb tap.
- Slip preview replace affordance unclear after interruption.
- File focus ring missing when tabbing/using keyboard accessory.

**Jordan (First-Timer renewing):**
- Confirm step clarifies “ส่งคำขอ” ≠ instant active — good.
- Empty bank correctly says contact staff — good.
- Flat expiry date doesn’t communicate urgency vs StatusPage.

**Sam (Accessibility-Dependent):**
- Busy/success/error not announced on main renew path.
- Invisible focus on file control.
- Confirm errors OK (`role="alert"`); draft-load and form errors weaker.

**Project — สมาชิกผู้ประกอบการ ABTA:**
- Trust improved: no fake bank + confirm before money submit. Remaining trust gap is status exits while waiting for treasurer.

### Cognitive load checklist

| Item | Pass? |
|------|-------|
| Single focus | Partial (pending dead-end distracts) |
| Chunking ≤4 | Pass (fee / bank / upload) |
| Grouping | Pass |
| Visual hierarchy | Pass (fee strong; empty bank honest) |
| One thing at a time | Pass on happy path + confirm |
| Minimal choices | Pass |
| Working memory | Pass (no bank recall required when empty; details shown when present) |
| Progressive disclosure | Pass (confirm step) |

**~1 failure → low–moderate.**

### Minor observations

- Success copy uses「ครับ」— on-brand; keep consistent.
- `data_rejected` CTA → `/register` may surprise; ensure copy matches destination.
- `reg-rise` / reduced-motion in shared CSS — good.
- Detector clean on TSX ≠ a11y clean.
- When bank data lands later, copy buttons / QR remain a harden opportunity — out of scope until real data exists.

### Questions (for product owner)

1. Pending renew: always deep-link `/status` with memberId — is token available on renew draft today?
2. Should rejected renewals resubmit on `/renew` or stay on `/slip` only?
3. Expiry urgency: compute days-left client-side from `expiryDate`, or extend renew draft API?

### Detector summary

```
detect.mjs targets: RenewPage.tsx, TransferBank.tsx
result: []
exit: 0
false positives: n/a
note: register.css advisory design-system hits are shared-shell debt, not renew-specific P0/P1
```

### Trend / snapshot

Prior formal critique: **23/40** (Acceptable) → this re-run: **31/40** (Good). Delta driven by confirm step + honest empty-bank gate (and not scoring invented bank as required). Persist under `.impeccable/critique/` when storage write succeeds.

---

## Concrete fix backlog (English)

Ordered for the next fix agent. Scope: `RenewPage.tsx` + `register.css` (+ draft fields only if needed for status/expiry). **Do not invent bank account data.**

| Priority | ID | Action | Files / notes | Command |
|----------|-----|--------|---------------|---------|
| P1 | R4 | Pending renewal: primary CTA to member status | `RenewPage.tsx`, `member-links` | clarify |
| P1 | R6 | `aria-live` for load/error/success; `aria-busy` on submit; `:focus-within` on `.reg-upload` | `RenewPage.tsx`, `register.css` | audit, polish |
| P1 | R5 | Surface `draft.status` + expiry urgency (pill / days-left) in hero | `RenewPage.tsx`, optional API | clarify, layout |
| P2 | R7 | Skeleton loading matching StatusPage | `RenewPage.tsx`, CSS | polish |
| P2 | R8 | Clear/replace slip controls when ready | `RenewPage.tsx` | adapt |
| P2 | R9 | Prefer inline slip resubmit on renew when `receiptStatus === "rejected"` | `RenewPage.tsx` | distill |
| P3 | R10 | Optional: reduce inner-box stacking; keep single brand kicker | `register.css` | quieter / layout |
| — | — | **Deferred:** real bank name/number/QR when association supplies data | `TransferBank.tsx` | harden (later) |

**Done when:** Pending users always have a status exit; AA live/focus checks pass on renew happy path; membership/expiry readable without opening `/status`. Bank remaining empty until ops provides data is OK.

**Suggested sequence:** `clarify` (R4–R5) → `audit`/`polish` (R6–R7) → `adapt`/`distill` (R8–R9) → re-run critique.
