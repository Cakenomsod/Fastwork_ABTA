---
target: admin slip review
total_score: 25
p0_count: 1
p1_count: 4
timestamp: 2026-07-27T14-26-36Z
slug: apps-web-src-admin-pages-slipreviewpage-tsx
---
# 12 — Admin Slip Review · Score **25/40** · P0: **1** · P1: **4**

> **Method:** ⚠️ DEGRADED: single-context (critique already running as nested Multitask subagent — dual Assessment A/B agents not spawned)  
> **Date:** 2026-07-27  
> **Target:** Slip review workspace in AdminApp (`SlipReviewPage` + shared review components + `SlipImage`)  
> **Files:** `apps/web/src/admin/pages/SlipReviewPage.tsx`, `SlipImage.tsx`, `ReviewQueuePanel.tsx`, `ReviewActionBar.tsx`, `MemberReviewSummary.tsx`, `ReviewDetailHeader.tsx`, `ReviewIdChangePanel.tsx`, `ReviewIdConflictDialog.tsx`, `admin.css`  
> **Register:** product · queue-first BO · speed + error prevention critical for treasurer  
> **Design health:** **25 / 40** — Acceptable  
> **P0:** 1 · **P1:** 4 · **P2:** 4 · **P3:** 2  
> **Detector:** `detect.mjs --json` → `[]` (clean)  
> **Browser overlay:** skipped (no live server / injection in this subagent run)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: **25/40** (Acceptable) — P0: **1** · P1: **4**

หน้าตรวจสลิปออกแบบรอบคิวเหรัญญิกได้ดี — ซ้ายคิว / ขวา detail, ไฮไลต์จำนวนเงิน, รูปสลิป, กันเลขใบเสร็จซ้ำก่อนยืนยัน และมี confirm ก่อนออกใบเสร็จตัวจริง โทนเขียวสมาคม+ทอง ไม่ใช่ admin เทา-น้ำเงินทั่วไป

จุดพังหนักสุดคือ **สลับรายการในคิวแล้ว detail/สลิปเก่าค้างจนกว่า fetch ใหม่เสร็จ** — กดยืนยันเร็วอาจเทียบเลข/ยอดกับคนผิด ทั้งที่ API ใช้ `selectedId` คนใหม่ แถมปุ่มอนุมัติอยู่ล่างสุดหลังบล็อกติดต่อ ทำให้รีบตรวจคิวช้า และ error บางตัวยังเป็นรหัสดิบ (`load_failed`)

### จุดแข็ง

1. **คิวเป็นศูนย์กลาง** — `bo-review-workspace` แยกคิว sticky + detail; empty state ชี้ชัดว่าให้เลือกรายการซ้าย
2. **กันพลาดเลขใบเสร็จ** — `gateApprove` + conflict banner + `ReviewIdConflictDialog` + digit panel ตรวจว่างก่อนบันทึก
3. **Confirm ก่อนทำลาย/ออกเอกสาร** — inline approve confirm แสดงเลขที่จะใช้; reject บังคับเหตุผล + placeholder ตัวอย่าง

### ปัญหาสำคัญ (สั้นๆ)

| ระดับ | ปัญหา |
|-------|--------|
| **P0** | สลับคิวแล้วไม่เคลียร์/`busy`-lock detail — แสดงสมาชิก/สลิปเก่าชั่วคราว (เสี่ยงอนุมัติผิดบริบท) |
| **P1** | ปุ่มยืนยัน/ไม่ผ่านอยู่ท้ายหน้า หลังข้อมูลติดต่อ — ไม่ sticky; งานหลักของเหรัญญิกช้า |
| **P1** | Error เป็นรหัสดิบ (`load_failed`, `approve_failed`, …) และ `paymentStatus` โชว์ enum อังกฤษ |
| **P1** | คิวเป็น `listbox` แต่ไม่มีลูกศร/shortcut — Alex เคลียร์คิวไม่ได้เร็ว; Sam แท็บทีละปุ่มยาว |
| **P1** | `ReviewIdConflictDialog` ไม่มี Escape / focus trap (ต่างจาก `ConfirmDialog`) |

### Top 3 ที่ควรแก้ก่อน

1. เคลียร์ detail + โชว์ loading และ disable actions ตอนเปลี่ยน `selectedId`
2. ดึงจำนวนเงิน + สลิป + action bar ให้อยู่ใน viewport งานตรวจ (sticky / ย่อ contact)
3. แปล error + `paymentStatus` เป็นภาษาไทย actionable

### Personas (สรุป)

