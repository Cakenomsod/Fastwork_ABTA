---
target: /renew RenewPage
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-07-27T15-03-24Z
slug: apps-web-src-pages-renewpage-tsx
---
# 04 â€” Renew (`/renew`)

> **Score:** 27/40 Â· **Band:** Acceptable (near Good)  
> **P0:** 0 Â· **P1:** 2 Â· **P2:** 3 Â· **P3:** 1  
> **Route:** `/renew`  
> **Files:** `apps/web/src/pages/RenewPage.tsx`, `TransferBank.tsx`, `register.css` (import), `shared.css` (tokens)  
> **Method:** âš ï¸ DEGRADED: single-context (critique subagent â€” nested dual-agent not permitted)  
> **Detector:** `detect.mjs --json` â†’ `[]` (clean, exit 0) on RenewPage + TransferBank  
> **Browser overlay:** skipped (LIFF auth + no reliable local renew session for injection)  
> **Date:** 2026-07-27 (re-critique after fixes)  
> **Notes:** Bank EMPTY is intentional product gate (do not score as defect). Confirm-before-submit **exists** via `PaymentConfirmPanel`.

---

## à¸ªà¸£à¸¸à¸›à¸ªà¸³à¸«à¸£à¸±à¸šà¸­à¹ˆà¸²à¸™ (à¸ à¸²à¸©à¸²à¹„à¸—à¸¢)

### à¸„à¸°à¹à¸™à¸™à¸ªà¸¸à¸‚à¸ à¸²à¸žà¸”à¸µà¹„à¸‹à¸™à¹Œ

**27/40 â€” Acceptable (à¹ƒà¸à¸¥à¹‰ Good)** â€” à¸«à¸¥à¸±à¸‡à¹à¸à¹‰: à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡à¹€à¸›à¹‡à¸™à¹€à¸à¸•à¸•à¸±à¹‰à¸‡à¹ƒà¸ˆ + à¸›à¸´à¸”à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”/à¸ªà¹ˆà¸‡ + à¸¡à¸µà¸‚à¸±à¹‰à¸™à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡ à¸ à¸²à¸£à¸à¸´à¸ˆà¹€à¸‡à¸´à¸™à¸›à¸¥à¸­à¸”à¸ à¸±à¸¢à¸‚à¸¶à¹‰à¸™à¸Šà¸±à¸” à¹à¸•à¹ˆà¸¢à¸±à¸‡à¸‚à¸²à¸”à¸—à¸²à¸‡à¸­à¸­à¸à¸•à¸­à¸™à¸£à¸­à¸•à¸£à¸§à¸ˆ, à¸ªà¸–à¸²à¸™à¸°à¸ªà¸¡à¸²à¸Šà¸´à¸à¹ƒà¸™ hero, à¹à¸¥à¸° a11y (live region / focus à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”)

