---
target: /receipt ReceiptPage after fixes
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-07-27T15-03-31Z
slug: apps-web-src-pages-receiptpage-tsx
---
# UX/UI Critique — `/receipt` (re-run after fixes)

> ⚠️ **DEGRADED: single-context** — รันภายใต้ parent subagent จึงไม่สามารถ spawn Assessment A/B แยกได้ตาม `critique.md` (nesting ถูกห้าม)  
> Method: single-context inline · Target: `apps/web/src/pages/ReceiptPage.tsx` + `receipt.css` + `shared.css`  
> Product: ABTA member receipt · green+gold · printable · mobile LIFF · status clarity · WCAG AA  
> Prior: 25/40 · P0=1 · P1=3 (2026-07-27) → **this re-run after harden/WCAG fixes**  
> Date: 2026-07-27 (re-critique)

---

## สรุปผู้บริหาร / Executive summary

**คะแนนสุขภาพดีไซน์: 30/40 (Good)** — แก้ P0 เดิมได้: watermark แบบร่าง, บล็อกปุ่มพิมพ์เมื่อ `rejected`, แสดง `rejectReason`, WCAG (fineprint / focus / reduced-motion / SR loading), และ CTA ใน error — เหลือเรื่องลำดับชั้นหลักฐาน + ช่องโหว่พิมพ์ผ่านเบราว์เซอร์

| | TH | EN |
|---|----|----|
| **P0** | 0 | Prior trust/print P0 resolved |
| **P1** | 2 | Browser print bypass on rejected · evidence hierarchy still fragmented |
| **Delta** | +5 | 25 → **30**/40 |
| **Top 3** | ดูด้านล่าง | See below |

### Top 3 remaining

1. **[P1]** `rejected` บล็อกปุ่มพิมพ์แล้ว แต่ **Ctrl+P / เมนูพิมพ์ของเบราว์เซอร์ยังพิมพ์ได้** — ยังมีตารางยอดเงิน + โครงเอกสาร; พึ่ง watermark «ไม่ผ่าน»  
2. **[P1]** คำถาม «ใช้เป็นหลักฐานได้ไหม» ยังกระจายใน badge + intro + status row + notice — ไม่มีแถบคำตอบเดียวด้านบน  
3. **[P2]** ใบเสร็จ `official` ยังมีบรรทัดเซ็นว่างบน LIFF — ทำให้คิดว่าเอกสารไม่สมบูรณ์

**Out of scope / not a bug:** ข้อมูลบัญชีธนาคารว่างโดยตั้งใจ — ไม่รายงานเป็น defect บนหน้านี้ (และหน้านี้ไม่มีฟิลด์บัญชีอยู่แล้ว)

---

## Fixed since prior (verified in source)

| Prior ID | Status | Evidence |
|----------|--------|----------|
| R1 watermark + rejected notice + `rejectReason` | ✅ | `.rcpt-watermark`, `rcpt-notice--danger`, `data.rejectReason` |
| R2 print policy | ✅ partial | UI: blocked span for `rejected`; draft CTA «พิมพ์แบบร่าง (มีลายน้ำ)»; **Ctrl+P still open** |
| R3 fineprint contrast | ✅ | `color: var(--page-muted)` (no `#8a9a92`) |
| R4 `:focus-visible` | ✅ | toolbar link, print btn, error btns |
| R5 `prefers-reduced-motion` | ✅ | rise/shimmer disabled |
| R6 skeleton live region | ✅ | `aria-live="polite"` + «กำลังโหลดใบเสร็จ» |
| R7 error CTAs | ✅ | «ลองใหม่» + «กลับไปสถานะสมาชิก» |
| R10 signature only when official | ✅ | non-official → `.rcpt-system-note` |

---

## ตารางฮิวริสติก / Heuristics (Nielsen 0–4)

