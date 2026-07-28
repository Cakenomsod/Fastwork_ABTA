---
target: Landing / App.tsx
total_score: 17
p0_count: 1
p1_count: 3
timestamp: 2026-07-27T15-03-39Z
slug: apps-web-src-app-tsx
---
# Landing (`/`) — UI/UX Critique

> ⚠️ DEGRADED: single-context (nested critique subagent — dual Assessment A/B agents not spawned)
> Method: source review + live browser (`localhost:5173/`) + `detect.mjs` · Target: `apps/web/src/App.tsx` (`Landing`) + `App.css` + `index.css`
> Register cue: **brand-adjacent entry fallback** inside a **product** system (green + gold)
> Score: **17/40** (Poor) · P0: **1** · P1: **3** · Date: 2026-07-27 (re-critique after project fixes elsewhere)
> Note: Landing sources **unchanged** vs prior critique — score held. Do **not** invent LIFF/OA QR URLs; only score real gaps.
> Browser overlay: skipped (no live inject this run; screenshot + a11y snapshot used)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์
**17/40 — Poor** — หลังแก้หน้าอื่นแล้ว Landing ยังเป็น stub เดิม: บอกให้ไป LINE แต่ไม่มีทางเข้าจริง (และห้ามสร้าง QR ปลอมถ้าไม่มีใน env)

### ความประทับใจโดยรวม
หน้า `/` เป็น fallback เมื่อเปิดนอก LINE — ชื่อแบรนด์ `ABTA สมาชิก` ใหญ่ชัด แต่ `h1` (“ระบบสมาชิก”) เล็กกว่าแบรนด์ พื้นหลังยังมี radial น้ำเงิน (`#c5d4e8`) นอกพาเลตต์เขียว+ทอง กลางหน้าโชว์ **Firebase projectId + LIFF ID** ให้สมาชิกทั่วไป ลิงก์สมัคร/Back Office เป็นข้อความคั่น `·` ไม่มีปุ่มหลักตาม DESIGN.md

ตรวจ live: มี LIFF ID ใน env แล้ว แต่หน้ายังไม่ใช้ `VITE_LIFF_URL` เป็น deep link / ไม่มีขั้นตอนไทยที่กู้ช่องทางได้โดยไม่ต้องมี QR ปลอม

### สิ่งที่ทำได้ดี
1. **ไม่รก** — ไม่มี card grid / gradient text / side-stripe; คอลัมน์เดียว `max-width: 28rem`
2. **บอกช่องทางหลัก** — copy บอกชัดว่าควรเปิดจาก LINE OA
3. **Focus ของลิงก์** — `.lead a:focus-visible` มี outline มองเห็นได้

### ปัญหาเร่งด่วน (P0–P1)
- **[P0]** ไม่มีทางกู้เข้า LINE — ไม่มีขั้นตอนไทย / deep link จาก `VITE_LIFF_URL` เมื่อมีค่า / ช่องทางติดต่อ; **อย่าสร้าง QR จาก URL ที่ไม่มีใน env**
- **[P1]** โชว์ `Firebase` + `LIFF` บนหน้าสาธารณะ (jargon + เปิดเผย config)
- **[P1]** ลิงก์ `/register` กับ `/admin` น้ำหนักเท่ากัน เป็น text link — สมาชิกอาจเข้า Back Office; touch target เล็ก
- **[P1]** ไม่ใช้ shell/token ของ member pages (`shared.css` / gold) — หน้าแรกดูคนละแบรนด์กับบัตรสมาชิก

### ข้อเสนอแนะสั้นๆ
ซ่อน `.meta` ออกจาก production → ถ้ามี `VITE_LIFF_URL` ใช้เป็น CTA “เปิดใน LINE”; ถ้าไม่มี แสดงขั้นตอนไทย + ปุ่มสมัคร (ไม่ invent QR) → ลดน้ำหนัก Admin → ดึงเขียว+ทองจาก DESIGN.md

### Top 3 ที่เหลือ
1. ไม่มี LINE recovery จริง (env-gated; ไม่ invent QR)
2. Public Firebase / LIFF meta
3. CTA text links + Admin น้ำหนักเท่ากัน (หรือ brand drift เขียว/ทอง)

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Says “open from LINE” but never confirms channel readiness in member language; dumps Firebase/LIFF IDs instead |
| 2 | Match System / Real World | 1 | `Firebase` / `LIFF` / `Back Office` jargon on a Thai member entry surface |
| 3 | User Control and Freedom | 3 | Can leave to `/register` or `/admin`; not trapped — but no path *into* LINE |
| 4 | Consistency and Standards | 1 | Orphan tokens vs `shared.css` `--page-*`; no gold; blue wash; text links ≠ primary buttons |
| 5 | Error Prevention | 1 | Equal-weight Admin link; public config leakage; no guard against wrong audience path |
| 6 | Recognition Rather Than Recall | 2 | Actions visible as links but not labeled buttons; users must decode meta |
| 7 | Flexibility and Efficiency | 2 | Direct deep links help staff; no member accelerator into LINE even when `VITE_LIFF_URL` exists |
| 8 | Aesthetic and Minimalist Design | 2 | Sparse layout is good; polluted by `.meta` and weak CTA hierarchy |
| 9 | Error Recovery | 1 | Unset/`VITE_LIFF_ID` string helps deployers, not members stuck outside LINE |
| 10 | Help and Documentation | 1 | One lead sentence; no Thai how-to / support; no env-gated deep link |
| **Total** | | **17/40** | **Poor — major UX overhaul of this surface** |

