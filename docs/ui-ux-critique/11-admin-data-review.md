# 11 — Admin Data Review (`/admin/data`)

> Generated: 2026-07-27 · Skill: Impeccable `critique` · Register: **product**
> Method: ⚠️ DEGRADED: single-context (subagent under Multitask parent — nested dual-agent spawn blocked)
> Target files: `DataReviewPage.tsx`, `ReviewQueuePanel.tsx`, `ReviewActionBar.tsx`, `ReviewDetailHeader.tsx`, `MemberReviewSummary.tsx`, `ReviewIdChangePanel.tsx`, `ReviewIdConflictDialog.tsx`, `MemberDetailDrawer.tsx` (peripheral), `admin.css`
> Route: **`/admin/data`** (not `/admin/data-review`)
> Detector: `detect.mjs --json` → **0 findings** (clean)
> Browser overlay: skipped (no local admin server running)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม

| | |
|--|--|
| **Score** | **23 / 40** — Acceptable |
| **P0** | **1** |
| **P1** | **3** |
| **Cognitive load** | ปานกลาง (fail ~3 ข้อ) |
| **AI slop** | ไม่ใช่ — ดูเป็นเครื่องมืองานจริง ไม่ใช่เทมเพลต AI |

### จุดแข็ง

1. **คิวเป็นศูนย์กลางจริง** — เลย์เอาต์ queue + detail ตรง Design Principle ของ Back Office
2. **ยืนยันก่อนอนุมัติ/เปลี่ยนเลข** — มี gate ตรวจเลขซ้ำ, confirm อนุมัติ, `ConfirmDialog` ตอนบันทึกเลขใหม่, เหตุผลบังคับตอนปฏิเสธ
3. **ภาษาไทยในฟิลด์สถานะหลักดี** — `รอตรวจ` / `อนุมัติแล้ว` / ประเภทสมัคร แปลแล้ว; empty state คิวว่างชัด

### ปัญหาเร่งด่วน

| Pri | ปัญหา | ทำไมสำคัญ |
|-----|--------|-----------|
| **P0** | สลับรายการในคิวแล้ว **detail เก่าค้าง** จน fetch ใหม่เสร็จ — ชื่อ/เลขบนจออาจไม่ตรง `selectedId` ที่จะอนุมัติ | อนุมัติคนผิดได้ |
| **P1** | ปุ่มอนุมัติใช้คำว่า **`promote`** + error หลายจุดโชว์รหัสดิบ (`load_failed`, `approve_failed`) | นายทะเบียนสับสน / ไม่รู้จะแก้ยังไง |
| **P1** | **เลขถาวรที่จะได้** (pending / effective) ไม่อยู่ใน header — ต้องจำจากแผงเปลี่ยนเลข | ผิดเลขตอนกดยืนยัน |
| **P1** | `listbox` ไม่รองรับลูกศร; dialog เลขซ้ำไม่มี Escape / focus trap | a11y + ความเร็วงานคีย์บอร์ด |

### Top 3 ที่ควรแก้ก่อน

1. เคลียร์/ใส่ loading state ของ detail ตอนเปลี่ยนคิว (กันอนุมัติผิดคน)
2. ตัด jargon `promote` + map ข้อความ error เป็นภาษาไทย actionable
3. โชว์เลขที่จะได้เมื่อยืนยันใน header + เสริมคีย์บอร์ดคิว / dialog

### Backlog สั้นๆ (ลำดับแก้)

1. `harden` — stale detail + error copy map
2. `clarify` — ป้ายอนุมัติ / เลขถาวรใน header
3. `audit` — listbox keyboard + conflict dialog Escape/focus
4. `polish` — รอบสุดท้าย

---

