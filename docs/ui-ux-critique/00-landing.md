# Landing (`/`) — UI/UX Critique

> Method: dual-agent (A: design review · B: detector + browser) · Target: `apps/web/src/App.tsx` (`Landing`) + `App.css` + `index.css`
> Register cue: **product** system with **brand-adjacent browser fallback** (association green + gold, WCAG AA)
> Score: **14/40** (Poor) · P0: **1** · P1: **3** · Date: 2026-07-27
> Browser overlay: skipped (MCP has no mutable evaluate / script inject)
> **Vs prior critique (17/40):** Landing source **unchanged** — no post-fix uplift on this surface; score re-calibrated slightly lower on status / control heuristics after dual-agent review.

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์
**14/40 — Poor** — โครงสร้างยังเบาดี แต่หน้าที่เปิดนอก LINE ยังเป็น stub ของนักพัฒนา ไม่ใช่ทางออกสำหรับสมาชิก และยังหลุดจากเขียว+ทองของสมาคม

### ความประทับใจโดยรวม
ชื่อแบรนด์ใหญ่ชัด (`ABTA สมาชิก`) แต่กลางหน้าโชว์ **Firebase / LIFF** เป็น monospace — อารมณ์เหมือนหน้า debug ไม่ใช่ทางเข้าสมาคม ลิงก์สมัครกับ Back Office น้ำหนักเท่ากัน คั่นด้วย `·` ไม่มีปุ่มหลัก พื้นหลังมี radial สีน้ำเงิน (`#c5d4e8`) ที่ไม่อยู่ในพาเลตต์สมาคม และ**ไม่มีทอง**ตาม DESIGN.md

### สิ่งที่ทำได้ดี
1. **ไม่รก / ไม่ AI-slop แบบการตลาด** — ไม่มี card grid / gradient text / side-stripe / eyebrow spam
2. **บอกช่องทางหลักตรงๆ** — copy ชี้ว่าต้องเปิดจาก LINE OA
3. **Focus ของลิงก์** — `.lead a:focus-visible` มี outline มองเห็นได้; ใช้ Sarabun เหมาะกับไทย

### ปัญหาเร่งด่วน (P0–P1)
- **[P0]** สมาชิกที่เปิดในเบราว์เซอร์ถูกบอกให้ไป LINE แต่ไม่มี QR / deep link / ขั้นตอนจริง — ทางออกตัน (อย่าคิดค้น OA URL ที่ไม่มีในโค้ด)
- **[P1]** โชว์ `Firebase` + `LIFF` / `VITE_LIFF_ID` บนหน้าสาธารณะ (jargon + โหลดเกินจำเป็น)
- **[P1]** ลิงก์ `/register` กับ `/admin` น้ำหนักเท่ากัน — สมาชิกอาจเข้า Back Office; touch target เล็ก
- **[P1]** ไม่ใช้ shell/token สมาชิก (`shared.css` / gold) — หน้าแรกดูคนละแบรนด์กับบัตร/สมัคร

### สิ่งที่เปลี่ยนเทียบรอบก่อน
**ไม่ดีขึ้น** — `Landing` ใน `App.tsx` / `App.css` / `index.css` ยังเหมือนรายงานก่อนหน้า; fixes ล่าสุดน่าจะอยู่หน้าอื่น ไม่ใช่ `/`

### ข้อเสนอแนะสั้นๆ
ซ่อน meta ออกจากผู้ใช้ทั่วไป → CTA ปุ่มหลัก “สมัครสมาชิก” + คำอธิบาย LINE ที่ทำได้จริงจากข้อมูลที่มี → ลด/ย้าย Back Office → ดึงเขียว+ทองจาก DESIGN.md

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Env/config shown; no member-facing “you’re outside LINE / next step” status |
| 2 | Match System / Real World | 1 | `Firebase` / `LIFF` / `VITE_LIFF_ID` / `Back Office` jargon on Thai member entry |
| 3 | User Control and Freedom | 2 | Can leave to `/register` or `/admin`; no path *into* intended LINE channel |
| 4 | Consistency and Standards | 1 | Orphan tokens vs `--page-*`; no gold; blue wash; text links ≠ primary buttons |
| 5 | Error Prevention | 1 | Equal-weight Admin; public config leakage; wrong-audience path unguarded |
| 6 | Recognition Rather Than Recall | 2 | Links visible but not button CTAs; LINE instruction without visible how |
| 7 | Flexibility and Efficiency | 2 | Deep links help staff; no member accelerator into LINE |
| 8 | Aesthetic and Minimalist Design | 2 | Sparse layout good; polluted by `.meta` and weak CTA hierarchy |
| 9 | Error Recovery | 1 | Unset `VITE_LIFF_ID` helps deployers, not members stuck outside LINE |
| 10 | Help and Documentation | 1 | One lead sentence; no how-to / OA identity / support (none inventable from code) |
| **Total** | | **14/40** | **Poor — major UX overhaul of this surface** |