- **Alex (power):** ไม่มี j/k, A/R, หรือ “รายการถัดไปหลังอนุมัติ”; ต้อง scroll หาปุ่ม; สลับคิวแล้ว UI ค้างของเก่า → เสี่ยงกดเร็วผิดคน
- **Sam (a11y):** focus-visible บนคิวมี; conflict modal ไม่โฟกัสเริ่มต้น/ไม่ Esc; สถานะโหลด detail ไม่ announce; error รหัสดิบอ่านไม่รู้เรื่อง
- **Riley (edge):** สลับรายการเร็ว + กดยืนยัน = race; เปิด approve confirm ค้างแล้วเปิด reject พร้อมกันได้; blob สลิปเปิดแท็บใหม่ไม่มี zoom/rotate ในหน้า

### Cognitive load

ล้มเหลวประมาณ **3/8** → **ปานกลาง** (contact section ดึงสมาธิจากยอดเงิน+สลิป; action อยู่ไกลจากหลักฐาน)

### AI slop

**ไม่ใช่ AI slop** — queue-first workspace จริง, ไม่มี side-stripe บนการ์ดเนื้อหา / gradient text / purple glow. Detector สะอาด. เตือนเล็ก: pill count + step chip ทรงเต็มเป็น convention ของ BO ไม่ใช่ scaffold ว่าง

---

## English (for follow-up fix agents)

### Provenance

`Method: ⚠️ DEGRADED: single-context (nested Multitask critique subagent; A/B not dual-spawned)`

Sources reviewed: `SlipReviewPage.tsx`, `SlipImage.tsx`, `ReviewQueuePanel.tsx`, `ReviewActionBar.tsx`, `MemberReviewSummary.tsx` (slip variant), `ReviewDetailHeader.tsx`, `ReviewIdChangePanel.tsx`, `ReviewIdConflictDialog.tsx`, `ConfirmDialog.tsx` (comparison), `admin.css` (`.bo-review-*`, `.bo-slip-*`, modals, reduced-motion).  
CLI: `node .cursor/skills/impeccable/scripts/detect.mjs --json` on page + shared review files → **`[]`**.

### Design health score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 2 | No detail loading; **stale member/slip on queue switch**; gating copy OK |
| 2 | Match system / real world | 3 | Strong Thai ops copy; raw `paymentStatus` + API error codes leak |
| 3 | User control & freedom | 3 | Cancel on confirm/reject/conflict; no Esc on conflict dialog; no undo after approve (OK) |
| 4 | Consistency & standards | 3 | Shared with data review; ConfirmDialog ≠ ConflictDialog a11y; error maps inconsistent vs Staff/Broadcast |
| 5 | Error prevention | 2 | Receipt conflict gate excellent; **stale-detail race**; approve+reject panels can both show |
| 6 | Recognition over recall | 3 | Amount highlighted + slip aside on wide; contact block forces scroll away from evidence |
| 7 | Flexibility & efficiency | 2 | No keyboard queue nav / shortcuts; actions not sticky; no auto-select next |
| 8 | Aesthetic & minimalist | 3 | Queue-first craft; contact/payment-status noise for slip task |
| 9 | Error recovery | 2 | Some Thai conflict/reject copy; many untranslated codes |
| 10 | Help & documentation | 2 | Bottom note + reject examples; no slip verification checklist |
| **Total** | | **25/40** | **Acceptable** |

### Anti-patterns verdict

**LLM assessment:** Passes product slop test. Feels like a real treasurer console (queue + evidence + gated confirm), not SaaS metrics chrome. Mild density issues, not decorative AI tells.

**Deterministic scan:** **0 findings** across SlipReviewPage + SlipImage + shared review components. Detector does **not** catch stale-state races, missing Esc, or raw error strings — human review owns those.

**Visual overlays:** Not injected this run.

### Cognitive load

Checklist failures (**3 → moderate**):

- [ ] Single focus — weak FAIL (contact + id-change compete with slip)
- [ ] Chunking — OK (sections)
- [ ] Grouping — OK
- [x] Visual hierarchy — FAIL (actions below low-value fields)
- [ ] One thing at a time — mostly OK once selected
- [ ] Minimal choices — OK (approve / reject)
- [x] Working memory — FAIL (scroll separates amount/slip from confirm)
- [x] Progressive disclosure — FAIL (full contact always shown for slip step)

Decision points ≤4 for primary actions — good. Extraneous load is the problem, not option count.

### Overall impression

Strong foundation for ABTA’s “คิวเป็นศูนย์กลาง” principle, with real error-prevention around receipt IDs. The single biggest opportunity: treat queue selection as a **hard context switch** (clear → load → unlock actions) and keep **amount + slip + approve/reject** in one composition without scrolling past phone/email.

### What's working

