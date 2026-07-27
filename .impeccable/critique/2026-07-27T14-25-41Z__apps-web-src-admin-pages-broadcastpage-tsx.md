---
target: BroadcastPage /admin/broadcast
total_score: 26
p0_count: 1
p1_count: 3
timestamp: 2026-07-27T14-25-41Z
slug: apps-web-src-admin-pages-broadcastpage-tsx
---
# 17 â€” Admin Broadcast (LINE à¸à¸¥à¸¸à¹ˆà¸¡)

> **Route:** `/admin/broadcast`  
> **Files:** `apps/web/src/admin/pages/BroadcastPage.tsx`, `apps/web/src/admin/admin.css` (`.bo-broadcast*`, `.bo-wizard*`)  
> **Date:** 2026-07-27  
> **Method:** âš ï¸ DEGRADED: single-context (critique run as nested subagent; dual-agent spawn blocked)  
> **Detector:** `detect.mjs --json` â†’ `[]` (clean, exit 0)  
> **Browser overlay:** skipped â€” auth-gated Back Office; no reliable localhost session for injection  
> **Personas:** Alex Â· Riley Â· Jordan (staff first-timers)  
> **Register:** product Â· **Stakes:** irreversible mass LINE OA messaging

---

## Score card

| Metric | Value |
|--------|-------|
| **Design Health** | **26 / 40** â€” Acceptable |
| **P0** | **1** |
| **P1** | **3** |
| **Cognitive load** | Moderate (3/8 checklist failures) |
| **AI slop** | Low â€” product wizard, not decorative SaaS |

### Heuristics

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Stats/`aria-live` good; meta/logs load fail silently |
| 2 | Match System / Real World | 3 | Thai staff copy clear; empty filter = â€œà¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—â€ easy to misread |
| 3 | User Control and Freedom | 3 | Back/cancel/clear OK; leave page loses draft |
| 4 | Consistency and Standards | 3 | Uses `bo-*`; mass send confirm not danger-weighted like other destructive actions |
| 5 | Error Prevention | 2 | Confirm exists, but **default-all + select-all + light confirm** still allow accidental blast |
| 6 | Recognition Rather Than Recall | 2 | Step 3 (audience) has **no message preview** â€” memory bridge |
| 7 | Flexibility and Efficiency | 2 | Presets help Alex; no shortcuts / draft resume |
| 8 | Aesthetic and Minimalist Design | 3 | Focused 4-step wizard; step 1 still dense |
| 9 | Error Recovery | 3 | Thai errors, form kept on send fail |
| 10 | Help and Documentation | 2 | Hints present; no â€œirreversible / who will receiveâ€ guidance for first-timers |
| **Total** | | **26/40** | **Acceptable** |

---

## à¸ªà¸£à¸¸à¸›à¸ªà¸³à¸«à¸£à¸±à¸šà¸­à¹ˆà¸²à¸™ (à¸ à¸²à¸©à¸²à¹„à¸—à¸¢)

### à¸„à¸§à¸²à¸¡à¸›à¸£à¸°à¸—à¸±à¸šà¹ƒà¸ˆà¹‚à¸”à¸¢à¸£à¸§à¸¡

à¸«à¸™à¹‰à¸² Broadcast à¸–à¸¹à¸à¸­à¸­à¸à¹à¸šà¸šà¹€à¸›à¹‡à¸™ **à¸§à¸´à¸‹à¸²à¸£à¹Œà¸” 4 à¸‚à¸±à¹‰à¸™** (à¸à¸£à¸­à¸‡ â†’ à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡ â†’ à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­ â†’ à¸¢à¸·à¸™à¸¢à¸±à¸™) à¸‹à¸¶à¹ˆà¸‡à¸ªà¸­à¸”à¸„à¸¥à¹‰à¸­à¸‡à¸«à¸¥à¸±à¸ Back Office à¸‚à¸­à¸‡ ABTA à¹à¸¥à¸°à¸¥à¸”à¸„à¸§à¸²à¸¡à¸ªà¸±à¸šà¸ªà¸™à¹€à¸¡à¸·à¹ˆà¸­à¹€à¸—à¸µà¸¢à¸šà¸à¸±à¸šà¸Ÿà¸­à¸£à¹Œà¸¡à¸¢à¸²à¸§à¸«à¸™à¹‰à¸²à¹€à¸”à¸µà¸¢à¸§ à¸ˆà¸¸à¸”à¹à¸‚à¹‡à¸‡à¸„à¸·à¸­à¸ à¸²à¸©à¸²à¹„à¸—à¸¢à¸Šà¸±à¸” à¸ªà¸–à¸´à¸•à¸´à¸œà¸¹à¹‰à¸£à¸±à¸šà¸¡à¸µ `aria-live` à¹à¸¥à¸°à¸¡à¸µ `ConfirmDialog` à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡

à¹à¸•à¹ˆà¸ à¸²à¸£à¸à¸´à¸ˆà¸™à¸µà¹‰à¹€à¸›à¹‡à¸™ **à¸à¸²à¸£à¸ªà¹ˆà¸‡ LINE à¹à¸šà¸šà¸à¸¥à¸¸à¹ˆà¸¡à¸—à¸µà¹ˆà¹à¸à¹‰à¹„à¸¡à¹ˆà¹„à¸”à¹‰** â€” à¸„à¸§à¸²à¸¡à¹€à¸ªà¸µà¹ˆà¸¢à¸‡à¸«à¸¥à¸±à¸à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆ â€œà¸à¸”à¸ªà¹ˆà¸‡à¹„à¸¡à¹ˆà¹„à¸”à¹‰â€ à¹à¸•à¹ˆà¸„à¸·à¸­ **à¸ªà¹ˆà¸‡à¸œà¸´à¸”à¸à¸¥à¸¸à¹ˆà¸¡/à¸ªà¹ˆà¸‡à¸—à¸±à¹‰à¸‡à¸ªà¸¡à¸²à¸„à¸¡à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸•à¸±à¹‰à¸‡à¹ƒà¸ˆ** à¸„à¹ˆà¸²à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™ (à¹„à¸¡à¹ˆà¹€à¸¥à¸·à¸­à¸à¸•à¸±à¸§à¸à¸£à¸­à¸‡ = à¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—/à¸—à¸¸à¸à¸ªà¸–à¸²à¸™à¸ à¸²à¸ž) + à¹€à¸¥à¸·à¸­à¸à¸œà¸¹à¹‰à¸£à¸±à¸šà¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´ + à¸¢à¸·à¸™à¸¢à¸±à¸™à¹à¸„à¹ˆà¸à¸”à¸›à¸¸à¹ˆà¸¡ à¸—à¸³à¹ƒà¸«à¹‰à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¸¡à¸·à¸­à¹ƒà¸«à¸¡à¹ˆ (Jordan) à¸ªà¹ˆà¸‡à¸¡à¸§à¸¥à¸Šà¸™à¹„à¸”à¹‰à¸‡à¹ˆà¸²à¸¢à¹€à¸à¸´à¸™à¹„à¸›

### à¸ˆà¸¸à¸”à¹à¸‚à¹‡à¸‡

1. **à¸§à¸´à¸‹à¸²à¸£à¹Œà¸”à¸—à¸µà¸¥à¸°à¸‚à¸±à¹‰à¸™** â€” à¹à¸¢à¸à¸à¸£à¸­à¸‡ / à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡ / à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­ / à¸¢à¸·à¸™à¸¢à¸±à¸™ à¸¥à¸” cognitive load à¹€à¸—à¸µà¸¢à¸š one-page compose  
2. **à¸ªà¸£à¸¸à¸›à¸•à¸±à¸§à¸à¸£à¸­à¸‡ + à¸ˆà¸³à¸™à¸§à¸™à¸œà¸¹à¹‰à¸£à¸±à¸š** à¹€à¸«à¹‡à¸™à¸Šà¸±à¸”à¹ƒà¸™à¸‚à¸±à¹‰à¸™ 4 à¹à¸¥à¸°à¹ƒà¸™ dialog  
3. **à¸—à¸²à¸‡à¸¥à¸±à¸” preset** (à¸à¸£à¸£à¸¡à¸à¸²à¸£ à¸¡à¸µ.à¸„. / à¹à¸¡à¹ˆà¹à¸šà¸šà¹€à¸Šà¸´à¸à¸›à¸£à¸°à¸Šà¸¸à¸¡) à¹à¸¥à¸° empty state à¹€à¸¡à¸·à¹ˆà¸­à¹„à¸¡à¹ˆà¸¡à¸µ LINE â€” à¸Šà¹ˆà¸§à¸¢à¸‡à¸²à¸™à¸‹à¹‰à¸³à¸‚à¸­à¸‡à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆ

### à¸›à¸±à¸à¸«à¸²à¹€à¸£à¸µà¸¢à¸‡à¸•à¸²à¸¡à¸„à¸§à¸²à¸¡à¸ªà¸³à¸„à¸±à¸

#### [P0] à¸„à¹ˆà¸²à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™ = à¸ªà¹ˆà¸‡à¹„à¸”à¹‰à¸—à¸±à¹‰à¸‡à¸à¸¥à¸¸à¹ˆà¸¡à¸—à¸µà¹ˆà¸¡à¸µ LINE + à¹€à¸¥à¸·à¸­à¸à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´
- **à¸„à¸·à¸­à¸­à¸°à¹„à¸£:** à¹„à¸¡à¹ˆà¹€à¸¥à¸·à¸­à¸à¸›à¸£à¸°à¹€à¸ à¸—/à¸ªà¸–à¸²à¸™à¸ à¸²à¸ž = â€œà¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸— Â· à¸—à¸¸à¸à¸ªà¸–à¸²à¸™à¸ à¸²à¸žâ€; à¹‚à¸«à¸¥à¸”à¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­à¹à¸¥à¹‰à¸§ `selected` = à¸—à¸¸à¸à¸„à¸™à¸—à¸µà¹ˆà¸¡à¸µ LINE  
- **à¸—à¸³à¹„à¸¡à¸ªà¸³à¸„à¸±à¸:** à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¸¡à¸·à¸­à¹ƒà¸«à¸¡à¹ˆà¸­à¸²à¸ˆà¸„à¸´à¸”à¸§à¹ˆà¸² â€œà¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¹„à¸”à¹‰à¹€à¸¥à¸·à¸­à¸à¹ƒà¸„à¸£â€ à¹à¸¥à¹‰à¸§à¸à¸”à¹„à¸›à¸ˆà¸™à¸ªà¹ˆà¸‡à¸ˆà¸£à¸´à¸‡ â€” à¸„à¸§à¸²à¸¡à¹€à¸ªà¸µà¸¢à¸«à¸²à¸¢à¸•à¹ˆà¸­à¸ªà¸¡à¸²à¸„à¸¡à¸ªà¸¹à¸‡à¸¡à¸²à¸  
- **à¹à¸à¹‰:** à¸šà¸±à¸‡à¸„à¸±à¸šà¹€à¸¥à¸·à¸­à¸à¸•à¸±à¸§à¸à¸£à¸­à¸‡à¸­à¸¢à¹ˆà¸²à¸‡à¸™à¹‰à¸­à¸¢à¸«à¸™à¸¶à¹ˆà¸‡à¸¡à¸´à¸•à¸´à¸à¹ˆà¸­à¸™à¹‚à¸«à¸¥à¸”/à¸à¹ˆà¸­à¸™à¹„à¸›à¸‚à¸±à¹‰à¸™à¸–à¸±à¸”à¹„à¸› *à¸«à¸£à¸·à¸­* à¹€à¸£à¸´à¹ˆà¸¡à¸”à¹‰à¸§à¸¢à¸œà¸¹à¹‰à¸£à¸±à¸šà¸§à¹ˆà¸²à¸‡à¹à¸¥à¹‰à¸§à¹ƒà¸«à¹‰ opt-in; à¹à¸ªà¸”à¸‡à¹à¸šà¸™à¹€à¸™à¸­à¸£à¹Œà¹€à¸•à¸·à¸­à¸™à¸ªà¸µ warn à¹€à¸¡à¸·à¹ˆà¸­ audience = à¸—à¸¸à¸à¸ªà¸–à¸²à¸™à¸ à¸²à¸ž/à¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—

