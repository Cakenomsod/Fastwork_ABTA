# 12 — Admin Slip Review (`/admin/slips`)

> **Method:** ⚠️ DEGRADED: single-context (critique running as nested Multitask subagent — dual Assessment A/B agents not spawned)  
> **Date:** 2026-07-27 (re-critique after stale-detail + sticky actions + Thai paymentStatus)  
> **Target:** `SlipReviewPage` + `reviewErrorMessage` + `ReviewActionBar` (+ shared review chrome / `MemberReviewSummary` slip variant)  
> **Files:** `apps/web/src/admin/pages/SlipReviewPage.tsx`, `reviewErrorMessage.ts`, `ReviewActionBar.tsx`, `MemberReviewSummary.tsx`, `SlipImage.tsx`, `ReviewQueuePanel.tsx`, `ReviewDetailHeader.tsx`, `ReviewIdChangePanel.tsx`, `ReviewIdConflictDialog.tsx`, `admin.css`  
> **Register:** product · queue-first BO · speed + error prevention critical for เหรัญญิก  
> **Design health:** **30 / 40** — Good  
> **Prior:** 25/40 · **Delta:** **+5**  
> **P0:** 0 · **P1:** 2 · **P2:** 4 · **P3:** 2  
> **Detector:** `detect.mjs --json` on page + helpers → **`[]` (0 findings)**  
> **Browser overlay:** skipped (admin auth-gated / no injection in this subagent run)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: **30/40** (Good) — ขึ้นจาก 25 (+5)

รอบแก้ปิด **P0 สลับคิวแล้ว detail/สลิปเก่าค้าง**, ดึง **ปุ่มยืนยัน/ไม่ผ่านให้ sticky** นอก scroll ของ detail และแปล **`paymentStatus` + error codes** เป็นไทย actionable แล้ว เหรัญญิกเทียบยอด↔สลิปแล้วกดได้โดยไม่ต้องเลื่อนหาปุ่ม และไม่เห็น enum อังกฤษดิบ เหลืองานหลักคือ **คีย์บอร์ดคิว** และ **conflict dialog a11y**

### Delta vs prior (สิ่งที่แก้แล้ว)

| รายการ | Prior | Now |
|--------|-------|-----|
| สลับคิวแล้ว detail/สลิปเก่าค้าง | **P0** | ✅ เคลียร์ detail + skeleton + `detailReady` + `actionsDisabled` |
| ปุ่มอนุมัติอยู่ท้ายหน้า หลัง contact | **P1** | ✅ `.bo-review-actions` sticky/flex-pinned นอก `.bo-review-main-scroll` |
| Error รหัสดิบ + `paymentStatus` อังกฤษ | **P1** | ✅ `reviewErrorMessage` + `paymentStatusLabel()` ไทย |
| คะแนน / P0 / P1 | 25 · 1 · 4 | **30 · 0 · 2** |

### จุดแข็ง

1. **คิวเป็นศูนย์กลาง** — `bo-review-workspace` แยกคิว sticky + detail; empty state ชัด
2. **กันพลาดเลขใบเสร็จ** — `gateApprove` + conflict banner + dialog + digit panel ก่อนบันทึก
3. **Confirm ก่อนออกเอกสาร** — inline approve โชว์เลขที่จะใช้; reject บังคับเหตุผล + ตัวอย่าง; action bar อยู่ใน viewport งานตรวจ

### ปัญหาที่เหลือ (สำคัญ)

| ระดับ | ปัญหา |
|-------|--------|
| **P1** | คิวเป็น `listbox` แต่ไม่มีลูกศร / shortcut — Alex เคลียร์คิวไม่ได้เร็ว |
| **P1** | `ReviewIdConflictDialog` ไม่มี Escape / focus trap (ต่างจาก `ConfirmDialog`) |
| **P2** | ช่องทางติดต่อยังกางเต็มเสมอบน slip variant — แย่งสมาธิจากยอด+สลิป |
| **P2** | Approve confirm + reject form เปิดพร้อมกันได้ |
| **P2** | ไม่มี auto-select รายการถัดไปหลังยืนยัน |
| **P2** | Queue age / submitted-at ยังไม่โชว์สำหรับ FIFO |
| **P3** | ไม่มี zoom/rotate สลิปในหน้า |
| **P3** | Success flash ไม่ auto-dismiss |