| # | Heuristic | คะแนน | ปัญหาหลัก (TH) | Key issue (EN) |
|---|-----------|-------|----------------|----------------|
| 1 | Visibility of System Status | 4 | watermark + notice ครบทุก key รวม rejected; SR โหลดได้ | Status visible screen+print; live loading |
| 2 | Match System / Real World | 3 | หัวข้อ/intro แยกตัวจริง·ร่าง·ไม่ผ่านดี; เซ็นว่างบน official ยังงง | Title/intro match states; empty official sig lines |
| 3 | User Control and Freedom | 3 | error มีทางออก; พิมพ์ rejected บล็อกใน UI แต่ไม่บล็อกเบราว์เซอร์ | Error exits OK; browser print bypass |
| 4 | Consistency and Standards | 3 | focus/reduced-motion สอดคล้อง sibling; token drift ยังมี | A11y aligned; design-token drift remains |
| 5 | Error Prevention | 3 | watermark + บล็อกปุ่ม; Ctrl+P ยังพิมพ์ rejected ได้ | Strong UI guards; OS print still works |
| 6 | Recognition Rather Than Recall | 3 | intro/fineprint อธิบายดีขึ้น; คำ badge ยังต้องเรียนรู้ | Better copy; badge vocab still learned |
| 7 | Flexibility and Efficiency | 2 | พิมพ์คลิกเดียว; ไม่มีคัดลอกเลขที่ / แชร์ | One-click print; no copy/share |
| 8 | Aesthetic and Minimalist Design | 3 | แผ่นสะอาด; section title uppercase ยังเป็น AI tell | Clean sheet; uppercase eyebrows remain |
| 9 | Error Recovery | 3 | ลองใหม่ + กลับสถานะ; ยังไม่มีลิงก์ LINE OA ตรง | Retry+back; LINE OA still prose-only |
| 10 | Help and Documentation | 3 | notice + เหตุผลปฏิเสธ + fineprint อ่านได้ | Notices + rejectReason + AA fineprint |
| **รวม** | | **30/40** | **Good — พื้นฐานน่าเชื่อถือขึ้นชัด; เหลือ polish หลักฐาน/พิมพ์** | **Good — trust baseline fixed; hierarchy/print polish left** |

---

## AI slop / Anti-patterns

### ประเมิน LLM (TH)

ยัง**ไม่**หลุดไป SaaS-cream / purple glow — เขียว+ทอง + แผ่นเอกสารยังพกความน่าเชื่อถือสมาคมได้ดีหลังแก้ หัวข้อเปลี่ยนตามสถานะ («แบบร่าง» / «เอกสารสถานะการชำระเงิน») และ system-note แทนเซ็นว่างบน non-official ช่วยลดกลิ่น “เอกสารปลอม”

จุดที่ยังเหลือ:
- **Uppercase tracked `.rcpt-section-title`** — eyebrow grammar; ภาษาไทยไม่ต้องการ uppercase
- **Page-load rise** — มี reduced-motion แล้ว แต่ยังเป็น decorative load choreography (product register ชอบน้อย)
- ไม่มี gradient text / side-stripe / glass / hero-metric / `999px` pill — ผ่าน absolute bans; pill เดิมแก้เป็น `12px` แล้ว

### Deterministic scan (EN)

| Scope | Exit | Findings |
|-------|------|----------|
| `ReceiptPage.tsx` only | 0 | **0** — clean |
| + `receipt.css` + `shared.css` | 2 | **39** advisory |

| Antipattern | Count | Notes |
|-------------|------:|-------|
| `design-system-color` | 19 | Badge/notice/table chrome hex drift (expected for semantic tints) |
| `design-system-font-size` | 19 | Document density sizes off DESIGN.md ramp |
| `design-system-radius` | 1 | Sheet `4px` (document edge — intentional formal look) |

**Improved vs prior:** `999px` pill **gone**; `#8a9a92` fineprint **gone**; findings 41 → **39**.

**False positives / soft noise:** Most color/font advisories are formal-doc chrome. Prioritize tokenizing badge/notice ramps later (`extract`), not blocking ship.

**Browser overlay:** ไม่รัน live inject ใน degraded single-context — ไม่มี user-visible overlay (LIFF/auth-gated `/receipt` ก็ไม่เหมาะกับ inject เปล่าๆ)

---

## Cognitive load / ภาระทางปัญญา

| Checklist item | Pass? | Note |
|----------------|:-----:|------|
| Single focus | ✅ | อ่าน/พิมพ์ใบเสร็จ |
| Chunking ≤4 | ✅ | Fields / table / status |
| Grouping | ✅ | Sections + notices |
| Visual hierarchy | ❌ | ยังไม่มี hero คำตอบเดียวเรื่องหลักฐาน; badge+row+notice แย่งน้ำหนัก |
| One thing at a time | ✅ | |
| Minimal choices ≤4 | ✅ | back + print (หรือ blocked) |
| Working memory | ⚠️ | ดีขึ้นจาก intro/watermark แต่คำ badge ยังต้องแมป |
| Progressive disclosure | ✅ | Notices ตาม key |

**Failures: 1–2 → low–moderate** (ดีขึ้นจาก prior 2 failures ชัด)

---

## Personas

### Casey — Distracted mobile (LIFF)

- ปุ่มพิมพ์ยังอยู่ toolbar บน — นอก thumb zone  
- Draft CTA ชัดว่ามีลายน้ำ — ลดความเสี่ยงพิมพ์โดยไม่ตั้งใจ  
- Rejected: เห็น «พิมพ์ไม่ได้» ทันที — ดี