| # | Heuristic | à¸„à¸°à¹à¸™à¸™ | à¸›à¸£à¸°à¹€à¸”à¹‡à¸™à¸«à¸¥à¸±à¸ |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 2 | à¹‚à¸«à¸¥à¸”à¹€à¸›à¹‡à¸™à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡; à¹„à¸¡à¹ˆà¸¡à¸µ `aria-live`; `draft.status` à¹„à¸¡à¹ˆà¹‚à¸Šà¸§à¹Œ |
| 2 | Match System / Real World | 3 | à¹„à¸—à¸¢à¸Šà¸±à¸”; à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡à¸ªà¸·à¹ˆà¸­à¸ªà¸²à¸£à¸•à¸£à¸‡ + à¸›à¸´à¸”à¹‚à¸­à¸™ â€” à¸”à¸µ |
| 3 | User Control and Freedom | 2 | Confirm à¸¡à¸µã€Œà¹à¸à¹‰à¹„à¸‚ã€; à¸£à¸­à¸•à¸£à¸§à¸ˆà¸¢à¸±à¸‡ dead-end; à¸¥à¸šà¸ªà¸¥à¸´à¸›à¹„à¸¡à¹ˆà¸Šà¸±à¸” |
| 4 | Consistency and Standards | 3 | à¹à¸Šà¸£à¹Œ `TransferBank` / `PaymentConfirmPanel` à¸à¸±à¸š flow à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™ |
| 5 | Error Prevention | 3 | à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡ + à¸›à¸´à¸”à¸ªà¹ˆà¸‡à¹€à¸¡à¸·à¹ˆà¸­à¹„à¸¡à¹ˆà¸¡à¸µà¸šà¸±à¸à¸Šà¸µ + validate à¹„à¸Ÿà¸¥à¹Œ |
| 6 | Recognition Rather Than Recall | 3 | Confirm à¸ªà¸£à¸¸à¸›à¸Šà¸·à¹ˆà¸­/à¹€à¸¥à¸‚/à¸„à¹ˆà¸²à¸˜à¸£à¸£à¸¡à¹€à¸™à¸µà¸¢à¸¡/à¸ªà¸¥à¸´à¸›; à¹„à¸¡à¹ˆà¸¡à¸µ days-left |
| 7 | Flexibility and Efficiency | 2 | à¹€à¸ªà¹‰à¸™à¸—à¸²à¸‡à¹€à¸”à¸µà¸¢à¸§ OK; à¸›à¸à¸´à¹€à¸ªà¸˜à¸¢à¸±à¸‡à¸šà¸±à¸‡à¸„à¸±à¸šà¹„à¸› `/slip` |
| 8 | Aesthetic and Minimalist Design | 3 | à¹€à¸‚à¸µà¸¢à¸§+à¸—à¸­à¸‡à¸Šà¸±à¸”; à¸à¸¥à¹ˆà¸­à¸‡ fee/bank à¸‹à¹‰à¸­à¸™à¹€à¸¥à¹‡à¸à¸™à¹‰à¸­à¸¢ |
| 9 | Error Recovery | 3 | `errorCopy` à¹„à¸—à¸¢ actionable; confirm à¸¡à¸µ `role="alert"` |
| 10 | Help and Documentation | 3 | hint à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡ + à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”; à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µ ETA à¸«à¸¥à¸±à¸‡à¸ªà¹ˆà¸‡ |
| **à¸£à¸§à¸¡** | | **27/40** | **Acceptable** |

### à¸ˆà¸¸à¸”à¹à¸‚à¹‡à¸‡

1. **à¹€à¸à¸•à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡** â€” `hasTransferAccount()` à¸›à¸´à¸”à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”+à¸›à¸¸à¹ˆà¸¡à¸ªà¹ˆà¸‡ + `NO_TRANSFER_ACCOUNT_SUBMIT_HINT` à¹„à¸¡à¹ˆà¸Šà¸§à¸™à¹‚à¸­à¸™à¸œà¸´à¸”
2. **à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡** â€” `PaymentConfirmPanel` à¸ªà¸£à¸¸à¸›à¸ªà¸¡à¸²à¸Šà¸´à¸ / à¸„à¹ˆà¸²à¸˜à¸£à¸£à¸¡à¹€à¸™à¸µà¸¢à¸¡ / à¸žà¸£à¸µà¸§à¸´à¸§à¸ªà¸¥à¸´à¸› +ã€Œà¹à¸à¹‰à¹„à¸‚ã€
3. **à¹‚à¸Ÿà¸à¸±à¸ªà¸¡à¸·à¸­à¸–à¸·à¸­** â€” hero â†’ fee â†’ bank â†’ upload â†’ CTA; success à¸¡à¸µà¹€à¸¥à¸‚à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ +ã€Œà¸”à¸¹à¸ªà¸–à¸²à¸™à¸°ã€

### à¸›à¸±à¸à¸«à¸²à¹€à¸£à¸µà¸¢à¸‡à¸•à¸²à¸¡à¸„à¸§à¸²à¸¡à¸ªà¸³à¸„à¸±à¸