1. **Queue + detail split** with sticky queue, count badge, refresh, and clear empty states.
2. **Receipt collision workflow** — preempt check, warn banner, modal with suggested ID, staged pending receipt via digit boxes.
3. **Approve confirm shows the exact number** that will become official (`effectiveIdOnConfirm`); reject requires reason with domain examples.

### Priority issues

#### [P0] What: Queue switch leaves previous member detail & slip visible

- **Why it matters:** `selectRow` sets `selectedId` but does **not** clear `detail`. `runApprove` / `gateApprove` / confirm copy still read the **old** `detail` until fetch resolves, while the API call uses the **new** `selectedId`. Staff comparing amount/slip to the on-screen card can approve the wrong mental model — catastrophic for payment review.
- **Fix:** On `selectedId` change: `setDetail(null)` (or keep previous behind an explicit “กำลังโหลด…” overlay), set `detailLoading`, disable `ReviewActionBar` until `detail.memberId === selectedId`, announce loading via `aria-busy` / `aria-live`. Optionally show skeleton matching layout.
- **Suggested command:** `/impeccable harden` (scoped to SlipReviewPage + shared pattern with DataReviewPage)

#### [P1] What: Primary actions buried under contact fields; not sticky

- **Why it matters:** Treasurer’s loop is compare amount ↔ slip → approve/reject. Contact block + full summary push `.bo-review-actions` below the fold on typical laptop heights. Speed + error prevention both suffer.
- **Fix:** Sticky action bar (bottom of `.bo-review-main` or viewport); move amount + slip above the fold as the hero pair; collapse “ช่องทางติดต่อ” behind disclosure for slip variant.
- **Suggested command:** `/impeccable layout` + `/impeccable distill`

#### [P1] What: Raw API error codes and English `paymentStatus`

- **Why it matters:** `load_failed` / `check_failed` / `approve_failed` / `reject_failed` render verbatim; `MemberReviewSummary` prints `detail.paymentStatus` without Thai labels (e.g. `slip_review`). Staff cannot recover; violates “สถานะชัด” and Match System/Real World.
- **Fix:** Shared `ERROR_LABEL` map (mirror `ReviewIdChangePanel` / BroadcastPage); Thai labels for payment + receipt statuses.
- **Suggested command:** `/impeccable clarify`

#### [P1] What: Queue listbox lacks keyboard navigation; no review accelerators

- **Why it matters:** Alex cannot clear a queue fast; Sam tabs through every item button without ArrowUp/Down/Home/End. `role="listbox"` promises keyboard behavior that isn’t implemented.
- **Fix:** Arrow-key roving tabindex on queue; optional shortcuts (e.g. approve/reject when detail focused); after successful approve, auto-select next pending item.
- **Suggested command:** `/impeccable harden` + `/impeccable polish`

#### [P1] What: Conflict dialog missing Escape, initial focus, focus trap

- **Why it matters:** `ConfirmDialog` already does Esc + focus; `ReviewIdConflictDialog` does not. High-stakes ID collision leaves keyboard users stuck or clicking overlay only. PRODUCT principle: confirm destructive clearly — and remain controllable.
- **Fix:** Reuse ConfirmDialog patterns (or extract shared modal shell): Esc, initial focus on primary/cancel, restore focus on close, `aria-describedby`.
- **Suggested command:** `/impeccable audit` / `/impeccable harden`

### Persona red flags

**Alex (Power User)**  
- No shortcuts; refresh is mouse-only workflow.  
- Must scroll to confirm after reading slip.  
- Stale detail on fast queue hopping = high mis-approve risk.  
- No “next item” after success — reorient to queue every time.

**Sam (Accessibility)**  
- Conflict modal: no Esc, no focus move into dialog.  
- Detail fetch failure/loading not announced.  
- Raw error codes useless to SR users.  
- Queue `listbox` without arrow keys is an a11y lie.

**Riley (Stress tester)**  
- Rapid select A→B while confirm open: confirm message can still show A’s receipt number.  
- `showReject` + `showApproveConfirm` can appear together (reject panel not cleared when approve confirm opens).  
- Slip open-in-new-tab only; no in-page zoom/rotate for blurry transfers.  
- Empty `amount` shows “—” with no warning that comparison is impossible.

### Minor observations

