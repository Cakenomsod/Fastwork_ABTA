# Landing (`/`) — UI/UX Critique

> ⚠️ DEGRADED: single-context (nested critique subagent — dual Assessment A/B agents not spawned)
> Method: source review + `detect.mjs` · Target: `apps/web/src/App.tsx` (`Landing`) + `App.css` + `index.css`
> Register cue: **brand-adjacent entry fallback** inside a **product** system (green + gold)
> Score: **17/40** (Poor) · P0: **1** · P1: **3** · Date: 2026-07-27
> Browser overlay: skipped (no live inject in this run)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์
**17/40 — Poor** — โครงสร้างเบาดี แต่หน้าที่ให้สมาชิกที่เปิดนอก LINE ยังไม่ช่วยทำงานจริง และหลุดจาก visual identity ของสมาคม

### ความประทับใจโดยรวม
หน้า Landing เป็น fallback เมื่อไม่ได้เปิดจาก LINE — ชื่อแบรนด์ใหญ่ชัด (`ABTA สมาชิก`) แต่หัวข้อจริง (`ระบบสมาชิก`) เล็กจน hierarchy พัง ลิงก์สมัคร/Back Office เป็นข้อความธรรมดาคั่นด้วย `·` ไม่มีปุ่มหลักตาม DESIGN.md และโชว์ **Firebase / LIFF ID** ให้ผู้ใช้ทั่วไปเห็น ซึ่งเป็นศัพท์เทคนิค ไม่ใช่สถานะที่สมาชิกต้องการ พื้นหลังมี radial สีน้ำเงิน (`#c5d4e8`) ที่ไม่มีในพาเลตต์เขียว+ทองของสมาคม

### สิ่งที่ทำได้ดี
1. **ไม่รก** — ไม่มี card grid / gradient text / side-stripe; layout กะทัดรัด (`max-width: 28rem`)
2. **บอกช่องทางหลัก** — copy บอกชัดว่าควรเปิดจาก LINE OA
3. **Focus ของลิงก์** — `.lead a:focus-visible` มี outline มองเห็นได้

### ปัญหาเร่งด่วน (P0–P1)
- **[P0]** สมาชิกที่เปิดในเบราว์เซอร์ถูกบอกให้ไป LINE แต่ไม่มี QR / deep link / ปุ่มเพิ่มเพื่อน — ทางออกตัน
- **[P1]** โชว์ `Firebase` + `LIFF` config บนหน้าสาธารณะ (jargon + ไม่ควรเป็นเนื้อหาสมาชิก)
- **[P1]** ลิงก์ `/register` กับ `/admin` น้ำหนักเท่ากัน เป็น text link — สมาชิกอาจเข้า Back Office โดยไม่ตั้งใจ; touch target เล็กบนมือถือ
- **[P1]** ไม่ใช้ shell/token ของ member pages (`shared.css` / gold) — หน้าแรกดูคนละแบรนด์กับบัตรสมาชิก

### ข้อเสนอแนะสั้นๆ
ซ่อน meta ออกจากผู้ใช้ทั่วไป → ทำ CTA ปุ่มหลัก “สมัครสมาชิก” + รอง “เข้า LINE” → ลดน้ำหนัก/ซ่อน Back Office → ดึงเขียว+ทองจาก DESIGN.md

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | States “open from LINE” but never confirms channel/LIFF readiness in user language; dumps env IDs instead |
| 2 | Match System / Real World | 1 | `Firebase` / `LIFF` / `Back Office` jargon on a Thai member entry surface |
| 3 | User Control and Freedom | 3 | Can leave to `/register` or `/admin`; not trapped — but no path *into* LINE |
| 4 | Consistency and Standards | 1 | Orphan tokens vs `shared.css` `--page-*`; no gold; blue wash; text links ≠ primary buttons |
| 5 | Error Prevention | 1 | Equal-weight Admin link; public config leakage; no guard against wrong audience path |
| 6 | Recognition Rather Than Recall | 2 | Actions are visible as links but not as labeled buttons; users must decode meta |
| 7 | Flexibility and Efficiency | 2 | Direct deep links help staff; no member accelerator into LINE |
| 8 | Aesthetic and Minimalist Design | 2 | Sparse layout is good; polluted by `.meta` and weak CTA hierarchy |
| 9 | Error Recovery | 1 | “ยังไม่ตั้งค่า VITE_LIFF_ID” helps deployers, not members stuck outside LINE |
| 10 | Help and Documentation | 1 | One lead sentence; no how-to open OA / QR / support contact |
| **Total** | | **17/40** | **Poor — major UX overhaul of this surface** |

### Anti-Patterns Verdict

**LLM assessment:** Not classic AI slop (no card grid, no gradient text, no side-stripe, no eyebrow spam). Failure mode is the opposite: **under-designed stub** that still leaks developer chrome. Brand test fails — after removing imaginary nav, the first viewport is a large title + tech `<dl>`, not a trustworthy association entry. Gold accent from DESIGN.md is absent; blue radial in `index.css` fights association green.

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