| à¸£à¸°à¸”à¸±à¸š | à¸›à¸±à¸à¸«à¸² | à¸—à¸³à¹„à¸¡à¸ªà¸³à¸„à¸±à¸ |
|-------|--------|-----------|
| **P1** | à¸£à¸­à¸•à¸£à¸§à¸ˆà¹€à¸›à¹‡à¸™ dead-end; à¹„à¸¡à¹ˆà¹‚à¸Šà¸§à¹Œ `draft.status` / à¸„à¸§à¸²à¸¡à¹€à¸£à¹ˆà¸‡à¸”à¹ˆà¸§à¸™à¸§à¸±à¸™à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸ | à¸œà¸´à¸”ã€Œà¸ªà¸–à¸²à¸™à¸°à¸Šà¸±à¸”à¸à¹ˆà¸­à¸™à¸ªà¸§à¸¢ã€; à¸ªà¸¡à¸²à¸Šà¸´à¸à¹„à¸¡à¹ˆà¸£à¸¹à¹‰à¸ˆà¸°à¹„à¸›à¹„à¸«à¸™à¸•à¹ˆà¸­ |
| **P1** | a11y: à¹„à¸¡à¹ˆà¸¡à¸µ `aria-live` / `aria-busy`; `.reg-upload` à¹„à¸¡à¹ˆà¸¡à¸µ `:focus-within`; label à¹€à¸›à¹‡à¸™ `<span>` | à¹€à¸›à¹‰à¸² WCAG AA; keyboard/SR à¸žà¸¥à¸²à¸”à¸ªà¸–à¸²à¸™à¸° |
| **P2** | à¹‚à¸«à¸¥à¸”à¹€à¸›à¹‡à¸™à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸­à¸¢à¹ˆà¸²à¸‡à¹€à¸”à¸µà¸¢à¸§ à¹„à¸¡à¹ˆà¸¡à¸µ skeleton | à¹€à¸—à¸µà¸¢à¸š Status/Receipt à¸­à¹ˆà¸­à¸™ |
| **P2** | à¹„à¸¡à¹ˆà¸¡à¸µà¸›à¸¸à¹ˆà¸¡à¸¥à¸š/à¹€à¸¥à¸·à¸­à¸à¸ªà¸¥à¸´à¸›à¹ƒà¸«à¸¡à¹ˆà¸Šà¸±à¸” | à¸•à¹‰à¸­à¸‡à¹à¸•à¸°à¹‚à¸‹à¸™à¹„à¸Ÿà¸¥à¹Œà¸—à¸¶à¸šà¸‹à¹‰à¸³ |
| **P2** | à¸ªà¸¥à¸´à¸›à¸–à¸¹à¸à¸›à¸à¸´à¹€à¸ªà¸˜à¸šà¸±à¸‡à¸„à¸±à¸šà¹„à¸› `/slip` | à¸‚à¸±à¹‰à¸™à¸žà¸´à¹€à¸¨à¸©à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸ˆà¸³à¹€à¸›à¹‡à¸™ |
| **P3** | `.reg-kicker` + à¸à¸¥à¹ˆà¸­à¸‡à¸‹à¹‰à¸­à¸™à¹ƒà¸™à¸Ÿà¸­à¸£à¹Œà¸¡ | à¸£à¸°à¸šà¸šà¹à¸šà¸£à¸™à¸”à¹Œ â€” à¸­à¸¢à¹ˆà¸²à¹€à¸žà¸´à¹ˆà¸¡ eyebrow |

### à¹„à¸¡à¹ˆà¸™à¸±à¸šà¹€à¸›à¹‡à¸™à¸šà¸±à¹Šà¸ (à¸•à¸±à¹‰à¸‡à¹ƒà¸ˆ)

- **à¸šà¸±à¸à¸Šà¸µà¸£à¸±à¸šà¹‚à¸­à¸™à¸§à¹ˆà¸²à¸‡** â€” `ASSOCIATION_TRANSFER_ACCOUNT = {}` à¸ˆà¸™à¸à¸§à¹ˆà¸²à¸ªà¸¡à¸²à¸„à¸¡à¹ƒà¸ªà¹ˆà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸£à¸´à¸‡; UI à¸šà¸¥à¹‡à¸­à¸à¸ªà¹ˆà¸‡à¹à¸¥à¹‰à¸§
- **Confirm à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡** â€” à¸¡à¸µà¹à¸¥à¹‰à¸§ (`confirmOpen` â†’ `PaymentConfirmPanel`)

### Cognitive load

à¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§ ~1â€“2 à¸‚à¹‰à¸­ (pending à¹„à¸¡à¹ˆà¸¡à¸µ next step; working memory à¸™à¹‰à¸­à¸¢à¸¥à¸‡à¸«à¸¥à¸±à¸‡à¸¡à¸µ confirm) â†’ **à¸•à¹ˆà¸³â€“à¸›à¸²à¸™à¸à¸¥à¸²à¸‡**