| Sev | Issue | Fix hint | Command |
|-----|-------|----------|---------|
| P2 | Slip variant always shows full contact section | Collapse / move below actions | `/impeccable distill` |
| P2 | Approve confirm + reject form can both be visible | Closing reject when opening confirm (and vice versa) | `/impeccable harden` |
| P2 | `.bo-review-queue` uses `bo-rise` but reduced-motion block only clears main/confirm/reject | Add queue (and workspace) to `prefers-reduced-motion` | `/impeccable harden` |
| P2 | No queue age / submitted-at for FIFO priority | Show `createdAt` in slip meta | `/impeccable clarify` |
| P3 | No in-page slip zoom/rotate | Lightbox with transform controls | `/impeccable delight` / shape |
| P3 | Success flash clears only on next select | Auto-dismiss after N seconds + keep `role="status"` | `/impeccable polish` |

### Emotional journey

- **Peak needed:** “ยอดตรงสลิป → ยืนยัน → ได้เลขใบเสร็จจริง” in under a minute.  
- **Valley:** scrolling past contact; cryptic errors; fear of wrong ID (partially mitigated by conflict modal).  
- **End:** Success message is reassuring when it lands in the queue alert — preserve; auto-advance would make the end feel complete.

### Questions to consider

- Should slip review hide member contact entirely unless “ดูโปรไฟล์” is opened?
- After approve, should the workspace auto-open the next queue item (Alex path) or return to empty “เลือกรายการ” (safer pause)?
- Is comparing slip amount to `detail.amount` enough, or do treasurers need bank/time/ref fields beside the image?

### Detector summary

```text
detect.mjs --json \
  apps/web/src/admin/pages/SlipReviewPage.tsx \
  apps/web/src/admin/SlipImage.tsx \
  apps/web/src/admin/ReviewActionBar.tsx \
  apps/web/src/admin/ReviewQueuePanel.tsx \
  apps/web/src/admin/MemberReviewSummary.tsx \
  apps/web/src/admin/ReviewDetailHeader.tsx \
  apps/web/src/admin/ReviewIdChangePanel.tsx \
  apps/web/src/admin/ReviewIdConflictDialog.tsx
→ [] (exit 0, clean)
```

No P0/P1 from detector; human review owns stale state, action placement, a11y, copy.

### Suggested command sequence

1. `/impeccable harden` — clear/lock detail on select; conflict modal Esc/focus; mutex approve vs reject panels  
2. `/impeccable layout` — sticky actions; amount+slip composition above the fold  
3. `/impeccable distill` — collapse contact on slip variant  
4. `/impeccable clarify` — Thai errors + paymentStatus labels + queue timestamps  
5. `/impeccable polish` — keyboard listbox, auto-next, reduced-motion on queue  

### Concrete fix backlog (for coding agents)

| ID | Sev | File(s) | Change |
|----|-----|---------|--------|
| S1 | P0 | `SlipReviewPage.tsx` (+ mirror `DataReviewPage.tsx`) | On `selectedId` change: clear `detail`, set loading, disable actions until `detail?.memberId === selectedId`; live region for loading/errors. |
| S2 | P1 | `admin.css`, `ReviewActionBar.tsx`, `SlipReviewPage.tsx` | Sticky `.bo-review-actions`; keep amount + slip + actions co-visible on desktop. |
| S3 | P1 | `MemberReviewSummary.tsx` (slip) | Progressive disclosure for contact section (default collapsed). |
| S4 | P1 | `SlipReviewPage.tsx` | Map `load_failed` / `check_failed` / `approve_failed` / `reject_failed` (+ passthrough codes) to Thai actionable strings. |
| S5 | P1 | `MemberReviewSummary.tsx` | Thai labels for `paymentStatus` (and keep receipt status map). |
| S6 | P1 | `ReviewQueuePanel.tsx` | Implement listbox arrow-key navigation + roving tabindex. |
| S7 | P1 | `ReviewIdConflictDialog.tsx` | Esc, initial focus, focus restore; align with `ConfirmDialog`. |
| S8 | P2 | `ReviewActionBar.tsx` | Opening approve confirm closes reject (and reject toggle cancels approve confirm). |
| S9 | P2 | `admin.css` | `prefers-reduced-motion` disables `.bo-review-queue` / workspace `bo-rise`. |
| S10 | P2 | `ReviewQueuePanel.tsx` (slip meta) | Show submitted/created time for FIFO triage. |
| S11 | P2 | `SlipReviewPage.tsx` | After successful approve/reject, optionally select next queue item. |
| S12 | P3 | `SlipImage.tsx` | Optional lightbox zoom/rotate; keep new-tab as secondary. |
| S13 | P3 | `SlipReviewPage.tsx` | Auto-dismiss success flash; warn when `amount == null`. |

### Trend / snapshot

First documented critique for this target in `docs/ui-ux-critique/`.  
Slug: `apps-web-src-admin-pages-slipreviewpage-tsx` (for `.impeccable/critique` storage).

---

*End of report — Thai summary above; English tables/backlog for fix agents.*