### Jordan — First-timer

- หัวข้อ/intro แยกสถานะช่วยมาก  
- `rejectReason` ทำให้รู้ว่าต้องทำอะไรต่อ (ถ้ามีเหตุผล)  
- Error มีลองใหม่ + กลับสถานะ — ไม่ตันแล้ว  
- Official เซ็นว่างยังอาจคิดว่าต้องประทับตราเอง

### Sam — Accessibility-dependent

- `:focus-visible`, reduced-motion, fineprint `--page-muted`, skeleton `aria-live` — ผ่านเกณฑ์ prior P1  
- Watermark เป็น `aria-hidden` แต่ `aria-label` บน article สื่อสถานะ — โอเค  
- Blocked print เป็น `<span>` ไม่ใช่ปุ่มปลอม — ดี

### สมาชิก ABTA (project) — หลักฐานที่เชื่อถือได้

- Non-official มี watermark + copy ชัด — ความเสี่ยงชื่อเสียงลดลงมาก  
- Rejected ยังพิมพ์ผ่าน Ctrl+P ได้ → เหลือช่องโหว่เล็กแต่จริง

---

## What's working / จุดแข็ง

1. **Trust gates หลังแก้** — watermark + หัวข้อสถานะ + system-note + บล็อกพิมพ์ rejected ใน UI  
2. **WCAG baseline** — contrast fineprint, focus rings, reduced motion, SR loading  
3. **Error ไม่ตัน** — retry + กลับ `/status` พร้อม token ใน query

---

## Priority issues (P0–P3)

### [P1] Rejected ยังพิมพ์ได้ผ่านเบราว์เซอร์ (Ctrl+P)

| | |
|--|--|
| **What (TH)** | UI แสดง «พิมพ์ไม่ได้ — ไม่ผ่าน» แต่ `@media print` ยังเรนเดอร์แผ่นเอกสารได้เมื่อผู้ใช้สั่งพิมพ์จากเบราว์เซอร์ |
| **Why** | PDF ที่พิมพ์จากเมนูระบบอาจถูกยื่นเป็นหลักฐานแม้มี watermark — ลดความชัดของนโยบาย «ห้ามพิมพ์» |
| **Fix** | (A) `@media print` ซ่อนเนื้อหา / แสดงเฉพาะหน้า «เอกสารนี้พิมพ์ไม่ได้» เมื่อ `rejected` หรือ (B) `beforeprint` handler ยกเลิก/แจ้งเตือน — อย่างน้อยให้ print stylesheet ดึง watermark ชัดและตัดตารางยอดถ้า policy เข้ม |
| **Command** | `/impeccable harden` |

### [P1] ลำดับชั้น «ใช้เป็นหลักฐานได้ไหม» ยังไม่เป็นคำตอบเดียว

| | |
|--|--|
| **What** | badge + intro + `rcpt-status-row` + notice ซ้ำความหมายโดยไม่ยกแถบสรุปด้านบนใต้หัวเอกสาร |
| **Why** | Product principle = สถานะชัดก่อนสวย — คำถามแรกของสมาชิกคือใช้เป็นหลักฐานได้หรือไม่ |
| **Fix** | Status strip เดียว: «ใช้เป็นหลักฐานได้» / «รอตรวจ — ยังใช้ไม่ได้» / «ไม่ผ่าน» ใต้ badge; ยอดรวมเน้นหลังตาราง |
| **Command** | `/impeccable layout` + `/impeccable clarify` |

### [P2] ลายเซ็นว่างบนใบเสร็จ official (LIFF)

| | |
|--|--|
| **What** | `rcpt-foot` สองคอลัมน์เซ็นว่างเฉพาะเมื่อ `official` |
| **Why** | บนมือถือดิจิทัลดูเหมือนเอกสารไม่ครบ |
| **Fix** | บนจอ: «ออกโดยระบบสมาชิก ABTA» + เลขอ้างอิง; เก็บเส้นเซ็นเฉพาะ `@media print` ถ้าจำเป็นทางกฎหมาย |
| **Command** | `/impeccable distill` |

### [P2] Section titles แบบ uppercase eyebrow

| | |
|--|--|
| **What** | `.rcpt-section-title { text-transform: uppercase; letter-spacing: 0.08em }` |
| **Why** | AI grammar; ไทยไม่ต้องการ uppercase |
| **Fix** | Sentence case น้ำหนัก 700 สีเขียวลึก ไม่ track กว้าง |
| **Command** | `/impeccable quieter` / `/impeccable typeset` |