### Anti-Patterns Verdict

**LLM assessment:** Not classic AI marketing slop (no card grid, gradient text, side-stripe, eyebrow spam). Failure mode is an **under-designed stub** that leaks developer chrome. Brand test fails — first viewport is large title + tech `<dl>`, not a trustworthy association entry. Gold from DESIGN.md absent; blue radial `#c5d4e8` fights association green.

**Deterministic scan (`detect.mjs`):**
- `App.tsx` alone: **0** findings (exit 0)
- With `App.css` + `index.css`: **7** advisory (exit 2)

| Rule | File:line | Note |
|------|-----------|------|
| `design-system-font-size` | `App.css:9` | `.brand` clamp `2rem`/`2.75rem` off DESIGN.md ramp |
| `design-system-font-size` | `App.css:17` | `h1` `1.15rem` off ramp |
| `design-system-font-size` | `App.css:25` | `.lead` `0.95rem` off ramp |
| `design-system-radius` | `App.css:41` | focus `border-radius: 2px` outside rounded scale (`8px`+) |
| `design-system-font-size` | `App.css:48` | `.meta` `0.85rem` off ramp |
| `design-system-color` | `index.css:7` | `#d8e8d0` undocumented |
| `design-system-color` | `index.css:8` | `#c5d4e8` undocumented (blue — off brand) |

False positives: fluid brand display size may be intentional; near-ramp rem sizes may be micro-tuning — treat as “align or document,” not delete brand scale. Blue `#c5d4e8` is a **true brand miss**, not just undocumented.

**Visual overlays:** Not injected — browser MCP lacks mutable evaluate/script inject. Live Landing confirmed at `http://localhost:5173/`: brand, h1, LINE lead, Firebase `abta-member` + LIFF id, text links Register · Back Office.

### Overall Impression

A quiet, honest stub — but as the branded browser fallback it should either **bridge people into LINE** (using only real configured facts) or **hand them a clear member CTA**. Today it does neither well: hierarchy favors `<p class="brand">` over `<h1>`, CTAs are prose links, and Firebase/LIFF dominate the middle. Biggest opportunity: **channel-recovery + primary action** screen sharing green+gold with member shells.

### What's Working
1. **Restraint** — no decorative card stack; single column, readable width (`max-width: 28rem`).
2. **Channel honesty** — Thai lead admits primary path is LINE OA.
3. **Keyboard focus** — visible `:focus-visible` on `.lead a`; green link color `#0f4c36` aligns with primary.

### Cognitive Load

Checklist failures (4/8 → **high**):
- [ ] Single focus — FAIL (LINE instruction / config / dual links compete)
- [x] Chunking — pass
- [x] Grouping — pass (`<dl>` + link row)
- [ ] Visual hierarchy — FAIL (`.meta` steals weight; no primary button)
- [ ] One thing at a time — FAIL (LINE + Register + Admin)
- [x] Minimal choices — pass (≤4 actions; quality is the problem)
- [x] Working memory — pass
- [ ] Progressive disclosure — FAIL (always shows env meta)

### Priority Issues

#### [P0] No recovery path into LINE (dead-end fallback)
- **What:** Lead says open from LINE OA; page offers only `/register` and `/admin` — no QR, LINE deep link, OA add-friend, or step list. Do **not** invent OA URLs/QR not present in code.
- **Why it matters:** Users who hit `/` outside LIFF cannot complete the intended product path; copy creates a dead end.
- **Fix:** Member fallback block: plain Thai explanation + secondary “ไปหน้าสมัครสมาชิก” → `/register`. If a real OA/deep-link config exists later, wire it; until then, do not fake it. Keep Admin out of the member default path.
- **Suggested command:** `/impeccable onboard` (then `/impeccable clarify`)

#### [P1] Public `.meta` dumps Firebase / LIFF
- **What:** `<dl className="meta">` always shows `projectId` and `VITE_LIFF_ID` (or unset warning).
- **Why it matters:** Extraneous load for members; jargon barrier (Jordan); environment disclosure (Riley).
- **Fix:** Gate behind `import.meta.env.DEV` (or staff-only). Replace with user-facing status only if truthful from existing config: e.g. ready / not ready — without raw IDs.
- **Suggested command:** `/impeccable distill` (+ `/impeccable harden` for env gating)

#### [P1] CTAs are equal-weight text links; Admin contaminates member surface
- **What:** `<a href="/register">` and `<a href="/admin">` in one `.lead` with ` · `; no `button-primary`; likely &lt;44px touch height.
- **Why it matters:** Members may enter Back Office; mobile (Casey) misses targets; hierarchy ≠ DESIGN.md.
- **Fix:** Primary filled button “ไปหน้าสมัครสมาชิก”; remove Admin from Landing or demote to footer / known staff URL only.
- **Suggested command:** `/impeccable layout` (+ `/impeccable adapt` for touch; `/impeccable distill` for Admin)

