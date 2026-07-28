---
target: Admin Dashboard
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-07-27T15-08-47Z
slug: apps-web-src-admin-pages-dashboardpage-tsx
---
# Admin Dashboard re-critique

⚠️ DEGRADED: single-context (nested Multitask subagent)

Score: 26/40 Acceptable (prior 24 → 26)
P0: 0 · P1: 2 · P2: 6 · P3: 3

## Heuristics
1 Visibility 3 | 2 Match 3 | 3 Control 3 | 4 Consistency 3 | 5 Prevention 2
6 Recognition 3 | 7 Flexibility 3 | 8 Aesthetic 2 | 9 Error recovery 3 | 10 Help 1
Total 26/40

## Delta
Fixed: keyboard rows (clickableRow), Thai ERROR_LABEL, .bo-btn:focus-visible
Open P1: hero-metric stats not queue actions; 8-way status filter wall

## Detector
1 advisory design-system-font-size @ DashboardPage.tsx:452 (0.8rem)

## Priority
P1 Hero-metric stats → queue filters/routes
P1 Status filter wall progressive disclosure
P2 SortMenu keyboard, Thai title, reduced-motion on bo-rise, inline 0.8rem