### Top 3 ที่ควรแก้ก่อน

1. คีย์บอร์ดคิว (↑↓ / Home·End) + roving tabindex
2. Esc + initial focus + focus restore บน `ReviewIdConflictDialog`
3. Collapse “ช่องทางติดต่อ” บน slip variant (default ปิด) + mutex approve/reject panels

### Personas (สรุป)

- **Alex (power):** sticky actions + ไม่กลัว stale → loop เร็วขึ้น; ยังไม่มี j/k หรือ auto-next
- **Sam (a11y):** loading announce ดีขึ้น; conflict modal ยังไม่ครบ; listbox ยังโกหกเรื่องลูกศร
- **Riley (edge):** race คนผิดปิดแล้ว; ยังเปิด approve+reject พร้อมกันได้; amount `—` ไม่เตือน

### Cognitive load

ล้มเหลวประมาณ **1–2/8** → **ต่ำ–ปานกลาง** (contact ยังกาง; sticky ลด memory bridge ของปุ่ม) — ดีขึ้นจาก prior ~3

### AI slop

**ไม่ใช่ AI slop** — treasurer console จริง; detector สะอาด; ไม่มี side-stripe / gradient text / purple glow

---

## English (for follow-up fix agents)

### Provenance

`Method: ⚠️ DEGRADED: single-context (nested Multitask critique subagent; A/B not dual-spawned)`

