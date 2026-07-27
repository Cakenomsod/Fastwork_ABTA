# 06 — Seminar (`/seminar`)

⚠️ **DEGRADED: single-context for Assessment A** (nested Multitask subagent — Assessment A spawn hit API limit; design review ran inline). Assessment B ran dual-agent (`24e9bab6-9324-4658-898a-76e9a1b8c000`).

**Method:** hybrid degraded · **Target:** `apps/web/src/pages/SeminarPage.tsx` + `register.css` (`.reg-seminar-*`, shared `.reg-*`)  
**Product brief:** สมัครสัมมนาผ่าน LINE LIFF — เลือกรายการ → กรอกข้อมูล → (ถ้าเสียเงิน) โอน+แนบสลิป → รอยืนยัน · clear status · mobile-first · WCAG AA  
**detect.mjs:** TSX `[]` (exit 0) · `register.css` 70 advisory (design-system color/font/radius vs DESIGN.md) · **Browser overlay:** skipped (no Vite server; LIFF-gated)  
**Date:** 2026-07-27

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Seminar list has no loading — empty copy flashes; busy only on button; success thin |
| 2 | Match System / Real World | 2 | Clear Thai; bank is placeholder; shirt/food free-text |
| 3 | User Control and Freedom | 3 | 「← กลับเลือกรายการ」 works; members-only has message; no clear-slip |
| 4 | Consistency and Standards | 3 | Shared `reg-*` shell/upload with Register/Renew (good) + shared bank debt |
| 5 | Error Prevention | 1 | Paid path invites slip without bank; no confirm before money submit |
| 6 | Recognition Rather Than Recall | 2 | List shows date/location; bank must be recalled; optional fields no examples |
| 7 | Flexibility and Efficiency | 2 | Fine single LIFF path; member autofill for name + pricing |
| 8 | Aesthetic and Minimalist Design | 3 | On-brand green+gold; list→form progressive; not cluttered |
| 9 | Error Recovery | 2 | `seminarErrorCopy` mostly actionable; no `role="alert"`; default vague |
| 10 | Help and Documentation | 2 | Upload hints OK; success has no next step / LINE expectation |
| **Total** | | **22/40** | **Acceptable** |

**P0:** 1 · **P1:** 3 · **P2:** 4 · **P3:** 2

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คำตัดสินสั้นๆ
หน้า `/seminar` โครงดี: เลือกรายการก่อน ค่อยกรอกฟอร์ม ใช้ shell เขียว-ทองของสมาชิก และมีทางกลับรายการ — แต่**เส้นทางเสียเงินยังโอนจริงไม่ได้**เพราะบัญชีรับโอนเป็น placeholder เดียวกับ `/renew` / register และยังไม่มีขั้นยืนยันก่อนส่ง ทำให้เสี่ยงสลิปผิด/คิวเหรัญญิกเสีย

**คะแนน: 22/40 (Acceptable)** · P0 = 1 · P1 = 3

### จุดแข็ง (2–3)
1. **Progressive disclosure มือถือ** — รายการสัมมนา → ฟอร์ม → ส่วนชำระเฉพาะเมื่อ `fee > 0` · เหมาะ LIFF
2. **สิทธิ์สมาชิกชัดพอสมควร** — autofill ชื่อเมื่อเป็นสมาชิก; กรอง `pricingOptions`; บล็อก「สัมมานี้สำหรับสมาชิกเท่านั้น」
3. **กันไฟล์ + ข้อความ error ไทย** — JPG/PNG · 5 MB · `seminarErrorCopy` ครอบคลุมเคสหลัก

### ปัญหาเรียงตามความสำคัญ

| ระดับ | ปัญหา | ทำไมสำคัญ |
|-------|--------|-----------|
| **P0** | บัญชีรับโอน「รอข้อมูลจากสมาคม」เมื่อมีค่าสมัคร | สมาชิก/บุคคลทั่วไปโอนไม่ได้ถูกต้อง → สมัครเสียเงินจริงไม่ได้ / เสี่ยงโอนผิด |
| **P1** | ไม่มีขั้นยืนยันก่อน「สมัครสัมมนา」เมื่อมีค่าธรรมเนียม | ธุรกรรมเงิน — ผิดหลัก「ยืนยันก่อนทำลาย/สำคัญ」 |
| **P1** | รายการสัมมนาไม่มี loading — แว็บ「ยังไม่มีงาน…」แล้วค่อยโผล่ | ผิดหลัก「สถานะชัดก่อนสวย」; Casey คิดว่างานปิด |
| **P1** | a11y + peak-end อ่อน: ไม่มี `aria-live`/`role="alert"`; success ไม่มี next step | WCAG AA; จบแล้วไม่รู้จะรออะไร / ดูสถานะที่ไหน |
| **P2** | `membersOnly` ยังโชว์ปุ่มส่ง disabled | สับสนว่าต้องทำอะไรต่อ |
| **P2** | ไซส์เสื้อ/อาหารเป็น free text | พิมพ์ผิด ยากจัดกลุ่มสำหรับเจ้าหน้าที่ |
| **P2** | ไม่มีปุ่มลบ/เปลี่ยนสลิปชัด | มือถือต้องแตะโซนเดิมซ้ำ |
| **P2** | เบอร์ใช้ `<input>` ธรรมดา แม้มี `isValidThaiMobile` | ไม่บังคับ 10 หลักตอนพิมพ์ (ต่างจาก flow อื่นที่อาจใช้ digit input) |
| **P3** | `.reg-kicker` uppercase tracked | ระบบแบรนด์ร่วม — อย่าเพิ่ม eyebrow ซ้ำ |
| **P3** | `register.css` มีค่าสี/ขนาดนอก DESIGN.md (detector) | advisory ร่วมหลายหน้า ไม่ใช่ slop ของ seminar โดยตรง |

