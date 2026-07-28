---
target: Admin Seminars (re-critique after fixes)
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-07-27T15-07-29Z
slug: apps-web-src-admin-pages-seminarspage-tsx
---
# UI/UX Critique: Admin Seminars (Back Office)

> Method: ⚠️ DEGRADED: single-context (nested under Multitask parent; no further sub-agents) · Detector: detect.mjs · Date: 2026-07-27 (re-critique after fixes)  
> Target: `apps/web/src/admin/pages/SeminarsPage.tsx` + `ConfirmDialog.tsx` (reason field) + seminar rules in `apps/web/src/admin/admin.css`  
> Prior: **20/40** · P0: 1 · P1: 3  
> Score: **28/40** · P0: **0** · P1: **2** · Band: Good  
> Fixes verified: ConfirmDialog reject+reason · Thai status badges · seminar title column · scoped busy (`saving` / `closingBusy` / `decidingId`)

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนสุขภาพดีไซน์

| # | Heuristic | คะแนน | ประเด็นหลัก |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 3 | Badge สถานะไทย + busy ต่อ action; ยังไม่มี skeleton โหลดแรก / toast สำเร็จ |
| 2 | Match System / Real World | 3 | สถานะ/error/ฟอร์มเป็นไทย; คิวยังพูดแบบ CRUD ไม่ใช่คิวงาน |
| 3 | User Control and Freedom | 3 | ConfirmDialog ปิดงาน + ปฏิเสธ (Esc/ยกเลิก); อนุมัติยังไม่มี undo |
| 4 | Consistency and Standards | 3 | ปฏิเสธใช้ ConfirmDialog เหมือนปิดงาน — สอดคล้อง BO; คิวยังไม่เหมือน Data/Slip |
| 5 | Error Prevention | 3 | เหตุผลปฏิเสธบังคับ + ปุ่มยืนยัน disabled จนไม่ว่าง; อนุมัติคลิกเดียว (ยอมรับได้) |
| 6 | Recognition Rather Than Recall | 3 | คอลัมน์งานโชว์ชื่อแล้ว; งานที่ปิด/ไม่อยู่ใน list → ช่องว่าง |
| 7 | Flexibility and Efficiency | 2 | Busy แยก scope แล้ว แต่ `decidingId` ยังล็อกปุ่มตัดสินใจทุกแถว; ไม่มีกรองคิว |
| 8 | Aesthetic and Minimalist Design | 3 | Audience composer ยังแข็ง; ตารางใบสมัครยังไม่ queue-first |
| 9 | Error Recovery | 3 | `ERROR_LABEL` แปลรหัส API เป็นไทย actionable |
| 10 | Help and Documentation | 2 | Hint ในฟอร์มสร้างดี; ไม่มีคำแนะนำคิวอนุมัติ |
| **รวม** | | **28/40** | **Good — P0 ปิดแล้ว; คิวยังไม่ใช่ศูนย์กลาง** |

### ความประทับใจรวม

รอบแก้ปิด **P0 `window.prompt`** และจุด recall/สถานะหลักแล้ว — ปฏิเสธมี dialog + reason, สถานะเป็น badge ไทย, คอลัมน์งานเป็นชื่อสัมมนา, busy ไม่ล็อกทั้งหน้าแล้ว โอกาสใหญ่ที่เหลือคือทำให้แผงใบสมัครเป็น **queue-first** (กรองรอพิจารณา + นับ) และกันชื่องานว่างเมื่อสัมมนาถูกปิดออกจาก list

### จุดแข็ง

1. **Reject ConfirmDialog + `requireReason`** — focus ที่ textarea, Esc/overlay ยกเลิก, confirm disabled จนมีเหตุผล, danger variant  
2. **สถานะไทย + `.bo-badge`** — `registered`/`paid`/`confirmed`/`rejected` map ชัด; semantic color  
3. **Audience composer + scoped busy** — สร้าง/แก้ยัง progressive; `saving` / `closingBusy` / `decidingId` แยกหน้าที่

### ปัญหาเรียงตามความสำคัญ (P0–P3)

#### [P1] คิวใบสมัครยังไม่ queue-first
- **อะไร**: แสดงทุกสถานะคละกัน; ไม่มีแท็บ/ชิป “รอพิจารณา” (default) / นับจำนวน
- **ทำไมสำคัญ**: หลัก BO คือคิวเป็นศูนย์กลาง; staff หาของที่ต้องทำยากเมื่อรายการยาว
- **แก้**: filter chips + counts; default = `registered` ∪ `paid` (ยังตัดสินใจได้)
- **คำสั่ง**: `/impeccable distill`

#### [P1] ชื่องานว่างเมื่อสัมมนาไม่อยู่ใน list เปิดอยู่
- **อะไร**: `seminarById.get(r.seminarId)?.title` → `""` หลังปิดงาน (list เหลือแต่ active)
- **ทำไมสำคัญ**: ใบสมัครค้างของงานที่ปิดแล้วอ่านไม่ออก — สูญเสีย recognition ที่เพิ่งแก้
- **แก้**: denormalize title บน registration, หรือ fetch รวม inactive สำหรับ lookup, หรือ fallback “งานที่ปิดแล้ว”
- **คำสั่ง**: `/impeccable clarify` + `/impeccable harden`

