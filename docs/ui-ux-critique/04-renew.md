# 04 — Renew (`/renew`)

> **Score:** 23/40 · **Band:** Acceptable  
> **P0:** 1 · **P1:** 3 · **P2:** 3 · **P3:** 2  
> **Route:** `/renew`  
> **Files:** `apps/web/src/pages/RenewPage.tsx`, `register.css` (import), `shared.css` (tokens)  
> **Method:** ⚠️ DEGRADED: single-context (critique subagent — nested dual-agent not permitted)  
> **Detector:** `detect.mjs --json` → `[]` (clean, exit 0)  
> **Browser overlay:** skipped (LIFF auth + no reliable local renew session for injection)  
> **Date:** 2026-07-27

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์

**23/40 — Acceptable** — โครงหน้าต่ออายุใช้ได้และสอดคล้องกับหน้า register แต่ยังทำภารกิจหลัก (โอนเงินแล้วส่งสลิปอย่างมั่นใจ) ไม่ครบ เพราะบัญชีรับโอนยังเป็น placeholder และไม่มีขั้นยืนยันก่อนส่งคำขอที่มีความเสี่ยงสูง

| # | Heuristic | คะแนน | ประเด็นหลัก |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 2 | โหลดเป็นข้อความเปล่า ไม่มี skeleton/`aria-live`; `draft.status` ไม่แสดง |
| 2 | Match System / Real World | 3 | ภาษาไทยชัด ค่าธรรมเนียมเป็นบาท แต่บัญชีโอนไม่ใช่ของจริง |
| 3 | User Control and Freedom | 2 | สถานะรอตรวจไม่มีทางออก; ลบสลิปไม่ได้ชัดเจน |
| 4 | Consistency and Standards | 3 | ใช้ shell เดียวกับ register — ดี แต่ติดหนี้บัญชีร่วมกัน |
| 5 | Error Prevention | 1 | ไม่มียืนยันก่อนส่งคำขอชำระเงิน; โอนได้โดยไม่มีบัญชี |
| 6 | Recognition Rather Than Recall | 2 | ต้องจำบัญชีจากที่อื่น; ไม่มี days-left แบบหน้า status |
| 7 | Flexibility and Efficiency | 2 | เส้นทางเดียวเหมาะ LIFF; ถูกปฏิเสธต้องไป `/slip` แยก |
| 8 | Aesthetic and Minimalist Design | 3 | เขียว+ทองชัด โฟกัสงานเดียว มีกล่องซ้อนเล็กน้อย |
| 9 | Error Recovery | 3 | ข้อความ error ภาษาไทย actionable หลายเคส |
| 10 | Help and Documentation | 2 | hint อัปโหลดมี; ไม่บอกขั้นตอนหลังส่ง / หมายเหตุการโอน |
| **รวม** | | **23/40** | **Acceptable** |

### จุดแข็ง

1. **โฟกัสงานเดียวบนมือถือ** — hero ชื่อ/เลขสมาชิก → ค่าธรรมเนียม → อัปโหลดสลิป → CTA เต็มความกว้าง เหมาะ LINE LIFF
2. **สถานะหลังส่งชัด** — แสดงเลขใบเสร็จ + ลิงก์「ดูสถานะ」หลังสำเร็จ
3. **กันไฟล์ผิด** — จำกัด JPG/PNG และ 5 MB พร้อมข้อความไทย; ปุ่มส่งปิดจนกว่ามีสลิป

### ปัญหาเรียงตามความสำคัญ

