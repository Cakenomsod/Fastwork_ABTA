---
target: /status,/card StatusPage
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-07-27T15-03-45Z
slug: apps-web-src-pages-statuspage-tsx
---
# 02 — Status / Member Card · Score **30/40** · P0: **0** · P1: **1**

> Routes: `/status`, `/card` (same `StatusPage`)  
> Files: `apps/web/src/pages/StatusPage.tsx`, `status.css`, `shared.css`  
> Method: ⚠️ DEGRADED: single-context (running as parent multitask subagent — nested dual-agent spawn disallowed)  
> Detector: `detect.mjs --json` → `[]` (clean) · Browser: error state `/status` (no `m`) — snapshot OK; screenshot timing unreliable on dark shell  
> Date: 2026-07-27 · Re-score after contrast / loading a11y / error CTA fixes · Register: product · Brand: association green + gold · WCAG 2.1 AA target  
> Prior: **26/40** · P0: 1 · P1: 3 → **Δ +4**, P0 cleared

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: **30/40** (Good) — P0: **0** · P1: **1**

หน้าสถานะ/บัตรสมาชิกยังเป็นจุดแข็งของฝั่งสมาชิก — การ์ดเขียว-ทองอ่านง่าย สถานะ+วันหมดอายุชัด — และรอบแก้ล่าสุด**ปิด P0 contrast** ได้จริง: pill ใช้ `--page-warn` / `--page-success` / `--page-danger` (≥5.4:1 กับขาว), label บนการ์ดใช้ `--page-green-mist` (≥4.78:1 บนปลาย gradient), skeleton มี `role="status"` + `sr-only` + `aria-live`, error CTA ไม่พาไปสมัครผิดทางแล้ว

### จุดแข็ง
1. **บัตรสมาชิกเป็นฮีโร่** — ชื่อ · เลขสมาชิก · pill สถานะ · วันหมดอายุอยู่บนการ์ดเดียว มองรู้ทันทีว่าเป็นบัตร ABTA
2. **สถานะ + การกระทำเชื่อมกัน** — ใกล้หมดอายุมี “ต่ออายุ”; reject มีเหตุผล + ส่งใหม่; ใบเสร็จเป็น secondary ที่สมเหตุสมผล
3. **A11y / token หลังแก้** — loading announce ได้; reduced motion มี; pill/label ผ่าน AA กับ token ใน DESIGN.md / `shared.css`

### ปัญหาสำคัญ (เรียงตามความเร่งด่วน)

| ระดับ | ปัญหา | สรุปสั้น |
|-------|--------|----------|
| **P1** | Error ลิงก์หมดอายุ/ไม่สมบูรณ์ไม่มีปุ่ม CTA | `invalid_token` / `forbidden` / `member_id_required` → `cta = null` มีแค่ข้อความบอกให้เปิดจาก LINE — Jordan ไม่มีปุ่มชัด |
| **P2** | `/card` กับ `/status` หน้าเดียวกัน — “เปิดบัตรสมาชิก” อาจวนซ้ำ | ไม่ detect path; บน `/card` ยังโชว์ปุ่มเปิดบัตร |
| **P2** | Detail list โชว์ทุกแถวเสมอ | สัมมนา / อัปเดตล่าสุด เพิ่ม cognitive load |
| **P3** | `temporary` กับ `warning` ใช้สีเดียวกัน; uppercase tracked labels | แยกด้วยข้อความได้ แต่ยังไม่แยกโทน; mild AI-grammar |

### Cognitive load
- ล้มเหลวประมาณ **2/8** ข้อ → **ปานกลาง** (detail rows 5 แถว; ไม่มี progressive disclosure)
- จุดตัดสินใจปุ่ม ≤3 → อยู่ในขีด working memory

### AI slop
- **ไม่ใช่ AI slop ชัด** — เขียวสมาคม + ทองเป็นการ์ดจริง ไม่ใช่ SaaS cream / purple glow
- Detector: **0 findings**
- เตือนเล็กน้อย: uppercase tracked labels บนการ์ด, pill ทรงเต็ม — convention ของบัตร/สถานะ

### Personas (สั้น)
- **Jordan**: การ์ดเข้าใจทันที; error ลิงก์ไม่สมบูรณ์ไม่มีปุ่ม — ต้องอ่าน hint เอง; “สถานะสัมมนา” ยังไม่ได้อธิบาย
- **Casey**: LIFF มือถือดี (ปุ่มล่าง); บน `/card` ปุ่มเปิดบัตรยังทำให้สับสน; contrast pill ผ่านแล้ว
- **Sam**: loading announce แล้ว; pill/label ผ่าน AA; focus บนปุ่มมี
- **สมาชิก ABTA**: งานหลัก “ยังเป็นสมาชิกไหม / หมดเมื่อไหร่ / ต้องต่ออายุไหม” — การ์ดตอบได้ชัดขึ้นหลังแก้ contrast