### Anti-Patterns Verdict

**LLM assessment:** Not classic AI slop (no card grid, no gradient text, no side-stripe, no eyebrow spam). Failure mode is an **under-designed stub** that still leaks developer chrome. Brand test fails — first viewport is large title + tech `<dl>`, not a trustworthy association entry. Gold from DESIGN.md absent; blue radial in `index.css` fights association green.

**Deterministic scan (`detect.mjs`, exit 2):** 7 advisory hits — no critical contrast/slop rules.

| Rule | File:line | Note |
|------|-----------|------|
| `design-system-font-size` | `App.css:9` | `.brand` clamp `2rem`/`2.75rem` off DESIGN.md ramp |
| `design-system-font-size` | `App.css:17` | `h1` `1.15rem` off ramp |
| `design-system-font-size` | `App.css:25` | `.lead` `0.95rem` off ramp |
| `design-system-radius` | `App.css:41` | focus `border-radius: 2px` outside rounded scale (`8px`+) |
| `design-system-font-size` | `App.css:48` | `.meta` `0.85rem` off ramp |
| `design-system-color` | `index.css:7` | `#d8e8d0` undocumented |
| `design-system-color` | `index.css:8` | `#c5d4e8` undocumented (blue — off brand) |

False positives: fluid brand display size may be intentional; treat as “align or document,” not delete brand scale.

**Live browser:** Confirmed at `/` — brand, inverted heading hierarchy, Firebase + LIFF values visible, equal text links “ไปหน้าสมัครสมาชิก · Back Office”, soft green+blue wash. No QR / deep-link CTA rendered.

**Visual overlays:** Not injected this run.

### Overall Impression

Quiet stub, honest about LINE-first — but as the branded browser fallback it must either **hand members a real channel path when env provides one** or **clear Thai steps + register CTA when it does not**. Inventing OA/QR URLs is out of scope. Biggest opportunity: channel-recovery + primary action screen sharing green+gold with member shells.

### What's Working
1. **Restraint** — no decorative card stack; single column, readable width.
2. **Channel honesty** — copy admits primary path is LINE OA.
3. **Keyboard focus** — visible `:focus-visible` on `.lead a`.

### Cognitive Load

Checklist failures (5/8 → **high**):
- [ ] Single focus — FAIL (brand / LINE instruction / config / dual links compete)
- [x] Chunking — pass (few items)
- [ ] Grouping — FAIL (CTAs buried in second `.lead`; `.meta` reads as primary content)
- [ ] Visual hierarchy — FAIL (`.brand` >> `h1` >> weak links)
- [ ] One thing at a time — FAIL
- [x] Minimal choices — pass (≤2 actions)
- [x] Working memory — pass
- [ ] Progressive disclosure — FAIL (always shows env meta)

### Priority Issues

#### [P0] No real LINE recovery path (env-gated — do not invent QR)
- **What:** Lead says open from LINE OA; page offers only `/register` and `/admin`. Code already knows `VITE_LIFF_URL` (`member-links.ts`) but Landing never surfaces it. No Thai step list / support contact when URL is empty.
- **Why it matters:** Outside-LIFF users cannot complete the intended product path; copy creates a dead end. Fake QR/OA URLs would be worse than no QR.
- **Fix:** If `import.meta.env.VITE_LIFF_URL` (or documented OA URL env) is set → primary CTA “เปิดใน LINE” using that URL only. If unset → Thai steps (“เปิด LINE OA ของสมาคม → เมนูสมาชิก”) + primary “ไปหน้าสมัครสมาชิก”; optional support contact. **Never invent `liff.line.me/...` or QR image sources.**
- **Suggested command:** `/impeccable onboard` (then `/impeccable clarify`)

#### [P1] Public `.meta` dumps Firebase / LIFF
- **What:** `<dl class="meta">` always shows `projectId` and LIFF ID (or unset warning). Live page exposes real IDs.
- **Why it matters:** Extraneous load for members; jargon barrier (Jordan); unnecessary environment disclosure (Riley).
- **Fix:** Hide behind `import.meta.env.DEV` (or staff-only). Replace with user-facing status: “พร้อมใช้งานผ่าน LINE” / “ยังเชื่อมต่อ LINE ไม่ได้ — ติดต่อเจ้าหน้าที่”.
- **Suggested command:** `/impeccable distill` (+ `/impeccable harden` for env gating)

