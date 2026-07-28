---
target: /slip SlipResubmitPage
total_score: 29
p0_count: 0
p1_count: 0
timestamp: 2026-07-27T15-03-28Z
slug: apps-web-src-pages-slipresubmitpage-tsx
---
# 05 — Slip Resubmit `/slip`

⚠️ **DEGRADED: single-context** (nested Multitask subagent — dual Assessment A/B spawn blocked by harness; design review + `detect.mjs` ran inline)

**Method:** single-context · **Target:** `apps/web/src/pages/SlipResubmitPage.tsx` + `register.css` / `shared.css`  
**Product brief:** ส่งสลิปใหม่หลังเหรัญญิกปฏิเสธ — high stress · reassurance · clear next step · mobile LIFF · WCAG AA  
**detect.mjs:** `[]` (0 findings) · **Browser overlay:** skipped (LIFF auth-gated; no reliable public preview without LINE session)  
**Date:** 2026-07-27 (re-critique after fixes)  
**Prior score:** 19/40 → **29/40**  
**Scope note:** บัญชีธนาคารว่าง = intentional (ไม่วิพากษ์ในรอบนี้)

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Reject reason + `aria-busy` / loading live; success ยังไม่มี live region |
| 2 | Match System / Real World | 3 | Thai / “เหรัญญิก” ชัด สอดคล้องสมาคม |
| 3 | User Control and Freedom | 3 | มีลิงก์สถานะใน draft error / form error; ยังไม่มีล้างสลิป; LIFF error แบบเดียวกับ Renew |
| 4 | Consistency and Standards | 3 | `.reg-upload` + `.reg-warn` / checklist ตรง sibling; success ยังบางกว่า Register |
| 5 | Error Prevention | 3 | Type/size + checklist 3 ข้อ; ไม่มีปุ่มยืนยันก่อนส่ง (ยอมรับได้สำหรับงานสั้น) |
| 6 | Recognition Rather Than Recall | 4 | `rejectReason` จาก draft / `?reason=` + fallback `reg-info` + ลิงก์สถานะ |
| 7 | Flexibility and Efficiency | 2 | One path เหมาะ LIFF; ไม่มี accelerator ที่จำเป็น |
| 8 | Aesthetic and Minimalist Design | 3 | Shell โฟกัส; warn + checklist เติมบริบทโดยไม่รก |
| 9 | Error Recovery | 3 | `role="alert"` + ลิงก์สถานะ; ยังไม่ย้ายโฟกัสไป error |
| 10 | Help and Documentation | 3 | Checklist + fallback info; success ยังไม่บอก “แจ้งใน LINE” |
| **Total** | | **29/40** | **Good** |

**P0:** 0 · **P1:** 0 · **P2:** 4 · **P3:** 2

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คำตัดสินสั้นๆ
หน้า `/slip` หลังแก้รอบนี้ **ปิดช่องว่างหลักของบริบทหลังถูกปฏิเสธแล้ว**: โชว์เหตุผล (`reg-warn`) หรือ fallback + ลิงก์สถานะ, อัปโหลดใช้ `.reg-upload` เหมือนสมัคร/ต่ออายุ, มี checklist ป้องกันสลิปผิดซ้ำ, error มี `role="alert"` และทางไปสถานะ — งาน high-stress ใช้งานได้จริงในเส้นทางหลัก

**คะแนน: 29/40 (Good)** · P0 = 0 · P1 = 0 · ดีขึ้นจาก 19/40

### จุดแข็ง (2–3)
1. **Memory bridge แก้แล้ว** — `rejectReason` จาก draft API หรือ `?reason=` / `liff.state`; ไม่มีเหตุผลก็มี `reg-info` + ลิงก์สถานะ
2. **อัปโหลดสอดคล้องสมาชิก** — `.reg-upload` + preview + ชื่อไฟล์ + `revokeObjectURL`
3. **ป้องกัน + a11y พื้นฐาน** — checklist 3 ข้อ, `role="alert"`, `aria-busy`, draft error มีปุ่ม/ข้อความไปสถานะ

### ปัญหาเรียงตามความสำคัญ

#### [P2] ไม่มีปุ่มล้าง / เลือกสลิปใหม่ชัดเจนเมื่อมีไฟล์แล้ว
- **ทำไมสำคัญ:** แตะ dropzone อีกครั้งได้ แต่ Casey บน LIFF อาจไม่รู้ว่าต้องแตะซ้ำ; ไม่มี “ลบรูป”
- **แก้:** ปุ่มรอง “ลบรูป / เลือกใหม่” เมื่อ `slip.kind === "ready"`