### Personas (à¸ªà¸±à¹‰à¸™à¹†)

- **Casey (à¸¡à¸·à¸­à¸–à¸·à¸­ LINE):** CTA/confirm à¸”à¸µ; à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡à¸£à¸¹à¹‰à¸§à¹ˆà¸²à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆ; à¸£à¸­à¸•à¸£à¸§à¸ˆà¸¢à¸±à¸‡à¸•à¸±à¸™
- **Jordan (à¸•à¹ˆà¸­à¸­à¸²à¸¢à¸¸à¸„à¸£à¸±à¹‰à¸‡à¹à¸£à¸):** à¸‚à¸±à¹‰à¸™à¸¢à¸·à¸™à¸¢à¸±à¸™à¸Šà¹ˆà¸§à¸¢; à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸£à¸¹à¹‰à¸£à¸°à¸¢à¸°à¹€à¸§à¸¥à¸²à¸£à¸­à¸«à¸¥à¸±à¸‡à¸ªà¹ˆà¸‡
- **Sam (a11y):** à¹‚à¸«à¸¥à¸”/error/busy à¸¢à¸±à¸‡à¹„à¸¡à¹ˆ announce; focus à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¹„à¸¡à¹ˆà¸Šà¸±à¸”

### Top 3 à¸—à¸µà¹ˆà¹€à¸«à¸¥à¸·à¸­

1. Pending / status clarity à¹ƒà¸™ hero + CTA à¸”à¸¹à¸ªà¸–à¸²à¸™à¸° (P1)
2. Live region + focus à¸­à¸±à¸›à¹‚à¸«à¸¥à¸” (P1)
3. Skeleton à¹‚à¸«à¸¥à¸” à¸«à¸£à¸·à¸­ clear à¸ªà¸¥à¸´à¸› / inline resubmit (P2)

### à¸ªà¸£à¸¸à¸›à¸«à¸™à¸¶à¹ˆà¸‡à¸›à¸£à¸°à¹‚à¸¢à¸„

à¹€à¸‡à¸´à¸™à¸›à¸¥à¸­à¸”à¸ à¸±à¸¢à¸‚à¸¶à¹‰à¸™à¹à¸¥à¹‰à¸§ (à¸šà¸¥à¹‡à¸­à¸à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡ + à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡) â€” à¹€à¸«à¸¥à¸·à¸­à¸—à¸³à¹ƒà¸«à¹‰**à¸ªà¸–à¸²à¸™à¸°à¹€à¸”à¸´à¸™à¸•à¹ˆà¸­à¹„à¸”à¹‰**à¹à¸¥à¸°**a11y à¸œà¹ˆà¸²à¸™ AA** à¸šà¸™ happy path

---

## English (for fix agents)

âš ï¸ DEGRADED: single-context (nested dual-agent disallowed under parent subagent). Assessment A (design review) + B (detector) completed inline in one context.

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Plain loading; no `aria-live`; `draft.status` unused |
| 2 | Match System / Real World | 3 | Clear Thai; empty bank is honest + gated |
| 3 | User Control and Freedom | 2 | Confirm has Back; pending still dead-end; no slip clear |
| 4 | Consistency and Standards | 3 | Shared `TransferBank` + `PaymentConfirmPanel` |
| 5 | Error Prevention | 3 | Confirm step + submit blocked without bank + file checks |
| 6 | Recognition Rather Than Recall | 3 | Confirm summarizes member/fee/slip; no days-left |
| 7 | Flexibility and Efficiency | 2 | Fine single path; rejection still hops to `/slip` |
| 8 | Aesthetic and Minimalist Design | 3 | On-brand; mild fee/bank box stacking |
| 9 | Error Recovery | 3 | Thai `errorCopy`; confirm errors use `role="alert"` |
| 10 | Help and Documentation | 3 | Empty-bank + upload hints; no post-submit ETA |
| **Total** | | **27/40** | **Acceptable** |

### Anti-patterns verdict