## English — Full Critique

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No detail loading when switching rows; previous member stays on screen |
| 2 | Match System / Real World | 2 | Approve CTA says `promote`; raw API error codes leak to UI |
| 3 | User Control and Freedom | 3 | Cancel on approve/reject/ID flows; no post-approve undo (acceptable for irreversible promote) |
| 4 | Consistency and Standards | 3 | Approve uses inline confirm; ID change uses `ConfirmDialog` |
| 5 | Error Prevention | 2 | Strong conflict gate + confirms, undermined by stale-detail race |
| 6 | Recognition Rather Than Recall | 3 | Pending/effective permanent ID not in header |
| 7 | Flexibility and Efficiency | 1 | No queue ↑↓ / approve shortcuts for desk staff |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained queue-first product UI; empty states clear |
| 9 | Error Recovery | 2 | Conflict dialog recovery is strong; many page-level errors unmapped |
| 10 | Help and Documentation | 2 | Footer note under actions only; no step help for first-week registrars |
| **Total** | | **23/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM assessment:** Does **not** read as AI slop. Queue-first composition matches PRODUCT.md; restrained green/paper admin tokens; no gradient text, no decorative side-stripes on content cards, no hero-metric chrome. Product-register failure risk is **strangeness without purpose** (e.g. English `promote` in a Thai staff CTA) more than visual fluff.

**Deterministic scan:** `detect.mjs` on DataReviewPage + related review components → **`[]` (0 findings)**. No false positives to note.

**Visual overlays:** Not available — admin app not running locally; no reliable live injection.

### Overall Impression

The bones are right for a registrar desk: sticky queue, dense but chunked member fields, slip aside, confirm-before-promote. The single biggest opportunity is **trust under speed** — staff click through the queue fast; any lag between selection and detail must never show the wrong person, and the permanent ID that will be minted must be impossible to miss.

### What's Working

1. **Queue-first IA** — `bo-review-workspace` grid keeps the task model correct (pick → verify → act).
2. **Layered confirmations for high stakes** — `gateApprove` + conflict banner/dialog, inline approve confirm with effective ID in the message, required reject reason, `ConfirmDialog` for staged ID saves.
3. **Thai domain labels** in `MemberReviewSummary` (data variant) and useful empty states for empty queue / no selection.

### Priority Issues

#### [P0] Stale detail while switching queue items
- **What:** `selectRow` sets `selectedId` immediately but does **not** clear `detail`. `runApprove` / `onReject` use `selectedId`; header/summary/confirm copy still show the previous member until fetch resolves.
- **Why it matters:** On slow networks or rapid clicking, staff can confirm Person A’s ID while submitting Person B — catastrophic for a membership registry.
- **Fix:** On selection change: clear detail (or keep previous behind an explicit “กำลังโหลด…” overlay with actions disabled until `detail.memberId === selectedId`). Prefer skeleton in `bo-review-main`.
- **Suggested command:** `/impeccable harden DataReviewPage`

#### [P1] Approve CTA jargon + raw error codes
- **What:** Label `อนุมัติ — promote + ใบเสร็จชั่วคราว`. Page-level `setError(err.message)` surfaces `load_failed` / `approve_failed` / `reject_failed` / `check_failed`.
- **Why it matters:** Registrars speak Thai process language (“เลื่อนเป็นสมาชิกถาวร / ออกใบเสร็จชั่วคราว”), not eng. tech verbs. Unmapped codes violate PRODUCT anti-reference on vague status text.
- **Fix:** Thai CTA without `promote`; shared `ERROR_LABEL` map (reuse `ReviewIdChangePanel` pattern) for all page actions.
- **Suggested command:** `/impeccable clarify DataReviewPage ReviewActionBar`

#### [P1] Effective permanent ID missing from detail header
- **What:** `ReviewDetailHeader` shows temp ID only. Pending staged ID lives in `ReviewIdChangePanel` status text; confirm message is the only other place that shows `effectiveIdOnConfirm`.
- **Why it matters:** Recognition over recall — the number that will stick after approve is the decision centerpiece.
- **Fix:** Header dual line: เลขชั่วคราว → เลขที่จะได้เมื่ออนุมัติ (highlight when pending differs).
- **Suggested command:** `/impeccable clarify ReviewDetailHeader`

