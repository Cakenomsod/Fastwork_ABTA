---
target: MessageTemplatesPage.tsx
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-07-27T15-07-41Z
slug: apps-web-src-admin-pages-messagetemplatespage-tsx
---
# Message Templates re-critique

Method: DEGRADED single-context (nested Multitask)
Target: apps/web/src/admin/pages/MessageTemplatesPage.tsx
Score: 31/40 Good
Prior: 26/40
P0: 0 · P1: 2 · P2: 3 · P3: 2
Detector: []

## Heuristics
1 Visibility 3 | 2 Match 4 | 3 Control 3 | 4 Consistency 4 | 5 Prevention 3
6 Recognition 3 | 7 Flexibility 2 | 8 Aesthetic 3 | 9 Recovery 3 | 10 Help 3
Total 31/40

## Fixes verified
- Dirty guard cancel/refresh/broadcast via PendingNav
- beforeunload when dirty
- Preview label ตัวอย่างข้อความ
- Plain-text no-merge hint

## Priority
P1 SPA sidebar leave bypasses dirty
P1 AGM invite save no elevated confirm
P2 Unsaved badge on edit
P2 Broadcast deep-link
P2 List search
