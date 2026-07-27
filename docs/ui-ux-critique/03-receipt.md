# UX/UI Critique — `/receipt`

> ⚠️ **DEGRADED: single-context** — รันภายใต้ parent subagent จึงไม่สามารถ spawn Assessment A/B แยกได้ตาม `critique.md` (nesting ถูกห้าม)  
> Method: single-context inline · Target: `apps/web/src/pages/ReceiptPage.tsx` + `receipt.css` + `shared.css`  
> Product: ABTA member receipt · green+gold · printable · mobile LIFF · status clarity · WCAG AA  
> Date: 2026-07-27

---

## สรุปผู้บริหาร / Executive summary

**คะแนนสุขภาพดีไซน์: 25/40 (Acceptable)** — พื้นฐานเอกสารใบเสร็จดี (โครงกระดาษ, badge สถานะ, print A4) แต่ยังไม่ผ่านเกณฑ์ “น่าเชื่อถือ + สถานะชัด + WCAG AA” ของสมาคมอย่างเต็มที่

| | TH | EN |
|---|----|----|
| **P0** | 1 | Non-official/rejected/draft still looks like a formal paid receipt |
| **P1** | 3 | WCAG gaps · error dead-end · unused `rejectReason` / weak rejected copy |
| **Top 3** | ดูด้านล่าง | See below |

### Top 3 issues

1. **[P0]** ใบเสร็จที่ไม่ใช่ตัวจริง (ยังไม่ออก / ชั่วคราว / รอตรวจ / **ไม่ผ่าน**) ยังมีลายเซ็นว่าง + ปุ่มพิมพ์ ทำให้ดูเป็นหลักฐานการชำระเงินจริง — โดยเฉพาะ `rejected` ไม่มี notice เฉพาะ และ API มี `rejectReason` แต่ไม่ได้แสดง  
2. **[P1]** WCAG AA: fineprint `#8a9a92` ตัดกันต่ำ · ไม่มี `:focus-visible` บนลิงก์/ปุ่มพิมพ์ · ไม่มี `prefers-reduced-motion` · skeleton มี `aria-busy` แต่ไม่มี `aria-live`  
3. **[P1]** สถานะ error เป็นทางตัน — ไม่มีปุ่มลองใหม่ / กลับสถานะสมาชิก / เปิด LINE OA

---

## ตารางฮิวริสติก / Heuristics (Nielsen 0–4)

| # | Heuristic | คะแนน | ปัญหาหลัก (TH) | Key issue (EN) |
|---|-----------|-------|----------------|----------------|
| 1 | Visibility of System Status | 3 | มี skeleton + badge + notice แต่ SR ไม่รู้ว่ากำลังโหลด; `rejected` ไม่มี notice | Skeleton/badges OK; no live region; rejected lacks notice |
| 2 | Match System / Real World | 3 | ภาษาใบเสร็จไทยดี; บรรทัดเซ็นว่างบน LIFF ดิจิทัลทำให้สับสน | Formal Thai copy good; empty signature lines confuse digital users |
| 3 | User Control and Freedom | 2 | มีกลับสถานะ + พิมพ์; error ไม่มีทางออก | Back+print OK; error state traps user |
| 4 | Consistency and Standards | 3 | เขียว+ทองสอดคล้อง status/register; focus/reduced-motion ไม่ครบเหมือน sibling | Brand shell consistent; a11y patterns lag status/register |
| 5 | Error Prevention | 2 | พิมพ์แบบร่าง/ไม่ผ่านได้โดยไม่ watermark แรงหรือบล็อก | Draft/rejected remain fully printable as formal sheet |
| 6 | Recognition Rather Than Recall | 3 | ป้ายกำกับชัด; คำย่อสถานะ (ตัวจริง/ชั่วคราว) ต้องเรียนรู้ครั้งแรก | Labels clear; badge vocabulary needs first-time learning |
| 7 | Flexibility and Efficiency | 2 | พิมพ์/PDF คลิกเดียว; ไม่มีคัดลอกเลขที่ / แชร์ | One-click print; no copy receipt # / share |
| 8 | Aesthetic and Minimalist Design | 3 | แผ่นใบเสร็จสะอาด; section title แบบ uppercase eyebrow + pill CTA เป็น AI tell เบาๆ | Clean sheet; uppercase eyebrows + pill CTA mild AI tells |
| 9 | Error Recovery | 2 | ข้อความ error ชัดแต่ไม่มี CTA ฟื้นตัว | Clear Thai errors without recovery CTAs |
| 10 | Help and Documentation | 2 | notice ช่วยบางสถานะ; fineprint อ่านยาก; ไม่มีคำอธิบาย “ใบเสร็จชั่วคราว” แบบลึก | Notices help some states; weak fineprint contrast; shallow temp help |
| **รวม** | | **25/40** | **Acceptable — ต้องแก้ก่อนปล่อยใช้งานจริง** | **Acceptable — fix before trusting production receipts** |

