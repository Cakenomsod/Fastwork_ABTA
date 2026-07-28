---
target: /register
total_score: 28
p0_count: 0
p1_count: 3
timestamp: 2026-07-27T15-05-22Z
slug: apps-web-src-pages-registerpage-tsx
---
# UI/UX Critique: Register (`/register`)

> Method: dual-agent (A: a5ee7712 · B: f8d170b0) · Detector: detect.mjs · Date: 2026-07-27 (re-critique after fixes)
> Score: 28/40 · P0: 0 · P1: 3
> Prior: 26/40 · Δ +2 · Bank empty = accepted product constraint (not scored as defect)

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์

| # | Heuristic | คะแนน | ประเด็นหลัก |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 3 | loading / submitting / legacy steps / success ชัด · validation ฟิลด์ยังโผล่ตอน submit + ท้ายฟอร์ม |
| 2 | Match System / Real World | 3 | ภาษาไทยสมาคมดี · “Member ID” / “ขั้นตอนเดียว” ขัดกับฟอร์มยาว |
| 3 | User Control and Freedom | 3 | Confirm ย้อนกลับ + legacy back ดี · สลับโหมดล้างฟอร์มโดยไม่เตือน |
| 4 | Consistency and Standards | 2 | PaymentConfirmPanel / TransferBank ร่วมกันดี · phone label + แท็บโหมด ARIA อ่อน |
| 5 | Error Prevention | 3 | **↑** Confirm ก่อนส่ง + `!canPay` ปิดสลิป/submit · ล็อกหลัก 0 + ตรวจสลิป |
| 6 | Recognition Rather Than Recall | 3 | Confirm สรุปชื่อ/เบอร์/ค่าธรรมเนียม/สลิป · ฟิลด์เสริมยังโชว์ตลอด |
| 7 | Flexibility and Efficiency | 2 | paste เบอร์ + `?flow=legacy` · ช่องทีละหลักทำร้าย autofill |
| 8 | Aesthetic and Minimalist Design | 3 | เชลล์เขียว/ทองสมาคม · ฟอร์มใหม่ยังซ้อน callout + 6 ฟิลด์ส่วนบุคคล |
| 9 | Error Recovery | 3 | `errorCopy` ไทย + `role="alert"` · ยังท้ายฟอร์มบ่อย ไม่ focus ไปฟิลด์ผิด |
| 10 | Help and Documentation | 3 | **↑** hint เมื่อบัญชีว่าง + legacy info · ไม่มี help เชิงลึกกว่านั้น |
| **รวม** | | **28/40** | **Good** |

### ความประทับใจรวม

หลังแก้รอบก่อน หน้า Register แข็งขึ้นชัด: มี **PaymentConfirmPanel** (“ตรวจสอบก่อนส่ง”) และ **เกต `canPay`** (ซ่อนสลิป / ปิด CTA / hint เมื่อบัญชียังว่างตามเจตนา product owner) — ไม่นับบัญชีว่างเป็นบั๊กอีกต่อไป คะแนนขึ้นจาก 26 → 28 (Acceptable → Good) ช่องโหว่ที่เหลืออยู่ที่ฝั่งสมัครใหม่: ฟอร์มยาวหน้าเดียว, PhoneDigitInput a11y/autofill, และ error ท้ายฟอร์ม

### จุดแข็ง

1. **แยกโหมด + wizard legacy** — แท็บใหม่/เก่า, ขั้น 1→2→3 พร้อมยืนยันก่อนผูก LINE
2. **Confirm-before-submit (ใหม่)** — `onRequestConfirm` → `PaymentConfirmPanel` สรุปชื่อ เบอร์ ค่าธรรมเนียม พรีวิวสลิป + ย้อนกลับ
3. **เกตชำระเงินตรงไปตรงมาเมื่อบัญชีว่าง** — ไม่บังคับอัปโหลดสลิปเมื่อโอนไม่ได้ · copy สถานะชัดโดยไม่ invent ข้อมูลบัญชี

### ปัญหาเรียงตามความสำคัญ (P0–P3)

#### P0 — ไม่มี
บัญชีรับโอนว่างเป็น **ข้อจำกัดผลิตภัณฑ์ที่ยอมรับแล้ว** (ไม่ treat เป็น blocking bug)

#### P1 — ฟอร์มสมัครใหม่ยาวหน้าเดียว (ไม่มี progressive disclosure)
- **อะไร:** ส่วนบุคคล 6 ฟิลด์ + ค่าธรรมเนียม + ธนาคาร + (เมื่อจ่ายได้) สลิป + คำเตือน ในสกอร์ลเดียว · kicker “ขั้นตอนเดียว” · legacy มีขั้นแล้ว
- **ทำไมสำคัญ:** cognitive load สูงบน LIFF · ตรง anti-reference ใน PRODUCT.md
- **แก้ยังไง:** แยก ≥2 ขั้น (ข้อมูล → ชำระ/สลิป) หรือยุบอีเมล/ตึกไว้หลัง “ข้อมูลเพิ่มเติม”
- **คำสั่งที่แนะนำ:** `/impeccable distill /register`

