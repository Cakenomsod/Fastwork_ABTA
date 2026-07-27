# 05 — Slip Resubmit `/slip`

⚠️ **DEGRADED: single-context** (nested Multitask subagent — dual Assessment A/B spawn blocked by harness; design review + `detect.mjs` ran inline)

**Method:** single-context · **Target:** `apps/web/src/pages/SlipResubmitPage.tsx` + `register.css` / `shared.css`  
**Product brief:** ส่งสลิปใหม่หลังเหรัญญิกปฏิเสธ — high stress · reassurance · clear next step · mobile LIFF · WCAG AA  
**detect.mjs:** `[]` (0 findings) · **Browser overlay:** skipped (LIFF auth-gated; no reliable public preview without LINE session)  
**Date:** 2026-07-27

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Busy text on button; no reject-reason context; loading is plain lead text |
| 2 | Match System / Real World | 3 | Thai copy clear; “เหรัญญิก” fits ABTA domain |
| 3 | User Control and Freedom | 2 | No clear slip / cancel; LIFF error has no escape CTA |
| 4 | Consistency and Standards | 1 | Bare `<input type="file">` vs `.reg-upload` on Register/Renew; no `reg-warn` reject reason |
| 5 | Error Prevention | 2 | Type/size checks OK; no “what a good slip needs” checklist |
| 6 | Recognition Rather Than Recall | 1 | Rejection reason shown on `/status` but **lost on `/slip`** |
| 7 | Flexibility and Efficiency | 2 | One path OK for LIFF; no keyboard/accelerator gaps that matter here |
| 8 | Aesthetic and Minimalist Design | 3 | Focused shell; missing the one high-stakes info block |
| 9 | Error Recovery | 2 | Plain Thai errors; missing `role="alert"`; weak recovery links |
| 10 | Help and Documentation | 1 | No tips, no bank reminder, no link back to status reason |
| **Total** | | **19/40** | **Poor** |

**P0:** 0 · **P1:** 4 · **P2:** 5 · **P3:** 2

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คำตัดสินสั้นๆ
หน้า `/slip` ใช้ shell เขียว-ทองของสมาชิกได้ดีและสั้นพอสำหรับงานเดียว — แต่ **พลาดจุดสำคัญที่สุดของบริบทหลังถูกปฏิเสธ**: ไม่โชว์เหตุผลที่เหรัญญิกปฏิเสธ และอัปโหลดสลิปยังเป็น native file input แทน `.reg-upload` ที่หน้าอื่นใช้แล้ว ทำให้สมาชิกเครียด จำไม่ได้ว่าต้องแก้ตรงไหน และรู้สึกว่า “หน้าส่งใหม่” ด้อยกว่าหน้าสมัคร/ต่ออายุ

**คะแนน: 19/40 (Poor)** · P0 = 0 · P1 = 4

### จุดแข็ง (2–3)
1. **โฟกัสงานเดียว** — hero + ฟอร์มสั้น + CTA เดียว ไม่แข่งกับเนื้อหาอื่น
2. **สำเนียงภาษาไทยสุภาพ** — “รอเหรัญญิกตรวจสอบครับ” / validation JPG·PNG·5MB ชัด
3. **ยืนยันสถานะสมาชิกใน lead** — “สมาชิกยังคงสถานะสมาชิกสมบูรณ์” ช่วยลดความกลัวถูกตัดสิทธิ์ (แม้ยังไม่พอถ้าไม่มีเหตุผลปฏิเสธ)

### ปัญหาเรียงตามความสำคัญ

#### [P1] ไม่แสดงเหตุผลที่สลิปไม่ผ่านบนหน้าแก้
- **ทำไมสำคัญ:** สมาชิกมาจาก LINE / `/status` ที่เคยเห็นเหตุผลแล้ว — พอเปิด `/slip` ต้องจำเอง (memory bridge) เสี่ยงส่งสลิปเดิมซ้ำ → วนถูกปฏิเสธ → ติดต่อเจ้าหน้าที่
- **แก้:** ดึง `rejectReason` (จาก status draft / API ใหม่ / query) แล้วโชว์ `.reg-warn` แบบหน้า Register resubmit; ถ้าไม่มีเหตุผล ให้มี fallback ชัด

#### [P1] อัปโหลดไม่สอดคล้องกับ Register / Renew
- **ทำไมสำคัญ:** native file input บน LIFF มือถือแตะยาก เป้าหมายเล็ก ไม่มี empty-state “แตะเพื่ออัปโหลด”
- **แก้:** ใช้ `.reg-upload` + preview ใน dropzone + ชื่อไฟล์ เหมือน `RenewPage` / `RegisterPage`

