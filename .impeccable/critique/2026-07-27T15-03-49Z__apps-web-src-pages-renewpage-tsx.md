---
target: /renew RenewPage
total_score: 31
p0_count: 0
p1_count: 3
timestamp: 2026-07-27T15-03-49Z
slug: apps-web-src-pages-renewpage-tsx
---
# 04 â€” Renew (`/renew`)

âš ï¸ **DEGRADED: single-context** (critique nested under parent Multitask subagent â€” dual Assessment A/B spawn blocked; design review + `detect.mjs` ran inline)

> **Score:** 31/40 Â· **Band:** Good  
> **P0:** 0 Â· **P1:** 3 Â· **P2:** 3 Â· **P3:** 1  
> **Route:** `/renew`  
> **Files:** `apps/web/src/pages/RenewPage.tsx`, `TransferBank.tsx`, `register.css` (import), `shared.css` (tokens)  
> **Method:** single-context (A: design review Â· B: detector)  
> **Detector:** `detect.mjs --json` on `RenewPage.tsx` + `TransferBank.tsx` â†’ `[]` (clean, exit 0)  
> **Browser overlay:** skipped (LIFF auth + no reliable local renew session for injection)  
> **Note:** Bank intentionally empty â€” **not** scored as â€œinvent bank data.â€ Confirm-before-submit **exists**.  
> **Prior:** 23/40 Acceptable (2026-07-27) â†’ **31/40 Good** (re-run after fixes)  
> **Date:** 2026-07-27

---

## à¸ªà¸£à¸¸à¸›à¸ªà¸³à¸«à¸£à¸±à¸šà¸­à¹ˆà¸²à¸™ (à¸ à¸²à¸©à¸²à¹„à¸—à¸¢)

### à¸„à¸°à¹à¸™à¸™à¸ªà¸¸à¸‚à¸ à¸²à¸žà¸”à¸µà¹„à¸‹à¸™à¹Œ

**31/40 â€” Good** â€” à¸«à¸¥à¸±à¸‡à¹à¸à¹‰à¹à¸¥à¹‰à¸§ à¹‚à¸Ÿà¸¥à¸§à¹Œà¸•à¹ˆà¸­à¸­à¸²à¸¢à¸¸à¸¡à¸µà¸‚à¸±à¹‰à¸™à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡ à¹à¸¥à¸°à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡à¸–à¸¹à¸à¹€à¸à¸•à¸­à¸¢à¹ˆà¸²à¸‡à¸‹à¸·à¹ˆà¸­à¸ªà¸±à¸•à¸¢à¹Œ (à¸›à¸´à¸”à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”/à¸ªà¹ˆà¸‡ + à¸šà¸­à¸à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆ) à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡ invent à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸˜à¸™à¸²à¸„à¸²à¸£ à¹€à¸«à¸¥à¸·à¸­à¸Šà¹ˆà¸­à¸‡à¹‚à¸«à¸§à¹ˆà¸ªà¸–à¸²à¸™à¸°/à¸—à¸²à¸‡à¸­à¸­à¸ à¹à¸¥à¸° a11y à¹€à¸›à¹‡à¸™à¸«à¸¥à¸±à¸