Sources reviewed: `SlipReviewPage.tsx`, `reviewErrorMessage.ts`, `ReviewActionBar.tsx`, `MemberReviewSummary.tsx` (slip + `paymentStatusLabel`), `SlipImage.tsx`, `ReviewQueuePanel.tsx`, `ReviewDetailHeader.tsx`, `ReviewIdChangePanel.tsx`, `ReviewIdConflictDialog.tsx`, `ConfirmDialog.tsx` (comparison), `admin.css` (`.bo-review-main-scroll`, sticky `.bo-review-actions`).  
CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/SlipReviewPage.tsx apps/web/src/admin/ReviewActionBar.tsx apps/web/src/admin/reviewErrorMessage.ts apps/web/src/admin/MemberReviewSummary.tsx` → **`[]`**.

### Design health score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Skeleton + `aria-live` + `detailReady`; gating copy OK |
| 2 | Match system / real world | 4 | Strong Thai ops copy; `paymentStatusLabel` + `reviewErrorMessage` |
| 3 | User control & freedom | 3 | Cancel on confirm/reject/conflict; no Esc on conflict dialog |
| 4 | Consistency & standards | 3 | Shared with data review; ConfirmDialog ≠ ConflictDialog a11y |
| 5 | Error prevention | 4 | Stale-detail race closed; receipt conflict gate; actions locked |
| 6 | Recognition over recall | 3 | Amount highlight + slip aside; sticky actions; contact still always open |
| 7 | Flexibility & efficiency | 2 | Sticky actions help; still no keyboard queue nav / shortcuts / auto-next |
| 8 | Aesthetic & minimalist | 3 | Queue-first craft; contact block still noisy for slip task |
| 9 | Error recovery | 3 | Thai mapped codes; unknown codes may still surface raw |
| 10 | Help & documentation | 2 | Bottom note + reject examples; no slip verification checklist |
| **Total** | | **30/40** | **Good** |

### Delta vs prior (25 → 30)

| Change | Effect on score / severity |
|--------|----------------------------|
| Clear detail + skeleton + `detailReady` / `actionsDisabled` | Clears **P0**; Heuristic **5** 2→4; **1** 2→3 |
| Sticky / flex-pinned `.bo-review-actions` outside scroll | Clears actions-buried **P1**; helps **6** / **7** |
| Thai `paymentStatusLabel` + `reviewErrorMessage` | Clears copy **P1**; Heuristic **2** 3→4; **9** 2→3 |
| Unchanged listbox keyboard + conflict dialog a11y | Remaining **P1×2** |

### Anti-patterns verdict

**LLM assessment:** Passes product slop test. Feels like a real treasurer console (queue + evidence + gated confirm), not SaaS metrics chrome. Sticky action pin is earned familiarity for desk tools.

**Deterministic scan:** **0 findings** across SlipReviewPage + helpers + MemberReviewSummary. Detector does **not** catch missing Esc or listbox keyboard — human review owns those.

**Visual overlays:** Not injected this run.

### Cognitive load

Checklist failures (~1–2 → low–moderate):

- [x] Single focus — weak (contact + id-change compete with slip) — improved by sticky actions
- [ ] Chunking — OK
- [ ] Grouping — OK
- [ ] Visual hierarchy — improved (actions always reachable)
- [ ] One thing at a time — mostly OK once selected
- [ ] Minimal choices — OK (approve / reject)
- [ ] Working memory — mostly OK now that actions stay pinned
- [x] Progressive disclosure — FAIL (full contact always shown for slip step)

### Overall impression

Strong foundation for ABTA’s “คิวเป็นศูนย์กลาง” principle, now with a trustworthy context switch and reachable primary actions. Biggest remaining opportunity: **keyboard-speed queue traversal** and **modal a11y parity** with `ConfirmDialog`, then distill contact off the default slip viewport.

### What's working

1. **Hard context switch on select** — clear detail → skeleton → unlock only when `detail.memberId === selectedId`.
2. **Sticky action composition** — amount/slip in scroll; approve/reject pinned under `.bo-review-main` via flex + sticky CSS.
3. **Thai status + errors** — `paymentStatusLabel` covers slip-queue statuses; shared `reviewErrorMessage` for load/check/approve/reject/taken codes.
4. **Receipt collision workflow** — preempt check, warn banner, modal with suggested ID, staged pending receipt.

### Priority issues

#### [P1] What: Queue listbox lacks keyboard navigation; no review accelerators

- **Why it matters:** Alex cannot clear a queue fast; Sam tabs through every item button without ArrowUp/Down/Home/End. `role="listbox"` promises keyboard behavior that isn’t implemented.
- **Fix:** Arrow-key roving tabindex on queue; optional shortcuts when detail focused; after successful approve, optionally auto-select next pending item.
- **Suggested command:** `/impeccable harden` + `/impeccable audit` (ReviewQueuePanel)

#### [P1] What: Conflict dialog missing Escape, initial focus, focus trap

- **Why it matters:** `ConfirmDialog` already does Esc + focus; `ReviewIdConflictDialog` does not. High-stakes ID collision leaves keyboard users stuck or clicking overlay only.
- **Fix:** Reuse ConfirmDialog patterns (or extract shared modal shell): Esc, initial focus on primary/cancel, restore focus on close, `aria-describedby`.
- **Suggested command:** `/impeccable audit` / `/impeccable harden`

### Persona red flags

**Alex (Power User)**  
- Sticky actions + cleared stale risk → faster safe loop.  
- Still no shortcuts; no “next item” after success.  
- Must mouse every queue row.

**Sam (Accessibility)**  
- Loading skeleton announced — good.  
- Conflict modal: no Esc, no focus move into dialog.  
- Queue `listbox` without arrow keys is still an a11y lie.  
- Thai errors now SR-friendly for mapped codes.

**Riley (Stress tester)**  
- Rapid select A→B no longer shows A’s slip while acting as B.  
- `showReject` + `showApproveConfirm` can still appear together.  
- Slip open-in-new-tab only; no in-page zoom/rotate.  
- Empty `amount` shows “—” with no warning that comparison is impossible.

### Minor observations

| Sev | Issue | Fix hint | Command |
|-----|-------|----------|---------|
| P2 | Slip variant always shows full contact section | Collapse / move below actions | `/impeccable distill` |
| P2 | Approve confirm + reject form can both be visible | Closing reject when opening confirm (and vice versa) | `/impeccable harden` |
| P2 | No queue age / submitted-at for FIFO priority | Show `createdAt` in slip meta | `/impeccable clarify` |
| P2 | No auto-select next after success | Optional next-item select | `/impeccable polish` |
| P3 | No in-page slip zoom/rotate | Lightbox with transform controls | `/impeccable delight` / shape |
| P3 | Success flash clears only on next select | Auto-dismiss after N seconds + keep `role="status"` | `/impeccable polish` |

### Emotional journey

- **Peak needed:** “ยอดตรงสลิป → ยืนยัน → ได้เลขใบเสร็จจริง” in under a minute — sticky actions make this reachable.  
- **Valley:** contact noise; incomplete conflict modal a11y.  
- **End:** Success flash in queue alert is reassuring; auto-advance would complete the loop.

### Questions to consider

- Should slip review hide member contact entirely unless “ดูโปรไฟล์” is opened?
- After approve, should the workspace auto-open the next queue item (Alex path) or return to empty “เลือกรายการ” (safer pause)?
- Is comparing slip amount to `detail.amount` enough, or do treasurers need bank/time/ref fields beside the image?

### Detector summary

```text
detect.mjs --json \
  apps/web/src/admin/pages/SlipReviewPage.tsx \
  apps/web/src/admin/ReviewActionBar.tsx \
  apps/web/src/admin/reviewErrorMessage.ts \
  apps/web/src/admin/MemberReviewSummary.tsx