#### [P1] ไม่มีแนวทางป้องกันสลิปผิดซ้ำ
- **ทำไมสำคัญ:** high-stress + ไม่รู้ว่า “สลิปดี” ต้องเห็นอะไร (ยอด วันที่ ชื่อบัญชี)
- **แก้:** checklist สั้น 2–3 ข้อใต้ฟิลด์อัปโหลด หรือ `reg-info` ก่อนฟอร์ม

#### [P1] ข้อผิดพลาดไม่ประกาศให้ AT / ไม่มีเส้นทางกู้คืนครบ
- **ทำไมสำคัญ:** WCAG AA — dynamic error ต้องมี `role="alert"` / `aria-live`; LIFF error ไม่มีปุ่มลองใหม่ / เปิดจาก OA
- **แก้:** ใส่ `role="alert"` ทุก `reg-form-error`; LIFF error เพิ่ม CTA; `slip_not_rejected` ลิงก์ไปสถานะ

#### [P2] อื่นๆ
- ไม่ `URL.revokeObjectURL` เมื่อเปลี่ยน/ถอดไฟล์ (Register/Renew ทำแล้ว)
- ไม่มีปุ่มล้างสลิป / เลือกใหม่ชัดเจน
- Success บาง — ไม่บอกระยะเวลาโดยประมาณหรือ “จะแจ้งใน LINE”
- Loading เป็นข้อความอย่างเดียว ไม่มี `aria-busy` / skeleton
- Kicker `ABTA` uppercase + tracking — ใกล้ AI eyebrow (ยอมรับได้ถ้าเป็นระบบแบรนด์ แต่ควรไม่ซ้ำทุกหน้าแบบเดียวกัน)

### Cognitive load
| Checklist | ผ่าน? |
|-----------|-------|
| Single focus | ✅ |
| Chunking | ✅ |
| Grouping | ⚠️ (upload ไม่มีกลุ่ม visual ชัด) |
| Visual hierarchy | ⚠️ (ขาด reject callout) |
| One thing at a time | ✅ |
| Minimal choices | ✅ |
| Working memory | ❌ ต้องจำเหตุผลจากหน้าก่อน |
| Progressive disclosure | ✅ (งานสั้นอยู่แล้ว) |

**Failures: 3 → moderate–high** สำหรับงาน high-stress

### Personas
- **Jordan (First-Timer):** ไม่รู้ต้องแก้ตรงไหนในสลิป; native file input กวนใจ
- **Casey (Mobile LIFF):** thumb zone ปุ่มล่างโอเค แต่ file input แย่; สลับแอปแล้วลืมเหตุผล
- **Sam (a11y):** error ไม่มี `role="alert"`; ไม่มี live region เมื่อส่งสำเร็จ

### Anti-patterns / AI slop
- **LLM:** ไม่ใช่ SaaS cream / purple glow — ใช้แบรนด์เขียว-ทองจริง · แต่ uppercase tracked kicker + pill CTA 999px เป็น grammar ที่ซ้ำข้ามหน้าสมาชิก · composition “hero + white card + one field” บางเกินไปสำหรับอารมณ์หลังถูกปฏิเสธ
- **Detector:** 0 findings (TSX ไม่ถูกสแกน CSS anti-patterns ของไฟล์ import ลึกเท่า HTML)

### Top 3 issues (สรุป)
1. ไม่โชว์เหตุผลปฏิเสธบนหน้าแก้ (P1)
2. อัปโหลดไม่ใช้ `.reg-upload` (P1)
3. ไม่มี checklist / ความช่วยเหลือป้องกันสลิปผิดซ้ำ (P1)

---

## English — Full critique for next agent

### Overall impression
The page is structurally honest: one job, shared member shell, Thai that sounds like the association. It fails the **emotional** brief. After a treasurer rejects a slip, the member lands here stressed and under-informed. Status already has `rejectReason` + a link to `/slip`; this page drops that context and under-builds the upload affordance that sibling flows already solved. Biggest opportunity: make this the **reassurance + fix** screen, not a bare file picker.

### Anti-patterns verdict

**LLM assessment:** Not generic AI cream/purple. Brand green/gold atmosphere matches DESIGN.md. Residual slop: uppercase tracked `ABTA` kicker (shared system), full-pill buttons (`border-radius: 999px`), and a hero that states reassurance without the one piece of information that earns trust (why it failed). Feels thinner / less crafted than Register resubmit, which already shows `reg-warn` with reject reason.