#### [P1] Incomplete keyboard / dialog a11y on core controls
- **What:** Queue uses `role="listbox"` / `option` but no ArrowUp/Down/Home/End. `ReviewIdConflictDialog` lacks Escape + initial focus (unlike `ConfirmDialog` / `MemberDetailDrawer`).
- **Why it matters:** Desktop staff and keyboard / SR users (Sam) hit a fake listbox and an incomplete modal.
- **Fix:** Implement listbox keyboard pattern; align conflict dialog with `ConfirmDialog` focus/Escape/body scroll lock.
- **Suggested command:** `/impeccable audit ReviewQueuePanel ReviewIdConflictDialog`

### Persona Red Flags

**Alex (Power User — นายทะเบียนคล่อง):**
- No `j`/`k` or ↑↓ queue navigation; every item is a mouse click.
- Approve path always two clicks (gate + confirm) — correct for risk, but no keyboard accelerator for “next + approve”.
- Long English-mixed CTA slows scanning under volume.
- High abandonment risk only if queue is long and UI feels slower than spreadsheet habits.

**Sam (Accessibility-dependent):**
- Listbox semantics without keyboard → SR/keyboard users cannot traverse options properly.
- Conflict dialog: no Escape, no auto-focus — focus can remain under the overlay.
- Focus-visible on queue items is good; keep that pattern when adding keys.
- Status meaning is mostly text-labeled (good); don’t regress to color-only badges.

**Riley (Stress tester):**
- **Race on rapid queue clicks** = primary exploit of the stale-detail bug.
- Reject with empty reason correctly blocked — good.
- `busy`/`gating` disables buttons — good against double-submit; still verify approve after conflict “use suggested” path under double-click.
- After approve, selection clears and flash moves to queue (`showAlerts={!detail}`) — solid; verify message isn’t lost if user immediately selects another row.
- `MemberDetailDrawer` delete confirm (typed / ConfirmDialog) is elsewhere — not on this page; don’t assume delete lives here.

### Cognitive Load

| Checklist | Result |
|-----------|--------|
| Single focus | Pass — queue + one detail |
| Chunking | Pass — sections ≤4-ish fields |
| Grouping | Pass |
| Visual hierarchy | Partial — action bar CTA overloaded with jargon |
| One thing at a time | Partial — reject panel can open while approve still available |
| Minimal choices | Pass at decision points (≤3 in conflict dialog) |
| Working memory | **Fail** — remember pending ID from nested panel |
| Progressive disclosure | Pass — reject + ID change expand |

→ **Moderate** cognitive load (~3 failures).

### Minor Observations

- Approve confirm is inline (`bo-review-confirm`) vs modal for ID change — consistent enough if intentional; document or unify.
- Slip empty hint correctly defers slip judgment to step 2 — good workflow honesty.
- Queue count pill + sticky queue are strong efficiency cues.
- Responsive stack in `admin.css` exists; primary users are desktop — OK.
- `MemberDetailDrawer` is related infrastructure, not mounted on this page; critique scope stays on queue-review loop.
- Animation `bo-rise` on workspace panels — ensure `prefers-reduced-motion` coverage in admin (harden/polish).

### Questions to Consider

- Should selecting the next queue item auto-advance after approve (Alex speed) or require intentional click (Riley safety)?
- Is “เลื่อนสถานะ + ออกใบเสร็จชั่วคราว” the registrar’s native phrase for what `promote` meant?
- Should reject require a second “ยืนยันปฏิเสธ” after reason, or is required reason enough friction?

### Concrete fix backlog (for next chat)

| Order | Command | Scope | Outcome |
|------|---------|--------|---------|
| 1 | `/impeccable harden` | `DataReviewPage` selection/detail sync | Impossible to act on mismatched `selectedId`/`detail` |
| 2 | `/impeccable clarify` | Approve label, error map, header effective ID | Thai, actionable, recognition-first |
| 3 | `/impeccable audit` | Queue listbox + conflict dialog a11y | Keyboard parity with ConfirmDialog |
| 4 | `/impeccable polish` | Data review workspace | Score re-check after P0/P1 |

---

## Trend / snapshot

First formal critique for this target in `docs/ui-ux-critique/`. Impeccable storage slug: `apps-web-src-admin-pages-datareviewpage-tsx`.