### [P2] ปุ่มพิมพ์อยู่นอก thumb zone

| | |
|--|--|
| **What** | Print CTA บน toolbar |
| **Why** | Casey มือเดียวถึงยากบนจอสูง |
| **Fix** | Sticky secondary print ที่ล่างบน mobile (ซ่อนตอน print) |
| **Command** | `/impeccable adapt` |

### [P3] ไม่มีคัดลอกเลขที่ใบเสร็จ

| | |
|--|--|
| **What** | เลขที่อยู่ใน `<dd>` อย่างเดียว |
| **Fix** | ปุ่มคัดลอกเล็กใน meta |
| **Command** | `/impeccable delight` |

### [P3] Design-system drift (39 advisories)

| | |
|--|--|
| **What** | Badge/notice hex + font-size นอก ramp |
| **Fix** | Semantic tokens ใน `shared.css` + DESIGN.md |
| **Command** | `/impeccable extract` / `/impeccable document` |

---

## Emotional journey

| Moment | Now | Target |
|--------|-----|--------|
| เปิดจาก LINE | เขียวสมาคม → องค์กร | คงไว้ |
| เห็นสถานะ | watermark + badge ชัดขึ้นมาก | แถบเดียว «ใช้เป็นหลักฐานได้ไหม» |
| พิมพ์ PDF | official ชัด; draft มีลายน้ำ; rejected บล็อกใน UI | rejected บล็อกทั้งเบราว์เซอร์ |
| Error | มีทางออก | คงไว้ (+ LINE OA link ถ้ามี) |
| Peak-end | fineprint อ่านได้ + system-note | จบด้วยความมั่นใจ + เลขที่คัดลอกได้ |

---

## Detector summary (for fix agents)

```text
node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/ReceiptPage.tsx
→ [] (exit 0)

node .cursor/skills/impeccable/scripts/detect.mjs --json \
  apps/web/src/pages/ReceiptPage.tsx \
  apps/web/src/pages/receipt.css \
  apps/web/src/pages/shared.css
→ 39 findings (exit 2): color 19 · font-size 19 · radius 1 (all advisory)
```

Hotspots remaining in `receipt.css`:
- L119 `border-radius: 4px` (sheet — formal; only radius advisory)
- L263–269 uppercase section titles
- Badge/notice literal palettes L210–231, L376–390

Manual remaining (not in detector):
- Ctrl+P bypass for `rejected`
- Evidence hierarchy strip missing
- Official empty signature on screen

---

## Fix backlog (ordered)

| Pri | ID | Action | Files | Command |
|----:|----|--------|-------|---------|
| P1 | R13 | Block or replace print output when `rejected` (print CSS / beforeprint) | `ReceiptPage.tsx`, `receipt.css` | harden |
| P1 | R8 | Top evidence strip «ใช้เป็นหลักฐานได้ไหม»; emphasize total | `ReceiptPage.tsx`, `receipt.css` | layout, clarify |
| P2 | R10b | Official: system attestation on screen; signature lines print-only | `ReceiptPage.tsx`, `receipt.css` | distill |
| P2 | R9 | Drop uppercase section titles | `receipt.css` | quieter, typeset |
| P2 | R14 | Mobile thumb-zone print control | `receipt.css` | adapt |
| P3 | R11 | Copy receipt number | `ReceiptPage.tsx` | delight |
| P3 | R12 | Tokenize badge/notice colors | `shared.css`, `DESIGN.md`, `receipt.css` | extract, document |

**Suggested sequence:** `harden` (R13) → `layout`+`clarify` (R8) → `distill`/`quieter` (R10b, R9) → optional `adapt`/`delight`/`extract`

---

## Questions for product (optional)

1. `rejected` ควร **ห้ามพิมพ์ทั้งเบราว์เซอร์** หรือพอแค่ watermark + บล็อกปุ่ม UI?  
2. ลายเซ็นว่างบน `official` จำเป็นบน PDF ทางกฎหมายหรือเอาออกจากหน้าจอ LIFF ได้?  
3. ต้องการแถบสรุปหลักฐานด้านบน หรือพอด้วย watermark + intro ปัจจุบัน?

---

## Meta

| Field | Value |
|-------|-------|
| Route | `/receipt` |
| Sources | `apps/web/src/pages/ReceiptPage.tsx`, `receipt.css`, `shared.css` |
| Score | **30/40** Good (was 25 Acceptable) |
| P0 / P1 | **0 / 2** |
| Personas | Casey, Jordan, Sam, สมาชิก ABTA |
| Snapshot slug | `apps-web-src-pages-receiptpage-tsx` |
| Bank empty | **Not a bug** (intentional / N/A on this page) |
