# UI/UX Critique: Register (`/register`)

> Method: single-agent page critique · Detector: detect.mjs · Date: 2026-07-27
> Score: 26/40 · P0: 1 · P1: 3

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์

| # | Heuristic | คะแนน | ประเด็นหลัก |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 3 | มี loading / submitting / ขั้น legacy / สำเร็จ — แต่ validation ฟิลด์โผล่ตอน submit |
| 2 | Match System / Real World | 3 | ภาษาไทยสมาคมดี · คำว่า Member ID / บางศัพท์ปนอังกฤษ |
| 3 | User Control and Freedom | 3 | สลับโหมด + ย้อนกลับใน legacy ได้ · ฟอร์มใหม่ไม่มีขั้นทบทวน |
| 4 | Consistency and Standards | 2 | แบรนด์เขียว/ทองสอดคล้อง · แท็บไม่มี ARIA · phone label พังใน legacy |
| 5 | Error Prevention | 2 | ล็อกเลข 0 + ตรวจสลิปดี · **บัญชีรับโอนยัง placeholder** · ไม่มี review ก่อนส่ง |
| 6 | Recognition Rather Than Recall | 3 | ป้ายชัด · confirm legacy โชว์การ์ดซ้ำ · ชำระเงินไม่มีข้อมูลให้จำ/ดู |
| 7 | Flexibility and Efficiency | 2 | paste เบอร์ + `?flow=legacy` · ช่องทีละหลักทำร้าย autofill |
| 8 | Aesthetic and Minimalist Design | 3 | เชลล์สมาคมชัด ไม่ใช่ SaaS เทา-น้ำเงิน · ฟอร์มใหม่ยาวซ้อน callout |
| 9 | Error Recovery | 3 | ข้อความ error ไทย actionable + `role="alert"` · อยู่ท้ายฟอร์มบ่อย |
| 10 | Help and Documentation | 2 | มี hint บางจุด · ไม่มีวิธีโอนเมื่อบัญชียัง “รอข้อมูล” |
| **รวม** | | **26/40** | **Acceptable** |

### ความประทับใจรวม

หน้า Register มีตัวตนสมาคม (เขียว + ทอง) และแยกโหมด “สมัครใหม่ / สมาชิกเก่า” ได้ดี โดยเฉพาะ wizard 3 ขั้นของ legacy ที่มี confirm ก่อนผูก LINE — สอดคล้องหลัก “สถานะชัด” และ “ยืนยันก่อนทำลาย” ของโปรดักต์ ช่องโหว่ใหญ่สุดอยู่ที่ **ฟอร์มสมัครใหม่**: บังคับแนบสลิปทั้งที่บัญชีรับโอนยังเป็น placeholder และยัดทุกฟิลด์ในหน้าเดียวโดยไม่มี progressive disclosure ซึ่งเป็น anti-pattern ที่ PRODUCT.md ระบุชัด

### จุดแข็ง

1. **แยกโหมดชัด + wizard legacy** — แท็บสองทาง, สี amber สำหรับสมาชิกเก่า, ขั้น 1→2→3 พร้อมยืนยันก่อน bind
2. **สถานะและ copy ภาษาไทย** — error map ตาม code, สำเร็จโชว์ Member ID + CTA ไปหน้าสถานะ, resubmit โชว์เหตุผลไม่ผ่าน
3. **PhoneDigitInput มี guardrails** — ล็อกหลักแรกเป็น 0, paste ปกติเป็น 10 หลัก, `prefers-reduced-motion` ถูก knobs ใน CSS

### ปัญหาเรียงตามความสำคัญ (P0–P3)