#### [P2] Success ยังบาง (peak-end) และไม่ประกาศให้ AT
- **ทำไมสำคัญ:** หลังถูกปฏิเสธ สมาชิกต้องการรู้ว่า “จะแจ้งผลทาง LINE” และ screen reader ควรได้ยินความสำเร็จ
- **แก้:** เพิ่มหนึ่งบรรทัดหลัง “รอเหรัญญิก…” + `aria-live="polite"` บน success

#### [P2] ไม่ย้ายโฟกัสไป error หลังส่งไม่สำเร็จ
- **ทำไมสำคัญ:** WCAG — `role="alert"` ช่วย แต่โฟกัสค้างที่ปุ่ม ทำให้ Sam พลาดบริบท
- **แก้:** `ref` + `focus()` ไปที่ `.reg-form-error` เมื่อ `error` ถูกตั้ง

#### [P2] LIFF error ยังไม่มี CTA (pattern ร่วมกับ Renew)
- **ทำไมสำคัญ:** ติดอยู่ที่ข้อความอย่างเดียว — ไม่ใช่ blocker เฉพาะหน้านี้ แต่ยังไม่มีทางกู้ใน-UI
- **แก้:** ปุ่ม ghost “ลองใหม่” (`location.reload`) หรือคำสั่งเปิด OA — ทำที่ member shell ร่วมกัน

#### [P3] อื่นๆ
- Kicker `ABTA` uppercase + pill CTA — grammar ร่วมสมาชิก
- Loading ยังเป็นข้อความอย่างเดียว (มี `aria-live` แล้ว — โอเคสำหรับ polish)

### Cognitive load
| Checklist | ผ่าน? |
|-----------|-------|
| Single focus | ✅ |
| Chunking | ✅ |
| Grouping | ✅ |
| Visual hierarchy | ✅ |
| One thing at a time | ✅ |
| Minimal choices | ✅ |
| Working memory | ✅ (reason บนหน้า / fallback) |
| Progressive disclosure | ✅ |

**Failures: 0 → low** สำหรับงาน high-stress

### Personas
- **Jordan:** รู้ว่าต้องแก้ตามเหตุผล + checklist; empty-state “แตะเพื่ออัปโหลด” ชัด
- **Casey:** hit target อัปโหลดใหญ่ขึ้น; ยังขาดปุ่มล้างไฟล์ชัด
- **Sam:** error มี `role="alert"`; success ยังไม่ announce; โฟกัสไม่ย้าย

### Anti-patterns / AI slop
- **LLM:** เขียว-ทองแบรนด์จริง ไม่ใช่ cream/purple · residual: kicker + pill ร่วมระบบ
- **Detector:** 0 findings

### Top 3 remaining
1. ปุ่มล้าง/เลือกสลิปใหม่เมื่อมีไฟล์ (P2)
2. Success: บรรทัด LINE + `aria-live` (P2)
3. Focus ไป error หลัง submit fail (P2)

---

## English — Full critique for next agent

### Overall impression
Re-critique after the fix pass. The page now does the emotional job: **show why it failed, make upload easy, prevent the same mistake**. Prior P1s (reject reason, `.reg-upload`, checklist, `role="alert"`, status recovery links) are in place. Remaining work is polish: clear-file, richer success peak-end, focus management. Bank account empty is **intentional / out of scope**.

### Anti-patterns verdict

**LLM assessment:** On-brand green/gold shell. Composition is purposeful (hero → warn/info → upload → checklist → CTA). Residual shared grammar: tracked `ABTA` kicker, full-pill buttons — system-level, not unique to `/slip`.

**Deterministic scan:** `detect.mjs --json apps/web/src/pages/SlipResubmitPage.tsx` → `[]` (0). Clean.

**Visual overlays:** Skipped — LIFF-gated; no injection session.

### What's working
1. `rejectReason` from `fetchSlipDraft` with query/`liff.state` handoff fallback; empty → `reg-info` + status link.
2. `.reg-upload` matches Renew/Register; preview alt improved; object URLs revoked.
3. Three-item checklist + `role="alert"` on field/form/draft errors; `aria-busy` on form/button; draft/`slip_not_rejected`-style paths link to status.

### Priority issues

#### [P2] No explicit clear / re-pick control when slip is ready
- **Why:** Re-tapping the dropzone works (`e.target.value = ""`) but is undiscoverable on one-thumb LIFF.
- **Fix:** Secondary control “ลบรูป” / “เลือกใหม่” that revokes URL and resets to empty.
- **Suggested command:** `/impeccable harden`

