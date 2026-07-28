---
target: DataReviewPage after stale-detail fix
total_score: 27
p0_count: 0
p1_count: 3
timestamp: 2026-07-27T15-09-56Z
slug: apps-web-src-admin-pages-datareviewpage-tsx
---
# 11 — Admin Data Review (`/admin/data`)

> **Method:** ⚠️ DEGRADED: single-context (critique running as nested Multitask subagent — dual Assessment A/B agents not spawned)  
> **Date:** 2026-07-27 (re-critique after stale-detail + error-map fixes)  
> **Target:** `DataReviewPage` + `reviewErrorMessage` + `ReviewActionBar` (+ shared review chrome)  
> **Files:** `apps/web/src/admin/pages/DataReviewPage.tsx`, `reviewErrorMessage.ts`, `ReviewActionBar.tsx`, `ReviewQueuePanel.tsx`, `ReviewDetailHeader.tsx`, `MemberReviewSummary.tsx`, `ReviewIdChangePanel.tsx`, `ReviewIdConflictDialog.tsx`, `admin.css`  
> **Route:** **`/admin/data`**  
> **Register:** product · queue-first BO · speed + wrong-person prevention for นายทะเบียน  
> **Design health:** **27 / 40** — Acceptable  
> **Prior:** 23/40 · **Delta:** **+4**  
> **P0:** 0 · **P1:** 3 · **P2:** 3 · **P3:** 1  
> **Detector:** `detect.mjs --json` on page + helpers → **`[]` (0 findings)**  
> **Browser overlay:** skipped (admin auth-gated / no injection in this subagent run)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: **27/40** (Acceptable) — ขึ้นจาก 23 (+4)

รอบแก้ปิด **P0 สลับคิวแล้ว detail ค้าง** ได้แล้ว — เคลียร์ detail + skeleton + `detailReady` ล็อกปุ่มจนกว่า `memberId` ตรง และ `reviewErrorMessage` แปลรหัสหลักเป็นไทย actionable ความเสี่ยงอนุมัติคนผิดจาก race ลดลงชัด เพดานคะแนนรอบนี้คือ **ศัพท์ `promote` บนปุ่มหลัก**, **เลขถาวรที่จะได้ไม่อยู่ใน header**, และ **คีย์บอร์ด listbox / conflict dialog**

### Delta vs prior (สิ่งที่แก้แล้ว)

| รายการ | Prior | Now |
|--------|-------|-----|
| สลับคิวแล้ว detail/สลิปเก่าค้าง (อนุมัติผิดคนได้) | **P0** | ✅ `selectRow` + `[selectedId]` เคลียร์ detail; skeleton; `detailReady`; `actionsDisabled` |
| Error รหัสดิบ (`load_failed` ฯลฯ) | **P1** | ✅ `reviewErrorMessage` map ไทย |
| คะแนน / P0 / P1 | 23 · 1 · 3 | **27 · 0 · 3** |

### จุดแข็ง

1. **คิวเป็นศูนย์กลางจริง** — queue sticky + detail; empty state ชี้ชัดให้เลือกรายการซ้าย
2. **Spine ความปลอดภัยปิดแล้ว** — สลับรายการ → blank/skeleton → ทำได้เมื่อ ID ตรงเท่านั้น
3. **ยืนยันก่อนอนุมัติ/เปลี่ยนเลข** — gate เลขซ้ำ, confirm อนุมัติโชว์เลขที่จะได้, reject บังคับเหตุผล, `ConfirmDialog` pattern สำหรับ staged ID

### ปัญหาที่เหลือ (สำคัญ)

| ระดับ | ปัญหา |
|-------|--------|
| **P1** | ปุ่มอนุมัติยังมีคำว่า **`promote`** (อังกฤษ jargon) |
| **P1** | **เลขถาวรที่จะได้** (pending / effective) ไม่อยู่ใน header — ต้องจำจากแผงเปลี่ยนเลข / confirm |
| **P1** | คิว `listbox` ไม่มีลูกศร; `ReviewIdConflictDialog` ไม่มี Escape / focus trap |
| **P2** | Unknown API codes ยังโชว์ดิบผ่าน `?? code` |
| **P2** | Approve confirm + reject form เปิดพร้อมกันได้ |
| **P2** | ไม่มี auto-select รายการถัดไปหลังอนุมัติ |
| **P3** | ช่วยเหลือสัปดาห์แรกของนายทะเบียนยังมีแค่ note ใต้ปุ่ม |

### Top 3 ที่ควรแก้ก่อน

1. ตัด jargon `promote` → ภาษาไทยกระบวนการ (เช่น เลื่อนเป็นสมาชิกถาวร + ใบเสร็จชั่วคราว)
2. โชว์เลขที่จะได้เมื่อยืนยันใน `ReviewDetailHeader`
3. คีย์บอร์ดคิว (↑↓) + Esc/focus บน conflict dialog ให้เท่า `ConfirmDialog`

### Personas (สรุป)

- **Alex (power):** คลิกคิวเร็วขึ้นได้โดยไม่กลัว stale; ยังไม่มี ↑↓ / shortcut; `promote` ช้าสายตา
- **Sam (a11y):** skeleton มี `role="status"` + `aria-live`; listbox ไม่ครบลูกศร; conflict ไม่ Esc/โฟกัสเข้า
- **Riley (edge):** race คนผิดปิดแล้ว; unmapped codes ยัง probe ได้; reject ว่างยังบล็อก

### Cognitive load