| ระดับ | ปัญหา | ทำไมสำคัญ |
|-------|--------|-----------|
| **P0** | บัญชีรับโอนเป็น「รอข้อมูลจากสมาคม」 | สมาชิกโอนเงินไม่ได้ถูกต้อง → ต่ออายุจริงไม่ได้ / เสี่ยงโอนผิด |
| **P1** | ไม่มีขั้นยืนยันก่อน「ส่งคำขอต่ออายุ」 | ธุรกรรมเงิน — ผิดหลัก「ยืนยันก่อนทำลาย/สำคัญ」ใน PRODUCT |
| **P1** | สถานะไม่ชัด: รอตรวจเป็น dead-end; ไม่ใช้ `draft.status`; หมดอายุแบนๆ | ผิดหลัก「สถานะชัดก่อนสวย」; เทียบหน้า `/status` อ่อนกว่า |
| **P1** | a11y: ไม่มี `aria-live` / focus upload หาย (input opacity 0) | เป้า WCAG AA; ผู้ใช้ keyboard/SR สับสนตอนโหลด/error |
| **P2** | โหลดเป็นข้อความอย่างเดียว ไม่มี skeleton | รู้สึกช้า/ว่างบนพื้นเขียว |
| **P2** | ไม่มีปุ่มลบ/เปลี่ยนสลิปชัด (ต้องเลือกไฟล์ใหม่) | Casey มือถืออาจสับสน |
| **P2** | สลิปถูกปฏิเสธบังคับไป `/slip` แทนอัปโหลดในหน้า | ขั้นพิเศษโดยไม่จำเป็น |
| **P3** | `.reg-kicker` uppercase tracked | ระบบแบรนด์ — อย่าลบทั้งไซต์; อย่าเพิ่ม eyebrow ซ้ำ |
| **P3** | กล่อง fee + bank + upload ใน form card | ซ้อนเล็กน้อย ไม่ถึง nested-card ร้ายแรง |

### Cognitive load

ล้มเหลว ~2 ข้อ (working memory เรื่องบัญชี, สถานะรอตรวจไม่มี next step) → **ปานกลาง**

### Personas (สั้นๆ)

- **Casey (มือถือ LINE):** CTA ล่างดี แต่บัญชีว่างทำให้หยุด; thumb ใช้ได้
- **Jordan (ต่ออายุครั้งแรก):** ไม่รู้จะโอนไปไหน; ไม่มีสรุปก่อนกดส่ง
- **Sam (a11y):** error/โหลดไม่อ่านออกผ่าน live region; focus บน upload ไม่ชัด

### สรุปหนึ่งประโยค

หน้าดูเป็นสมาคมและสั้นพอดี แต่**ยังต่ออายุเงินจริงไม่ได้**จนกว่าจะมีบัญชีโอน + ขั้นยืนยัน + สถานะที่เดินต่อได้

---

## English (for fix agents)

⚠️ DEGRADED: single-context (nested dual-agent disallowed under parent subagent). Assessment A (design review) + B (detector) completed inline in one context.

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Plain loading text; no `aria-live`; `draft.status` unused |
| 2 | Match System / Real World | 3 | Clear Thai + fee; bank block is not real-world transfer data |
| 3 | User Control and Freedom | 2 | Pending renewal has no exit CTA; no explicit slip clear |
| 4 | Consistency and Standards | 3 | Shared `reg-*` shell with register (good) + shared bank debt |
| 5 | Error Prevention | 1 | No confirm before payment submit; can proceed without bank |
| 6 | Recognition Rather Than Recall | 2 | User must recall bank details; no days-left vs StatusPage |
| 7 | Flexibility and Efficiency | 2 | Fine single path; rejection forces `/slip` hop |
| 8 | Aesthetic and Minimalist Design | 3 | On-brand green+gold; slight box stacking inside form |
| 9 | Error Recovery | 3 | Thai `errorCopy` mostly actionable |
| 10 | Help and Documentation | 2 | Upload hints OK; no post-submit / transfer-note guidance |
| **Total** | | **23/40** | **Acceptable** |

### Anti-patterns verdict

**LLM:** Not generic SaaS cream/purple. Association green + gold atmosphere matches DESIGN.md. Uppercase `.reg-kicker` is intentional brand mark (one kicker), not section-eyebrow spam. Pill CTAs (`border-radius: 999px`) are shared member-shell convention — leave unless redesigning the system. Main failure is **task incompleteness** (payment instructions), not visual slop.

**Detector:** `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/RenewPage.tsx` → `[]` (0 findings). No deterministic AI-slop hits on the TSX. CSS-only risks (e.g. invisible file focus) are outside detector markup scan.

**Overlays:** Not injected — LIFF session required; no reliable local renew view for live detect.js.

### Overall impression

Renew is a thin, correct-feeling LIFF form that reuses register payment UI. Biggest opportunity: make renewal a **trustworthy money flow** — real bank details, confirm amount/member, and clear status exits — not just “upload slip.”

### What's working

1. Mobile single-column task flow with member identity in hero and fee callout.
2. Success end-state: receipt number + “ดูสถานะ” CTA.
3. Client-side slip constraints + disabled submit until file ready; rejected path has CTA.