### Cognitive load

| Checklist | ผ่าน? |
|-----------|-------|
| Single focus | ✅ (หลังเลือกงาน) |
| Chunking | ✅ (ผู้สมัคร / ชำระ / เพิ่มเติม) |
| Grouping | ✅ |
| Visual hierarchy | ⚠️ (bank ว่างทำลายลำดับความสำคัญของเงิน) |
| One thing at a time | ✅ |
| Minimal choices | ✅ |
| Working memory | ❌ (บัญชีโอน; หลัง success ไม่มีบริบทงาน) |
| Progressive disclosure | ✅ |

**Failures: ~2–3 → ปานกลาง** (สูงขึ้นทันทีเมื่อ `fee > 0`)

### Personas (สั้นๆ)
- **Casey (มือถือ LINE):** รายการ+CTA ล่างดี; หยุดที่บัญชีว่าง; reload แล้วสลิปหาย
- **Jordan (สมัครครั้งแรก):** ไม่รู้「รอเจ้าหน้าที่ยืนยัน」ใช้เวลานานแค่ไหน; optional fields ไม่มีตัวอย่าง
- **Sam (a11y):** error/busy/success ไม่ announce; upload focus พึ่ง browser ใน `.reg-upload`
- **สมาชิก ABTA:** คาดหวังความน่าเชื่อถือของสมาคม — placeholder เงินทำให้แบรนด์เขียว-ทองดู“ยังไม่พร้อม”

### Anti-patterns / AI slop
- **LLM:** ไม่ใช่ cream/purple SaaS — ใช้แบรนด์สมาคมจริง · list buttons ไม่ใช่ identical icon-card grid · kicker `ABTA` เป็น brand mark ร่วม ไม่ใช่ section eyebrow spam
- **Detector:** TSX สะอาด; 70 hits ใน `register.css` เป็น design-system advisory (shared) — ส่วนใหญ่ false positive สำหรับ “AI slop”

### Top 3 issues
1. บัญชีรับโอนเป็น placeholder (P0)
2. ไม่ยืนยันก่อนส่งเมื่อมีค่าธรรมเนียม (P1)
3. ไม่มี loading รายการ + success ไม่บอก next step (P1)

### สรุปหนึ่งประโยค
โครงเลือกงาน→สมัครใช้ได้บน LINE แต่**ยังสมัครเสียเงินอย่างมั่นใจไม่ได้**จนกว่าจะมีบัญชีโอนจริง + ยืนยันยอด + สถานะโหลด/หลังส่งที่ชัด

---

## English — Full critique for next agent

### Overall impression
Seminar is the right IA for LIFF: pick an event, then fill a short form, with payment UI revealed only when needed. Visual language matches member Register/Renew. The single biggest opportunity is the same debt as renew — **make paid registration a trustworthy money flow** (real bank, confirm, clear status ends), not “upload a slip into a void.”

### Anti-patterns verdict

**LLM assessment:** Not generic AI cream/purple/glow. Association green + gold atmosphere matches DESIGN.md. Composition is product-appropriate (list → form), not marketing card grids. Residual shared grammar: uppercase tracked `.reg-kicker`, pill CTAs (`999px`) — system-level, not page-unique slop. Failure mode is **task incompleteness on paid path**, not decorative excess.

**Deterministic scan:**
- `detect.mjs --json apps/web/src/pages/SeminarPage.tsx` → `[]` (exit 0)
- Secondary: `register.css` → **70** advisory (`design-system-color` 37, `design-system-font-size` 25, `design-system-radius` 8), `importedBy` includes SeminarPage — treat as shared token drift vs DESIGN.md, not seminar-specific antipatterns. No cream-palette / nested-cards / low-contrast rule hits.

**Visual overlays:** Not shown — no local Vite server; `/seminar` is LIFF-auth gated; mutation/injection skipped.

