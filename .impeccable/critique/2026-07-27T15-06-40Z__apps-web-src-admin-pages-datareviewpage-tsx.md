---
target: /admin/data DataReviewPage re-critique after fixes
total_score: 27
p0_count: 0
p1_count: 3
timestamp: 2026-07-27T15-06-40Z
slug: apps-web-src-admin-pages-datareviewpage-tsx
---
# 11 — Admin Data Review (`/admin/data`) · Score **27/40** · P0: **0** · P1: **3**

> Generated: 2026-07-27 · Skill: Impeccable `critique` · Register: **product**
> Method: ⚠️ DEGRADED: single-context (running as parent multitask subagent — nested dual-agent spawn disallowed)
> Target files: `DataReviewPage.tsx`, `ReviewActionBar.tsx`, `ReviewQueuePanel.tsx`, `reviewErrorMessage.ts`, `admin.css` (+ related: `ReviewDetailHeader`, `ReviewIdConflictDialog`, `ReviewIdChangePanel`, `MemberReviewSummary`)
> Route: **`/admin/data`**
> Detector: `detect.mjs --json` → **`[]` (0 findings)** · Browser overlay: skipped (admin auth-gated; no live injection)
> Prior: **23/40** · P0: 1 · P1: 3 → **Δ +4**, P0 cleared (stale detail + action lock + Thai errors)
> Fixes verified: `selectRow`/`useEffect` clear detail; `detailReady` gate; `actionsDisabled={!detailReady}`; `reviewErrorMessage` Thai map

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: **27/40** (Acceptable) — P0: **0** · P1: **3**

รอบแก้ปิด **P0 อนุมัติคนผิดจาก detail ค้าง** ได้จริง: สลับคิวแล้วเคลียร์ detail + skeleton + ล็อกปุ่มจนกว่า `detail.memberId === selectedId` และ error หลักเป็นภาษาไทยผ่าน `reviewErrorMessage` แล้ว — ยังเหลือ jargon `promote` บนปุ่มอนุมัติ, เลขถาวรที่จะได้ไม่อยู่ใน header, และ listbox/dialog ยังไม่ครบคีย์บอร์ด

### จุดแข็ง

1. **คิวเป็นศูนย์กลาง + กัน race แล้ว** — เคลียร์ detail / `detailLoading` / skeleton / `aria-busy` / `actionsDisabled` ทำให้สลับแถวเร็วไม่โชว์คนเก่า
2. **ยืนยันก่อนอนุมัติ/เปลี่ยนเลขยังแน่น** — `gateApprove` + conflict banner/dialog, confirm มีเลข effective, เหตุผลบังคับตอนปฏิเสธ
3. **Error หลักเป็นไทย actionable** — `load_failed` / `approve_failed` / `reject_failed` / `member_id_taken` ฯลฯ map ใน `reviewErrorMessage.ts`

### ปัญหาเร่งด่วน

| Pri | ปัญหา | ทำไมสำคัญ |
|-----|--------|-----------|
| **P1** | ปุ่มอนุมัติยังมีคำว่า **`promote`** | นายทะเบียนสแกนคิวเร็ว — คำอังกฤษเทคนิคทำให้ CTA หลักอ่านช้า/สับสน |
| **P1** | **เลขถาวรที่จะได้** (pending / effective) ยังไม่อยู่ใน `ReviewDetailHeader` | ต้องจำจากแผงเปลี่ยนเลขหรือข้อความ confirm — ผิดเลขตอนกดยืนยัน |
| **P1** | `listbox` ไม่มีลูกศร; `ReviewIdConflictDialog` ไม่มี Escape / focus trap | a11y + ความเร็วงานคีย์บอร์ดบนเดสก์ท็อป |

### Top 3 ที่ควรแก้ก่อน