#### P0 — บัญชีรับโอนเป็น placeholder แต่บังคับแนบสลิป
- **อะไร:** `.reg-bank` แสดง “รอข้อมูลจากสมาคม” ขณะที่สลิปเป็น required
- **ทำไมสำคัญ:** สมาชิกบน LINE ทำธุรกรรมหลัก (โอนแล้วอัปโหลด) ไม่ได้สำเร็จ — ผิดหลัก “สถานะชัดก่อนสวย” และบล็อก task completion
- **แก้ยังไง:** ใส่ชื่อบัญชี/เลขบัญชี/ธนาคารจริง (หรือดึงจาก config) · ถ้ายังไม่มีข้อมูล ให้บล็อก submit พร้อมข้อความชัด หรือซ่อนขั้นอัปโหลดจนกว่าจะพร้อม
- **คำสั่งที่แนะนำ:** `/impeccable harden /register`

#### P1 — ฟอร์มสมัครใหม่ยาวหน้าเดียว (ไม่มี progressive disclosure)
- **อะไร:** ส่วนบุคคล 6 ฟิลด์ + ค่าธรรมเนียม + ธนาคาร + อัปโหลด + คำเตือน ในสกอร์ลเดียว · ขณะที่ legacy มี 3 ขั้นแล้ว
- **ทำไมสำคัญ:** cognitive load สูงบน LIFF มือถือ · ตรง anti-reference “ฟอร์มยาวไม่มี progressive disclosure”
- **แก้ยังไง:** แยกอย่างน้อย 2 ขั้น (ข้อมูล → ชำระ/สลิป) หรือยุบฟิลด์เสริม (อีเมล/ตึก) ไว้หลัง “เพิ่มเติม”
- **คำสั่งที่แนะนำ:** `/impeccable distill /register` หรือ `/impeccable shape register new-flow`

#### P1 — PhoneDigitInput ผูก label ผิดในโหมด legacy + autofill อ่อน
- **อะไร:** `aria-labelledby` ฮาร์ดโค้ดเป็น `reg-phone-label` ทั้งที่ legacy ใช้ `legacy-phone-label` · ช่องหลักที่ 2–10 ใส่ `autocomplete="one-time-code"`
- **ทำไมสำคัญ:** Sam (a11y) ได้ label ผิด/ว่าง · Casey พิมพ์เบอร์ทีละช่องช้าและ autofill เบอร์ไม่ช่วย
- **แก้ยังไง:** ส่ง `aria-labelledby` เป็น prop จาก parent · พิจารณา input เบอร์เดียว `tel` บนมือถือ หรือ autocomplete `tel-national` ทั้งกลุ่ม
- **คำสั่งที่แนะนำ:** `/impeccable audit /register` (แล้ว fix ใน `PhoneDigitInput.tsx`)

#### P1 — Error โผล่ท้ายฟอร์ม ไม่ชิดฟิลด์ที่พลาด
- **อะไร:** `required_fields_missing` / `invalid_phone` / submit errors อยู่ที่ `.reg-form-error` ใต้ฟอร์ม · มี `aria-invalid` เฉพาะเบอร์
- **ทำไมสำคัญ:** บนมือถือต้องเลื่อนหาว่าผิดตรงไหน · เพิ่มโอกาสส่งซ้ำ/ละทิ้ง
- **แก้ยังไง:** inline error ใต้ชื่อ/นามสกุล/เบอร์ · focus ไปฟิลด์แรกที่ invalid หลัง submit
- **คำสั่งที่แนะนำ:** `/impeccable clarify /register`

#### P2 — ฟิลด์เบอร์ใน legacy บอกว่า “ช่วยตรวจสอบ” แต่ไม่ถูกส่งไป API
- **อะไร:** hint “ไม่บังคับ · ใช้ช่วยตรวจสอบเท่านั้น” แต่ `searchLegacyMembers` ไม่รับ phone
- **ทำไมสำคัญ:** copy หลอกลวง · ภาระพิมพ์โดยไม่มีประโยชน์
- **แก้ยังไง:** ลบฟิลด์ออก หรือส่ง phone ไปค้น/ยืนยันจริง แล้วอัปเดต hint ให้ตรงพฤติกรรม
- **คำสั่งที่แนะนำ:** `/impeccable clarify /register`

### ธงแดงตาม Persona