#### [P2] Success under-reassures (peak-end) and is silent to AT
- **Why:** High-stress journey ends on “รอเหรัญญิกตรวจสอบครับ” without LINE expectation; visual-only swap.
- **Fix:** One line: แจ้งผลทาง LINE เมื่อเหรัญญิกตรวจเสร็จ · wrap success in `aria-live="polite"`.
- **Suggested command:** `/impeccable clarify` or light `/impeccable delight`

#### [P2] No focus move to alert after submit failure
- **Why:** `role="alert"` helps, but keyboard/SR users often stay on the disabled→enabled button.
- **Fix:** On `setError`, focus the alert node (`tabIndex={-1}`).
- **Suggested command:** `/impeccable audit` / `/impeccable harden`

#### [P2] LIFF connect error has no in-UI CTA (shared with Renew)
- **Why:** Text-only recovery; same pattern on sibling pages — fix once in shared member error shell.
- **Fix:** Reload / “เปิดจาก LINE OA” instructional CTA button.
- **Suggested command:** `/impeccable harden` (member shell)

#### [P3] Shared kicker / pill button grammar
- Defer to member-shell quieter pass.

#### [P3] Loading remains copy-only
- Acceptable with `aria-live="polite"`; optional skeleton is polish-only.

### Persona red flags

**Jordan** — Primary action clear; reject reason + checklist remove the “what do I fix?” dead end. Residual: may not discover re-pick without clear control.

**Casey** — Large upload zone in thumb-friendly short page. Interruption + return: reason still on page if draft loads. Clear-file gap remains.

**Sam** — Alerts present; success not announced; focus not moved to form error; field title is a `<span>` beside labeled upload (acceptable but not ideal association).

### Cognitive load (English)
0 checklist failures. Working-memory bridge closed. Extraneous load from missing reject context is gone.

### Emotional journey
- **Valley:** Arrival after reject — now supported by `reg-warn` / fallback.  
- **Peak:** Seeing reason + easy upload — largely delivered.  
- **End:** Success still thin; one LINE line would close peak-end.

### Minor observations
- Bank empty intentional — do not treat as regression.
- `errorCopy` map is solid and actionable in Thai.
- `.reg-upload small` uses `var(--abta-muted)` — confirm token exists in cascade (fallback may wash contrast); prefer `--page-muted` if undefined.
- Reduced-motion already gated on `.reg-wrap`.

### Questions to consider
- Should success always promise LINE notification, or only when OA push is guaranteed?
- Worth a shared `RegLiffError` component so `/slip`, `/renew`, `/seminar` get the same recovery CTA?

---

## Concrete fix backlog (for next agent)

Ordered. Prefer existing CSS; no new visual system.

### Must (P1)
_(none — prior P1s closed)_

### Should (P2)
1. Clear / replace slip control when ready.
2. Enrich success copy (LINE) + `aria-live="polite"`.
3. Focus management to form alert on submit error.
4. Shared LIFF error CTA (optional co-fix with Renew).

### Could (P3)
5. Align `--abta-muted` → `--page-muted` on upload hint if needed.
6. Defer kicker/pill quieter to member-shell pass.

### Suggested command sequence
1. `/impeccable harden apps/web/src/pages/SlipResubmitPage.tsx` — clear file, focus on error, optional LIFF CTA  
2. `/impeccable clarify …` — success LINE line  
3. `/impeccable polish …` — final  

### Acceptance checks
- [x] Reject reason visible without revisiting `/status` (when data exists)
- [x] Upload hit target via `.reg-upload`
- [x] Errors announced (`role="alert"`)
- [x] Object URL revoked on re-pick / unmount
- [x] Score re-critique ≥ 28/40 (**29/40**)
- [ ] Explicit clear-file control
- [ ] Success LINE expectation + AT announce
- [ ] Focus to alert on submit error

### Files to touch (remaining)
- `apps/web/src/pages/SlipResubmitPage.tsx` (primary)
- CSS: existing classes only

---

## Trend / snapshot

| Run | Score | Notes |
|-----|------:|-------|
| 1 (initial) | 19/40 | Missing reject reason, bare file input, no checklist/alerts |
| 2 (this) | **29/40** | Prior P1s closed; P2 polish remains |

Impeccable storage slug: `apps-web-src-pages-slipresubmitpage-tsx`