---

## AI slop / Anti-patterns

### ประเมิน LLM (TH)

หน้านี้**ไม่ดูเป็น SaaS-cream / purple glow** — เขียวสมาคม + ทองและแผ่นขาวแบบเอกสารจริงช่วยเรื่องความน่าเชื่อถือได้ดี โครงสร้าง “หัวเอกสาร → ข้อมูลสมาชิก → ตารางรายการ → ลายเซ็น” ตรงกับโลกจริงของใบเสร็จสมาคม

จุดที่ยังมีกลิ่น AI/product-slop เบาๆ:
- **Uppercase tracked section titles** (`.rcpt-section-title`) — eyebrow pattern ซ้ำทุก section
- **Pill CTA** (`border-radius: 999px` บน `.rcpt-print-btn`) — ขัดกับ radius ใน DESIGN.md (`8–16px`) และเป็น rounded-full ที่ detector จับได้
- **Decorative page-load rise + shimmer** โดยไม่มี `prefers-reduced-motion` — product register ไม่ต้องการ choreography
- ไม่มี gradient text / side-stripe / glassmorphism / hero-metric — ผ่าน absolute bans

### Deterministic scan (EN)

| Scope | Exit | Findings |
|-------|------|----------|
| `ReceiptPage.tsx` only (per request) | 0 | **0** — clean markup scan |
| + `receipt.css` + `shared.css` | 2 | **41** advisory |

| Antipattern | Count | Notes |
|-------------|------:|-------|
| `design-system-color` | 19 | Literal hex/rgba drift (badges, notice, fineprint `#8a9a92`, shadows) |
| `design-system-font-size` | 15 | Many rem sizes off DESIGN.md ramp |
| `design-system-radius` | 7 | Includes **`999px` pill** and `4px`/`6px`/`10px` vs documented `8/12/14/16` |

**False positives / soft noise:** Many color/font advisories are expected for a formal document surface (table chrome, semantic badge tints). Prioritize: **`#8a9a92` fineprint (contrast)**, **`999px` pill**, missing tokens for warn/danger badge ramps, and align radius to DESIGN.md.

**Browser overlay:** ไม่รัน live inject ใน degraded single-context นี้ — ไม่มี user-visible overlay

---

## Cognitive load / ภาระทางปัญญา

| Checklist item | Pass? | Note |
|----------------|:-----:|------|
| Single focus | ✅ | Primary task = อ่าน/พิมพ์ใบเสร็จ |
| Chunking ≤4 | ✅ | Fields / table / status แยกกลุ่ม |
| Grouping | ✅ | Sections + status row |
| Visual hierarchy | ❌ | ยอดรวมไม่ใช่ hero ของหน้า; badge กับ status row แย่งน้ำหนัก |
| One thing at a time | ✅ | |
| Minimal choices ≤4 | ✅ | 2 actions (back, print) |
| Working memory | ❌ | ต้องเข้าใจคำว่า ตัวจริง/ชั่วคราว/รอตรวจ/ไม่ผ่าน |
| Progressive disclosure | ✅ | Notices เฉพาะบาง key |

**Failures: 2 → moderate cognitive load**

Decision points: ไม่เกิน 4 ตัวเลือก — ดีสำหรับ LIFF มือถือ

---

## Personas

เลือกตาม surface: **เอกสาร/หลักฐานการชำระ + LIFF มือถือ** → Casey, Jordan, Sam (+ project: สมาชิก ABTA)

### Casey — Distracted mobile (LIFF)

- ปุ่มพิมพ์อยู่บน toolbar (top) — นอก thumb zone บนจอสูง  
- ไม่มี state persistence ชัดเมื่อสลับแอป (พึ่ง URL params — โอเคถ้าเปิดจาก LINE ใหม่)  
- Touch: ปุ่มพิมพ์ padding พอใช้ แต่ไม่มี focus/press feedback ที่ชัดบน CSS