1. ตัด `promote` จาก `approveLabel` → ภาษาไทยกระบวนการ (เช่น เลื่อนเป็นสมาชิกถาวร + ออกใบเสร็จชั่วคราว)
2. โชว์เลขที่จะได้เมื่อยืนยันใน header (คู่กับเลขชั่วคราว)
3. ลูกศรคิว listbox + Escape/focus ใน conflict dialog ให้เท่า `ConfirmDialog`

### Backlog สั้นๆ (ลำดับแก้)

1. `clarify` — ป้ายอนุมัติ + เลขถาวรใน header
2. `audit` — listbox keyboard + conflict dialog Escape/focus
3. `polish` — รอบสุดท้าย / re-critique

---

## English — Full Critique

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton + `aria-live` + `detailReady`; gating “กำลังตรวจสอบเลข…” present |
| 2 | Match System / Real World | 2 | Primary CTA still contains English `promote` |
| 3 | User Control and Freedom | 3 | Cancel on approve/reject/ID; no post-approve undo (acceptable) |
| 4 | Consistency and Standards | 3 | Inline approve confirm vs modal ID change; tokens consistent |
| 5 | Error Prevention | 4 | Stale-detail race closed; actions locked until `detailReady`; conflict gate |
| 6 | Recognition Rather Than Recall | 3 | Effective permanent ID still not in header — confirm/panel only |
| 7 | Flexibility and Efficiency | 1 | No queue ↑↓ / shortcuts for desk staff |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained queue-first product UI; skeleton + empty states clean |
| 9 | Error Recovery | 3 | Thai `reviewErrorMessage` map; conflict recovery strong; unknown codes fall through |
| 10 | Help and Documentation | 2 | Footer note under actions only; no first-week registrar help |
| **Total** | | **27/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM assessment:** Does **not** read as AI slop. Queue-first composition matches PRODUCT.md; restrained green/paper admin tokens; no gradient text / decorative side-stripes on content cards. Product-register risk is residual **jargon on the primary CTA** (`promote`), not visual fluff.

**Deterministic scan:** `detect.mjs --json` on DataReviewPage + ReviewActionBar + ReviewQueuePanel + reviewErrorMessage → **`[]` (0 findings)**. No false positives.

**Visual overlays:** Not available — admin auth-gated; no reliable live injection this run.

### Overall Impression

The safety spine is now trustworthy under speed: switch row → blank/skeleton → act only when IDs match. The biggest remaining opportunity is **recognition at the decision moment** — Thai process language on Approve, and the permanent ID that will be minted visible in the header before confirm.

### What's Working

1. **Stale-detail / wrong-person path closed** — `selectRow` and `[selectedId]` effect clear `detail`, set loading; `detailReady` requires `detail.memberId === selectedId && !detailLoading`; `runApprove` / `onReject` / `gateApprove` / `onUseSuggestedId` all bail without it; `ReviewActionBar` `actionsDisabled` + `locked`.
2. **Layered confirmations** — conflict check before confirm, effective ID in confirm copy, required reject reason, `ConfirmDialog` pattern for staged ID saves.
3. **Thai error mapping** — shared `reviewErrorMessage` covers the review-queue codes staff actually hit.

### Priority Issues

#### [P1] Approve CTA still says `promote`
- **What:** `approveLabel="อนุมัติ — promote + ใบเสร็จชั่วคราว"` on `DataReviewPage`.
- **Why it matters:** Registrars speak Thai process language; English tech verb on the primary success button violates PRODUCT anti-references and slows queue scanning.
- **Fix:** e.g. `อนุมัติ — เลื่อนเป็นสมาชิกถาวร + ออกใบเสร็จชั่วคราว` (or shorter desk phrasing staff already use).
- **Suggested command:** `/impeccable clarify DataReviewPage ReviewActionBar`

#### [P1] Effective permanent ID missing from detail header
- **What:** `ReviewDetailHeader` still shows temp ID only. Pending/effective lives in `ReviewIdChangePanel` + confirm message.
- **Why it matters:** Recognition over recall — the number minted on approve is the decision centerpiece.
- **Fix:** Header dual line: เลขชั่วคราว → เลขที่จะได้เมื่ออนุมัติ (highlight when pending differs from current).
- **Suggested command:** `/impeccable clarify ReviewDetailHeader DataReviewPage`