### What's working
1. List → detail form with back control; empty seminars state exists.
2. Member detection adjusts pricing options and prefills names; members-only gate with plain Thai.
3. Slip constraints + preview via `.reg-upload`; fee callout when `fee > 0`.

### Priority issues

#### [P0] Bank account is a permanent placeholder on paid seminars
- **What:** When `fee > 0`, `.reg-bank` shows 「รอข้อมูลจากสมาคม」 / “will show when association confirms” — identical stub to Renew/Register. No account name, number, bank, or QR.
- **Why:** Paid seminar task = transfer correct amount then attach proof. Without details, users abandon, pay wrong accounts, or spam OA. Violates trustworthy association positioning and “สถานะชัดก่อนสวย.”
- **Fix:** Load transfer details from config/API (shared with renew). Render copyable name / number / bank (+ optional QR). Until live: **disable** slip + submit with 「ยังไม่เปิดรับชำระออนไลน์ — ติดต่อ LINE OA」 — do not invite upload against empty bank.
- **Suggested command:** `/impeccable harden` then `/impeccable clarify`

#### [P1] No confirmation before paid submit
- **What:** One tap `สมัครสัมมนา` after slip-ready posts registration. No review of seminar title, fee, applicant type, or “I transferred X THB.” Register already has `.reg-confirm*` patterns unused here.
- **Why:** PRODUCT principle #3 — confirm important actions. Wrong slip/amount wastes treasurer queue and creates anxiety.
- **Fix:** For `fee > 0`, inline confirm step: title, applicant type label, fee, slip thumb; primary 「ยืนยันสมัคร」; secondary 「แก้ไข」. Free path can stay one-step.
- **Suggested command:** `/impeccable harden` (+ `/impeccable clarify`)

#### [P1] Seminar list has no loading / status flash
- **What:** `items` starts `[]`; UI immediately shows 「ยังไม่มีงานสัมมนาที่เปิดรับสมัคร」 until fetch resolves. LIFF loading only disables CTA — no hero/list skeleton. Fetch failure sets error but empty state may still show.
- **Why:** Casey on slow LINE webview assumes no events and leaves. Status principle violated at first paint.
- **Fix:** `listPhase: loading | ready | error`; skeleton or 「กำลังโหลดรายการ…」 with `aria-live="polite"`; empty only when `ready && length === 0`; keep fetch error distinct.
- **Suggested command:** `/impeccable polish` (+ `/impeccable clarify`)

#### [P1] a11y + thin success (peak-end)
- **What:** Form errors lack `role="alert"` / focus move. Busy is button text only (no `aria-busy` on form). Success shows raw `registrationId` + 「รอเจ้าหน้าที่ยืนยันสิทธิ์ครับ」 — no seminar title, no “แจ้งผลทาง LINE”, no link to status/OA.
- **Why:** WCAG AA goal; peak-end rule — last screen under-reassures after money/effort.
- **Fix:** `role="alert"` on `.reg-form-error`; `aria-busy={busy}`; announce success via `aria-live`; success: title + id label + 「จะแจ้งผลทาง LINE เมื่อเจ้าหน้าที่ตรวจแล้ว」 + optional status/OA CTA.
- **Suggested command:** `/impeccable audit` + `/impeccable clarify`

#### [P2] Members-only still shows disabled primary CTA
- **Fix:** Hide submit when `membersOnly`; show single CTA 「กลับเลือกรายการ」 or 「สมัครสมาชิก」 if product has a path.
- **Suggested command:** `/impeccable distill`

#### [P2] Shirt size / food type are free text
- **Fix:** Selects or chip groups from seminar config (or sensible defaults: S–XXL, ทั่วไป/มังสวิรัติ/ฮาลาล) with “อื่นๆ” + notes.
- **Suggested command:** `/impeccable clarify` (+ API if options per seminar)

#### [P2] No explicit clear/replace slip control
- **Fix:** When `slip.kind === "ready"`, ghost 「ลบรูป / เลือกใหม่」 (Renew backlog R8).
- **Suggested command:** `/impeccable adapt`

#### [P2] Phone field under-constrained
- **Fix:** Reuse `PhoneDigitInput` (already imported helper) or `maxLength={10}` + digit filter; inline field error vs only form-level.
- **Suggested command:** `/impeccable harden`

#### [P3] Shared kicker / pill grammar + DESIGN.md drift
- System-level quieter/document pass; don’t special-case seminar alone for kicker. Sync CSS tokens or expand DESIGN.md for intentional off-ramp values.
- **Suggested command:** `/impeccable quieter` / `/impeccable document` (member shell)

### Persona red flags

**Jordan (confused first-timer)**  
List titles are clear; after select, “ประเภทผู้สมัคร” with prices helps. Paid path without bank → “what do I do?” Optional shirt/food with no examples → skips or invents values. Success id without explanation looks like an error code.