### Jordan — First-timer

- คำว่า «ตัวจริง / ชั่วคราว / รอตรวจ» ไม่มีคำอธิบายสั้นๆ ครั้งแรก  
- บรรทัดเซ็นว่าง → อาจคิดว่าต้องไปประทับตราเอง  
- Error: «เปิดจาก LINE OA» แต่ไม่มีปุ่ม/ลิงก์พาไป

### Sam — Accessibility-dependent

- ไม่มี `:focus-visible` บน `.rcpt-toolbar__link` / `.rcpt-print-btn` (status หน้าอื่นมี)  
- Skeleton: `aria-busy` ไม่มี `aria-live` / ข้อความโหลด  
- Fineprint contrast ล้ม WCAG AA  
- Motion ไม่เคารพ `prefers-reduced-motion` (PRODUCT.md กำหนดไว้)

### สมาชิก ABTA (project) — ต้องการหลักฐานที่เชื่อถือได้

- พิมพ์ PDF แบบร่างแล้วยื่นเป็นหลักฐานได้โดย UI ไม่ขวางพอ → ความเสี่ยงชื่อเสียงสมาคม  
- `rejectReason` ใน `PublicStatus` ไม่ถูกใช้บนหน้านี้

---

## What's working / จุดแข็ง

1. **โครงใบเสร็จสมจริง** — `article` + header meta (เลขที่/วันที่) + ตาราง + tfoot รวมทั้งสิ้น + print `@page A4` ที่ตัด atmosphere/toolbar  
2. **สถานะบางส่วนชัด** — badge tones + notices สำหรับ `none` / `temp` / `pending_review` สอดคล้องหลัก «สถานะชัดก่อนสวย»  
3. **Identity เขียว+ทอง** — shell/atmosphere สอดคล้อง member pages อื่น ไม่หลุดไป SaaS เทา-น้ำเงิน

---

## Priority issues (P0–P3)

### [P0] เอกสารไม่เป็นทางการยังดูเป็นใบเสร็จตัวจริงที่พิมพ์ได้

| | |
|--|--|
| **What (TH)** | สถานะ `none` / `temp` / `pending_review` / **`rejected`** ยังแสดงแผ่น formal พร้อมลายเซ็นว่างและ CTA «พิมพ์ / บันทึก PDF» โดย `rejected` ไม่มี `.rcpt-notice` และไม่โชว์ `rejectReason` |
| **Why** | สมาชิก (และบุคคลภายนอก) อาจใช้ PDF เป็นหลักฐานการชำระเงินทั้งที่ยังไม่ผ่าน — ทำลายความน่าเชื่อถือสมาคม |
| **Fix** | (1) Notice เฉพาะ `rejected` + แสดง `rejectReason` (2) Watermark/แถบ «ไม่ใช่ใบเสร็จตัวจริง» บนหน้าจอ+พิมพ์ สำหรับ non-official (3) ซ่อนหรือปรับ copy ปุ่มพิมพ์ / disable signature block เมื่อไม่ใช่ `official` (4) พิจารณาบล็อก print หรือ confirm ก่อนพิมพ์เมื่อไม่ใช่ตัวจริง |
| **Command** | `/impeccable harden` + `/impeccable clarify` |

### [P1] WCAG AA ยังไม่ครบ (contrast · focus · reduced motion · SR loading)

| | |
|--|--|
| **What** | `.rcpt-fineprint` ใช้ `#8a9a92` บนขาว (~≤3:1) · ไม่มี `:focus-visible` · ไม่มี `@media (prefers-reduced-motion: reduce)` สำหรับ `rcpt-rise`/`rcpt-shimmer` · skeleton ไม่ announce |
| **Why** | PRODUCT ตั้งเป้า WCAG 2.1 AA และ reduced motion; LIFF มีผู้ใช้สายตา/มอเตอร์หลากหลาย |
| **Fix** | เปลี่ยน fineprint เป็น `--page-muted` (`#4a5c52`) · คัดลอก focus ring จาก `status.css` · เพิ่ม reduced-motion block · `aria-live="polite"` + ข้อความ «กำลังโหลดใบเสร็จ» |
| **Command** | `/impeccable audit` → `/impeccable polish` |