#### [P1] Incomplete keyboard / dialog a11y on core controls
- **What:** Queue `role="listbox"` / `option` without ArrowUp/Down/Home/End. `ReviewIdConflictDialog` lacks Escape + initial focus / focus trap (unlike `ConfirmDialog` / `MemberDetailDrawer`). Overlay click-outside cancel exists.
- **Why it matters:** Desktop staff and keyboard/SR users hit a fake listbox and an incomplete modal.
- **Fix:** Listbox keyboard pattern; align conflict dialog with `ConfirmDialog` focus/Escape/body scroll lock.
- **Suggested command:** `/impeccable audit ReviewQueuePanel ReviewIdConflictDialog`

### Persona Red Flags

**Alex (Power User — นายทะเบียนคล่อง):**
- Stale-detail fear reduced — can click queue faster with confidence.
- Still no ↑↓ / j-k queue nav; every item is a mouse click.
- `promote` in CTA slows visual scan under volume.
- Approve remains two-step (gate + confirm) — correct for risk; no keyboard accelerator.

**Sam (Accessibility-dependent):**
- Loading skeleton has `role="status"` + `aria-live="polite"` — good.
- Listbox semantics without keyboard → cannot traverse options properly.
- Conflict dialog: no Escape, no auto-focus — focus can remain under the overlay.
- Focus-visible on queue items remains; preserve when adding keys.

**Riley (Stress tester):**
- Rapid queue clicks no longer show Person A while acting as Person B — primary exploit closed.
- Reject empty reason still blocked; `busy`/`gating`/`actionsDisabled` block double-submit.
- Unmapped error codes still surface raw (`?? code`) — probe unknown API messages.
- After approve, selection clears and flash moves to queue (`showAlerts={!selectedId}`) — solid.

### Cognitive Load

| Checklist | Result |
|-----------|--------|
| Single focus | Pass — queue + one detail |
| Chunking | Pass |
| Grouping | Pass |
| Visual hierarchy | Partial — CTA still jargon-heavy |
| One thing at a time | Partial — reject panel can open while approve available |
| Minimal choices | Pass at conflict dialog (≤3) |
| Working memory | **Fail** — remember pending ID from nested panel |
| Progressive disclosure | Pass — reject + ID change expand |

→ **Moderate** cognitive load (~2–3 failures). Improved vs prior race-induced memory load.

### Minor Observations

- Approve confirm stays inline (`bo-review-confirm`) vs modal for ID change — fine if intentional.
- Slip empty hint correctly defers slip judgment to step 2.
- Skeleton shimmer respects `prefers-reduced-motion` in `admin.css`.
- Unknown codes in `reviewErrorMessage` fall through raw — map new codes as they appear (P2).
- `ReviewActionBar` remounts via `key={detail.memberId}` — resets confirm/reject UI on person change (good).

### Questions to Consider

- Should selecting the next queue item auto-advance after approve (Alex speed) or require intentional click (Riley safety)?
- Exact registrar phrase for the former `promote` step?
- Should reject require a second confirm after reason, or is required reason enough?

### Concrete fix backlog (for next chat)

| Order | Command | Scope | Outcome |
|------|---------|--------|---------|
| 1 | `/impeccable clarify` | Approve label + header effective ID | Thai CTA; recognition-first ID |
| 2 | `/impeccable audit` | Queue listbox + conflict dialog a11y | Keyboard parity with ConfirmDialog |
| 3 | `/impeccable polish` | Data review workspace | Re-critique after P1 |

---

## Trend / snapshot

Prior formal critique: **23/40**. This re-run: **27/40** (Δ +4). Slug: `apps-web-src-admin-pages-datareviewpage-tsx`.
