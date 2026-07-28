---
target: Admin Staff StaffPage after fixes
total_score: 29
p0_count: 0
p1_count: 0
timestamp: 2026-07-27T15-06-31Z
slug: apps-web-src-admin-pages-staffpage-tsx
---
# Admin Staff re-critique (post-fix)

Method: DEGRADED single-context (nested Multitask)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | Save busy label missing; soft reload flash |
| 2 | Match System / Real World | 3 | super badge still English |
| 3 | User Control and Freedom | 3 | ConfirmDialog Esc/cancel OK |
| 4 | Consistency and Standards | 3 | Confirm wired; table not cardized |
| 5 | Error Prevention | 3 | Confirm + self-delete blocked |
| 6 | Recognition Rather Than Recall | 3 | Role capabilities unexplained |
| 7 | Flexibility and Efficiency | 3 | Keyboard rows via clickableRow |
| 8 | Aesthetic and Minimalist Design | 3 | Clean BO list+form |
| 9 | Error Recovery | 3 | Thai ERROR_LABEL map |
| 10 | Help and Documentation | 2 | Bottom note only; no role hints |
| **Total** | | **29/40** | **Good** |

Prior: 22/40. Fixes verified: ConfirmDialog delete, self-delete disabled, keyboard rows, Thai errors.

## Anti-Patterns
LLM: Not AI slop; prior window.confirm inconsistency resolved. Detector: []. Browser: skipped (auth).

## Priority Issues
- [P2] Busy Save + soft reload + aria-live
- [P2] bo-table--cards missing
- [P2] Role capability hints
- [P3] super badge / locked email copy
- [P3] ConfirmDialog focus restore

## Persona / Cognitive
Working memory fail: role capabilities. Failures 1 = low.