#### [P1] Dialog à¸¢à¸·à¸™à¸¢à¸±à¸™à¹€à¸šà¸²à¹€à¸à¸´à¸™à¹„à¸›à¸ªà¸³à¸«à¸£à¸±à¸š blast à¸—à¸µà¹ˆà¹à¸à¹‰à¹„à¸¡à¹ˆà¹„à¸”à¹‰
- **à¸„à¸·à¸­à¸­à¸°à¹„à¸£:** `ConfirmDialog` à¹à¸šà¸š default (à¹€à¸‚à¸µà¸¢à¸§) à¸›à¹‰à¸²à¸¢ â€œà¸ªà¹ˆà¸‡à¹€à¸¥à¸¢â€ â€” à¹„à¸¡à¹ˆà¸¡à¸µ typed confirm à¸ˆà¸³à¸™à¸§à¸™à¸„à¸™, à¹„à¸¡à¹ˆà¹ƒà¸Šà¹‰ `variant="danger"` / `requireTypedConfirm`  
- **à¸—à¸³à¹„à¸¡à¸ªà¸³à¸„à¸±à¸:** à¸‚à¸±à¸”à¸«à¸¥à¸±à¸ PRODUCT â€œà¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¹ˆà¸­à¸™à¸—à¸³à¸¥à¸²à¸¢â€; à¸à¸”à¸žà¸¥à¸²à¸”à¸„à¸£à¸±à¹‰à¸‡à¹€à¸”à¸µà¸¢à¸§ = à¸ªà¹ˆà¸‡ LINE à¸ˆà¸£à¸´à¸‡  
- **à¹à¸à¹‰:** à¹€à¸¡à¸·à¹ˆà¸­ `selectedCount â‰¥ N` (à¹€à¸Šà¹ˆà¸™ 20) à¸šà¸±à¸‡à¸„à¸±à¸šà¸žà¸´à¸¡à¸žà¹Œà¸ˆà¸³à¸™à¸§à¸™à¸œà¸¹à¹‰à¸£à¸±à¸š; à¹ƒà¸Šà¹‰ danger/warn visual; à¹à¸ªà¸”à¸‡à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¹€à¸•à¹‡à¸¡à¹ƒà¸™ dialog (à¹„à¸¡à¹ˆà¸•à¸±à¸”à¸—à¸µà¹ˆ 400 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸¡à¸µ â€œà¸”à¸¹à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”â€)

#### [P1] à¸‚à¸±à¹‰à¸™à¸•à¸£à¸§à¸ˆà¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­à¹„à¸¡à¹ˆà¸¡à¸µà¸šà¸£à¸´à¸šà¸—à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡ (memory bridge)
- **à¸„à¸·à¸­à¸­à¸°à¹„à¸£:** à¸‚à¸±à¹‰à¸™ 3 à¹à¸ªà¸”à¸‡à¸•à¸²à¸£à¸²à¸‡à¸­à¸¢à¹ˆà¸²à¸‡à¹€à¸”à¸µà¸¢à¸§ â€” à¸•à¹‰à¸­à¸‡à¸ˆà¸³à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ˆà¸²à¸à¸‚à¸±à¹‰à¸™ 2  
- **à¸—à¸³à¹„à¸¡à¸ªà¸³à¸„à¸±à¸:** Riley/Jordan à¸•à¸£à¸§à¸ˆà¸£à¸²à¸¢à¸Šà¸·à¹ˆà¸­à¹à¸¥à¹‰à¸§à¹„à¸¡à¹ˆà¹€à¸«à¹‡à¸™à¸§à¹ˆà¸²à¸ˆà¸°à¸ªà¹ˆà¸‡à¸­à¸°à¹„à¸£ â†’ à¸•à¸£à¸§à¸ˆà¹„à¸¡à¹ˆà¸„à¸£à¸š  
- **à¹à¸à¹‰:** sticky preview à¸¢à¹ˆà¸­à¸‚à¸­à¸‡à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡ + à¸ˆà¸³à¸™à¸§à¸™à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸ à¸‚à¹‰à¸²à¸‡à¸•à¸²à¸£à¸²à¸‡ à¸«à¸£à¸·à¸­à¹à¸–à¸šà¸ªà¸£à¸¸à¸›à¹€à¸«à¸™à¸·à¸­à¸•à¸²à¸£à¸²à¸‡