### Priority issues

#### [P0] Bank account is a permanent placeholder

- **What:** `.reg-bank` shows 「รอข้อมูลจากสมาคม」 / “will show when association confirms” — no account name, number, or bank. Same stub as Register/Seminar. `RenewDraft` has no bank fields; API has no transfer payload.
- **Why:** Core renew task = pay correct amount to correct account, then upload proof. Without details, members abandon, pay wrong, or spam support. Directly violates “สถานะชัดก่อนสวย” / trustworthy association positioning.
- **Fix:** Ship transfer details from config/API into draft; render copyable account name, number, bank; optional QR. Until live, **block submit** with explicit “ยังไม่เปิดรับต่ออายุออนไลน์” + link to OA — do not invite slip upload against empty bank.
- **Suggested command:** `/impeccable harden` (then `/impeccable clarify` for copy)

#### [P1] No confirmation before high-stakes submit

- **What:** One tap from slip-ready → `submitRenewal`. No review of fee, memberId, or “I transferred X THB.” Register legacy flow already has `.reg-confirm*` patterns unused here.
- **Why:** PRODUCT principle #3 — confirm important actions. Wrong slip / wrong amount creates treasurer queue waste and member anxiety.
- **Fix:** Inline confirm step (reuse `.reg-confirm`): show name, memberId, fee, slip thumb; primary “ยืนยันส่งคำขอ”; secondary “แก้ไข.” Prefer inline over `window.confirm`.
- **Suggested command:** `/impeccable harden` (+ `/impeccable clarify`)

#### [P1] Status clarity gaps (pending dead-end + unused membership status)

- **What:** `pendingRenewal` → warn text only, no status link. `draft.status` fetched but never rendered. Expiry is flat `หมดอายุ {date}` without near/expired tone or days-left (StatusPage has this).
- **Why:** Principle “สถานะชัดก่อนสวย.” Pending users feel trapped; expired members don’t feel urgency.
- **Fix:** Pending: warn + primary “ดูสถานะคำขอ” (`/status` with member params). Hero: status pill from `draft.status` + expiry urgency. Align labels with StatusPage tones.
- **Suggested command:** `/impeccable clarify` (+ `/impeccable layout` for pill/hero)

#### [P1] WCAG AA gaps — live regions & upload focus

- **What:** Loading/errors/busy lack `aria-live` / `aria-busy`. File input is `opacity: 0` over `.reg-upload` with no `:focus-within` ring. Field label is `<span>` not wired `htmlFor`. Contrast of gold-soft on green is generally OK for large/bold; keep muted tokens as DESIGN.md.
- **Why:** Stated AA goal; screen-reader and keyboard users miss state changes.
- **Fix:** `aria-live="polite"` for draft load/errors; `aria-busy` while submitting; `.reg-upload:focus-within { outline… }`; associate label; announce slip-ready.
- **Suggested command:** `/impeccable audit` then `/impeccable polish`

#### [P2] Loading UX is bare lead text

- **What:** 「กำลังเชื่อมต่อ LINE…」 / 「กำลังโหลดข้อมูลสมาชิก…」 only — Status/Receipt use skeletons.
- **Fix:** Reuse skeleton pattern from StatusPage for draft load.
- **Suggested command:** `/impeccable polish`

#### [P2] No explicit replace/remove slip control

- **What:** Replacing requires re-tapping the opaque file hit area; no “ลบรูป” / “เลือกใหม่.”
- **Fix:** When `slip.kind === "ready"`, show ghost button to clear + re-open picker.
- **Suggested command:** `/impeccable adapt`

#### [P2] Rejected slip forces navigation to `/slip`

- **What:** Rejected state only links to `liffPageUrl("/slip")` instead of allowing re-upload on `/renew`.
- **Fix:** Prefer inline resubmit on renew (same form) or deep-link with shared component to avoid duplicate UX debt.
- **Suggested command:** `/impeccable distill`

#### [P3] Brand kicker / nested soft cards

- Keep single ABTA kicker; don’t add more uppercase eyebrows. Optional flatten bank dashed box vs fee gradient hierarchy later.
- **Suggested command:** `/impeccable quieter` only if kickers proliferate

### Persona red flags