**LLM:** Not SaaS cream/purple. Association green+gold intact. Empty-bank block + confirm panel feel product-trustworthy, not unfinished invite-to-pay. Uppercase `.reg-kicker` remains intentional brand mark. Pill CTAs are shared member-shell convention.

**Detector:** `detect.mjs --json apps/web/src/pages/RenewPage.tsx apps/web/src/pages/TransferBank.tsx` â†’ `[]` (0 findings).

**Overlays:** Not injected â€” LIFF session required.

**Intentional non-issues (do not re-open as P0):**
- Empty `ASSOCIATION_TRANSFER_ACCOUNT` until ops supplies real data; UI disables upload/submit and shows contact hint.
- Confirm-before-submit via `PaymentConfirmPanel` / `confirmOpen`.

### Overall impression

Renew is now a **safe money gate** when bank data is missing, and a **two-step confirm flow** when payment is enabled. Biggest remaining gap: **status exits and AA announcements**, not payment trust.

### What's working

1. `hasTransferAccount()` + empty `TransferBankBlock` + disabled submit â€” no false invitation to transfer.
2. Inline `PaymentConfirmPanel` (member, fee, slip preview, Back) before `submitRenewal`.
3. Success end-state with receipt number + status link; shared payment components with Register/Seminar.

### Priority issues

#### [P1] Pending renewal dead-end + unused membership status

- **What:** `pendingRenewal` â†’ warn text only, noã€Œà¸”à¸¹à¸ªà¸–à¸²à¸™à¸°ã€CTA. `draft.status` fetched but never rendered. Expiry is flat `à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸ {date}` without near/expired tone or days-left (StatusPage has this).
- **Why:** Principle â€œà¸ªà¸–à¸²à¸™à¸°à¸Šà¸±à¸”à¸à¹ˆà¸­à¸™à¸ªà¸§à¸¢.â€ Pending users feel trapped; expired members get no urgency cue.
- **Fix:** Pending: warn + primary link to member status (`memberStatusHrefFromUrl` / LIFF status with params). Hero: status pill from `draft.status` + expiry urgency aligned with StatusPage.
- **Suggested command:** `/impeccable clarify` (+ `/impeccable layout`)

#### [P1] WCAG AA â€” live regions & upload focus

- **What:** Loading/errors/busy lack page-level `aria-live` / `aria-busy` (confirm error has `role="alert"` only). File input is `opacity: 0` over `.reg-upload` with no `:focus-within` ring. Field label is `<span>` not `htmlFor`-wired.
- **Why:** Stated AA goal; SR/keyboard users miss state changes and focus.
- **Fix:** `aria-live="polite"` on load/error/success shells; `aria-busy` while submitting; `.reg-upload:focus-within { outlineâ€¦ }`; associate label; announce slip-ready.
- **Suggested command:** `/impeccable audit` then `/impeccable polish`

#### [P2] Loading UX is bare lead text

- **What:** ã€Œà¸à¸³à¸¥à¸±à¸‡à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­ LINEâ€¦ã€ / ã€Œà¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¸¡à¸²à¸Šà¸´à¸â€¦ã€ only â€” Status/Receipt use skeletons.
- **Fix:** Reuse skeleton pattern from StatusPage for draft load.
- **Suggested command:** `/impeccable polish`

#### [P2] No explicit replace/remove slip control

- **What:** Replacing requires re-tapping the opaque file hit area; noã€Œà¸¥à¸šà¸£à¸¹à¸›ã€/ã€Œà¹€à¸¥à¸·à¸­à¸à¹ƒà¸«à¸¡à¹ˆã€.
- **Fix:** When `slip.kind === "ready"`, show ghost button to clear + re-open picker.
- **Suggested command:** `/impeccable adapt`

#### [P2] Rejected slip forces navigation to `/slip`

- **What:** Rejected state only links to `liffPageUrl("/slip")` instead of allowing re-upload on `/renew`.
- **Fix:** Prefer inline resubmit on renew (same form) or shared upload component to avoid hop.
- **Suggested command:** `/impeccable distill`

#### [P3] Brand kicker / nested soft cards

- Keep single ABTA kicker; optional flatten bank dashed box vs fee hierarchy later.
- **Suggested command:** `/impeccable quieter` only if kickers proliferate

### Persona red flags