#### [P1] à¸­à¸­à¸à¹„à¸›à¸«à¸™à¹‰à¸²à¹à¸¡à¹ˆà¹à¸šà¸šà¹à¸¥à¹‰à¸§à¸£à¹ˆà¸²à¸‡à¸«à¸²à¸¢ / à¹‚à¸«à¸¥à¸”à¹à¸¡à¹ˆà¹à¸šà¸šà¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§à¹€à¸‡à¸µà¸¢à¸š
- **à¸„à¸·à¸­à¸­à¸°à¹„à¸£:** `goMessageTemplates()` à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™ route; state à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸­à¸¢à¸¹à¹ˆà¹ƒà¸™ memory; `loadMeta` catch à¸§à¹ˆà¸²à¸‡  
- **à¸—à¸³à¹„à¸¡à¸ªà¸³à¸„à¸±à¸:** à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¹„à¸›à¹à¸à¹‰à¹à¸¡à¹ˆà¹à¸šà¸šà¹à¸¥à¹‰à¸§à¸à¸¥à¸±à¸šà¸¡à¸²à¹€à¸£à¸´à¹ˆà¸¡à¹ƒà¸«à¸¡à¹ˆ; à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆà¸¡à¸µà¹à¸¡à¹ˆà¹à¸šà¸šà¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸£à¸¹à¹‰à¸§à¹ˆà¸²à¹‚à¸«à¸¥à¸”à¸žà¸¥à¸²à¸”  
- **à¹à¸à¹‰:** draft à¹ƒà¸™ `sessionStorage`; à¹à¸ªà¸”à¸‡ error à¹€à¸¡à¸·à¹ˆà¸­à¹‚à¸«à¸¥à¸” tags/templates à¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§

### Persona (à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆ)

**Jordan (à¸¡à¸·à¸­à¹ƒà¸«à¸¡à¹ˆ):** à¸­à¹ˆà¸²à¸™ â€œà¹„à¸¡à¹ˆà¹€à¸¥à¸·à¸­à¸ = à¸£à¸§à¸¡à¸—à¸¸à¸à¸„à¹ˆà¸²â€ à¹à¸¥à¹‰à¸§à¸­à¸²à¸ˆà¹€à¸‚à¹‰à¸²à¹ƒà¸ˆà¸§à¹ˆà¸²à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¹€à¸¥à¸·à¸­à¸; à¸›à¸¸à¹ˆà¸¡à¸ªà¹ˆà¸‡à¸ªà¸µà¹€à¸‚à¸µà¸¢à¸§à¸”à¸¹à¹€à¸«à¸¡à¸·à¸­à¸™à¸‡à¸²à¸™à¸›à¸à¸•à¸´à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆà¸„à¸§à¸²à¸¡à¹€à¸ªà¸µà¹ˆà¸¢à¸‡à¸ªà¸¹à¸‡; à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸§à¹ˆà¸²à¸ªà¹ˆà¸‡à¹à¸¥à¹‰à¸§à¹à¸à¹‰à¹„à¸¡à¹ˆà¹„à¸”à¹‰  