### คำสั่งที่แนะนำต่อ
1. `/impeccable harden` — ปุ่ม CTA ชัดสำหรับ error ลิงก์ (เช่น “เปิดจาก LINE OA” / ปิด LIFF)
2. `/impeccable clarify` — path-aware ปุ่มบัตรบน `/card` + ความหมายสถานะสัมมนา
3. `/impeccable distill` — ยุบ detail rows ที่ไม่จำเป็น
4. `/impeccable polish` — ปิด backlog

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Skeleton + named busy + `aria-live` on ready; pill + expiry clear |
| 2 | Match System / Real World | 3 | Natural Thai; card metaphor strong; “สถานะสัมมนา” still domain jargon |
| 3 | User Control and Freedom | 3 | Wrong register CTA removed; token/incomplete errors still have no button exit |
| 4 | Consistency and Standards | 3 | Pills/labels use DESIGN/`--page-*` tokens; mild dual `--abta-muted` naming |
| 5 | Error Prevention | 3 | Guards missing `memberId`; recovery paths branched by code |
| 6 | Recognition Rather Than Recall | 3 | Key facts on one screen; status has text label (not color-only) |
| 7 | Flexibility and Efficiency | 2 | Fine for LIFF read path; no copy ID / share / refresh affordance |
| 8 | Aesthetic and Minimalist Design | 3 | Strong brand card; detail list still slightly noisy |
| 9 | Error Recovery | 4 | Clear Thai errors; `not_found`→register; network→retry; token→LINE hint |
| 10 | Help and Documentation | 2 | LINE OA footnote only; no status glossary |
| **Total** | | **30/40** | **Good** |

### Anti-Patterns Verdict

**LLM assessment**: Passes the product slop test. Member card remains a deliberate association artifact (green gradient, gold border tint, ABTA mark)—not generic SaaS cream or purple glow. Mild tells: `text-transform: uppercase` + tracking on `.mcard__label`, full-pill chips. None dominate.

**Deterministic scan**: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/StatusPage.tsx` → **`[]`** (0 findings).

**Visual overlays**: Not injected this run (LIFF/auth-gated happy path; no mutation overlay). Live check: `/status` without `m` renders error copy correctly (`ลิงก์ไม่สมบูรณ์`); **0 interactive CTAs** in that state.

**Manual contrast (post-fix)**:

| Pair | Ratio | AA |
|------|------:|----|
| `--page-warn` `#b54708` on white | 5.43:1 | PASS |
| `--page-success` `#027a48` on white | 5.41:1 | PASS |
| `--page-danger` `#b42318` on white | 6.57:1 | PASS |
| `--page-muted` pill on white | 7.13:1 | PASS |
| `--page-green-mist` on card-light `#1c6f4c` | 4.78:1 | PASS |
| (prior) old `#b9822a` / `#d97a19` white | ~3.1–3.3:1 | cleared |
| (prior) `#9fc4b2` on `#1c6f4c` | 3.21:1 | cleared |

### Overall Impression

From **26 → 30**: the page finally honors “สถานะชัดก่อนสวย.” Prior P0 contrast and the loading/error CTA P1s are fixed in code. Remaining work is path-aware actions, error exits with a real button, and dialing back always-on detail noise—not another color emergency.

### What's Working

1. **Status-first hierarchy** — name → member ID + pill → expiry (+ days left).
2. **Action coupling** — `canResubmit` / `canResubmitSlip` / `canRenew` gate the right primary CTA.
3. **Post-fix a11y + tokens** — `StatusSkeleton` announces; ready region `aria-live="polite"`; pills/labels meet AA against DESIGN tokens; `prefers-reduced-motion` intact.

### Priority Issues

#### [P1] What: Incomplete / invalid-link errors have no actionable button
- **Why it matters**: `errorCta()` returns `null` for `invalid_token` / `forbidden` / `403` / `member_id_required`. Live `/status` (no `m`) shows title + detail + hint only—**zero** interactive controls. Jordan must invent the next step from prose. Better than the old always-register CTA, but still weak control/recovery.
- **Fix**: Add an explicit primary control: e.g. “ปิดหน้านี้” (`liff.closeWindow` when in LIFF) and/or reinforced “พิมพ์ เช็คสถานะ ใน LINE OA” as a copyable chip / deep link when available. Keep register only for `not_found`.
- **Suggested command**: `/impeccable harden` · `/impeccable clarify`