| # | Heuristic | à¸„à¸°à¹à¸™à¸™ | à¸›à¸£à¸°à¹€à¸”à¹‡à¸™à¸«à¸¥à¸±à¸ |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 2 | à¹‚à¸«à¸¥à¸”à¹€à¸›à¹‡à¸™à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¹€à¸›à¸¥à¹ˆà¸²; à¹„à¸¡à¹ˆà¸¡à¸µ `aria-live`; `draft.status` à¹„à¸¡à¹ˆà¹à¸ªà¸”à¸‡; pending à¸­à¹ˆà¸­à¸™ |
| 2 | Match System / Real World | 4 | à¸ à¸²à¸©à¸²à¹„à¸—à¸¢à¸Šà¸±à¸” à¸„à¹ˆà¸²à¸˜à¸£à¸£à¸¡à¹€à¸™à¸µà¸¢à¸¡à¹€à¸›à¹‡à¸™à¸šà¸²à¸—; à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡ = à¸ªà¸–à¸²à¸™à¸° ops à¸ˆà¸£à¸´à¸‡ à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆ placeholder à¸«à¸¥à¸­à¸ |
| 3 | User Control and Freedom | 3 | Confirm à¸¡à¸µã€Œà¹à¸à¹‰à¹„à¸‚ã€; pending à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µ CTA à¸­à¸­à¸; à¸¥à¸šà¸ªà¸¥à¸´à¸›à¹„à¸¡à¹ˆà¸Šà¸±à¸” |
| 4 | Consistency and Standards | 4 | `TransferBank` + `PaymentConfirmPanel` à¸£à¹ˆà¸§à¸¡à¸à¸±à¸š register/seminar |
| 5 | Error Prevention | 4 | à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡à¸¡à¸µà¹à¸¥à¹‰à¸§; à¸›à¸´à¸”à¸ªà¹ˆà¸‡à¹€à¸¡à¸·à¹ˆà¸­à¹„à¸¡à¹ˆà¸¡à¸µà¸šà¸±à¸à¸Šà¸µ/à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸¥à¸´à¸›; à¸à¸±à¸™à¹„à¸Ÿà¸¥à¹Œà¸œà¸´à¸” |
| 6 | Recognition Rather Than Recall | 3 | à¸„à¹ˆà¸²à¸˜à¸£à¸£à¸¡à¹€à¸™à¸µà¸¢à¸¡/à¸šà¸±à¸à¸Šà¸µà¸­à¸¢à¸¹à¹ˆà¸šà¸™à¸«à¸™à¹‰à¸²; à¹„à¸¡à¹ˆà¸¡à¸µ days-left / à¸ªà¸–à¸²à¸™à¸°à¸ªà¸¡à¸²à¸Šà¸´à¸à¹à¸šà¸š `/status` |
| 7 | Flexibility and Efficiency | 2 | à¹€à¸ªà¹‰à¸™à¸—à¸²à¸‡à¹€à¸”à¸µà¸¢à¸§à¹€à¸«à¸¡à¸²à¸° LIFF; à¸ªà¸¥à¸´à¸›à¸–à¸¹à¸à¸›à¸à¸´à¹€à¸ªà¸˜à¸šà¸±à¸‡à¸„à¸±à¸šà¹„à¸› `/slip` |
| 8 | Aesthetic and Minimalist Design | 3 | à¹€à¸‚à¸µà¸¢à¸§+à¸—à¸­à¸‡à¸Šà¸±à¸” à¹‚à¸Ÿà¸à¸±à¸ªà¸‡à¸²à¸™à¹€à¸”à¸µà¸¢à¸§; à¸à¸¥à¹ˆà¸­à¸‡ fee/bank à¸‹à¹‰à¸­à¸™à¹€à¸¥à¹‡à¸à¸™à¹‰à¸­à¸¢ |
| 9 | Error Recovery | 3 | `errorCopy` à¹„à¸—à¸¢ actionable; confirm à¸¡à¸µ `role="alert"`; à¸Ÿà¸­à¸£à¹Œà¸¡à¸«à¸¥à¸±à¸à¸¢à¸±à¸‡à¹„à¸¡à¹ˆ announce |
| 10 | Help and Documentation | 3 | hint à¸­à¸±à¸›à¹‚à¸«à¸¥à¸” + à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡ + à¸„à¸³à¹€à¸•à¸·à¸­à¸™ confirm; à¹„à¸¡à¹ˆà¸šà¸­à¸à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸«à¸¥à¸±à¸‡à¸ªà¹ˆà¸‡à¸Šà¸±à¸” |
| **à¸£à¸§à¸¡** | | **31/40** | **Good** |

### à¸ˆà¸¸à¸”à¹à¸‚à¹‡à¸‡