→ [] (exit 0, clean)
```

No P0/P1 from detector; human review owns keyboard listbox + conflict modal a11y.

### Suggested command sequence

1. `/impeccable audit` — queue listbox keyboard + conflict modal Esc/focus  
2. `/impeccable distill` — collapse contact on slip variant  
3. `/impeccable harden` — mutex approve vs reject panels  
4. `/impeccable polish` — auto-next optional, reduced-motion edge cases, re-critique  

### Concrete fix backlog (for coding agents)

| ID | Sev | File(s) | Change |
|----|-----|---------|--------|
| S1 | ✅ | `SlipReviewPage.tsx` | Stale-detail clear/lock — done |
| S2 | ✅ | `admin.css`, `ReviewActionBar.tsx` | Sticky / pinned actions — done |
| S3 | P2 | `MemberReviewSummary.tsx` (slip) | Progressive disclosure for contact section (default collapsed) |
| S4 | ✅ | `reviewErrorMessage.ts` / page | Thai error map — done |
| S5 | ✅ | `MemberReviewSummary.tsx` | Thai `paymentStatusLabel` — done |
| S6 | P1 | `ReviewQueuePanel.tsx` | Implement listbox arrow-key navigation + roving tabindex |
| S7 | P1 | `ReviewIdConflictDialog.tsx` | Esc, initial focus, focus restore; align with `ConfirmDialog` |
| S8 | P2 | `ReviewActionBar.tsx` | Opening approve confirm closes reject (and vice versa) |
| S9 | P2 | `ReviewQueuePanel.tsx` (slip meta) | Show submitted/created time for FIFO triage |
| S10 | P2 | `SlipReviewPage.tsx` | After successful approve/reject, optionally select next queue item |
| S11 | P3 | `SlipImage.tsx` | Optional lightbox zoom/rotate; keep new-tab as secondary |
| S12 | P3 | `SlipReviewPage.tsx` | Auto-dismiss success flash; warn when `amount == null` |

### Trend / snapshot

Prior formal critique: **25/40**. This re-run: **30/40** (Δ +5).  
Slug: `apps-web-src-admin-pages-slipreviewpage-tsx`.

---

*End of report — Thai summary above; English tables/backlog for fix agents.*