**Casey (Distracted Mobile — primary LIFF):**
- Stops at empty bank; may upload old slip anyway.
- Submit at bottom is good; no sticky confirm of amount while scrolling preview.
- Interruption: no draft persistence of selected slip across LIFF suspend (file lost on reload).

**Jordan (First-Timer renewing):**
- Doesn’t know what “ส่งคำขอต่ออายุ” implies (queue vs instant active).
- No checklist: “โอนแล้ว → แนบสลิป → รอเหรัญญิก.”
- Pending message without next step → support contact.

**Sam (Accessibility-Dependent):**
- Busy/success/error not announced.
- Invisible focus on file control.
- Warn/success rely on color + text (text OK) but live region missing.

**Project — สมาชิกผู้ประกอบการ ABTA:**
- Expects association-grade trust on money. Placeholder bank + one-tap submit feels unfinished vs green/gold brand promise.

### Cognitive load checklist

| Item | Pass? |
|------|-------|
| Single focus | Partial (pending dead-end distracts) |
| Chunking ≤4 | Pass (fee / bank / upload) |
| Grouping | Pass |
| Visual hierarchy | Partial (fee strong; bank empty weakens) |
| One thing at a time | Pass on happy path |
| Minimal choices | Pass |
| Working memory | **Fail** (bank must be recalled) |
| Progressive disclosure | Pass |

**~2 failures → moderate.**

### Minor observations

- Success copy uses 「ครับ」 — on-brand warmth; keep consistent across member surfaces.
- `data_rejected` CTA → `/register` may surprise; ensure copy matches that destination.
- `reg-rise` animation has `prefers-reduced-motion` — good.
- Detector clean ≠ a11y clean.

### Questions (for product owner)

1. Are bank details blocked on missing ops data, or waiting on API fields? Should UI hard-block renew until ready?
2. Confirm step: full-screen step vs compact summary above CTA?
3. Should rejected renewals resubmit on `/renew` or stay on `/slip` only?

### Detector summary

```
detect.mjs target: apps/web/src/pages/RenewPage.tsx
result: []
exit: 0
false positives: n/a
```

### Trend / snapshot

First formal critique for this target in `docs/ui-ux-critique/`. Also persist under `.impeccable/critique/` when storage write succeeds.

---

## Concrete fix backlog (English)

Ordered for the next fix agent. Scope: `RenewPage.tsx` + `register.css` (+ API/draft only if needed for P0).

| Priority | ID | Action | Files / notes | Command |
|----------|-----|--------|---------------|---------|
| P0 | R1 | Provide real transfer details in renew draft UI (name, account no., bank; copy buttons). If data unavailable, **disable** upload/submit with clear OA message — remove inviting empty bank stub. | `RenewPage.tsx`, `api.ts` RenewDraft, backend draft if needed, `register.css` | harden |
| P0 | R2 | Wire copy/QR affordances for account number (mobile). | `RenewPage.tsx`, CSS | harden |
| P1 | R3 | Add inline confirm step before `submitRenewal` (member, fee, slip preview). Reuse `.reg-confirm*`. | `RenewPage.tsx`, `register.css` | harden, clarify |
| P1 | R4 | Pending renewal: add primary CTA to member status; optional secondary dismiss/back to OA. | `RenewPage.tsx`, `member-links` | clarify |
| P1 | R5 | Surface `draft.status` + expiry urgency (pill / days-left) in hero. | `RenewPage.tsx`, tokens | clarify, layout |
| P1 | R6 | `aria-live` for load/error/success; `aria-busy` on submit; `:focus-within` on `.reg-upload`; proper label association. | `RenewPage.tsx`, `register.css` | audit, polish |
| P2 | R7 | Skeleton loading matching StatusPage. | `RenewPage.tsx`, CSS | polish |
| P2 | R8 | Clear/replace slip controls when ready. | `RenewPage.tsx` | adapt |
| P2 | R9 | Prefer inline slip resubmit on renew when `receiptStatus === "rejected"`. | `RenewPage.tsx` | distill |
| P3 | R10 | Optional: reduce inner-box stacking; keep single brand kicker. | `register.css` | quieter / layout |

**Done when:** Member can see correct bank + fee, confirm once, submit, and always has a status exit; AA live/focus checks pass on the renew happy path.

**Suggested sequence:** `harden` (R1–R3) → `clarify` (R4–R5) → `audit`/`polish` (R6–R7) → `adapt`/`distill` (R8–R9) → re-run critique.
