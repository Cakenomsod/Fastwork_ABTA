# 02 — Status / Member Card · Score **26/40** · P0: **1** · P1: **3**

> Routes: `/status`, `/card` (same `StatusPage`)  
> Files: `apps/web/src/pages/StatusPage.tsx`, `status.css`, `shared.css`  
> Method: ⚠️ DEGRADED: single-context (running as parent multitask subagent — nested dual-agent spawn disallowed)  
> Detector: `detect.mjs --json` → `[]` (clean) · Browser overlay: skipped (no live view in this run)  
> Date: 2026-07-27 · Register: product · Brand: association green + gold · WCAG 2.1 AA target

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: **26/40** (Acceptable) — P0: **1** · P1: **3**

หน้าสถานะ/บัตรสมาชิกเป็นจุดแข็งของระบบสมาชิก: การ์ดเขียว-ทองอ่านง่าย มี skeleton ตอนโหลด ข้อความ error เป็นภาษาไทยชัด และมี `prefers-reduced-motion` แล้ว — แต่ **pill สถานะสีเตือน/ชั่วคราวตัดกับตัวอักษรขาวไม่ผ่าน AA** ซึ่งขัดหลัก “สถานะชัดก่อนสวย”

### จุดแข็ง
1. **บัตรสมาชิกเป็นฮีโร่** — ชื่อ · เลขสมาชิก · สถานะ · วันหมดอายุอยู่บนการ์ดเดียว มองรู้ทันทีว่าเป็นบัตร ABTA
2. **สถานะ + การกระทำเชื่อมกัน** — ใกล้หมดอายุมี “ต่ออายุ”; reject มีเหตุผล + ปุ่มส่งใหม่; ใบเสร็จ/บัตรเป็น secondary ที่สมเหตุสมผล
3. **Motion มีวินัย** — `rise` + shimmer มีทางเลือก `prefers-reduced-motion: reduce`

### ปัญหาสำคัญ (เรียงตามความเร่งด่วน)

| ระดับ | ปัญหา | สรุปสั้น |
|-------|--------|----------|
| **P0** | Pill `temporary` / `warning` contrast ไม่ผ่าน AA | ขาวบน `#b9822a` / `#d97a19` ≈ 3.1–3.3:1 — สถานะที่ต้องชัดที่สุดกลับอ่านยาก |
| **P1** | Label บนปลาย gradient การ์ดอ่อนเกินไป | `#9fc4b2` บน `#1c6f4c` ≈ 3.2:1 — ป้าย “หมายเลขสมาชิก / วันหมดอายุ” เสี่ยงอ่านไม่ออก |
| **P1** | Loading / เปลี่ยนสถานะไม่ประกาศให้ screen reader | มี `aria-busy` แต่ไม่มีข้อความโหลด / `aria-live` |
| **P1** | Error แล้ว CTA เสมอ “ไปหน้าสมัครสมาชิก” | ลิงก์หมดอายุ/ห้ามเข้า ไม่ควรพาไปสมัครเป็นทางหลัก |
| **P2** | `/card` กับ `/status` หน้าเดียวกัน — ปุ่ม “เปิดบัตรสมาชิก” อาจวนซ้ำ | สมาชิกที่เปิดจากบัตรจะงงว่าเปิดอะไรอีก |
| **P2** | Detail list โชว์ทุกแถวเสมอ | สัมมนา / อัปเดตล่าสุด เพิ่ม cognitive load โดยไม่จำเป็น |
| **P3** | สี pill ไม่ตรง token ใน DESIGN.md; uppercase tracked labels | polish / consistency |

### Cognitive load
- ล้มเหลวประมาณ **2/8** ข้อ → **ปานกลาง** (detail rows 5 แถว; ไม่มี progressive disclosure)
- จุดตัดสินใจปุ่ม ≤3 → อยู่ในขีด working memory

### AI slop
- **ไม่ใช่ AI slop ชัด** — เขียวสมาคม + ทองเป็นการ์ดจริง ไม่ใช่ SaaS cream / purple glow
- Detector: **0 findings**
- เตือนเล็กน้อย: uppercase tracked labels บนการ์ด, pill ทรงเต็ม — แต่เป็น convention ของบัตร/สถานะ ไม่ใช่ scaffold ว่าง

### Personas (สั้น)
- **Jordan**: รู้ว่าเป็นบัตรสมาชิก แต่ไม่รู้ว่า “สถานะชั่วคราว / สัมมนา” หมายความว่าต้องทำอะไรต่อ
- **Casey**: มือถือ LIFF ดี (ปุ่มล่าง, touch padding) แต่ contrast pill เตือน + ปุ่มบัตรซ้ำบน `/card` เป็นปัญหาจริง
- **Sam**: focus บนปุ่มมี; skeleton/สถานะโหลดไม่ announce; สี pill บางโทนพึ่ง luminance ไม่พอ
- **สมาชิก ABTA**: ต้องการรู้ “ยังเป็นสมาชิกไหม / หมดเมื่อไหร่ / ต้องต่ออายุไหม” ใน 5 วินาที — การ์ดทำได้ดี แต่ pill เตือนทำลายจุดนั้น