**Alex (à¸¡à¸·à¸­à¹‚à¸›à¸£):** preset à¸”à¸µ à¹à¸•à¹ˆà¹„à¸¡à¹ˆà¸¡à¸µà¸„à¸µà¸¢à¹Œà¸¥à¸±à¸” / bulk exclude à¸—à¸µà¹ˆà¹€à¸£à¹‡à¸§; à¸¢à¸·à¸™à¸¢à¸±à¸™à¸‹à¹‰à¸³à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡à¹€à¸¡à¸·à¹ˆà¸­à¸ªà¹ˆà¸‡à¸à¸¥à¸¸à¹ˆà¸¡à¹€à¸¥à¹‡à¸à¸­à¸²à¸ˆà¸£à¸³à¸„à¸²à¸ â€” à¸„à¸§à¸£ threshold à¸•à¸²à¸¡à¸ˆà¸³à¸™à¸§à¸™  

**Riley (à¸—à¸”à¸ªà¸­à¸šà¸‚à¸­à¸š):** à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸¢à¸²à¸§à¸–à¸¹à¸à¸•à¸±à¸”à¹ƒà¸™ preview (`max-height: 7.5rem`, confirm 400 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£); à¸„à¹‰à¸™à¸«à¸²à¹à¸¥à¹‰à¸§ â€œà¹€à¸¥à¸·à¸­à¸à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¸—à¸µà¹ˆà¹à¸ªà¸”à¸‡â€ à¸­à¸²à¸ˆà¸—à¸³à¹ƒà¸«à¹‰à¹€à¸‚à¹‰à¸²à¹ƒà¸ˆà¸œà¸´à¸”à¹€à¸£à¸·à¹ˆà¸­à¸‡à¸—à¸±à¹‰à¸‡à¸Šà¸¸à¸”; refresh à¸à¸¥à¸²à¸‡à¸—à¸²à¸‡à¸£à¹ˆà¸²à¸‡à¸«à¸²à¸¢  

### Cognitive load (checklist à¸—à¸µà¹ˆà¹„à¸¡à¹ˆà¸œà¹ˆà¸²à¸™)

- [ ] Progressive disclosure à¸šà¸™à¸‚à¸±à¹‰à¸™ 1 (filters + tags + presets à¸žà¸£à¹‰à¸­à¸¡à¸à¸±à¸™)  
- [ ] Working memory â€” à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¹„à¸¡à¹ˆà¸­à¸¢à¸¹à¹ˆà¹ƒà¸™à¸‚à¸±à¹‰à¸™ 3  
- [ ] Minimal choices â€” à¸ªà¸–à¸²à¸™à¸ à¸²à¸ž 6 à¸›à¸¸à¹ˆà¸¡ + à¸›à¸£à¸°à¹€à¸ à¸— 4 + à¹à¸—à¹‡à¸ + preset à¹ƒà¸™à¸ˆà¸­à¹€à¸”à¸µà¸¢à¸§  

---

## English â€” full critique (for fix agents)

### Anti-patterns verdict

**LLM:** Does **not** read as AI-slop marketing UI. It is a restrained product wizard with association-green tokens, sticky footer CTAs, and real Thai staff language. Risks are **safety/defaults**, not decorative gradients or card grids. Unused legacy layout classes (`.bo-broadcast-layout` two-column) exist in CSS but the live page is a single-column wizard â€” fine, not harmful.

**Detector:** `detect.mjs` returned **0 findings** on `BroadcastPage.tsx`. No contrast/slop rules fired on this markup path (CSS-only anti-patterns not fully covered by the HTML detector).

**Overlays:** Not available (auth-gated admin).

### Overall impression

Solid **structure** for a high-stakes tool; weak **guardrails** for the irreversible send. Biggest opportunity: make â€œwho receives thisâ€ impossible to misunderstand before confirm, and make confirm proportional to blast size.

### What's working

1. Four-step wizard with disabled future steps and sticky primary footer â€” correct task model.  
2. Filter summary chips + live recipient counts reduce ambiguity at step 4.  
3. Empty states (no LINE / no templates / no search hits) include recovery actions.

### Priority issues