**Casey (distracted mobile LIFF)**  
Thumb-friendly full-width CTA; back control good. Empty-flash on open is high abandon risk. Interruption mid-slip: file lost on reload. Bank stub stops the money path cold.

**Sam (accessibility)**  
- Errors not in live region / `role="alert"`  
- List swap and success swap are visual-only  
- `.reg-upload` file input opacity pattern needs `:focus-within` (shared CSS debt)  
- `membersOnly` + disabled button announced poorly without explanatory `aria-describedby`

**Project — สมาชิกผู้ประกอบการ ABTA (LINE)**  
Expects association-grade trust for event fees. Green/gold shell promises professionalism; placeholder bank + one-tap submit feels unfinished vs PRODUCT personality.

### Cognitive load (English)
~2–3 checklist failures (hierarchy when bank empty, working memory for payment, success context). Decision points ≤4. Extraneous load spikes on paid path only.

### Emotional journey
- **Start:** List browse — calm if loading honest; valley if false empty.  
- **Middle:** Form — fine; members-only is a sharp but recoverable stop.  
- **High stakes:** Payment section — currently a trust valley (empty bank).  
- **End:** Success — polite but thin; strengthen LINE follow-up for peak-end.

### Minor observations
- `eventDate` rendered raw — format with Thai locale if API sends ISO.
- Default `applicantType: "public_paid"` before select can briefly mismatch; selection handler resets — OK if list loading fixed.
- Success uses 「ครับ」 — on-brand; keep consistency.
- `reg-rise` / reduced-motion on shared shell — good; keep.
- Detector clean on TSX ≠ a11y clean.

### Questions to consider
1. Should paid seminars **hard-block** until bank config exists (recommended), or show OA contact only?
2. Confirm step: inline above CTA vs full second screen?
3. After success, is there a member status surface for seminar registrations, or LINE push only?
4. Are shirt/food options global or per-seminar from admin?

### Detector summary

```
PRIMARY:  detect.mjs --json apps/web/src/pages/SeminarPage.tsx → [] exit 0
SECONDARY: register.css → 70 advisory (color 37, font-size 25, radius 8)
Browser overlay: not injected (no server / LIFF)
False positives: shared DESIGN.md drift; black rgba shadows; 999px pills
```

### Trend / snapshot

First formal critique for this target in `docs/ui-ux-critique/`. Persist under `.impeccable/critique/` when storage write succeeds.

---

## Concrete fix backlog (English)

Ordered for the next fix agent. Scope: `SeminarPage.tsx` + shared `register.css` / payment config (coordinate with Renew P0 bank work).

| Priority | ID | Action | Files / notes | Command |
|----------|-----|--------|---------------|---------|
| P0 | S1 | Provide real transfer details when `fee > 0` (name, account, bank; copy). If unavailable, **disable** upload/submit with clear OA message — remove inviting empty bank stub. | `SeminarPage.tsx`, shared bank config/API, `register.css` | harden |
| P0 | S2 | Mobile copy/QR affordances for account number (share component with Renew). | `SeminarPage.tsx`, CSS | harden |
| P1 | S3 | Inline confirm before submit when `fee > 0` (title, type, fee, slip). Reuse `.reg-confirm*`. | `SeminarPage.tsx`, `register.css` | harden, clarify |
| P1 | S4 | Seminar list loading / error / empty phases; `aria-live` on load. | `SeminarPage.tsx` | polish, clarify |
| P1 | S5 | `role="alert"` on errors; `aria-busy`; richer success (title, LINE expectation, optional status CTA). | `SeminarPage.tsx` | audit, clarify |
| P2 | S6 | Hide primary submit when `membersOnly`; one clear exit/action. | `SeminarPage.tsx` | distill |
| P2 | S7 | Shirt/food as selects/chips (+ อื่นๆ). | `SeminarPage.tsx`, optional API | clarify |
| P2 | S8 | Clear/replace slip controls when ready. | `SeminarPage.tsx` | adapt |
| P2 | S9 | Constrain phone via `PhoneDigitInput` / digit filter + field-level error. | `SeminarPage.tsx` | harden |
| P3 | S10 | Format `eventDate` for `th-TH`; keep single brand kicker; optional DESIGN.md sync for shared CSS advisories. | `SeminarPage.tsx`, DESIGN.md | polish / document |

**Done when:** User can pick a seminar, see honest list states, pay with real bank details (or be hard-blocked), confirm once if paid, submit, and leave success knowing LINE will follow up; AA live/focus checks pass on happy path.

**Suggested sequence:** `harden` (S1–S3, S9) → `clarify`/`polish` (S4–S5, S7) → `audit` (S5) → `distill`/`adapt` (S6, S8) → re-run critique.