**Visual overlays:** Not injected this run.

### Overall Impression

A quiet, honest stub — but as the branded browser fallback it should either **redirect people into LINE** or **hand them a clear member CTA**. Today it does neither well: hierarchy favors a `<p class="brand">` over `<h1>`, CTAs are prose links, and Firebase/LIFF dominate the middle of the page. Biggest opportunity: turn this into a **channel-recovery + primary action** screen that shares green+gold identity with member shells.

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

#### [P0] No recovery path into LINE
- **What:** Lead says open from LINE OA; page offers only `/register` and `/admin` — no QR, LINE deep link, OA add-friend, or step list.
- **Why it matters:** Users who hit `/` outside LIFF cannot complete the intended product path; copy creates a dead end.
- **Fix:** Primary block: short Thai steps + optional QR/deep link to OA; secondary: “สมัครสมาชิกในเบราว์เซอร์” → `/register`. Keep Admin out of the member default path.
- **Suggested command:** `/impeccable onboard` (then `/impeccable clarify`)

#### [P1] Public `.meta` dumps Firebase / LIFF
- **What:** `<dl class="meta">` always shows `projectId` and `VITE_LIFF_ID` (or unset warning).
- **Why it matters:** Extraneous load for members; jargon barrier (Jordan); unnecessary environment disclosure (Riley).
- **Fix:** Hide behind `import.meta.env.DEV` (or staff-only). Replace with user-facing status: “พร้อมใช้งานผ่าน LINE” / “ยังเชื่อมต่อ LINE ไม่ได้ — ติดต่อเจ้าหน้าที่”.
- **Suggested command:** `/impeccable distill` (+ `/impeccable harden` for env gating)

#### [P1] CTAs are equal-weight text links, not buttons
- **What:** `<a href="/register">` and `<a href="/admin">` in one `.lead` with ` · `; no `button-primary` styling; likely &lt;44px touch height.
- **Why it matters:** Members may enter Back Office; mobile (Casey) misses targets; hierarchy doesn’t match DESIGN.md.
- **Fix:** Stack: primary filled button “ไปหน้าสมัครสมาชิก”; tertiary muted text/link “เจ้าหน้าที่ — Back Office” (or move Admin to a footer / `?staff=1`). Thai label for admin path.
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

**Riley (Stress Tester):** Public project + LIFF IDs; unset env string as “UX”; Admin entry from public landing.

**Sam (A11y):** Brand not in heading outline; focus on links OK; no landmark beyond `<main>`; contrast of muted on `#eef2ea` is OK per DESIGN (`#4a5c52`).

**สมาชิก ABTA (project):** Expects association trust + LINE path; gets a config panel — tone mismatch with “อบอุ่นแบบสมาคม”.

### Minor Observations
- DM Sans loaded in `index.html` but Landing brand uses Sarabun only — fine for Thai, but display could use DM Sans per DESIGN.md for Latin “ABTA”.
- No `prefers-reduced-motion` needed yet (no motion) — add if entrance motion is introduced.
- `20vh` top padding centers content oddly on short phones; prefer `clamp` padding.
- Detector radius `2px` on focus — bump to `rounded.sm` (8px).

### Questions to Consider
- Should `/` ever be a public member surface, or only a **staff/dev gate** with auto-hint to LINE?
- Is browser `/register` a supported Phase 1 path, or should Landing refuse and push LINE only?
- Does Admin belong on this page at all in production?

### Detector findings (raw summary)
- **7** findings, all **advisory**
- Families: `design-system-font-size` ×4, `design-system-radius` ×1, `design-system-color` ×2
- Files: `App.css`, `index.css` (no hits inside `App.tsx` markup rules)

### Concrete fix backlog

| Priority | Task | Owner command | Files |
|----------|------|---------------|-------|
| P0 | Add LINE recovery (copy steps + QR/deep link) | `onboard` → `clarify` | `App.tsx`, `App.css` |
| P1 | Gate `.meta` to `DEV` / replace with user status | `distill` → `harden` | `App.tsx` |
| P1 | Primary button CTA; demote Admin | `layout` → `adapt` | `App.tsx`, `App.css` |
| P1 | Align colors to `--page-*` + gold; remove blue wash | `colorize` | `App.css`, `index.css` |
| P2 | Fix heading semantics + type ramp | `typeset` | `App.tsx`, `App.css` |
| P3 | Move inline margin to class; focus radius token | `polish` | `App.tsx`, `App.css` |
| — | Final pass | `polish` | all three |

**Recommended command order for fix agents:**
1. `/impeccable distill` — remove public config chrome
2. `/impeccable onboard` — LINE recovery + clear first action
3. `/impeccable layout` — button hierarchy / Admin demotion
4. `/impeccable colorize` — green+gold identity
5. `/impeccable typeset` — heading structure
6. `/impeccable polish` — tokens, spacing, focus radius

Re-run critique after fixes to lift score from **17/40**.
