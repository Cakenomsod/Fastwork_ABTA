---
target: /register RegisterPage after fixes
total_score: 29
p0_count: 0
p1_count: 3
timestamp: 2026-07-27T15-03-15Z
slug: apps-web-src-pages-registerpage-tsx
---
# UI/UX Critique: Register (`/register`)

> Method: ⚠️ DEGRADED: single-context (nested Multitask — dual A/B agents not spawned) · Detector: detect.mjs · Date: 2026-07-27 (re-critique after fixes)
> Score: 29/40 · P0: 0 · P1: 3
> Note: Bank EMPTY is intentional product state — not scored as P0 missing invented account data. Submit/slip are gated via `hasTransferAccount()`.

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์

| # | Heuristic | คะแนน | ประเด็นหลัก |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 3 | loading / submitting / wizard / สำเร็จ / บัญชีว่างชัด — validation ฟิลด์ยังโผล่ตอน submit |
| 2 | Match System / Real World | 3 | ภาษาไทยสมาคมดี · คำว่า Member ID ปนอังกฤษ |
| 3 | User Control and Freedom | 4 | สลับโหมด + ย้อนกลับ legacy + **PaymentConfirmPanel** ก่อนส่งใหม่ |
| 4 | Consistency and Standards | 2 | แบรนด์เขียว/ทองสอดคล้อง · แท็บไม่มี ARIA · phone label พังใน legacy |
| 5 | Error Prevention | 3 | ล็อกเลข 0 + สลิป + **บล็อกส่งเมื่อบัญชีว่าง** + confirm ก่อนส่ง · ยังไม่มี inline validate |
| 6 | Recognition Rather Than Recall | 3 | ป้ายชัด · confirm สรุปชื่อ/เบอร์/ยอด/สลิป · บัญชีว่างมีสถานะอ่านได้ |
| 7 | Flexibility and Efficiency | 2 | paste เบอร์ + `?flow=legacy` · ช่องทีละหลักทำร้าย autofill |
| 8 | Aesthetic and Minimalist Design | 3 | เชลล์สมาคมชัด · ฟอร์มใหม่ยังยาวซ้อน callout (anti-ref progressive disclosure) |
| 9 | Error Recovery | 3 | ข้อความ error ไทย actionable + `role="alert"` · อยู่ท้ายฟอร์มบ่อย |
| 10 | Help and Documentation | 3 | hint บัญชีว่าง + `NO_TRANSFER_ACCOUNT_SUBMIT_HINT` · ยังขาด help เชิงฟิลด์ |
| **รวม** | | **29/40** | **Good** |

### ความประทับใจรวม

หลังแก้: บัญชีรับโอนว่างถูกออกแบบเป็นสถานะจริง (empty block + ซ่อนอัปโหลดสลิป + ปิดปุ่มส่ง + hint ติดต่อเจ้าหน้าที่) และมีขั้นยืนยันก่อนส่งสมัครใหม่ — สอดคล้องหลัก “สถานะชัดก่อนสวย” และ “ยืนยันก่อนทำลาย” โดยไม่ต้อง invent เลขบัญชี จุดอ่อนที่เหลืออยู่ที่ **cognitive load ของฟอร์มใหม่** (ยาวหน้าเดียว), **a11y ของ PhoneDigitInput/แท็บ**, และ **error ที่ไม่ชิดฟิลด์**

### จุดแข็ง

1. **เกตบัญชีว่างอย่างถูกต้อง** — `TransferBankBlock` empty state + `canPay` ซ่อนสลิป/ปิด submit + `no_transfer_account` copy — ไม่หลอกให้โอน/อัปโหลด
2. **Confirm ก่อนส่งทั้งสองทาง** — legacy ขั้น 3 + `PaymentConfirmPanel` (ชื่อ/เบอร์/ยอด/พรีวิวสลิป + แก้ไข)
3. **แยกโหมด + wizard legacy** — แท็บสองทาง, amber สำหรับสมาชิกเก่า, ขั้น 1→2→3 พร้อมยืนยันก่อน bind

### ปัญหาเรียงตามความสำคัญ (P0–P3)

#### P0
ไม่มี — บัญชีรับโอนว่างเป็น intentional; ไม่ถือว่า missing real numbers เป็น blocker ที่ต้อง invent ข้อมูล