#### P1 — PhoneDigitInput ผูก label ผิดใน legacy + autofill อ่อน
- **อะไร:** `aria-labelledby` ฮาร์ดโค้ด `reg-phone-label` ทั้งที่ legacy ใช้ `legacy-phone-label` · หลัก 2–10 ใช้ `autocomplete="one-time-code"`
- **ทำไมสำคัญ:** Sam ได้ label ผิด/ว่าง · Casey พิมพ์ช้าและเสีย phone autofill
- **แก้ยังไง:** ส่ง `aria-labelledby` เป็น prop · พิจารณา `tel` เดียวหรือ `tel-national` ทั้งกลุ่ม
- **คำสั่งที่แนะนำ:** `/impeccable audit /register`

#### P1 — Error โผล่ท้ายฟอร์ม ไม่ชิดฟิลด์ที่พลาด
- **อะไร:** `required_fields_missing` / `invalid_phone` อยู่ที่ `.reg-form-error` · `aria-invalid` เฉพาะเบอร์ · ไม่ `focus()` ฟิลด์แรกที่ผิด
- **ทำไมสำคัญ:** บนมือถือไม่รู้ว่าผิดตรงไหน → ส่งซ้ำหรือละทิ้ง
- **แก้ยังไง:** inline error ใต้ชื่อ/นามสกุล/เบอร์ · focus ฟิลด์แรกหลัง confirm/submit fail
- **คำสั่งที่แนะนำ:** `/impeccable clarify /register`

#### P2 — เมื่อ `!canPay` ยังเปิดฟอร์มยาวให้กรอก
- **อะไร:** ผู้ใช้กรอกครบแล้วเจอ CTA disabled + hint (informational ภายใต้ข้อจำกัดบัญชีว่าง)
- **ทำไมสำคัญ:** เสียแรงบน LINE ก่อนรู้ว่ายังสมัครผ่านระบบไม่ได้
- **แก้ยังไง:** นำด้วยสถานะ “ยังเปิดรับสมัครผ่านระบบไม่ได้” · เลื่อนฟอร์มยาวออกจนกว่า `canPay`
- **คำสั่งที่แนะนำ:** `/impeccable onboard /register`

#### P2 — ฟิลด์เบอร์ใน legacy บอกว่าช่วยตรวจสอบแต่ไม่ถูกส่ง API
- **อะไร:** hint “ใช้ช่วยตรวจสอบเท่านั้น” แต่ `searchLegacyMembers` / bind ไม่รับ phone
- **ทำไมสำคัญ:** copy หลอกลวง
- **แก้ยังไง:** ลบฟิลด์ หรือส่ง phone จริงแล้วอัปเดต hint
- **คำสั่งที่แนะนำ:** `/impeccable clarify /register`

### ธงแดงตาม Persona

**Jordan (First-Timer)**
- ต้องเลือกแท็บใหม่/เก่าก่อนเข้าใจว่าตัวเองอยู่กลุ่มไหน
- “ขั้นตอนเดียว” ขัดกับความยาวฟอร์ม
- สิทธิ์สมาชิกชั่วคราวหลังสำเร็จอาจยังไม่ชัด

**Casey (Mobile / LIFF)**
- ฟอร์มใหม่ยาว · CTA ท้ายหน้า · ช่องเบอร์ 10 ช่อง
- ไม่มี client draft ถ้าสลับไปแอพธนาคาร (ยกเว้น path resubmit จากเซิร์ฟเวอร์)

**Sam (a11y)**
- `PhoneDigitInput` ชี้ `reg-phone-label` พังใน legacy
- แท็บโหมดไม่มี `role="tab"` / `aria-selected`
- loading ยังไม่มี live region ชัดบน shell

**สมาชิก ABTA บน LINE**
- Confirm ก่อนส่ง/ผูก LINE สร้างความมั่นใจ (ดีขึ้นจากรอบก่อน)
- บัญชีว่างบล็อกเส้นทางเงินอย่างถูกต้องตามเจตนา — ยังเสี่ยงกรอกฟอร์มยาวก่อนพบว่ายังจ่ายไม่ได้

### ข้อสังเกตเล็กน้อย

- Detector `detect.mjs` → `[]` (exit 0)
- Browser overlay ข้าม: LIFF OAuth 400 (invalid `redirectUri` localhost) — ฟอร์มไม่โหลด
- `prefers-reduced-motion` ถูก knobs บน shell/ปุ่ม
- Resubmit + `rejectReason` ยังเป็นจุด recovery ที่แข็ง
- สลับโหมดล้างข้อมูลโดยไม่ confirm