### คำสั่งที่แนะนำต่อ
1. `/impeccable audit apps/web/src/pages/StatusPage.tsx` — contrast pill + labels  
2. `/impeccable harden` — aria-live, loading copy, error CTA ตามโค้ด  
3. `/impeccable clarify` — ความหมายสถานะ + copy ปุ่มบน `/card`  
4. `/impeccable polish` — ปิด backlog

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton + pill + expiry hint; no `aria-live` for load→ready |
| 2 | Match System / Real World | 3 | Natural Thai; card metaphor strong; some labels (seminar) assume domain knowledge |
| 3 | User Control and Freedom | 2 | Error exits weak (register-only); no retry; `/card` “open card” can feel trapped/circular |
| 4 | Consistency and Standards | 3 | Shared member shell/tokens; pill hex diverge from DESIGN.md warn/danger |
| 5 | Error Prevention | 2 | Guards missing `memberId`; network fail → generic path; wrong recovery CTA |
| 6 | Recognition Rather Than Recall | 3 | All key facts on one screen; status has text label (not color-only) |
| 7 | Flexibility and Efficiency | 2 | Fine for LIFF read path; no copy ID / share / refresh affordance |
| 8 | Aesthetic and Minimalist Design | 3 | Strong brand card; detail list slightly noisy; mild uppercase label pattern |
| 9 | Error Recovery | 3 | Clear Thai errors + reject reasons; recovery CTA often wrong destination |
| 10 | Help and Documentation | 2 | LINE OA footnote only; no status glossary / next-step explainer |
| **Total** | | **26/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM assessment**: Passes the product slop test more than it fails. The member card is a deliberate association artifact (green gradient, gold border tint, ABTA mark)—not generic SaaS cream or purple glow. Mild tells: `text-transform: uppercase` + wide tracking on `.mcard__label`, full-pill status chips, decorative sheen. None dominate.

**Deterministic scan**: `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/StatusPage.tsx` → **`[]`** (0 findings). Detector missed contrast (CSS color pairs / runtime states)—manual WCAG check required.

**Visual overlays**: Not injected this run (no local live server / browser presentation). Fallback = source + contrast math.

### Overall Impression

Best member-facing composition in the product so far: status clarity is *almost* nailed by layout, then undermined by **failing contrast on the warning/temporary pills**—exactly the tones that carry urgency. Fix contrast and error recovery first; polish disclosure second.

### What's Working

1. **Status-first hierarchy** — name → member ID + pill → expiry (+ days left) matches PRODUCT principle “สถานะชัดก่อนสวย”.
2. **Action coupling** — `canResubmit` / `canResubmitSlip` / `canRenew` gate the right primary CTA; ghost receipt/card as secondary.
3. **Loading + reduced motion** — skeleton mirrors layout; `@media (prefers-reduced-motion: reduce)` disables rise/shimmer/btn transition.

### Priority Issues

#### [P0] What: Warning & temporary status pills fail WCAG AA contrast
- **Why it matters**: Product targets WCAG 2.1 AA and “status clarity first.” White on `#b9822a` (~3.34:1) and `#d97a19` (~3.11:1) fails large-text-adjacent small pill text. Near-expiry / temporary members—highest anxiety—get the least readable chip.
- **Fix**: Darken pill fills (align with DESIGN.md `--warn` / deeper ochre) or switch chip to soft fill + dark ink (≥4.5:1). Re-check all five tones on card green. Prefer semantic tokens over one-off hex in `status.css`.
- **Suggested command**: `/impeccable audit apps/web/src/pages/StatusPage.tsx` (then `/impeccable colorize` if palette needs retune)

#### [P1] What: Card meta labels fail AA on the light end of the member-card gradient
- **Why it matters**: `.mcard__label` uses `#9fc4b2` (`--page-green-text-muted`). Against `#1c6f4c` (card light stop) ≈ **3.21:1**. ID/expiry labels sit lower on the card where the gradient is lightest—Casey outdoors + Sam low-vision lose the structure.
- **Fix**: Bump on-card muted text toward `#bcd8c9` / `#d4e8dc` or add a darker local strip behind the label row; verify ≥4.5:1 on `#1c6f4c` and mid stops.
- **Suggested command**: `/impeccable audit` · `/impeccable typeset` (label size/weight if needed)

#### [P1] What: Loading and ready states are not announced accessibly
- **Why it matters**: `StatusSkeleton` sets `aria-busy` without accessible name / `role="status"` / `aria-live`. Sam hears silence, then a sudden content dump. WCAG status messages require announcement.
- **Fix**: Add visually hidden “กำลังโหลดสถานะสมาชิก…” in skeleton; wrap ready content region with `aria-live="polite"` (or announce status label on ready). Keep `aria-busy={true}` only while loading.
- **Suggested command**: `/impeccable harden apps/web/src/pages/StatusPage.tsx`