#### P1 — ฟอร์มสมัครใหม่ยาวหน้าเดียว (ไม่มี progressive disclosure)
- **อะไร:** ส่วนบุคคล 6 ฟิลด์ + ค่าธรรมเนียม + ธนาคาร + (เมื่อมีบัญชี) อัปโหลด + คำเตือน ในสกอร์ลเดียว · ขณะที่ legacy มี 3 ขั้นแล้ว
- **ทำไมสำคัญ:** cognitive load สูงบน LIFF มือถือ · ตรง anti-reference “ฟอร์มยาวไม่มี progressive disclosure” ใน PRODUCT.md
- **แก้ยังไง:** แยกอย่างน้อย 2 ขั้น (ข้อมูล → ชำระ/สลิป) หรือยุบฟิลด์เสริม (อีเมล/ตึก) ไว้หลัง “เพิ่มเติม”
- **คำสั่งที่แนะนำ:** `/impeccable distill /register` หรือ `/impeccable shape register new-flow`

#### P1 — PhoneDigitInput ผูก label ผิดในโหมด legacy + autofill อ่อน
- **อะไร:** `aria-labelledby` ฮาร์ดโค้ดเป็น `reg-phone-label` ทั้งที่ legacy ใช้ `legacy-phone-label` · ช่องหลักที่ 2–10 ใส่ `autocomplete="one-time-code"`
- **ทำไมสำคัญ:** Sam (a11y) ได้ label ผิด/ว่าง · Casey พิมพ์เบอร์ทีละช่องช้าและ autofill เบอร์ไม่ช่วย
- **แก้ยังไง:** ส่ง `aria-labelledby` เป็น prop จาก parent · พิจารณา input เบอร์เดียว `tel` บนมือถือ หรือ autocomplete `tel-national` ทั้งกลุ่ม
- **คำสั่งที่แนะนำ:** `/impeccable audit /register` (แล้ว fix ใน `PhoneDigitInput.tsx`)

#### P1 — Error โผล่ท้ายฟอร์ม ไม่ชิดฟิลด์ที่พลาด
- **อะไร:** `required_fields_missing` / `invalid_phone` / submit errors อยู่ที่ `.reg-form-error` ใต้ฟอร์ม · มี `aria-invalid` เฉพาะเบอร์ · ไม่ focus ฟิลด์แรกที่ invalid
- **ทำไมสำคัญ:** บนมือถือต้องเลื่อนหาว่าผิดตรงไหน · เพิ่มโอกาสส่งซ้ำ/ละทิ้ง
- **แก้ยังไง:** inline error ใต้ชื่อ/นามสกุล/เบอร์ · focus ไปฟิลด์แรกที่ invalid หลัง submit
- **คำสั่งที่แนะนำ:** `/impeccable clarify /register`

#### P2 — ฟิลด์เบอร์ใน legacy บอกว่า “ช่วยตรวจสอบ” แต่ไม่ถูกส่งไป API
- **อะไร:** hint “ไม่บังคับ · ใช้ช่วยตรวจสอบเท่านั้น” แต่ `searchLegacyMembers` / `bindLegacyMember` ไม่รับ phone
- **ทำไมสำคัญ:** copy หลอกลวง · ภาระพิมพ์โดยไม่มีประโยชน์
- **แก้ยังไง:** ลบฟิลด์ออก หรือส่ง phone ไปค้น/ยืนยันจริง แล้วอัปเดต hint ให้ตรงพฤติกรรม
- **คำสั่งที่แนะนำ:** `/impeccable clarify /register`

#### P2 — โหมดแท็บไม่มี semantics ของ tab
- **อะไร:** `.reg-mode-tab` เป็น `<button>` ใน `<nav>` ไม่มี `aria-selected` / `role="tablist|tab|tabpanel"`
- **ทำไมสำคัญ:** Sam ไม่รู้โหมดปัจจุบันจาก AT; คีย์บอร์ด arrow ไม่สลับแท็บแบบมาตรฐาน
- **แก้ยังไง:** ใส่ `aria-selected` อย่างน้อย หรือทำ tab pattern เต็ม
- **คำสั่งที่แนะนำ:** `/impeccable audit /register`

### ธงแดงตาม Persona

**Jordan (First-Timer)**
- เห็นสองแท็บทันทีโดยยังไม่รู้ว่าตัวเองเป็นสมาชิกเก่าหรือใหม่ — info box ช่วยได้แต่ยังต้องตัดสินใจก่อนกรอก
- Kicker “ขั้นตอนเดียว” ยังขัดกับความยาวฟอร์ม (แม้การชำระจะถูกบล็อกเมื่อบัญชีว่าง — สถานะชัดขึ้น)
- สำเร็จแล้วได้ Member ID แต่คำว่า “สมาชิกชั่วคราว” อาจไม่เข้าใจสิทธิ์อะไรใช้ได้ทันที

