---
target: /seminar SeminarPage
total_score: 22
p0_count: 1
p1_count: 3
timestamp: 2026-07-27T14-29-04Z
slug: apps-web-src-pages-seminarpage-tsx
---
⚠️ DEGRADED: single-context for Assessment A (nested Multitask; A spawn API limit). Assessment B dual-agent 24e9bab6-9324-4658-898a-76e9a1b8c000.

Target: apps/web/src/pages/SeminarPage.tsx + register.css
Score: 22/40 Acceptable · P0:1 · P1:3

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No list loading; empty flash; thin success |
| 2 | Match System / Real World | 2 | Bank placeholder; free-text shirt/food |
| 3 | User Control and Freedom | 3 | Back to list works |
| 4 | Consistency and Standards | 3 | Shared reg-* + shared bank debt |
| 5 | Error Prevention | 1 | Paid path without bank; no confirm |
| 6 | Recognition Rather Than Recall | 2 | Bank recall; weak optional field cues |
| 7 | Flexibility and Efficiency | 2 | Single LIFF path; member autofill |
| 8 | Aesthetic and Minimalist Design | 3 | On-brand; progressive list→form |
| 9 | Error Recovery | 2 | Thai errors; no role=alert |
| 10 | Help and Documentation | 2 | Upload OK; success no next step |
| Total | | 22/40 | Acceptable |

## Anti-patterns
LLM: Not cream/purple; brand green+gold. Task incompleteness on paid path.
Detector: SeminarPage.tsx [] exit 0; register.css 70 design-system advisories (shared). Overlay skipped.

## Priority Issues
[P0] Bank placeholder on paid seminars — harden
[P1] No confirm before paid submit — harden/clarify
[P1] Seminar list no loading / empty flash — polish/clarify
[P1] a11y + thin success peak-end — audit/clarify

## Personas
Casey: empty flash + bank stub. Jordan: unclear success. Sam: no live regions.

Full bilingual report: docs/ui-ux-critique/06-seminar.md