| Sev | Issue | Why | Fix | Suggested command |
|-----|-------|-----|-----|-------------------|
| **P0** | Empty filters = all types/statuses; load auto-selects every LINE recipient | Accidental association-wide blast | Require intentional audience OR start with zero selection + warn banner when â€œà¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—/à¸—à¸¸à¸à¸ªà¸–à¸²à¸™à¸ à¸²à¸žâ€ | `/impeccable harden` then `/impeccable clarify` |
| **P1** | Confirm is default primary â€œà¸ªà¹ˆà¸‡à¹€à¸¥à¸¢â€; no typed count; preview truncated to 400 chars | One misclick = real LINE messages | `requireTypedConfirm` with count (threshold); danger/warn styling; full message or expandable preview | `/impeccable harden` |
| **P1** | Step 3 audience table has no message preview | Memory bridge; incomplete review | Compact sticky message strip on step 3 | `/impeccable layout` |
| **P1** | Navigate to templates loses draft; silent `loadMeta` failure | Draft loss / empty templates without explanation | `sessionStorage` draft; surface meta errors | `/impeccable harden` |

### Persona red flags

**Alex:** Presets are good accelerators. Missing: keyboard path for send/cancel beyond dialog Esc; no â€œsend to filtered minus exclusionsâ€ mental model beyond checkboxes; small blasts still pay full confirm friction if you later add typed confirm without a threshold.

**Jordan (staff first-timer):** Lead copy â€œà¸—à¸³à¸—à¸µà¸¥à¸°à¸‚à¸±à¹‰à¸™â€ helps, but â€œà¹„à¸¡à¹ˆà¹€à¸¥à¸·à¸­à¸ = à¸£à¸§à¸¡à¸—à¸¸à¸à¸„à¹ˆà¸²â€ + auto-checked table feels like the system already decided the audience. Primary green send looks like approve-queue, not irreversible broadcast. No plain-language â€œà¸ªà¹ˆà¸‡à¹à¸¥à¹‰à¸§à¹à¸à¹‰à¹„à¸‚à¹„à¸¡à¹ˆà¹„à¸”à¹‰à¸šà¸™ LINE à¸‚à¸­à¸‡à¸ªà¸¡à¸²à¸Šà¸´à¸â€.

**Riley:** Long message clipped in `.bo-broadcast-preview-body` (`max-height: 7.5rem`); confirm truncates at 400; `selectAll` API path when `selected.size === recipients.length` after search toggles needs careful QA; mid-flow navigation to `/admin/message-templates` drops compose state; logs fail open silently.

### Minor observations

- Step 2 still shows recipient stats â€” useful, but can steal focus from â€œcomposeâ€.  
- Failed log badge reuses `near-expiry` styling â€” semantic mismatch.  
- `aria-hidden="false"` on compact wizard label is noisy; compact mode CSS hides desktop grid inconsistently at narrow widths (verify 720px).  
- After successful send, reset to step 1 + open logs is good peak-end; keep success banner visible above the fold.

### Questions to consider

1. Should â€œno filterâ€ mean â€œblocked until you pick a segmentâ€ rather than â€œeveryoneâ€?  
2. At what recipient count does typed confirmation become mandatory (10 / 20 / 50)?  
3. Should step 3 and step 4 share one persistent preview rail so the message never leaves the viewport?

---

## Concrete fix backlog (English â€” execute in order)

Use this section as the implementation checklist for the next chat.

### P0 â€” Safe audience defaults

1. **Stop silent â€œeveryoneâ€.** Either:
   - Block â€œà¸–à¸±à¸”à¹„à¸›â€ until at least one of: member type, status, board, or tag is set; **or**
   - Keep broad filters but **do not** auto-`selected = all` â€” start empty and require â€œà¹€à¸¥à¸·à¸­à¸à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¸—à¸µà¹ˆà¹à¸ªà¸”à¸‡â€.
2. Add a persistent **warn callout** when `!filtersActive`: e.g. â€œà¸à¸³à¸¥à¸±à¸‡à¸£à¸§à¸¡à¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—à¹à¸¥à¸°à¸—à¸¸à¸à¸ªà¸–à¸²à¸™à¸ à¸²à¸žà¸—à¸µà¹ˆà¸¡à¸µ LINE â€” à¸•à¸£à¸§à¸ˆà¸ˆà¸³à¸™à¸§à¸™à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡â€.
3. Mirror the same warning on step 4 summary and in `confirmDescription`.

