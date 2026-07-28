---
target: Admin Dashboard
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-07-27T15-07-05Z
slug: apps-web-src-admin-pages-dashboardpage-tsx
---
⚠️ DEGRADED: single-context (nested Multitask critique subagent — dual Assessment A/B agents not spawned)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Loading / searching / selected OK; no live region for result-count changes |
| 2 | Match system / real world | 3 | Thai ops copy + mapped errors; title/nav still English “Dashboard” |
| 3 | User control & freedom | 3 | Clear filters + Esc drawer; auto-open drawer on single search hit can surprise |
| 4 | Consistency & standards | 3 | Focus-visible now shared; Search Submit vs instant filter apply still uneven |
| 5 | Error prevention | 2 | Dense 8-way status seg; auto-open drawer on 1 match |
| 6 | Recognition over recall | 3 | Filters/badges visible; composite status badge logic still hard to parse |
| 7 | Flexibility & efficiency | 3 | Rows keyboard-activatable via clickableRow; no queue deep-links / shortcuts |
| 8 | Aesthetic & minimalist | 2 | Hero-metric 4-stat grid still competes with the work list |
| 9 | Error recovery | 3 | Thai actionable ERROR_LABEL map; unknown codes may still surface raw |
| 10 | Help & documentation | 1 | No help for 「สิทธิ์ประชุมใหญ่ (สามัญ)」 / T filters beyond labels |
| **Total** | | **26/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment:** Green+gold BO identity holds. Absolute ban hero-metric (big num + small label ×4) remains the main product-register failure. Filter wall still template-admin. Keyboard rows + focus rings now meet earned-familiarity for table activation.

**Deterministic scan:** 1 advisory — design-system-font-size @ DashboardPage.tsx:452 (0.8rem inline). No P0/P1 from detector.

**Visual overlays:** Skipped (admin auth-gated).

## Overall Impression

Safety/UX pass landed. Page still opens as metrics dashboard instead of queue console — that IA gap is the score ceiling.

## What's Working

1. clickableRowProps — role=button, tabIndex=0, Enter/Space, aria-label, selected + :focus-visible row styles.
2. ERROR_LABEL maps search/reload/detail/auth codes to actionable Thai.
3. .bo-btn:focus-visible (+ danger variants) aligned with seg/menu focus system.

## Priority Issues

### [P1] Hero-metric stats are not queue actions
Pending stats should filter/navigate; demote total/active. Command: distill + layout.

### [P1] Status filter wall (8 options)
Queue chips primary; rest under disclosure. Command: distill.

## Persona Red Flags

Alex: no search shortcut; stats non-accelerating. Sam: rows fixed; SortMenu incomplete; reduced-motion gaps. Registrar: first viewport not actionable queue.

## Minor Observations

P2: EN Dashboard title; SortMenu keyboard; inline 0.8rem; auto-open; dual fetch; reduced-motion on rise. P3: Thai th uppercase; nav count color; Phase 1 eyebrow.

## Questions

Should /admin be queue-home? Do total/active earn first-viewport pixels?