#### [P1] What: Error primary CTA always sends users to `/register`
- **Why it matters**: `invalid_token` / `forbidden` / generic errors all offer “ไปหน้าสมัครสมาชิก”. Existing members following a dead link will start the wrong journey (support tickets, duplicate applications).
- **Fix**: Branch CTAs: token/forbidden → emphasize reopen from LINE OA (“เช็คสถานะ”) + optional retry; `not_found` may keep register; add explicit retry control for network/unknown.
- **Suggested command**: `/impeccable clarify` · `/impeccable harden`

#### [P2] What: `/card` and `/status` share one view; “เปิดบัตรสมาชิก” can be circular
- **Why it matters**: Jordan/Casey already on the digital card still see “เปิดบัตรสมาชิก” when `memberCardUrl` is present—implies another artifact exists.
- **Fix**: Detect path (`/card` vs `/status`) or omit/rename CTA when already rendering the card (“แชร์บัตร” / hide). Keep receipt + renew.
- **Suggested command**: `/impeccable clarify` · `/impeccable distill`

#### [P2] What: Detail card always expands every metadata row
- **Why it matters**: Up to 5 rows (payment, receipt, seminar, renewal, updated) pushes chunking past the ≤4 guideline; seminar/updated rarely drive the next action.
- **Fix**: Keep payment + receipt always; collapse seminar/updated behind “รายละเอียดเพิ่มเติม” or demote updated to foot meta.
- **Suggested command**: `/impeccable distill` · `/impeccable layout`

#### [P3] What: Pill colors diverge from DESIGN.md; uppercase tracked labels
- **Why it matters**: Consistency debt; mild AI-grammar eyebrow on labels.
- **Fix**: Map tones to design tokens; sentence-case labels or reduce tracking.
- **Suggested command**: `/impeccable polish`

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
- Unclear what to do when pill says temporary/warning beyond reading expiry.  
- Error → register CTA may send them into the wrong funnel.  
- No inline explanation of “สถานะสัมมนา”.

**Casey (Distracted Mobile / LIFF)**  
- Thumb-zone actions at bottom: good. Touch padding on `.btn` (~adequate).  
- Warning pill contrast fails outdoors / bright LINE WebView.  
- On `/card`, “เปิดบัตรสมาชิก” wastes a tap / confuses.  
- Foot-note help is below fold on small phones.

**Sam (Accessibility)**  
- `btn:focus-visible` gold outline: good.  
- Status not color-only (has `statusLabel`): good.  
- Pill luminance fail + muted labels on light card stop: fail AA.  
- Skeleton/busy without live announcement; `em` used for hint/sub (OK visually, not semantic emphasis for AT).

**สมาชิก ABTA (project persona)**  
- Primary job: “ฉันยังเป็นสมาชิกอยู่ไหม / ต้องต่ออายุเมื่อไหร่ / ใบเสร็จอยู่ที่ไหน”.  
- Card answers the first two when contrast holds.  
- Reject + resubmit path respects association workflow.  
- Trust risk: soft/failed contrast on urgent states feels “unofficial” vs paper membership card.

### Detector Summary

| Source | Result |
|--------|--------|
| CLI `detect.mjs` | `[]` — 0 rules fired |
| Manual contrast | **FAIL** temporary + warning pills; **FAIL** muted labels on `#1c6f4c` |
| Reduced motion | Present in `status.css` |
| Browser overlay | Skipped this run |

### Concrete Fix Backlog

1. **[P0]** Retune `.status--temporary` / `.status--warning` (and verify all tones) for ≥4.5:1 text contrast; prefer DESIGN.md semantic colors.  
2. **[P1]** Raise `.mcard__label` / soft on-card text contrast against lightest card stop.  
3. **[P1]** Accessible loading: named busy state + polite live region on ready.  
4. **[P1]** Error CTA matrix by `code` + retry for transient failures.  
5. **[P2]** Path-aware card CTA (`/card` vs `/status`).  
6. **[P2]** Collapse non-critical detail rows.  
7. **[P3]** Token-align pill colors; soften uppercase label styling.  
8. Re-run `/impeccable critique` / update this file score after fixes.

### Questions for Product (optional)

1. Should temporary vs warning pills use filled dark chips or soft tint + dark ink (membership-card vs alert style)?  
2. On `/card`, is “เปิดบัตรสมาชิก” meant to open an image/PDF, or is it legacy of shared routing?  
3. Which detail rows are support-critical vs optional for Phase 1 members?

### Suggested command sequence

1. `/impeccable audit apps/web/src/pages/StatusPage.tsx`  
2. `/impeccable harden apps/web/src/pages/StatusPage.tsx`  
3. `/impeccable clarify apps/web/src/pages/StatusPage.tsx`  
4. `/impeccable distill` (detail list)  
5. `/impeccable polish`