### P1 â€” Confirm proportional to blast

4. For `selectedCount >= 20` (tune with product): `ConfirmDialog` with `requireTypedConfirm={String(selectedCount)}` and copy â€œà¸žà¸´à¸¡à¸žà¹Œà¸ˆà¸³à¸™à¸§à¸™à¸œà¸¹à¹‰à¸£à¸±à¸šà¹€à¸žà¸·à¹ˆà¸­à¸¢à¸·à¸™à¸¢à¸±à¸™â€.
5. Use warn/danger visual weight for mass send (label e.g. â€œà¸¢à¸·à¸™à¸¢à¸±à¸™à¸ªà¹ˆà¸‡ LINE à¸ˆà¸£à¸´à¸‡â€); keep cancel as the safe default focus (already focuses cancel â€” keep it).
6. Stop hard-truncating confirm body at 400 without affordance â€” show full text in scrollable region or â€œà¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¹€à¸•à¹‡à¸¡â€ expand.

### P1 â€” Recognition on step 3

7. Add a read-only **message preview strip** (2â€“4 lines + char count + template title) above the recipient table on step 3.
8. Keep selected-count chip in sync (`aria-live` already on selection meta â€” preserve).

### P1 â€” Draft & meta resilience

9. Persist `{ message, templateId, filters, step, selectedIds }` to `sessionStorage` keyed by staff session; restore on mount; clear after successful send.
10. On `loadMeta` failure, set visible error: â€œà¹‚à¸«à¸¥à¸”à¹à¸¡à¹ˆà¹à¸šà¸š/à¹à¸—à¹‡à¸à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆâ€ + retry (do not fail open).

### P2 â€” Polish (after P0/P1)

11. Semantic badge for log failures (not `near-expiry`).  
12. Clarify search + â€œà¹€à¸¥à¸·à¸­à¸à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¸—à¸µà¹ˆà¹à¸ªà¸”à¸‡â€ helper text when `hasSearch`.  
13. Increase preview `max-height` on step 4 or make it resizable.  
14. Optional: draft autosave indicator for Alex.

### Suggested command sequence

1. `/impeccable harden apps/web/src/admin/pages/BroadcastPage.tsx` â€” defaults, confirm, draft, meta errors  
2. `/impeccable clarify` â€” warn copy, irreversible LINE language for Jordan  
3. `/impeccable layout` â€” step 3 preview strip  
4. `/impeccable polish` â€” badges, preview height, search helper  
5. Re-run `/impeccable critique` on this page â€” target **â‰¥ 32/40**, **P0 = 0**

---

## Evidence pointers (code)

```152:152:apps/web/src/admin/pages/BroadcastPage.tsx
      setSelected(new Set(data.recipients.map((r) => r.memberId)));
```

```217:230:apps/web/src/admin/pages/BroadcastPage.tsx
    } else {
      parts.push("à¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—");
    }
    // ...
    } else {
      parts.push("à¸—à¸¸à¸à¸ªà¸–à¸²à¸™à¸ à¸²à¸ž");
    }
```

```1182:1193:apps/web/src/admin/pages/BroadcastPage.tsx
      <ConfirmDialog
        open={confirmOpen}
        title="à¸¢à¸·à¸™à¸¢à¸±à¸™à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¹à¸šà¸šà¸à¸¥à¸¸à¹ˆà¸¡"
        description={confirmDescription}
        confirmLabel="à¸ªà¹ˆà¸‡à¹€à¸¥à¸¢"
        // no variant="danger" / requireTypedConfirm
```

```3521:3531:apps/web/src/admin/admin.css
.bo-broadcast-preview-body {
  /* ... */
  max-height: 7.5rem;
  overflow: auto;
}
```

---

*End of report 17 â€” Admin Broadcast*
