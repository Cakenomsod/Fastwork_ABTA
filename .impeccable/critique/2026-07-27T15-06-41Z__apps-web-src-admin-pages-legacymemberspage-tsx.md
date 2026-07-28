---
target: Admin Legacy Members
total_score: 19
p0_count: 1
p1_count: 3
timestamp: 2026-07-27T15-06-41Z
slug: apps-web-src-admin-pages-legacymemberspage-tsx
---
# Legacy Members re-critique

⚠️ DEGRADED: single-context (nested Multitask — dual A/B not spawned)

Target: apps/web/src/admin/pages/LegacyMembersPage.tsx + admin.css
Score: 19/40 Poor · P0: 1 · P1: 3
Prior: 19/40 → 19/40 (unchanged)

## Heuristics
1 Visibility 2 · 2 Match world 1 · 3 Control 3 · 4 Consistency 2 · 5 Prevention 2
6 Recognition 1 · 7 Efficiency 1 · 8 Aesthetic 2 · 9 Recovery 2 · 10 Help 1
Total 19/40

## Detector
1 advisory: design-system-font-size @ LegacyMembersPage.tsx:247 (0.8rem inline)

## Priority
P0 Dead-end list — no drawer; phone/email/expiry hidden despite API
P1 English legacy status (Active/NonActive…)
P1 Stats not filter shortcuts + 4-col grid with 3 cards
P1 Seg ARIA + loading live region gaps

## Top 3
1. Detail drawer / show contact fields
2. Thai status labels
3. Clickable stats + 3-col grid