#### [P1] Brand / token drift from member system
- **What:** Hardcoded `#1e3a2f`, `#0f4c36`; no `--page-gold`; `index.css` blue wash `#c5d4e8`; Landing unused by `shared.css` shells.
- **Why it matters:** First browser impression ≠ member card / register / status; undermines “น่าเชื่อถือ · เป็นระเบียบ · อบอุ่นแบบสมาคม”.
- **Fix:** Reuse `--page-*`; drop blue radial; add gold mark accent only; optional light member-shell atmosphere consistent with register.
- **Suggested command:** `/impeccable colorize` (+ `/impeccable polish`)

#### [P2] Semantic / typographic hierarchy inverted
- **What:** Brand is `<p class="brand">` at display size; product title is `<h1>` at `1.15rem`.
- **Why it matters:** Screen readers get a weak document title; visual weight fights semantics (Sam).
- **Fix:** One `h1` for brand (“ABTA สมาชิก”); demote “ระบบสมาชิก” to lead/subtitle; `text-wrap: balance` on heading.
- **Suggested command:** `/impeccable typeset`

#### [P3] Inline style on second lead; focus radius off token
- **What:** `style={{ marginTop: "1.5rem" }}`; focus `border-radius: 2px`.
- **Why it matters:** Spacing/tokens should live in CSS system.
- **Fix:** `.cta-row` class; focus radius → `rounded.sm` (8px).
- **Suggested command:** `/impeccable polish`

### Persona Red Flags

**Jordan (First-Timer):** Sees Firebase/LIFF; does not know what to tap first; “เปิดจาก LINE” without how → abandon.

**Casey (Distracted Mobile):** Mid-page text links, not 44×44 buttons; Admin equally tempting; `20vh` top padding pushes content; no thumb-zone CTA stack.

**Riley (Stress Tester):** Public project + LIFF IDs; unset env string as “UX”; Admin entry from public landing; Register without LINE context unframed.

**Sam (A11y):** Brand not in heading outline; focus on links OK; semantic `<dl>` ok; no landmark beyond `<main>`; muted `#4a5c52` on `#eef2ea` OK per DESIGN AA intent.

**สมาชิก ABTA (project):** Expects association trust + LINE path; gets a config panel — tone mismatch with “อบอุ่นแบบสมาคม”.

### Minor Observations
- DM Sans loaded for display elsewhere; Landing brand uses Sarabun only — acceptable for Thai-heavy, but Latin “ABTA” could use DM Sans per DESIGN.md.
- No motion yet — no `prefers-reduced-motion` needed until entrance motion is added.
- Detector radius `2px` on focus — bump to `rounded.sm` (8px).

### Questions to Consider
- Should `/` ever be a public member surface, or only a **staff/dev gate** with auto-hint to LINE?
- Is browser `/register` a supported Phase 1 path, or should Landing refuse and push LINE only?
- Does Admin belong on this page at all in production?
- What can be shown for LINE recovery **without inventing** OA URL/QR not in the codebase?

### Detector findings (raw summary)
- **7** findings when CSS included, all **advisory**
- Families: `design-system-font-size` ×4, `design-system-radius` ×1, `design-system-color` ×2
- Files: `App.css`, `index.css` (no markup antipattern hits in `App.tsx`)

### Concrete fix backlog

| Priority | Task | Owner command | Files |
|----------|------|---------------|-------|
| P0 | Member LINE fallback copy + clear next step (no invented OA/QR) | `onboard` → `clarify` | `App.tsx`, `App.css` |
| P1 | Gate `.meta` to `DEV` / replace with user status | `distill` → `harden` | `App.tsx` |
| P1 | Primary button CTA; remove/demote Admin | `layout` → `adapt` / `distill` | `App.tsx`, `App.css` |
| P1 | Align colors to `--page-*` + gold; remove blue wash | `colorize` | `App.css`, `index.css` |
| P2 | Fix heading semantics + type ramp | `typeset` | `App.tsx`, `App.css` |
| P3 | Move inline margin to class; focus radius token | `polish` | `App.tsx`, `App.css` |
| — | Final pass | `polish` | all three |

**Recommended command order for fix agents:**
1. `/impeccable distill` — remove public config chrome (+ Admin off member path)
2. `/impeccable onboard` — LINE fallback + clear first action (facts only)
3. `/impeccable layout` — button hierarchy
4. `/impeccable colorize` — green+gold identity
5. `/impeccable typeset` — heading structure
6. `/impeccable polish` — tokens, spacing, focus radius

Re-run critique after Landing-specific fixes to lift score from **14/40**.