**Jordan (First-Timer)**
- เห็นสองแท็บทันทีโดยยังไม่รู้ว่าตัวเองเป็นสมาชิกเก่าหรือใหม่ — info box ช่วยได้แต่ยังต้องตัดสินใจก่อนกรอก
- Kicker “ขั้นตอนเดียว” ขัดกับความยาวฟอร์ม + การโอนเงินที่ยังไม่มีบัญชี
- สำเร็จแล้วได้ Member ID แต่คำว่า “สมาชิกชั่วคราว” อาจไม่เข้าใจสิทธิ์อะไรใช้ได้ทันที

**Casey (Mobile / LIFF)**
- ฟอร์มใหม่ยาว · CTA หลักอยู่ท้ายหน้า (ต้องเลื่อน) · ช่องเบอร์ 10 ช่องแคบบนจอเล็ก (มี wrap ที่ ≤340px แต่ยังเหนื่อย)
- สลิป upload ดี (แตะพื้นที่ใหญ่) แต่ไม่มีบัญชีให้โอนก่อนอัปโหลด
- สลับแอปไปแอพธนาคารแล้วกลับมา — ไม่มี draft persist นอก draft resubmit จากเซิร์ฟเวอร์

**Sam (a11y)**
- `PhoneDigitInput` `aria-labelledby="reg-phone-label"` พังใน legacy (`legacy-phone-label`)
- โหมดแท็บเป็น `<button>` ใน `<nav>` ไม่มี `aria-selected` / `role="tab"`
- สถานะ match ใช้สี + ข้อความ (ดีที่ไม่พึ่งสีอย่างเดียว) · loading เป็นข้อความอย่างเดียว ไม่มี `aria-live` ชัดบน shell

**สมาชิก ABTA บน LINE**
- ต้องการโอนเงิน + แนบสลิปให้จบใน LINE — ติดที่บัญชีรับโอนว่าง
- กลัวผูก LINE ผิดคน — legacy มีขั้นยืนยันดี · ฟอร์มใหม่ไม่มีสรุปก่อนส่ง
- ต้องการเช็คสถานะหลังสมัคร — success ชี้ไปสถานะและคำว่า “เช็คสถานะ” ดี

### ข้อสังเกตเล็กน้อย

- Detector `detect.mjs` คืน `[]` — ไม่มี AI-slop rule hit บน markup ที่สแกน
- `.reg-kicker` uppercase + tracking ใช้แบบจุดเดียวต่อหน้า (ยอมรับได้ในแบรนด์ ไม่ใช่ eyebrow ทุกเซกชัน)
- `rounded-full` บนปุ่ม/แท็บเข้ากับ LIFF CTA · ไม่ใช่ pill cluster รก
- Resubmit prefill + แสดง `rejectReason` ทำงานดีมากสำหรับ emotional recovery
- โหมด legacy เก็บ phone ในฟอร์มแต่ search/bind ไม่ใช้ — dead UI
- Success copy ชัดเรื่องสิทธิ์ชั่วคราว vs ใบเสร็จหลังอนุมัติ — เก็บไว้

### คำถามที่ควรคิด