**Deterministic scan:** `detect.mjs --json apps/web/src/pages/SlipResubmitPage.tsx` → `[]` (0). No absolute-ban hits in the TSX surface. CSS living in `register.css` was not separately scored by the detector (markup-oriented). Manual review still flags consistency and a11y gaps the detector will not catch in React source.

**Visual overlays:** Not available — LIFF-gated route; no injection session.

### What's working
1. Single-purpose layout; no competing CTAs.
2. Client-side file guards (JPG/PNG, 5 MB) with plain Thai messages.
3. Lead line reassures membership is still complete — correct emotional instinct, incomplete execution.

### Priority issues

#### [P1] Rejection reason missing on the fix screen
- **Why:** Recognition vs recall failure. `/status` shows `เหตุผลที่สลิปไม่ผ่าน` then sends users to `/slip`, which shows nothing. Interrupted mobile users (Casey) re-upload the same slip.
- **Fix:** On LIFF ready, fetch member/payment reject context (extend slip draft API, or reuse status-by-LINE if available). Render:
  ```tsx
  {rejectReason ? (
    <div className="reg-warn" role="status">
      เหตุผลที่สลิปไม่ผ่าน: {rejectReason}
    </div>
  ) : (
    <div className="reg-info" role="status">
      โปรดแนบสลิปที่ชัด อ่านยอดและวันที่ได้ · หากไม่แน่ใจ ให้เปิดหน้าสถานะดูเหตุผลจากเหรัญญิก
    </div>
  )}
  ```
  Mirror Register resubmit (`reg-warn` + `role="status"`).
- **Suggested command:** `/impeccable clarify` then `/impeccable harden`

#### [P1] Upload control inconsistent with sibling member flows
- **Why:** `RenewPage` / `RegisterPage` use `.reg-upload` (large dashed hit target, preview inside, filename). `/slip` uses a naked labeled `<input type="file">` + separate `.reg-slip-preview`. On LIFF this feels unfinished and harder to tap.
- **Fix:** Copy the Renew upload block; keep preview inside the label; revoke prior object URLs on change/unmount (Register already does).
- **Suggested command:** `/impeccable layout` (or implement directly against existing CSS — no new styles needed)

#### [P1] No slip-quality scaffolding (error prevention)
- **Why:** After reject, members need a short “before you send” list: readable amount, date, account name, full slip not cropped. Without it, intrinsic stress + extrinsic ambiguity.
- **Fix:** 2–3 bullet checklist under the upload field, or one `reg-info` line. Do not add a wall of help.
- **Suggested command:** `/impeccable clarify`

#### [P1] Error / recovery a11y and exits incomplete (WCAG AA)
- **Why:** Register uses `role="alert"` on form errors; Slip does not. Screen readers may miss submit failures. LIFF error state has no retry / “open from LINE OA” CTA (Seminar/Renew are stronger). `slip_not_rejected` should deep-link to status when possible.
- **Fix:**
  - `role="alert"` on slip + submit errors
  - `aria-busy={busy}` on form or button
  - Focus management: move focus to alert on error
  - LIFF error: primary ghost/primary CTA back to OA instructions
- **Suggested command:** `/impeccable audit` + `/impeccable harden`

#### [P2] Object URL leak / no clear-file control
- **Fix:** `revokeObjectURL` on replace + unmount; optional “ลบรูป” secondary control when `slip.kind === "ready"`.
- **Suggested command:** `/impeccable harden`

#### [P2] Success state under-reassures (peak-end)
- **Fix:** After “รับสลิปใหม่แล้ว”, add one line: แจ้งผลทาง LINE เมื่อเหรัญญิกตรวจเสร็จ · keep “ดูสถานะ” CTA.
- **Suggested command:** `/impeccable delight` (light) or `/impeccable clarify`

#### [P2] Loading state too thin
- **Fix:** Keep short copy; add `aria-live="polite"` region; optional skeleton for form card.
- **Suggested command:** `/impeccable polish`

#### [P3] Shared kicker / pill button grammar
- System-level; don’t special-case this page alone. Track in design-system quieting pass.
- **Suggested command:** `/impeccable quieter` (member shell scope)

#### [P3] Preview `alt="สลิป"` is generic
- Prefer `alt="ตัวอย่างสลิปที่เลือก"` / empty alt if decorative beside filename.
- **Suggested command:** `/impeccable audit`