### [P1] Error state เป็นทางตัน

| | |
|--|--|
| **What** | `ReceiptError` มี title/detail อย่างเดียว ไม่มีลองใหม่ / ลิงก์กลับ `/status` / ลิงก์ LINE |
| **Why** | สมาชิกใน LINE ที่ลิงก์หมดอายุจะค้าง ไม่รู้จะทำอะไรต่อ |
| **Fix** | ปุ่ม «ลองใหม่» (reload) + «กลับไปสถานะสมาชิก» (เมื่อมี `m`) + คำแนะนำเปิดจาก LINE OA ที่ actionable |
| **Command** | `/impeccable harden` + `/impeccable clarify` |

### [P1] ลำดับชั้นยอดเงินและความหมายสถานะยังอ่อน

| | |
|--|--|
| **What** | ยอดรวมอยู่ในตารางเท่านั้น; badge + `rcpt-status-row` + notice ซ้ำซ้อนโดยไม่ยก «หลักฐานนี้ใช้ได้อยู่หรือยัง» เป็นคำตอบเดียวบนสุด |
| **Why** | หลัก product = สถานะชัดก่อนสวย — คำถามแรกของสมาชิกคือใช้เป็นหลักฐานได้ไหม ไม่ใช่รูปแบบตาราง |
| **Fix** | Status strip ด้านบนใต้ badge: ใช้ได้เป็นหลักฐาน / รอตรวจ / ไม่ผ่าน — ยอดรวมใหญ่ขึ้นหลังตารางหรือเป็น summary callout |
| **Command** | `/impeccable layout` + `/impeccable clarify` |

### [P2] Section titles แบบ uppercase eyebrow + pill print button

| | |
|--|--|
| **What** | `.rcpt-section-title { text-transform: uppercase; letter-spacing: 0.08em }` และ `border-radius: 999px` |
| **Why** | AI grammar tell; ขัด DESIGN.md radius; ภาษาไทยไม่ต้องการ uppercase |
| **Fix** | ใช้ sentence case น้ำหนัก 700 สีเขียวลึก; radius `12px`/`14px` ตาม token |
| **Command** | `/impeccable quieter` หรือ `/impeccable typeset` |

### [P2] ลายเซ็นว่างบนเอกสารดิจิทัล

| | |
|--|--|
| **What** | `rcpt-foot` สองคอลัมน์เซ็นว่างเสมอ รวมถึงบนจอ LIFF |
| **Why** | ทำให้คิดว่าเอกสารไม่สมบูรณ์ หรือต้องไปประทับตราเอง |
| **Fix** | โชว์ลายเซ็น/ตราเฉพาะ `official` หรือแทนด้วยข้อความ «ออกโดยระบบสมาชิก ABTA» + เลขอ้างอิง; เก็บเส้นเซ็นเฉพาะโหมดพิมพ์ถ้าจำเป็นทางกฎหมาย |
| **Command** | `/impeccable distill` |

### [P3] ไม่มีคัดลอกเลขที่ใบเสร็จ / แชร์

| | |
|--|--|
| **What** | เลขที่อยู่ใน `<dd>` อย่างเดียว |
| **Why** | Power/mobile user อยากส่งเลขให้เหรัญญิกเร็วๆ |
| **Fix** | ปุ่มคัดลอกเลขที่ (เล็ก, secondary) ใน meta |
| **Command** | `/impeccable delight` (เล็กน้อย) |

### [P3] Design-system drift จำนวนมาก (detector advisory)

| | |
|--|--|
| **What** | 41 advisories — สี badge/notice ยังไม่อยู่ใน DESIGN.md |
| **Why** | Token drift ทำให้ status/receipt/admin เพี้ยนระยะยาว |
| **Fix** | เพิ่ม semantic tokens (`--page-warn-*`, `--page-danger-*`, receipt chrome) ใน `shared.css` + DESIGN.md แล้วแทน hex |
| **Command** | `/impeccable extract` หรือ `/impeccable document` |

---

## Emotional journey