1. บัญชีรับโอนจะมาจาก config/CMS เมื่อไหร่ — หรือต้อง soft-launch โดยปิดการสมัครใหม่จนกว่าจะพร้อม?
2. ฟอร์มใหม่ควรยืมโครงสร้าง 3 ขั้นของ legacy หรือยุบฟิลด์เสริมก็พอ?
3. PhoneDigitInput คุ้มค่าความถูกต้องของรูปแบบ 0XXXXXXXXX มากกว่าความเร็วพิมพ์บนมือถือหรือยัง?
4. ควรมีขั้น “สรุปก่อนส่ง” สำหรับสมัครใหม่ เหมือน confirm ของ legacy หรือไม่?

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading/submit/legacy steps/success clear; field validation only after submit |
| 2 | Match System / Real World | 3 | Strong Thai association voice; “Member ID” English leak |
| 3 | User Control and Freedom | 3 | Mode switch + legacy back/confirm; new path lacks review/cancel affordance |
| 4 | Consistency and Standards | 2 | Brand tokens consistent; tabs not ARIA tabs; phone label id mismatch |
| 5 | Error Prevention | 2 | Digit lock + slip checks; **bank TBD while slip required**; no pre-submit review |
| 6 | Recognition Rather Than Recall | 3 | Labels + legacy confirm card; payment details missing to recognize |
| 7 | Flexibility and Efficiency | 2 | Paste + `?flow=legacy`; per-digit boxes hurt tel autofill |
| 8 | Aesthetic and Minimalist Design | 3 | Association green/gold shell (not SaaS gray-blue); new form stacks callouts |
| 9 | Error Recovery | 3 | Actionable Thai `errorCopy` + `role="alert"`; often bottom-of-form only |
| 10 | Help and Documentation | 2 | Some hints; stranded when bank is “รอข้อมูลจากสมาคม” |
| **Total** | | **26/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM:** Passes the product AI-slop test visually — committed association green + gold, not generic SaaS gray-blue; no side-stripe accents, gradient text, or glow. Detector agrees (`[]`). The real product anti-pattern is **long new-member form without progressive disclosure** (called out in PRODUCT.md), plus a **blocking payment stub** (bank placeholder + required slip). Uppercase kickers and pill CTAs are intentional brand/LIFF choices, not decorative noise.

**Deterministic scan:** `detect.mjs --json` on `RegisterPage.tsx` + `PhoneDigitInput.tsx` → `[]` (exit 0). No overlay run (source critique; LIFF auth gate).

### Overall Impression

Strong brand shell and an excellent legacy bind wizard; the new-registration path is the weak half — cognitively heavy and currently unable to complete payment. Biggest opportunity: ship real bank details and split (or collapse) the new form to match the clarity already earned by the legacy steps.

### What's Working

1. **Dual-mode identity** — green “new” vs amber “legacy,” with a real 3-step legacy flow and explicit bind confirmation.
2. **Status-first Thai copy** — coded errors, blocked/already-registered recovery, success with Member ID + status CTA, resubmit reject reason.
3. **Phone constraints** — locked leading `0`, paste normalization, reduced-motion honored on shell animation.

### Priority Issues

1. **[P0] Bank account placeholder while slip is required**  
   - **What:** `.reg-bank` shows “รอข้อมูลจากสมาคม”; slip upload is mandatory.  
   - **Why:** Blocks the primary member task (pay → attach proof) inside LINE.  
   - **Fix:** Inject real account fields from config; or disable submit / hide upload until bank data exists, with clear status copy.  
   - **Suggested command:** `/impeccable harden /register`

2. **[P1] New registration is one long form (no progressive disclosure)**  
   - **What:** Six personal fields + fee + bank + upload + warn in one scroll; legacy already has steps.  
   - **Why:** High extraneous load on LIFF; matches a named product anti-reference.  
   - **Fix:** Split into data → payment steps, or collapse optional fields behind disclosure.  
   - **Suggested command:** `/impeccable distill /register`

3. **[P1] PhoneDigitInput label wiring + autofill friction**  
   - **What:** Hardcoded `aria-labelledby="reg-phone-label"` breaks legacy (`legacy-phone-label`); digits use `autocomplete="one-time-code"`.  
   - **Why:** Screen reader association fails; mobile entry/autofill suffers.  
   - **Fix:** Pass labelledby (and optionally `aria-describedby`) as props; prefer single `tel` input or proper tel autocomplete on the group.  
   - **Suggested command:** `/impeccable audit /register`

4. **[P1] Errors appear at form footer, not at the failing field**  
   - **What:** Submit/`required_fields_missing`/`invalid_phone` surface in `.reg-form-error` only; only phone gets `aria-invalid`.  
   - **Why:** On mobile, users miss the cause and resubmit or abandon.  
   - **Fix:** Inline errors under name/phone; focus first invalid control after submit.  
   - **Suggested command:** `/impeccable clarify /register`