1. **à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡à¸¡à¸µà¹à¸¥à¹‰à¸§** â€” `PaymentConfirmPanel` à¸ªà¸£à¸¸à¸›à¸Šà¸·à¹ˆà¸­/à¹€à¸¥à¸‚à¸ªà¸¡à¸²à¸Šà¸´à¸/à¸„à¹ˆà¸²à¸˜à¸£à¸£à¸¡à¹€à¸™à¸µà¸¢à¸¡ + à¸žà¸£à¸µà¸§à¸´à¸§à¸ªà¸¥à¸´à¸› + ã€Œà¹à¸à¹‰à¹„à¸‚ã€ à¸•à¸²à¸¡à¸«à¸¥à¸±à¸ PRODUCT
2. **à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡à¸–à¸¹à¸à¹€à¸à¸•à¸­à¸¢à¹ˆà¸²à¸‡à¸‹à¸·à¹ˆà¸­à¸ªà¸±à¸•à¸¢à¹Œ** â€” `hasTransferAccount()` à¸›à¸´à¸”à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”/à¸ªà¹ˆà¸‡ + `NO_TRANSFER_ACCOUNT_SUBMIT_HINT` (à¹„à¸¡à¹ˆà¸Šà¸§à¸™à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸—à¸±à¸šà¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡)
3. **à¹‚à¸Ÿà¸à¸±à¸ªà¸‡à¸²à¸™à¹€à¸”à¸µà¸¢à¸§à¸šà¸™à¸¡à¸·à¸­à¸–à¸·à¸­** â€” hero â†’ à¸„à¹ˆà¸²à¸˜à¸£à¸£à¸¡à¹€à¸™à¸µà¸¢à¸¡ â†’ à¸˜à¸™à¸²à¸„à¸²à¸£/à¸­à¸±à¸›à¹‚à¸«à¸¥à¸” â†’ CTA; à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸¡à¸µà¹€à¸¥à¸‚à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ +ã€Œà¸”à¸¹à¸ªà¸–à¸²à¸™à¸°ã€

### à¸›à¸±à¸à¸«à¸²à¹€à¸£à¸µà¸¢à¸‡à¸•à¸²à¸¡à¸„à¸§à¸²à¸¡à¸ªà¸³à¸„à¸±à¸

| à¸£à¸°à¸”à¸±à¸š | à¸›à¸±à¸à¸«à¸² | à¸—à¸³à¹„à¸¡à¸ªà¸³à¸„à¸±à¸ |
|-------|--------|-----------|
| **P1** | `pendingRenewal` à¹€à¸›à¹‡à¸™ dead-end â€” à¸¡à¸µà¹à¸„à¹ˆ warn à¹„à¸¡à¹ˆà¸¡à¸µã€Œà¸”à¸¹à¸ªà¸–à¸²à¸™à¸°ã€ | à¸œà¸´à¸”à¸«à¸¥à¸±à¸ã€Œà¸ªà¸–à¸²à¸™à¸°à¸Šà¸±à¸”à¸à¹ˆà¸­à¸™à¸ªà¸§à¸¢ã€; à¸ªà¸¡à¸²à¸Šà¸´à¸à¸£à¸¹à¹‰à¸ªà¸¶à¸à¸•à¸´à¸” |
| **P1** | a11y: à¹„à¸¡à¹ˆà¸¡à¸µ `aria-live` / `aria-busy`; `.reg-upload` à¹„à¸¡à¹ˆà¸¡à¸µ `:focus-within` | à¹€à¸›à¹‰à¸² WCAG AA; keyboard/SR à¸žà¸¥à¸²à¸”à¸ªà¸–à¸²à¸™à¸° |
| **P1** | à¹„à¸¡à¹ˆà¹ƒà¸Šà¹‰ `draft.status` + à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸à¹à¸šà¸™à¹† à¹„à¸¡à¹ˆà¸¡à¸µ urgency/days-left | à¹€à¸—à¸µà¸¢à¸š `/status` à¸­à¹ˆà¸­à¸™; à¹„à¸¡à¹ˆà¸à¸£à¸°à¸•à¸¸à¹‰à¸™à¸•à¹ˆà¸­à¸­à¸²à¸¢à¸¸ |
| **P2** | à¹‚à¸«à¸¥à¸”à¹€à¸›à¹‡à¸™à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸­à¸¢à¹ˆà¸²à¸‡à¹€à¸”à¸µà¸¢à¸§ à¹„à¸¡à¹ˆà¸¡à¸µ skeleton | à¸£à¸¹à¹‰à¸ªà¸¶à¸à¸Šà¹‰à¸²/à¸§à¹ˆà¸²à¸‡à¸šà¸™à¸žà¸·à¹‰à¸™à¹€à¸‚à¸µà¸¢à¸§ |
| **P2** | à¹„à¸¡à¹ˆà¸¡à¸µà¸›à¸¸à¹ˆà¸¡à¸¥à¸š/à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¸¥à¸´à¸›à¸Šà¸±à¸” | à¸•à¹‰à¸­à¸‡à¹à¸•à¸°à¹‚à¸‹à¸™à¹„à¸Ÿà¸¥à¹Œà¸—à¸¶à¸šà¸‹à¹‰à¸³ |
| **P2** | à¸ªà¸¥à¸´à¸›à¸–à¸¹à¸à¸›à¸à¸´à¹€à¸ªà¸˜à¸šà¸±à¸‡à¸„à¸±à¸šà¹„à¸› `/slip` | à¸‚à¸±à¹‰à¸™à¸žà¸´à¹€à¸¨à¸©à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸ˆà¸³à¹€à¸›à¹‡à¸™ |
| **P3** | `.reg-kicker` uppercase tracked | à¸£à¸°à¸šà¸šà¹à¸šà¸£à¸™à¸”à¹Œ â€” à¸­à¸¢à¹ˆà¸²à¹€à¸žà¸´à¹ˆà¸¡ eyebrow à¸‹à¹‰à¸³ |