#### [P2] `decidingId != null` ยังล็อกอนุมัติ/ปฏิเสธทุกแถว
- **อะไร**: `disabled={rowBusy || decidingId != null}` — ระหว่างตัดสินใจใบหนึ่ง ใบอื่นกดไม่ได้
- **ทำไมสำคัญ**: ช้ากว่า per-row busy จริง; Alex ติดคอขวด
- **แก้**: disable เฉพาะแถวที่กำลังบันทึก (หรืออนุญาต parallel ถ้า API รับได้)
- **คำสั่ง**: `/impeccable harden`

#### [P2] ไม่มี feedback โหลดแรก / สำเร็จ
- **อะไร**: โหลดครั้งแรกไม่มี skeleton; บันทึก/อนุมัติ/ปฏิเสธไม่มี toast
- **แก้**: “กำลังโหลด…” + toast/banner สั้นหลัง action
- **คำสั่ง**: `/impeccable polish`

#### [P3] ตารางมือถือ / inline style / token drift
- **อะไร**: ไม่มี `bo-table--cards`; empty cell ใช้ inline color; detector advisory ใน `.bo-seminar-*`
- **แก้**: pattern การ์ด; class สำหรับ muted empty; token สี tag ทั่วไป
- **คำสั่ง**: `/impeccable adapt` + `/impeccable document`

### ธงแดงตาม Persona

**Alex (Power User / เจ้าหน้าที่ประจำ)**  
- ยังไม่มี bulk / กรองคิวรอ  
- `decidingId` ล็อกทุกแถวตัดสินใจระหว่าง request  
- สร้างฟอร์มยังแย่งโฟกัสกับคิวเมื่อเปิดอยู่

**Sam (Accessibility)**  
- ConfirmDialog reason มี label + focus — ดีขึ้นมากจาก prompt  
- สถานะเป็นข้อความใน badge (ไม่พึ่งสีอย่างเดียว) — ดี  
- ชื่องานว่าง = แถวประกาศไม่ครบบริบท

**นายทะเบียน ABTA (persona โปรเจกต์)**  
- ปฏิเสธมีเหตุผลทบทวนใน dialog ก่อนส่ง — ตรงหลัก “ยืนยันก่อนทำลาย”  
- ยังต้องสแกนตารางคละสถานะเพื่อหาคิวรอ  
- งานปิดแล้ว + ใบสมัครค้าง = ชื่องานหาย

### ข้อสังเกตเล็กน้อย

- ปุ่มยกเลิกซ้ำในฟอร์มสร้าง (หัว + ท้าย)  
- Preview label “สรุปสิทธิ์” ยัง uppercase tracked (eyebrow เล็ก จุดเดียว)  
- Detector: TSX clean (`[]`); `admin.css` ~212 advisory ทั้งไฟล์; ~24 ในบล็อก `.bo-seminar-*` (font-size/radius/color) — ไม่มี absolute bans

### คำถามที่ควรคิด

- หน้าที่หลักของหน้านี้หลังแก้ P0 แล้ว คือเคลียร์คิว หรือสร้างงาน?
- ใบสมัครของงานที่ปิดแล้วควรอยู่ในแท็บ “ทั้งหมด” หรือซ่อนจนกว่าจะเปิด archive?
- ต้องการ bulk approve สำหรับ `registered` ที่ไม่ต้องสลิปหรือไม่?

---

## English (for follow-up fix agents)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Thai badges + per-action busy; no initial skeleton / success toast |
| 2 | Match System / Real World | 3 | Thai statuses/errors; queue still CRUD-shaped |
| 3 | User Control and Freedom | 3 | ConfirmDialog close + reject (Esc/cancel); no approve undo |
| 4 | Consistency and Standards | 3 | Reject matches close via ConfirmDialog; queue ≠ Data/Slip pattern |
| 5 | Error Prevention | 3 | Required reason + disabled confirm until filled |
| 6 | Recognition Rather Than Recall | 3 | Title column fixed; blank when seminar not in active list |
| 7 | Flexibility and Efficiency | 2 | Scoped busy improved; decide still freezes all decide buttons; no filter |
| 8 | Aesthetic and Minimalist Design | 3 | Audience composer strong; regs panel not queue-first |
| 9 | Error Recovery | 3 | `ERROR_LABEL` maps API codes to Thai |
| 10 | Help and Documentation | 2 | Create hints good; no approval-queue guidance |
| **Total** | | **28/40** | **Good** |

### Anti-Patterns Verdict

**LLM assessment**: Prior AI/product-slop failure (`window.prompt`, raw IDs/statuses) is largely cleared. Surface now reads as association BO with a strong create composer. Remaining failure mode is **ops queue IA**: mixed statuses, no pending-first default, title lookup tied only to active seminars.