#### [P1] CTAs are equal-weight text links, not buttons
- **What:** `<a href="/register">` and `<a href="/admin">` in one `.lead` with ` · `; no `button-primary` styling; likely &lt;44px touch height.
- **Why it matters:** Members may enter Back Office; mobile (Casey) misses targets; hierarchy doesn’t match DESIGN.md.
- **Fix:** Stack: primary filled button “ไปหน้าสมัครสมาชิก”; tertiary muted text/link “เจ้าหน้าที่ — Back Office” (or footer / `?staff=1`). Thai label for admin path.
- **Suggested command:** `/impeccable layout` (+ `/impeccable adapt` for touch)

#### [P1] Brand / token drift from member system
- **What:** Hardcoded `#1e3a2f`, `#0f4c36`; no `--page-gold`; `index.css` blue wash `#c5d4e8`; Landing unused by `shared.css` shells.
- **Why it matters:** First browser impression ≠ member card / register / status; undermines “น่าเชื่อถือ · เป็นระเบียบ”.
- **Fix:** Reuse `--page-*` (or shared landing tokens); drop blue radial; add gold mark accent; optional light member-shell atmosphere consistent with register.
- **Suggested command:** `/impeccable colorize` (+ `/impeccable polish`)

#### [P2] Semantic / typographic hierarchy inverted
- **What:** Brand is `<p class="brand">` at display size; product title is `<h1>` at `1.15rem`.
- **Why it matters:** Screen readers get a weak document title; visual weight fights semantics (Sam).
- **Fix:** One `h1` for brand (“ABTA สมาชิก”); demote “ระบบสมาชิก” to lead/subtitle; `text-wrap: balance` on heading.
- **Suggested command:** `/impeccable typeset`

#### [P3] Inline style on second lead
- **What:** `style={{ marginTop: "1.5rem" }}` on CTA paragraph.
- **Why it matters:** Spacing should live in CSS; harder to keep rhythm consistent.
- **Fix:** `.cta-row` / `.page__actions` class with token spacing.
- **Suggested command:** `/impeccable polish`

### Persona Red Flags

**Jordan (First-Timer):** Sees Firebase/LIFF; does not know what to tap first; “เปิดจาก LINE” without how → abandon.

**Casey (Distracted Mobile):** Mid-page text links, not 44×44 buttons; Admin equally tempting; no thumb-zone CTA stack.

**Riley (Stress Tester):** Public project + LIFF IDs; unset env string as “UX”; Admin entry from public landing; would notice absence of real deep link despite LIFF being configured.

**Sam (A11y):** Brand not in heading outline; focus on links OK; no landmark beyond `<main>`; contrast of muted on `#eef2ea` is OK per DESIGN (`#4a5c52`).

**สมาชิก ABTA (project):** Expects association trust + LINE path; gets a config panel — tone mismatch with “อบอุ่นแบบสมาคม”.

### Minor Observations
- DM Sans loaded but Landing brand uses Sarabun only — fine for Thai; Latin “ABTA” could use DM Sans per DESIGN.md.
- No `prefers-reduced-motion` needed yet (no motion).
- `20vh` top padding odd on short phones; prefer `clamp` padding.
- Detector radius `2px` on focus — bump to `rounded.sm` (8px).
- Re-critique finding: other project pages may have improved; **Landing did not move** — backlog below still accurate.

### Questions to Consider
- Should `/` ever be a public member surface, or only a **staff/dev gate** with auto-hint to LINE?
- Is browser `/register` a supported Phase 1 path, or should Landing refuse and push LINE only when `VITE_LIFF_URL` is set?
- Does Admin belong on this page at all in production?

### Detector findings (raw summary)
- **7** findings, all **advisory**
- Families: `design-system-font-size` ×4, `design-system-radius` ×1, `design-system-color` ×2
- Files: `App.css`, `index.css` (no hits inside `App.tsx` markup rules)

### Concrete fix backlog

| Priority | Task | Owner command | Files |
|----------|------|---------------|-------|
| P0 | Env-gated LINE recovery: use `VITE_LIFF_URL` when set; Thai steps when not; **never invent QR** | `onboard` → `clarify` | `App.tsx`, `App.css` |
| P1 | Gate `.meta` to `DEV` / replace with user status | `distill` → `harden` | `App.tsx` |
| P1 | Primary button CTA; demote Admin | `layout` → `adapt` | `App.tsx`, `App.css` |
| P1 | Align colors to `--page-*` + gold; remove blue wash | `colorize` | `App.css`, `index.css` |
| P2 | Fix heading semantics + type ramp | `typeset` | `App.tsx`, `App.css` |
| P3 | Move inline margin to class; focus radius token | `polish` | `App.tsx`, `App.css` |
| — | Final pass | `polish` | all three |

**Recommended command order for fix agents:**
1. `/impeccable distill` — remove public config chrome
2. `/impeccable onboard` — env-gated LINE recovery + clear first action (no invented QR)
3. `/impeccable layout` — button hierarchy / Admin demotion
4. `/impeccable colorize` — green+gold identity
5. `/impeccable typeset` — heading structure
6. `/impeccable polish` — tokens, spacing, focus radius

Re-run critique after Landing fixes to lift score from **17/40**.