5. **[P2] Legacy phone field claims to help verification but is unused**  
   - **What:** Hint says it helps verification; `searchLegacyMembers` / `bindLegacyMember` omit phone.  
   - **Why:** Misleading copy and wasted input.  
   - **Fix:** Remove the field or wire it into search/bind and update copy.  
   - **Suggested command:** `/impeccable clarify /register`

### Cognitive load checklist (8)

| Item | Result | Notes |
|------|--------|-------|
| Single focus | Fail (new) | Tabs + info + fee + bank + upload + warn compete |
| Chunking | Fail (new) | Personal section shows 6 fields (>4) |
| Grouping | Pass | `reg-section` groups are clear |
| Visual hierarchy | Pass | Hero → form card → primary CTA |
| One thing at a time | Fail (new) / Pass (legacy) | New asks data + payment together |
| Minimal choices | Pass | 2 modes; actions usually ≤4 |
| Working memory | Fail (payment) | Must know where to transfer; bank not shown |
| Progressive disclosure | Fail (new) / Pass (legacy) | Legacy 1→2→3 is the model |

**Failures: 5 on new path → high cognitive load (critical for new registration).** Legacy path is low–moderate.

### Persona Red Flags

**Jordan (First-Timer):** Must choose new vs legacy before understanding; “ขั้นตอนเดียว” undersells payment friction; temporary membership rights may be unclear after success.

**Casey (Mobile):** Long scroll; primary CTA below fold; 10 digit boxes; interruption risk with no client draft; cannot complete transfer without bank details.

**Sam (a11y):** Broken `aria-labelledby` on legacy phone; mode controls lack tab semantics/`aria-selected`; loading text without strong live-region pattern on shell.

**สมาชิก ABTA บน LINE:** Payment blocked by empty bank block; fears wrong LINE bind (legacy confirm helps; new path has no summary); post-submit status path is good once they get there.

### Minor Observations

- Detector clean (`[]`).
- Resubmit + reject reason is a strong recovery moment — keep.
- Ghost secondary buttons correctly recolored inside the white form card.
- Success footers reinforcing “เช็คสถานะ” in LINE OA match product voice.

### Questions to Consider

1. Soft-launch: hide/disable new registration until bank details ship?
2. Should new registration reuse the legacy 3-step pattern?
3. Is per-digit phone UX worth the mobile cost vs a single `tel` field with the same `isValidThaiMobile` guard?
4. Does new submit need a confirm/summary step like legacy bind?

### Detector Findings (JSON summary)

```json
{
  "command": "node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/pages/RegisterPage.tsx apps/web/src/pages/PhoneDigitInput.tsx",
  "exitCode": 0,
  "findings": [],
  "count": 0,
  "note": "No deterministic AI-slop / quality rule hits on scanned TSX markup. CSS-only anti-patterns not fully covered by detector."
}
```

### Concrete fix backlog for next chat

- Replace bank placeholder in `RegisterPage.tsx` / `.reg-bank` with real account name, number, bank (from env/config API); gate slip+submit if missing
- Split new registration into ≥2 steps (personal → payment/slip) mirroring legacy `legacyStep`, or collapse email/building behind “ข้อมูลเพิ่มเติม”
- Fix `PhoneDigitInput.tsx`: accept `aria-labelledby` prop (default `reg-phone-label`); pass `legacy-phone-label` from legacy form; stop misusing `autocomplete="one-time-code"` on phone digits
- Add inline field errors + `aria-invalid` for firstName/lastName/phone; on submit error, `focus()` first invalid control
- Move `.reg-form-error` association via `aria-describedby` on the form or fields
- Add `aria-selected` (and preferably tab pattern) on `.reg-mode-tab` buttons
- Remove unused legacy phone field or include phone in `searchLegacyMembers` / bind payload and align hint copy
- Add `aria-live="polite"` on loading/submitting status text in `reg-shell`
- Optional: single `input type="tel"` fallback under 360px width while keeping digit UI on larger phones
- Optional: client-side draft in `sessionStorage` for Casey interruption recovery (non-resubmit path)