### คำถามที่ควรคิด

1. ถ้าบัญชีว่างอีกหลายสัปดาห์ ควรปิด “สมัครใหม่” เป็น closed state แทนฟอร์มยาว + ปุ่ม disabled หรือไม่?
2. ทำไม legacy ได้ wizard 3 ขั้น แต่เส้นทางเงิน (สมัครใหม่) ยังเป็น “ขั้นตอนเดียว”?
3. ช่องเบอร์ 10 ช่องคุ้มค่าความถูกต้องมากกว่า autofill บนมือถือหรือยัง?
4. สลับแท็บโหมดควร confirm ก่อนล้างฟิลด์ที่พิมพ์ไว้หรือไม่?

### สถานะเทียบรอบก่อน

| ประเด็นเดิม | สถานะ |
|-------------|--------|
| P0 บัญชีว่าง + บังคับสลิป | **แก้/ยอมรับแล้ว** — เกต `canPay` · ไม่ re-P0 |
| P1 ฟอร์มใหม่ยาว | **ยังเปิด** |
| P1 PhoneDigitInput label/autofill | **ยังเปิด** |
| P1 error ท้ายฟอร์ม | **ยังเปิด** |
| P2 legacy phone ไม่ใช้ | **ยังเปิด** |
| Confirm ก่อนส่ง | **เพิ่มแล้ว — ให้เครดิต** (`PaymentConfirmPanel`) |

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading/submit/legacy/success clear; field validation late + footer |
| 2 | Match System / Real World | 3 | Strong Thai voice; “Member ID” / “ขั้นตอนเดียว” vs long form |
| 3 | User Control and Freedom | 3 | Confirm back + legacy back; mode switch wipes form without warn |
| 4 | Consistency and Standards | 2 | Shared payment components good; phone label + mode tabs ARIA weak |
| 5 | Error Prevention | 3 | **↑** Confirm panel + `!canPay` gates slip/submit; digit lock + slip checks |
| 6 | Recognition Rather Than Recall | 3 | Confirm summarizes fields; optionals always visible |
| 7 | Flexibility and Efficiency | 2 | Paste + `?flow=legacy`; per-digit boxes hurt tel autofill |
| 8 | Aesthetic and Minimalist Design | 3 | On-brand green/gold; new form still stacks callouts + 6 personal fields |
| 9 | Error Recovery | 3 | Actionable Thai `errorCopy` + `role="alert"`; often footer-only, no focus-to-field |
| 10 | Help and Documentation | 3 | **↑** Empty-bank hint + legacy info; no deeper task help |
| **Total** | | **28/40** | **Good** |

### Anti-Patterns Verdict

**LLM:** Passes product AI-slop visually — association green + gold, not generic SaaS. Absolute bans mostly avoided. Remaining product-strangeness: **10-box OTP-style phone** for a normal Thai mobile, and **long new-member form without progressive disclosure** (named PRODUCT anti-reference). Empty bank is an **accepted constraint**, not a defect.

**Deterministic scan:** `detect.mjs --json` on `RegisterPage.tsx` + `PhoneDigitInput.tsx` → `[]` (exit 0). No overlay (LIFF OAuth 400 on localhost `/register`).

### Overall Impression

Confirm-before-submit and honest payment gating lifted the page from Acceptable (26) to Good (28). Biggest remaining opportunity: split/collapse the new registration path to match the clarity already earned by the legacy wizard, then fix phone a11y/autofill and inline validation.

### What's Working

1. **Dual-mode IA** — New vs legacy; legacy 1→2→3 with bind confirm is the strongest flow.
2. **Confirm-before-submit (new)** — `PaymentConfirmPanel` with summary + slip preview + back.
3. **Honest empty-bank gating** — Slip hidden, CTA disabled, `NO_TRANSFER_ACCOUNT_SUBMIT_HINT` — status clear without inventing account data.

### Priority Issues

1. **[P1] New registration is still one long form**  
   - **What:** Six personal fields + fee + bank + (when paying) slip + warn; kicker says one step.  
   - **Why:** High LIFF cognitive load; PRODUCT anti-reference.  
   - **Fix:** ≥2 steps (data → payment/slip) or collapse email/building.  
   - **Suggested command:** `/impeccable distill /register`

2. **[P1] PhoneDigitInput label wiring + autofill friction**  
   - **What:** Hardcoded `aria-labelledby="reg-phone-label"` vs legacy `legacy-phone-label`; digits misuse `one-time-code`.  
   - **Why:** Screen reader fail; mobile autofill/typing suffer.  
   - **Fix:** Pass labelledby prop; prefer single `tel` or group `tel-national`.  
   - **Suggested command:** `/impeccable audit /register`