| Moment | Now | Target |
|--------|-----|--------|
| เปิดจาก LINE | เขียวสมาคม → รู้สึกองค์กร | คงไว้ |
| เห็น badge | รู้สถานะคร่าวๆ | ต้องรู้ทันทีว่า «ใช้เป็นหลักฐานได้ไหม» |
| พิมพ์ PDF | ง่าย แต่เสี่ยงพิมพ์ของปลอม/ร่าง | มั่นใจว่าพิมพ์ได้เฉพาะที่ถูกต้อง หรือมี watermark ชัด |
| Error | ตกใจ → ตัน | ฟื้นตัวได้ใน 1 tap |
| Peak-end | จบที่ fineprint อ่านยาก + เซ็นว่าง | จบด้วยความมั่นใจ + เลขที่ชัด |

---

## Detector summary (for fix agents)

```text
# Requested
node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/ReceiptPage.tsx
→ [] (exit 0)

# Full surface (recommended for polish)
node .cursor/skills/impeccable/scripts/detect.mjs --json \
  apps/web/src/pages/ReceiptPage.tsx \
  apps/web/src/pages/receipt.css \
  apps/web/src/pages/shared.css
→ 41 findings (exit 2): color 19 · font-size 15 · radius 7 (all advisory)
```

Hotspots in `receipt.css`:
- L72 `border-radius: 999px` (print btn)
- L350 `#8a9a92` fineprint (contrast + undocumented)
- L36–41 / L364–370 motion without reduced-motion
- Badge/notice literal palettes L151–174, L317–326

Manual (not in detector) but required for AA:
- Missing `:focus-visible` on interactive controls
- Missing rejected notice + unused `data.rejectReason`
- Error CTAs absent in `ReceiptError`

---

## Fix backlog (ordered)

| Pri | ID | Action | Files | Command |
|----:|----|--------|-------|---------|
| P0 | R1 | Rejected notice + `rejectReason`; non-official watermark (screen+print); soften/hide signature when not official | `ReceiptPage.tsx`, `receipt.css` | harden, clarify |
| P0 | R2 | Print policy: confirm or label CTA when `receiptStatusKey !== "official"` | `ReceiptPage.tsx` | harden |
| P1 | R3 | Fineprint → `--page-muted` (≥4.5:1) | `receipt.css` | audit, polish |
| P1 | R4 | `:focus-visible` on toolbar link + print btn (mirror status) | `receipt.css` | audit |
| P1 | R5 | `prefers-reduced-motion` for rise/shimmer | `receipt.css` | audit |
| P1 | R6 | Skeleton `aria-live` + loading text; optionally `role="status"` | `ReceiptPage.tsx` | harden |
| P1 | R7 | Error: Retry + back to status + clearer LINE recovery | `ReceiptPage.tsx`, `receipt.css` | harden, clarify |
| P1 | R8 | Top “ใช้เป็นหลักฐานได้ไหม” strip; emphasize total | `ReceiptPage.tsx`, `receipt.css` | layout, clarify |
| P2 | R9 | Drop uppercase section titles; radius token on CTA | `receipt.css` | quieter, typeset |
| P2 | R10 | Signature block only when official / print-legal | `ReceiptPage.tsx` | distill |
| P3 | R11 | Copy receipt number control | `ReceiptPage.tsx` | delight |
| P3 | R12 | Tokenize badge/notice colors into `shared.css` + DESIGN.md | `shared.css`, `DESIGN.md`, `receipt.css` | extract, document |

**Suggested sequence for fix agents:** `harden` (R1–R2, R6–R7) → `audit`/`polish` (R3–R5) → `layout`+`clarify` (R8) → `quieter`/`distill` (R9–R10) → optional delight/extract

---

## Questions for product (optional)

1. ใบเสร็จที่ไม่ใช่ `official` ควร **พิมพ์ได้พร้อม watermark** หรือ **ห้ามพิมพ์** เลย?  
2. ลายเซ็น/ตราประทับว่างจำเป็นทางกฎหมายบน PDF หรือเอาออกจาก LIFF ได้?  
3. โทนหน้าใบเสร็จควรมั่นคงแบบเอกสารราชการ หรืออุ่นแบบสมาคมมากกว่านี้?

---

## Meta

| Field | Value |
|-------|-------|
| Route | `/receipt` |
| Sources | `apps/web/src/pages/ReceiptPage.tsx`, `receipt.css`, `shared.css` |
| Score | **25/40** Acceptable |
| P0 / P1 | **1 / 3** (plus related P1 rows in backlog) |
| Personas | Casey, Jordan, Sam, สมาชิก ABTA |
| Snapshot slug | `apps-web-src-pages-receiptpage-tsx` |