**Casey (Mobile / LIFF)**
- ฟอร์มใหม่ยาว · CTA หลักอยู่ท้ายหน้า · ช่องเบอร์ 10 ช่องแคบบนจอเล็ก
- เมื่อบัญชีว่าง: ปุ่มปิด + hint — ดีที่ไม่เสียเวลาอัปโหลดสลิปเปล่า · แต่ยังไม่มีทางออกอื่นใน UI (โทร/LINE เจ้าหน้าที่)
- สลับแอปแล้วกลับมา — ไม่มี draft persist นอก draft resubmit จากเซิร์ฟเวอร์

**Sam (a11y)**
- `PhoneDigitInput` `aria-labelledby="reg-phone-label"` พังใน legacy (`legacy-phone-label`)
- โหมดแท็บเป็น `<button>` ใน `<nav>` ไม่มี `aria-selected` / `role="tab"`
- loading เป็นข้อความอย่างเดียว ไม่มี `aria-live` ชัดบน shell

**สมาชิก ABTA บน LINE**
- รู้แล้วว่ายังโอนผ่านระบบไม่ได้ (empty bank) — ไม่ถูกหลอกให้แนบสลิป · ต้องติดต่อเจ้าหน้าที่นอกระบบ
- กลัวผูก LINE ผิดคน — legacy มีขั้นยืนยันดี · ฟอร์มใหม่มีสรุปก่อนส่งแล้ว
- ต้องการเช็คสถานะหลังสมัคร — success ชี้ไปสถานะและคำว่า “เช็คสถานะ” ดี

### Cognitive load checklist (8)

| Item | Result | Notes |
|------|--------|-------|
| Single focus | Fail (new) | Tabs + info + fee + bank + warn แข่งกัน |
| Chunking | Fail (new) | Personal section โชว์ 6 ฟิลด์ (>4) |
| Grouping | Pass | `reg-section` ชัด |
| Visual hierarchy | Pass | Hero → form → CTA |
| One thing at a time | Fail (new) / Pass (legacy) | ใหม่รวมข้อมูล+ชำระในหน้าเดียว |
| Minimal choices | Pass | 2 โหมด; actions ≤4 |
| Working memory | Pass (gated) | ไม่ต้องจำบัญชีเมื่อว่าง — UI บอกสถานะ; เมื่อมีบัญชี confirm สรุปให้ |
| Progressive disclosure | Fail (new) / Pass (legacy) | Legacy 1→2→3 เป็นแบบอย่าง |

**Failures: ~4 บนเส้นทางใหม่ → high cognitive load (ยังสำคัญ)**. Legacy ต่ำ–ปานกลาง.

### ข้อสังเกตเล็กน้อย

- Detector `detect.mjs` คืน `[]` — ไม่มี AI-slop rule hit บน markup ที่สแกน
- `.reg-kicker` uppercase + tracking ใช้แบบจุดเดียวต่อหน้า (ยอมรับได้ในแบรนด์)
- Resubmit prefill + แสดง `rejectReason` ทำงานดีมากสำหรับ emotional recovery
- โหมด legacy เก็บ phone ในฟอร์มแต่ search/bind ไม่ใช้ — dead UI
- Success copy ชัดเรื่องสิทธิ์ชั่วคราว vs ใบเสร็จหลังอนุมัติ — เก็บไว้
- Browser overlay ข้าม (LIFF/auth-gated)

### คำถามที่ควรคิด

1. ฟอร์มใหม่ควรยืมโครงสร้าง 2–3 ขั้นของ legacy หรือยุบฟิลด์เสริมก็พอ?
2. PhoneDigitInput คุ้มค่าความถูกต้องของรูปแบบ 0XXXXXXXXX มากกว่าความเร็วพิมพ์บนมือถือหรือยัง?
3. เมื่อบัญชีว่าง ควรมี CTA “ติดต่อเจ้าหน้าที่” (deep link LINE) นอกจากข้อความสถานะหรือไม่?
4. ควรอัปเดต kicker จาก “ขั้นตอนเดียว” เมื่อบัญชียังไม่พร้อมชำระ?

### Top 3 ที่เหลือ (หลังแก้)