3. **[P1] Errors still footer-centric**  
   - **What:** Missing/invalid fields surface in `.reg-form-error`; only phone gets `aria-invalid`; no focus first invalid.  
   - **Why:** Mobile users miss the cause.  
   - **Fix:** Inline errors under name/phone; focus first invalid after failed confirm.  
   - **Suggested command:** `/impeccable clarify /register`

4. **[P2] Full personal form still open when `!canPay`**  
   - **What:** Users can fill everything then hit disabled CTA (informational under empty-bank constraint).  
   - **Why:** Wasted effort before discovering registration can’t complete payment.  
   - **Fix:** Lead with closed/unavailable status; defer long form until `canPay`.  
   - **Suggested command:** `/impeccable onboard /register`

5. **[P2] Legacy phone field unused**  
   - **What:** Hint claims verification help; search/bind omit phone.  
   - **Why:** Misleading copy.  
   - **Fix:** Remove or wire into API and update hint.  
   - **Suggested command:** `/impeccable clarify /register`

### Cognitive load checklist (8)

| Item | Result | Notes |
|------|--------|-------|
| Single focus | Fail (new) | Tabs + fields + fee/bank/warn compete |
| Chunking | Fail (new) | Personal section = 6 fields (>4) |
| Grouping | Pass | `reg-section` groups clear |
| Visual hierarchy | Pass | Hero → form → primary CTA |
| One thing at a time | Fail (new) / Pass (legacy) | New asks data (+ payment when open) together |
| Minimal choices | Pass | 2 modes; actions usually ≤4 |
| Working memory | Pass | Confirm / legacy step 3 re-show data |
| Progressive disclosure | Fail (new) / Pass (legacy) | Legacy wizard is the model |

**Failures: 4 on new path → high cognitive load.** Legacy path is low–moderate.

### Persona Red Flags

**Jordan:** Must choose new vs legacy early; “ขั้นตอนเดียว” undersells length; temporary membership rights may be unclear after success.

**Casey:** Long scroll; CTA below fold; 10 digit boxes; no client draft if interrupted mid-new-flow.

**Sam:** Broken legacy phone `aria-labelledby`; mode controls lack tab semantics; loading without strong live region.

**สมาชิก ABTA บน LINE:** Confirm before send/bind builds trust; empty bank correctly blocks payment (accepted); still risk filling a long form before discovering payment isn’t open yet.

### Minor Observations

- Detector clean (`[]`).
- Browser evidence blocked by LIFF OAuth invalid localhost redirectUri.
- Resubmit + reject reason remains a strong recovery moment.
- Mode switch resets typed data without confirm.
- Reduced-motion honored on shell animation.

### Questions to Consider

1. If bank stays empty for weeks, should “สมัครใหม่” be a closed state instead of a fillable form + disabled button?
2. Why does legacy earn a 3-step wizard while the money path stays “one step”?
3. Is 10-box phone accuracy worth killing autofill for every LINE member on a phone?
4. Should switching modes confirm before wiping typed fields?

### Detector Findings (JSON summary)

```json
{
  "command": "node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/RegisterPage.tsx apps/web/src/pages/PhoneDigitInput.tsx",
  "exitCode": 0,
  "findings": [],
  "count": 0,
  "browser": "skipped — LIFF OAuth 400 invalid redirectUri for http://localhost:5173/register; register DOM never loaded; no detect.js injection",
  "note": "No deterministic AI-slop / quality rule hits on scanned TSX markup."
}
```

### Concrete fix backlog for next chat

- Split new registration into ≥2 steps (personal → payment/slip) mirroring legacy `legacyStep`, or collapse email/building behind “ข้อมูลเพิ่มเติม”
- Fix `PhoneDigitInput.tsx`: accept `aria-labelledby` prop (default `reg-phone-label`); pass `legacy-phone-label` from legacy form; stop misusing `autocomplete="one-time-code"` on phone digits
- Add inline field errors + `aria-invalid` for firstName/lastName/phone; on confirm/submit fail, `focus()` first invalid control
- Move `.reg-form-error` association via `aria-describedby` on the form or fields
- Add `aria-selected` (and preferably tab pattern) on `.reg-mode-tab` buttons
- When `!canPay`, lead with closed/unavailable status and defer the long personal form
- Remove unused legacy phone field or include phone in `searchLegacyMembers` / bind payload and align hint copy
- Add `aria-live="polite"` on loading/submitting status text in `reg-shell`
- Optional: confirm before mode-tab switch if form dirty
- Optional: client-side draft in `sessionStorage` for Casey interruption recovery (non-resubmit path)
- **Do not** invent bank account data — empty bank remains intentional product constraint