### Persona red flags

**Jordan (confused first-timer)**  
Primary action “ส่งสลิปใหม่” is clear in 5s, but *what to fix* is not. No reject reason, no checklist → literal reading of “แนบไฟล์แล้วส่ง” → repeat failure. Native file input has no “แตะเพื่ออัปโหลด” teaching empty state.

**Casey (distracted mobile LIFF)**  
Primary CTA is full-width near bottom of a short page — good. Interruption risk: returns to `/slip` with empty memory of treasurer’s note. Bare file control is awkward one-thumb. No draft persistence beyond chosen file in memory (refresh loses preview — acceptable if documented, still jarring).

**Sam (accessibility)**  
- Form errors lack `role="alert"` / live region  
- Busy state only changes button text; no `aria-busy` / `aria-disabled` semantics beyond native `disabled`  
- Success swap is visual-only; no polite announcement  
- Focus indicators exist on `.reg-btn:focus-visible` but file input relies on browser default inside a plain field

### Cognitive load (English)
3 checklist failures (grouping of upload, hierarchy without reject callout, working-memory bridge). Decision points ≤4 — OK. Extraneous load dominates: missing context the system already has elsewhere.

### Emotional journey
- **Valley:** Arrival after rejection — currently under-supported.  
- **Peak needed:** Seeing the exact reject reason + a large easy upload.  
- **End:** Success is calm but thin; strengthen LINE follow-up expectation for peak-end.

### Minor observations
- `e.target.value = ""` allows re-selecting same file — good; keep when moving to `.reg-upload`.
- Success shows `memberId` prominently — good consistency with other success screens.
- `errorCopy` map is solid; extend with status URL when API can return it.
- No `prefers-reduced-motion` bug on this page specifically — `.reg-wrap` already gated in CSS.

### Questions to consider
- Should `/slip` require a draft endpoint (like register) so reject reason + eligibility are known before the form appears?
- If reject reason is empty in Firestore, what reassuring fallback copy should always show?
- Is bank account / amount reminder in scope here, or only on renew/register?

---

## Concrete fix backlog (for next agent)

Ordered for implementation. Scope: `SlipResubmitPage.tsx` (+ API if needed); reuse existing `register.css` classes — avoid new visual system.

### Must (P1)
1. **Surface `rejectReason`** above the form (`reg-warn` / fallback `reg-info`). Prefer API draft-by-LINE; otherwise document query/status handoff.
2. **Replace bare file input** with `.reg-upload` pattern from `RenewPage.tsx` (~lines 215–244).
3. **Add short slip checklist** (2–3 items) under upload.
4. **A11y errors:** `role="alert"` on all form errors; `aria-busy` while submitting; LIFF error recovery CTA; improve `slip_not_rejected` copy with status path if available.
5. **`revokeObjectURL`** on file change + unmount (copy Register/Renew).

### Should (P2)
6. Clear / replace slip control when ready.
7. Enrich success copy (LINE notification expectation).
8. `aria-live` loading / success announcements.

### Could (P3)
9. Better preview `alt`.
10. Defer kicker/pill quieting to shared member-shell pass.

### Suggested command sequence
1. `/impeccable clarify apps/web/src/pages/SlipResubmitPage.tsx` — reject reason + checklist + success/error copy  
2. `/impeccable harden …` — draft fetch, revoke URLs, alerts, LIFF recovery  
3. `/impeccable layout …` — swap to `.reg-upload`  
4. `/impeccable audit …` — WCAG AA pass  
5. `/impeccable polish …` — final  

### Acceptance checks
- [ ] Reject reason visible without visiting `/status` again (when data exists)
- [ ] Upload hit target ≥ ~44px visual zone via `.reg-upload`
- [ ] Errors announced to AT (`role="alert"`)
- [ ] No object URL leak on re-pick
- [ ] Score re-critique target: ≥ 28/40

### Files to touch
- `apps/web/src/pages/SlipResubmitPage.tsx` (primary)
- Possibly `apps/web/src/lib/api.ts` + `apps/functions/src/members/slip-resubmit.ts` (draft/rejectReason)
- CSS: prefer existing `.reg-upload`, `.reg-warn`, `.reg-info` — no new sheet unless forced

---

## Trend / snapshot

First documented critique for this target in `docs/ui-ux-critique/`.  
Impeccable storage slug: `apps-web-src-pages-slipresubmitpage-tsx`