**à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆà¸šà¸±à¹Šà¸à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¹à¸à¹‰à¹ƒà¸™à¸£à¸­à¸šà¸™à¸µà¹‰:** à¸šà¸±à¸à¸Šà¸µà¸£à¸±à¸šà¹‚à¸­à¸™à¸§à¹ˆà¸²à¸‡à¹‚à¸”à¸¢à¹€à¸ˆà¸•à¸™à¸² â€” à¸­à¸¢à¹ˆà¸² invent à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸˜à¸™à¸²à¸„à¸²à¸£

### Cognitive load

à¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§ ~1 à¸‚à¹‰à¸­ (pending à¹„à¸¡à¹ˆà¸¡à¸µ next step à¹€à¸›à¹‡à¸™ distraction) â†’ **à¸•à¹ˆà¸³â€“à¸›à¸²à¸™à¸à¸¥à¸²à¸‡**

### Personas (à¸ªà¸±à¹‰à¸™à¹†)

- **Casey (à¸¡à¸·à¸­à¸–à¸·à¸­ LINE):** Confirm + CTA à¸¥à¹ˆà¸²à¸‡à¸”à¸µ; pending à¹„à¸¡à¹ˆà¸¡à¸µà¸—à¸²à¸‡à¸­à¸­à¸; focus à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¹„à¸¡à¹ˆà¸Šà¸±à¸”
- **Jordan (à¸•à¹ˆà¸­à¸­à¸²à¸¢à¸¸à¸„à¸£à¸±à¹‰à¸‡à¹à¸£à¸):** à¸‚à¸±à¹‰à¸™à¸¢à¸·à¸™à¸¢à¸±à¸™à¸Šà¹ˆà¸§à¸¢; à¸–à¹‰à¸²à¸šà¸±à¸à¸Šà¸µà¸§à¹ˆà¸²à¸‡à¸£à¸¹à¹‰à¸§à¹ˆà¸²à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆ; à¹„à¸¡à¹ˆà¸£à¸¹à¹‰ urgency à¸ˆà¸²à¸à¸§à¸±à¸™à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸
- **Sam (a11y):** à¹‚à¸«à¸¥à¸”/error/busy à¹„à¸¡à¹ˆà¸­à¹ˆà¸²à¸™à¸œà¹ˆà¸²à¸™ live region; focus à¸šà¸™ upload à¸«à¸²à¸¢

### Top 3 à¸—à¸µà¹ˆà¹€à¸«à¸¥à¸·à¸­

1. Pending renewal à¹„à¸¡à¹ˆà¸¡à¸µ CTA à¹„à¸›à¸ªà¸–à¸²à¸™à¸° (P1)
2. WCAG live region + focus à¸­à¸±à¸›à¹‚à¸«à¸¥à¸” (P1)
3. à¹„à¸¡à¹ˆà¹‚à¸Šà¸§à¹Œ `draft.status` / à¸„à¸§à¸²à¸¡à¹€à¸£à¹ˆà¸‡à¸”à¹ˆà¸§à¸™à¸§à¸±à¸™à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸ (P1)

### à¸ªà¸£à¸¸à¸›à¸«à¸™à¸¶à¹ˆà¸‡à¸›à¸£à¸°à¹‚à¸¢à¸„