1. **ฟอร์มใหม่ยาวไม่มี progressive disclosure** (P1)
2. **PhoneDigitInput label/autofill a11y** (P1)
3. **Error ไม่ชิดฟิลด์ + ไม่ focus** (P1)

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading/submit/wizard/success/empty-bank clear; field validation still submit-time |
| 2 | Match System / Real World | 3 | Strong Thai association voice; “Member ID” English leak |
| 3 | User Control and Freedom | 4 | Mode switch + legacy back + **PaymentConfirmPanel** before new submit |
| 4 | Consistency and Standards | 2 | Brand tokens consistent; tabs not ARIA; phone label id mismatch |
| 5 | Error Prevention | 3 | Digit lock + slip checks + **gated empty bank** + pre-submit confirm; no inline validate |
| 6 | Recognition Rather Than Recall | 3 | Labels + confirm summary; empty bank readable status |
| 7 | Flexibility and Efficiency | 2 | Paste + `?flow=legacy`; per-digit boxes hurt tel autofill |
| 8 | Aesthetic and Minimalist Design | 3 | Association green/gold shell; new form still stacks callouts |
| 9 | Error Recovery | 3 | Actionable Thai `errorCopy` + `role="alert"`; often bottom-of-form only |
| 10 | Help and Documentation | 3 | Empty-bank hint + submit status; little per-field help |
| **Total** | | **29/40** | **Good** |

### Anti-Patterns Verdict

**LLM:** Passes the product AI-slop test visually — committed association green + gold, not generic SaaS gray-blue; no side-stripe accents, gradient text, or glow. Detector agrees (`[]`). Remaining product anti-pattern: **long new-member form without progressive disclosure** (PRODUCT.md). Empty bank is **intentional** and correctly gated — do not invent account numbers.

**Deterministic scan:** `detect.mjs --json` on `RegisterPage.tsx` + `TransferBank.tsx` + `PhoneDigitInput.tsx` → `[]` (exit 0). Browser overlay skipped (LIFF auth gate).

### Overall Impression

Post-fix Register is operationally safer: empty transfer account no longer traps users into uploading a slip they cannot pay against, and both new + legacy paths confirm before high-stakes submit. The remaining gap vs PRODUCT principles is **cognitive load on the new path** (one long form), plus a11y wiring on phone digits/mode tabs and footer-only field errors.

### What's Working

1. **Honest empty-bank gate** — `TransferBankBlock` empty copy, hide slip, disable CTA, `no_transfer_account` / `NO_TRANSFER_ACCOUNT_SUBMIT_HINT`.
2. **Confirm before commit** — legacy step 3 + `PaymentConfirmPanel` (name/phone/fee/slip preview + back).
3. **Dual-mode identity** — green “new” vs amber “legacy,” with a real 3-step legacy bind flow.

### Priority Issues

1. **[P1] New registration is one long form (no progressive disclosure)**  
   - **What:** Six personal fields + fee + bank + (when payable) upload + warn in one scroll; legacy already has steps.  
   - **Why:** High extraneous load on LIFF; matches a named product anti-reference.  
   - **Fix:** Split into data → payment steps, or collapse optional fields behind disclosure.  
   - **Suggested command:** `/impeccable distill /register`

2. **[P1] PhoneDigitInput label wiring + autofill friction**  
   - **What:** Hardcoded `aria-labelledby="reg-phone-label"` breaks legacy (`legacy-phone-label`); digits use `autocomplete="one-time-code"`.  
   - **Why:** Screen reader association fails; mobile entry/autofill suffers.  
   - **Fix:** Pass labelledby as prop; prefer single `tel` input or proper tel autocomplete on the group.  
   - **Suggested command:** `/impeccable audit /register`

3. **[P1] Errors appear at form footer, not at the failing field**  
   - **What:** Submit/`required_fields_missing`/`invalid_phone` surface in `.reg-form-error` only; only phone gets `aria-invalid`; no focus move.  
   - **Why:** On mobile, users miss the cause and resubmit or abandon.  
   - **Fix:** Inline errors under name/phone; focus first invalid control after submit.  
   - **Suggested command:** `/impeccable clarify /register`

4. **[P2] Legacy phone field claims to help verification but is unused**  
   - **What:** Hint says it helps verification; `searchLegacyMembers` / `bindLegacyMember` omit phone.  
   - **Why:** Misleading copy and wasted input.  
   - **Fix:** Remove the field or wire it into search/bind and update copy.  
   - **Suggested command:** `/impeccable clarify /register`

5. **[P2] Mode tabs lack tab semantics**  
   - **What:** `.reg-mode-tab` buttons lack `aria-selected` / tab roles.  
   - **Why:** AT users get weak mode state; non-standard keyboard pattern.  
   - **Fix:** At least `aria-selected`; preferably full tablist pattern.  
   - **Suggested command:** `/impeccable audit /register`