#### [P2] What: `/card` and `/status` share one view; “เปิดบัตรสมาชิก” can be circular
- **Why it matters**: No path detection. On `/card`, when `memberCardUrl` is present (often `/card?…`), Casey still sees “เปิดบัตรสมาชิก”—implies another artifact.
- **Fix**: Detect `pathname === "/card"`; hide or rename to “แชร์บัตร” / open image only when URL differs from current page. Keep receipt + renew.
- **Suggested command**: `/impeccable clarify` · `/impeccable distill`

#### [P2] What: Detail card always expands every metadata row
- **Why it matters**: Up to 5 rows (payment, receipt, seminar, renewal, updated) exceeds ≤4 chunking; seminar/updated rarely drive the next action.
- **Fix**: Keep payment + receipt always; collapse seminar/updated behind “รายละเอียดเพิ่มเติม” or demote updated to foot meta.
- **Suggested command**: `/impeccable distill` · `/impeccable layout`

#### [P3] What: `temporary` and `warning` share the same fill; uppercase tracked labels
- **Why it matters**: Both use `--page-warn` + white—labels differentiate, but tone parity weakens skimming. Uppercase tracked `.mcard__label` is a mild AI-grammar eyebrow.
- **Fix**: Soft tint + dark ink for temporary vs filled warn for near-expiry; sentence-case labels or reduce tracking.
- **Suggested command**: `/impeccable polish` · `/impeccable colorize`

### Cognitive Load Assessment

| Checklist item | Pass? | Note |
|----------------|-------|------|
| Single focus | Yes | Card carries the primary answer |
| Chunking ≤4 | **No** | Detail rows can hit 5 |
| Grouping | Yes | Card / detail / actions |
| Visual hierarchy | Yes | Brand card dominates |
| One thing at a time | Yes | Read-then-act |
| Minimal choices ≤4 | Yes | ≤3 action buttons |
| Working memory | Yes | No cross-screen recall |
| Progressive disclosure | **No** | All details always visible |

**Failures: 2 → moderate cognitive load.**

### Persona Red Flags

**Jordan (First-Timer)**  
- Sees ABTA card and understands “member” instantly—good.  
- Error “ลิงก์ไม่สมบูรณ์” has no button—must parse hint.  
- No inline explanation of “สถานะสัมมนา”.

**Casey (Distracted Mobile / LIFF)**  
- Thumb-zone actions at bottom: good. Touch padding on `.btn` adequate.  
- Pill contrast fixed for outdoor LIFF.  
- On `/card`, “เปิดบัตรสมาชิก” still wastes a tap / confuses.  
- Foot-note help remains below fold on small phones.

**Sam (Accessibility)**  
- `btn:focus-visible` gold outline: good.  
- Status not color-only (`statusLabel`): good.  
- Loading announces via `role="status"` + `sr-only` + `aria-live`: good.  
- Pill + mist labels meet AA on card gradient: good (prior fails cleared).

**สมาชิก ABTA (project persona)**  
- Primary job: “ฉันยังเป็นสมาชิกอยู่ไหม / ต้องต่ออายุเมื่อไหร่ / ใบเสร็จอยู่ที่ไหน”.  
- Card answers the first two with readable urgency tones.  
- Reject + resubmit path respects association workflow.  
- Trust: urgent pills now look official (token-aligned ochre/green/red).

### Detector Summary

| Source | Result |
|--------|--------|
| CLI `detect.mjs` | `[]` — 0 rules fired |
| Manual contrast | **PASS** all status pills + mist labels on card-light |
| Reduced motion | Present in `status.css` |
| Browser overlay | Skipped (no inject); error-state snapshot used |

### Concrete Fix Backlog

1. **[P1]** Add explicit CTA for token/incomplete-link errors (LIFF close / LINE OA reopen).  
2. **[P2]** Path-aware card CTA (`/card` vs `/status`).  
3. **[P2]** Collapse non-critical detail rows.  
4. **[P3]** Differentiate temporary vs warning tones; soften uppercase labels.  
5. Re-run `/impeccable critique` after next pass (target 32+).

### Fixed since prior critique (do not re-open)

- ~~P0 warning/temporary pill contrast~~ → `--page-warn` `#b54708` + white  
- ~~P1 muted card labels~~ → `--page-green-mist` on gradient  
- ~~P1 loading not announced~~ → `role="status"` / `sr-only` / `aria-live`  
- ~~P1 error always → register~~ → branched `errorCta()` + retry

### Questions for Product (optional)

1. For token errors, prefer LIFF `closeWindow`, a LINE deep link, or both?  
2. On `/card`, should “เปิดบัตรสมาชิก” open a printable image/PDF, or is it legacy of shared routing?  
3. Which detail rows are support-critical vs optional for Phase 1?

### Suggested command sequence

1. `/impeccable harden apps/web/src/pages/StatusPage.tsx`  
2. `/impeccable clarify apps/web/src/pages/StatusPage.tsx`  
3. `/impeccable distill` (detail list)  
4. `/impeccable polish`