à¸«à¸™à¹‰à¸²à¸•à¹ˆà¸­à¸­à¸²à¸¢à¸¸à¸žà¸£à¹‰à¸­à¸¡à¹€à¸›à¹‡à¸™à¹€à¸‡à¸´à¸™à¸ˆà¸£à¸´à¸‡à¹€à¸¡à¸·à¹ˆà¸­à¸¡à¸µà¸šà¸±à¸à¸Šà¸µ â€” à¸•à¸­à¸™à¸™à¸µà¹‰à¹€à¸à¸•à¸§à¹ˆà¸²à¸‡ + à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡à¸„à¸£à¸šà¹à¸¥à¹‰à¸§; à¹€à¸«à¸¥à¸·à¸­à¸—à¸³à¹ƒà¸«à¹‰à¸ªà¸–à¸²à¸™à¸°à¹€à¸”à¸´à¸™à¸•à¹ˆà¸­à¹„à¸”à¹‰à¹à¸¥à¸°à¸œà¹ˆà¸²à¸™ AA

---

## English (for fix agents)

âš ï¸ DEGRADED: single-context (nested dual-agent disallowed under parent subagent). Assessment A (design review) + B (detector) completed inline in one context.

### Scoring note (ops constraints)

- **Empty bank is intentional.** `ASSOCIATION_TRANSFER_ACCOUNT = {}` + empty `TransferBankBlock` + disabled submit is correct ops UX. Do **not** treat â€œship invented bank detailsâ€ as a required fix or P0.
- **Confirm-before-submit exists** via `PaymentConfirmPanel` (`confirmOpen` â†’ review â†’ `onConfirmSubmit`). Do not re-open that as a missing P1.

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Plain loading; no `aria-live`; `draft.status` unused; pending weak |
| 2 | Match System / Real World | 4 | Clear Thai + fee; empty bank = honest ops state |
| 3 | User Control and Freedom | 3 | Confirm hasã€Œà¹à¸à¹‰à¹„à¸‚ã€; pending no exit CTA; no explicit slip clear |
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

**Detector:** `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/RenewPage.tsx apps/web/src/pages/TransferBank.tsx` â†’ `[]` (0 findings, exit 0). Scanning shared `register.css` yields many advisory design-system-color/font-size/radius hits (shared shell debt) â€” treat as **out of renew scope / advisory**, not renew regressions.

**Overlays:** Not injected â€” LIFF session required; no reliable local renew view for live detect.js.

### Overall impression

Renew is now a trustworthy money-flow shell for when bank data arrives: honest empty gate, confirm step, shared transfer/confirm components. Biggest remaining opportunity: **status clarity and exits** (pending + membership/expiry) and **AA live/focus**, not payment invention.

### What's working

1. Inline confirm before `submitRenewal` with member, fee, slip preview, andã€Œà¹à¸à¹‰à¹„à¸‚ã€back.
2. Empty transfer account correctly blocks upload/submit with contact-staff copy (`NO_TRANSFER_ACCOUNT_SUBMIT_HINT`).
3. Mobile single-column happy path; success shows receipt number +ã€Œà¸”à¸¹à¸ªà¸–à¸²à¸™à¸°ã€.

### Priority issues

#### [P1] Pending renewal is a dead-end

- **What:** `draft.pendingRenewal` â†’ `.reg-warn` only (â€œà¸¡à¸µà¸„à¸³à¸‚à¸­à¸•à¹ˆà¸­à¸­à¸²à¸¢à¸¸à¸£à¸­à¸•à¸£à¸§à¸ˆà¸­à¸¢à¸¹à¹ˆà¹à¸¥à¹‰à¸§â€). No primaryã€Œà¸”à¸¹à¸ªà¸–à¸²à¸™à¸°à¸„à¸³à¸‚à¸­ã€despite success path already using `memberStatusHrefFromUrl`.
- **Why:** PRODUCT â€œà¸ªà¸–à¸²à¸™à¸°à¸Šà¸±à¸”à¸à¹ˆà¸­à¸™à¸ªà¸§à¸¢.â€ Members feel trapped and contact support.
- **Fix:** Pending: warn + primary CTA to `/status` (need memberId/token from draft or known link helper). Optional secondary back to OA.
- **Suggested command:** `/impeccable clarify`

#### [P1] WCAG AA gaps â€” live regions & upload focus

- **What:** Loading/errors/busy lack page-level `aria-live` / `aria-busy` (unlike Status/Receipt/SlipResubmit). File input remains `opacity: 0` over `.reg-upload` with **no** `:focus-within` ring. Confirm panel announces errors via `role="alert"` but draft-load and form errors do not.
- **Why:** Stated AA goal; keyboard/SR miss state changes; invisible focus on file control.
- **Fix:** `aria-live="polite"` for draft load/errors; `aria-busy` while submitting; `.reg-upload:focus-within { outlineâ€¦ }`; announce slip-ready.
- **Suggested command:** `/impeccable audit` then `/impeccable polish`