ล้มเหลวประมาณ **2/8** → **ปานกลาง** (จำเลข pending จากแผงซ้อน; CTA ยัง jargon) — ดีขึ้นจากโหลดจาก race เดิม

### AI slop

**ไม่ใช่ AI slop** — queue-first จริง, เขียว+ทอง BO, detector สะอาด. ความเสี่ยง product-register คือ **ศัพท์เทคนิคบนปุ่มหลัก** ไม่ใช่การตกแต่ง

---

## English (for follow-up fix agents)

### Provenance

`Method: ⚠️ DEGRADED: single-context (nested Multitask critique subagent; A/B not dual-spawned)`

Sources reviewed: `DataReviewPage.tsx`, `reviewErrorMessage.ts`, `ReviewActionBar.tsx`, `ReviewQueuePanel.tsx`, `ReviewDetailHeader.tsx`, `MemberReviewSummary.tsx`, `ReviewIdChangePanel.tsx`, `ReviewIdConflictDialog.tsx`, `ConfirmDialog.tsx` (comparison), `admin.css` (`.bo-review-*`, skeleton, reduced-motion).  
CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/DataReviewPage.tsx apps/web/src/admin/ReviewActionBar.tsx apps/web/src/admin/reviewErrorMessage.ts` → **`[]`**.

### Design health score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton + `aria-live` + `detailReady`; gating “กำลังตรวจสอบเลข…” present |
| 2 | Match System / Real World | 2 | Primary CTA still contains English `promote` |
| 3 | User Control and Freedom | 3 | Cancel on approve/reject/ID; no Esc on conflict dialog |
| 4 | Consistency and Standards | 3 | Shared review chrome; conflict dialog ≠ ConfirmDialog a11y |
| 5 | Error Prevention | 4 | Stale-detail race closed; actions locked until `detailReady`; conflict gate |
| 6 | Recognition Rather Than Recall | 3 | Effective permanent ID still not in header — confirm/panel only |
| 7 | Flexibility and Efficiency | 1 | No queue ↑↓ / shortcuts for desk staff |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained queue-first product UI; skeleton + empty states clean |
| 9 | Error Recovery | 3 | Thai `reviewErrorMessage` map; conflict recovery strong; unknown codes fall through |
| 10 | Help and Documentation | 2 | Footer note under actions only; no first-week registrar help |
| **Total** | | **27/40** | **Acceptable** |

### Delta vs prior (23 → 27)

| Change | Effect on score / severity |
|--------|----------------------------|
| Clear detail + skeleton + `detailReady` / `actionsDisabled` | Clears **P0**; Heuristic **5** ↑; **1** ↑ |
| Shared `reviewErrorMessage` Thai map | Clears raw-code **P1**; Heuristic **9** ↑ |
| Unchanged `promote` CTA + header ID + listbox/dialog a11y | Remaining **P1×3** |

### Anti-Patterns Verdict

**LLM assessment:** Does **not** read as AI slop. Queue-first composition matches PRODUCT.md; restrained green/paper admin tokens; no gradient text / decorative side-stripes on content cards. Product-register risk is residual **jargon on the primary CTA** (`promote`), not visual fluff.

**Deterministic scan:** `detect.mjs --json` on DataReviewPage + ReviewActionBar + reviewErrorMessage → **`[]` (0 findings)**. No false positives.

**Visual overlays:** Not available — admin auth-gated; no reliable live injection this run.

### Overall Impression

The safety spine is now trustworthy under speed: switch row → blank/skeleton → act only when IDs match. The biggest remaining opportunity is **recognition at the decision moment** — Thai process language on Approve, and the permanent ID that will be minted visible in the header before confirm.

### What's Working

1. **Stale-detail / wrong-person path closed** — `selectRow` and `[selectedId]` effect clear `detail`, set loading; `detailReady` requires `detail.memberId === selectedId && !detailLoading`; `runApprove` / `onReject` / `gateApprove` / `onUseSuggestedId` all bail without it; `ReviewActionBar` `actionsDisabled` + `locked`.
2. **Layered confirmations** — conflict check before confirm, effective ID in confirm copy, required reject reason, staged ID saves.
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
- Sticky `.bo-review-actions` also applies here (shared CSS) — bonus for desk reachability (not the prior P0 for this page).

### Questions to Consider

- Should selecting the next queue item auto-advance after approve (Alex speed) or require intentional click (Riley safety)?
- Exact registrar phrase for the former `promote` step?
- Should reject require a second confirm after reason, or is required reason enough?

### Concrete fix backlog (for next chat)

| Order | Command | Scope | Outcome |
|------|---------|--------|---------|
| 1 | `/impeccable clarify` | Approve label + header effective ID | Thai CTA; recognition-first ID |
| 2 | `/impeccable audit` | Queue listbox + conflict dialog a11y | Keyboard parity with ConfirmDialog |
| 3 | `/impeccable polish` | Data review workspace | Mutex approve/reject; auto-next optional; re-critique |

### Detector summary

```text
detect.mjs --json \
  apps/web/src/admin/pages/DataReviewPage.tsx \
  apps/web/src/admin/ReviewActionBar.tsx \
  apps/web/src/admin/reviewErrorMessage.ts
→ [] (exit 0, clean)
```

### Trend / snapshot

Prior formal critique: **23/40**. This re-run: **27/40** (Δ +4).  
Slug: `apps-web-src-admin-pages-datareviewpage-tsx`.

---

*End of report — Thai summary above; English tables/backlog for fix agents.*