**Casey (Distracted Mobile â€” primary LIFF):**
- Empty bank: clear stop + contact â€” good.
- Pending: no thumb-zone exit to status.
- Slip file lost on LIFF suspend/reload (no persistence).

**Jordan (First-Timer renewing):**
- Confirm step explains what will be sent â€” good.
- Still unclear how long treasurer review takes after success.
- Pending message without next step â†’ support contact.

**Sam (Accessibility-Dependent):**
- Busy/success/load not announced at page level.
- Invisible focus on file control.
- Confirm panel better (alert on error); form path still thin.

**Project â€” à¸ªà¸¡à¸²à¸Šà¸´à¸à¸œà¸¹à¹‰à¸›à¸£à¸°à¸à¸­à¸šà¸à¸²à¸£ ABTA:**
- Empty-bank gate + confirm now match association trust. Remaining debt is status clarity, not payment theater.

### Cognitive load checklist

| Item | Pass? |
|------|-------|
| Single focus | Partial (pending dead-end distracts) |
| Chunking â‰¤4 | Pass (fee / bank / upload) |
| Grouping | Pass |
| Visual hierarchy | Pass (fee + empty bank honest) |
| One thing at a time | Pass (+ confirm step) |
| Minimal choices | Pass |
| Working memory | Pass on confirm; Fail on pending next-step |
| Progressive disclosure | Pass |

**~1â€“2 failures â†’ lowâ€“moderate.**

### Minor observations

- Success copy ã€Œà¸„à¸£à¸±à¸šã€ â€” on-brand; keep consistent.
- `data_rejected` CTA â†’ `/register` may surprise; ensure copy matches destination.
- `reg-rise` / reduced-motion in shared shell â€” good.
- Detector clean â‰  a11y clean.
- When bank data eventually ships, copy buttons / QR remain open product work (not scored now).

### Questions (for product owner)

1. Pending renewal: always deep-link to `/status`, or also show receipt number if API exposes it?
2. Rejected renewals: keep `/slip` only, or inline resubmit on `/renew`?
3. When bank data arrives, do we need copy-to-clipboard + QR in the same `TransferBankBlock`?

### Detector summary

```
detect.mjs targets: RenewPage.tsx TransferBank.tsx
result: []
exit: 0
false positives: n/a
```

### Trend / snapshot

Previous formal critique: **23/40** (P0:1, P1:3) â†’ this run **27/40** (P0:0, P1:2). +4 from empty-bank gate + confirm-before-submit. Persist under `.impeccable/critique/` when storage write succeeds.

---

## Concrete fix backlog (English)

Ordered for the next fix agent. Scope: `RenewPage.tsx` + `register.css` (+ status link helpers). Do **not** invent bank account data.

| Priority | ID | Action | Files / notes | Command |
|----------|-----|--------|---------------|---------|
| P1 | R4 | Pending renewal: primary CTA to member status; optional secondary back to OA | `RenewPage.tsx`, `member-links` | clarify |
| P1 | R5 | Surface `draft.status` + expiry urgency (pill / days-left) in hero | `RenewPage.tsx` | clarify, layout |
| P1 | R6 | `aria-live` for load/error/success; `aria-busy` on submit; `:focus-within` on `.reg-upload`; label association | `RenewPage.tsx`, `register.css` | audit, polish |
| P2 | R7 | Skeleton loading matching StatusPage | `RenewPage.tsx`, CSS | polish |
| P2 | R8 | Clear/replace slip controls when ready | `RenewPage.tsx` | adapt |
| P2 | R9 | Prefer inline slip resubmit on renew when `receiptStatus === "rejected"` | `RenewPage.tsx` | distill |
| P3 | R10 | Optional: reduce inner-box stacking; keep single brand kicker | `register.css` | quieter / layout |

**Done when:** Pending users always have a status exit; hero shows membership status/expiry urgency; AA live/focus checks pass on renew happy path (including empty-bank gated state).

**Suggested sequence:** `clarify` (R4â€“R5) â†’ `audit`/`polish` (R6â€“R7) â†’ `adapt`/`distill` (R8â€“R9) â†’ re-run critique.

**Fixed since prior critique (do not regress):**
- R1/R2 empty-bank intentional gate (upload/submit disabled + honest empty UI)
- R3 inline confirm before `submitRenewal`