#### [P1] Membership status & expiry urgency unused

- **What:** `draft.status` fetched but never rendered. Expiry is flat `à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸ {date}` without near/expired tone or days-left (StatusPage has `expiryDaysLeft` / tones).
- **Why:** Principle â€œà¸ªà¸–à¸²à¸™à¸°à¸Šà¸±à¸”à¸à¹ˆà¸­à¸™à¸ªà¸§à¸¢â€; expired members donâ€™t feel urgency to renew.
- **Fix:** Hero status pill from `draft.status` + expiry urgency aligned with StatusPage labels/tones (API may need days-left field if missing).
- **Suggested command:** `/impeccable clarify` (+ `/impeccable layout`)

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
- **Fix:** Prefer inline resubmit on renew (same form) or deep-link with shared upload component.
- **Suggested command:** `/impeccable distill`

#### [P3] Brand kicker / soft inner boxes

- Keep single ABTA kicker; donâ€™t add more uppercase eyebrows. Optional flatten fee vs bank hierarchy later.
- **Suggested command:** `/impeccable quieter` only if kickers proliferate

### Persona red flags

**Casey (Distracted Mobile â€” primary LIFF):**
- Confirm at bottom is good; pending state has nowhere to go with a thumb tap.
- Slip preview replace affordance unclear after interruption.
- File focus ring missing when tabbing/using keyboard accessory.

**Jordan (First-Timer renewing):**
- Confirm step clarifies â€œà¸ªà¹ˆà¸‡à¸„à¸³à¸‚à¸­â€ â‰  instant active â€” good.
- Empty bank correctly says contact staff â€” good.
- Flat expiry date doesnâ€™t communicate urgency vs StatusPage.

**Sam (Accessibility-Dependent):**
- Busy/success/error not announced on main renew path.
- Invisible focus on file control.
- Confirm errors OK (`role="alert"`); draft-load and form errors weaker.

**Project â€” à¸ªà¸¡à¸²à¸Šà¸´à¸à¸œà¸¹à¹‰à¸›à¸£à¸°à¸à¸­à¸šà¸à¸²à¸£ ABTA:**
- Trust improved: no fake bank + confirm before money submit. Remaining trust gap is status exits while waiting for treasurer.

### Cognitive load checklist

| Item | Pass? |
|------|-------|
| Single focus | Partial (pending dead-end distracts) |
| Chunking â‰¤4 | Pass (fee / bank / upload) |
| Grouping | Pass |
| Visual hierarchy | Pass (fee strong; empty bank honest) |
| One thing at a time | Pass on happy path + confirm |
| Minimal choices | Pass |
| Working memory | Pass (no bank recall required when empty; details shown when present) |
| Progressive disclosure | Pass (confirm step) |

**~1 failure â†’ lowâ€“moderate.**

### Minor observations

- Success copy usesã€Œà¸„à¸£à¸±à¸šã€â€” on-brand; keep consistent.
- `data_rejected` CTA â†’ `/register` may surprise; ensure copy matches destination.
- `reg-rise` / reduced-motion in shared CSS â€” good.
- Detector clean on TSX â‰  a11y clean.
- When bank data lands later, copy buttons / QR remain a harden opportunity â€” out of scope until real data exists.

### Questions (for product owner)

1. Pending renew: always deep-link `/status` with memberId â€” is token available on renew draft today?
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

Prior formal critique: **23/40** (Acceptable) â†’ this re-run: **31/40** (Good). Delta driven by confirm step + honest empty-bank gate (and not scoring invented bank as required). Persist under `.impeccable/critique/` when storage write succeeds.

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
| â€” | â€” | **Deferred:** real bank name/number/QR when association supplies data | `TransferBank.tsx` | harden (later) |

**Done when:** Pending users always have a status exit; AA live/focus checks pass on renew happy path; membership/expiry readable without opening `/status`. Bank remaining empty until ops provides data is OK.

**Suggested sequence:** `clarify` (R4â€“R5) â†’ `audit`/`polish` (R6â€“R7) â†’ `adapt`/`distill` (R8â€“R9) â†’ re-run critique.