**Deterministic scan (`detect.mjs`)**:  
- `SeminarsPage.tsx` / `ConfirmDialog.tsx`: **0** findings (exit 0).  
- `admin.css`: exit 2, **~212** advisory (global drift). **~24** in `.bo-seminar-*` (~2841–3250): `design-system-font-size` / `radius` / `color` (warm public-tag browns, `999px` checks). **0** absolute bans.

**Visual overlays**: Skipped — Multitask subagent; auth-gated admin; source + detector only.

### Overall Impression

**20 → 28**. Safety and recognition fixes landed. Biggest remaining opportunity: treat registrations as a **pending queue** (filter + counts) and keep seminar titles resolvable after close.

### What's Working

1. Reject path: `ConfirmDialog` + `requireReason`, focus/Esc/busy, contextual description with applicant + seminar title.
2. Thai `REG_STATUS_LABEL` + `.bo-badge` semantic classes aligned to `registered|paid|confirmed|rejected`.
3. Title column via `seminarById`; list meta fallback “ยังไม่ระบุวัน/สถานที่”; scoped busy flags instead of page-wide `busy`.

### Priority Issues

1. **[P1] Registrations panel not queue-first**  
   - **What**: All statuses listed; no default “รอพิจารณา” filter/counts.  
   - **Why**: Staff primary job is clearing actionable regs (`registered`/`paid`).  
   - **Fix**: Chips + counts; default filter actionable; optional sort newest-first.  
   - **Suggested command**: `/impeccable distill`

2. **[P1] Seminar title blank for closed/missing seminars**  
   - **What**: Lookup only against active `seminars` state.  
   - **Why**: After deactivate, remaining regs lose the recognition fix.  
   - **Fix**: Keep title on reg payload, include inactive in lookup map, or show “งานที่ปิดแล้ว”.  
   - **Suggested command**: `/impeccable clarify`

3. **[P2] Decide busy still freezes sibling rows**  
   - **What**: `disabled={rowBusy || decidingId != null}`.  
   - **Fix**: Per-row disable only (or true parallel).  
   - **Suggested command**: `/impeccable harden`

4. **[P2] Weak initial load / success feedback**  
   - **Fix**: Loading copy/skeleton; short success banner after save/decide/close.  
   - **Suggested command**: `/impeccable polish`

5. **[P3] Mobile table + token drift**  
   - **Fix**: `bo-table--cards`; CSS class for empty muted; document/token public-tag colors.  
   - **Suggested command**: `/impeccable adapt`

### Persona Red Flags

**Alex**: No pending filter/bulk; decide locks all action rows; create panel competes with queue.  
**Sam**: Reject dialog now proper; empty seminar title leaves incomplete row context.  
**นายทะเบียน**: Reject reason reviewable — good; still hunts mixed-status table; closed-seminar regs opaque.

### Minor Observations

- Duplicate Cancel in create panel.
- Mild uppercase tracked “สรุปสิทธิ์” preview label (single eyebrow, not scaffold).
- Inline `style={{ color: "var(--bo-muted)" }}` on empty regs cell.

### Questions to Consider

- Is the primary job now clear-queue or create-seminar?
- Should closed-seminar registrations live in an archive filter?
- Bulk-approve free `registered` rows?

### Detector Findings (JSON summary)

```json
{
  "exitCode": { "tsx": 0, "adminCss": 2 },
  "targets": [
    "apps/web/src/admin/pages/SeminarsPage.tsx",
    "apps/web/src/admin/ConfirmDialog.tsx",
    "apps/web/src/admin/admin.css"
  ],
  "tsxFindings": 0,
  "adminCssTotalFindings": 212,
  "seminarBlockApproxFindings": 24,
  "byAntipatternSeminarBlock": {
    "design-system-font-size": 11,
    "design-system-radius": 5,
    "design-system-color": 8
  },
  "severity": "all advisory",
  "absoluteBans": 0
}
```

### Concrete fix backlog for next chat

1. **Queue filters**: chips รอพิจารณา (default) / ทั้งหมด / ยืนยันแล้ว / ปฏิเสธ + counts in panel head.
2. **Title resilience**: inactive seminar lookup or denormalized title / “งานที่ปิดแล้ว” fallback (never blank).
3. **True per-row decide busy**: drop `decidingId != null` global disable on sibling approve/reject.
4. **Initial loading + success**: skeleton/“กำลังโหลด…”; short success feedback after save/decide/close.
5. **Optional**: bulk approve for actionable free regs; `bo-table--cards`; tokenise public-tag browns.

**Suggested command sequence**: `/impeccable distill` → `/impeccable clarify` → `/impeccable harden` → `/impeccable polish` → `/impeccable adapt`

### Delta vs prior (20/40)

| Item | Prior | Now |
|------|-------|-----|
| Reject `window.prompt` | P0 | ✅ ConfirmDialog + reason |
| `seminarId` in table | P1 | ✅ title (active only) |
| Raw English status | P1 | ✅ Thai badges |
| Page-wide `busy` | P1 | ✅ scoped (decide still cross-locks rows → P2) |
| Queue-first filter | part of P1 | ❌ still P1 |
| API English errors | P2 | ✅ `ERROR_LABEL` |