**Not P0:** Empty `ASSOCIATION_TRANSFER_ACCOUNT` is intentional. Do not invent bank/account data. Scoring assumes gate + empty messaging stay.

### Cognitive load checklist (8)

| Item | Result | Notes |
|------|--------|-------|
| Single focus | Fail (new) | Tabs + info + fee + bank + warn compete |
| Chunking | Fail (new) | Personal section shows 6 fields (>4) |
| Grouping | Pass | `reg-section` groups are clear |
| Visual hierarchy | Pass | Hero → form card → primary CTA |
| One thing at a time | Fail (new) / Pass (legacy) | New asks data + payment together |
| Minimal choices | Pass | 2 modes; actions usually ≤4 |
| Working memory | Pass (gated) | Empty bank is status, not a memory bridge; confirm summarizes |
| Progressive disclosure | Fail (new) / Pass (legacy) | Legacy 1→2→3 is the model |

**Failures: ~4 on new path → high cognitive load (still priority).** Legacy path is low–moderate.

### Persona Red Flags

**Jordan (First-Timer):** Must choose new vs legacy before understanding; “ขั้นตอนเดียว” undersells form length; temporary membership rights may be unclear after success.

**Casey (Mobile):** Long scroll; primary CTA below fold; 10 digit boxes; interruption risk with no client draft; empty bank correctly blocks pay path but offers no in-UI contact CTA.

**Sam (a11y):** Broken `aria-labelledby` on legacy phone; mode controls lack tab semantics/`aria-selected`; loading text without strong live-region pattern on shell.

**สมาชิก ABTA บน LINE:** Cannot complete transfer in-app until account data ships (by design); no longer coaxed into slip upload; legacy bind confirm + new payment confirm reduce wrong-submit fear; post-submit status path is good.

### Minor Observations

- Detector clean (`[]`).
- Resubmit + reject reason remains a strong recovery moment — keep.
- Ghost secondary buttons correctly recolored inside the white form card.
- Success footers reinforcing “เช็คสถานะ” in LINE OA match product voice.
- Trend vs prior critique: **26 → 29** (P0 bank stub removed by intentional gate + confirm).

### Questions to Consider

1. Should new registration reuse a 2–3 step pattern like legacy?
2. Is per-digit phone UX worth the mobile cost vs a single `tel` field with the same `isValidThaiMobile` guard?
3. When bank is empty, add a “contact staff” LINE deep-link CTA beyond status text?
4. Should the “ขั้นตอนเดียว” kicker change while payment is unavailable?

### Top 3 remaining

1. Long new form without progressive disclosure (P1)
2. PhoneDigitInput label / autofill a11y (P1)
3. Footer-only errors without field focus (P1)

### Detector Findings (JSON summary)

```json
{
  "command": "node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/RegisterPage.tsx apps/web/src/pages/TransferBank.tsx apps/web/src/pages/PhoneDigitInput.tsx",
  "exitCode": 0,
  "findings": [],
  "count": 0,
  "note": "No deterministic AI-slop / quality rule hits on scanned TSX markup. CSS-only anti-patterns not fully covered by detector. Browser overlay skipped (LIFF auth)."
}
```

### Concrete fix backlog for next chat

- Split new registration into ≥2 steps (personal → payment/slip) mirroring legacy `legacyStep`, or collapse email/building behind “ข้อมูลเพิ่มเติม”
- Fix `PhoneDigitInput.tsx`: accept `aria-labelledby` prop (default `reg-phone-label`); pass `legacy-phone-label` from legacy form; stop misusing `autocomplete="one-time-code"` on phone digits
- Add inline field errors + `aria-invalid` for firstName/lastName/phone; on submit error, `focus()` first invalid control
- Move `.reg-form-error` association via `aria-describedby` on the form or fields
- Add `aria-selected` (and preferably tab pattern) on `.reg-mode-tab` buttons
- Remove unused legacy phone field or include phone in `searchLegacyMembers` / bind payload and align hint copy
- Add `aria-live="polite"` on loading/submitting status text in `reg-shell`
- Optional: single `input type="tel"` fallback under 360px width while keeping digit UI on larger phones
- Optional: client-side draft in `sessionStorage` for Casey interruption recovery (non-resubmit path)
- **Do not invent** bank name / account number / account name — keep `ASSOCIATION_TRANSFER_ACCOUNT = {}` until product supplies real data
