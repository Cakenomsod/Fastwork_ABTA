# Phase 1 — สถานะโค้ด / ความพร้อมใช้งาน

> **ตรวจเมื่อ:** 22 ก.ค. 2569  
> **ขอบเขต:** Phase 1 ตาม [02-Phase-1-Confirmed.md](./02-Phase-1-Confirmed.md) + อัปเดต [12-Scope-Update-2026-07-21.md](./12-Scope-Update-2026-07-21.md)  
> **ไม่รวม:** Broadcast LINE (Phase 3–4 — เลื่อนทำหลัง Phase 1)  
> **คำตัดสิน:** โค้ด Phase 1 **ครบแล้ว** (ไม่รวม Broadcast) — ยังไม่พร้อมเปิดรับสมัครจริงจนกว่าจะปิด go-live checklist

---

## สรุปสั้น ๆ

| มุม | สถานะ |
|-----|--------|
| โค้ดฟีเจอร์ Phase 1 (ไม่รวม Broadcast) | ✅ ครบ |
| พร้อมให้ลูกค้า Demo / รีวิว Back Office | ✅ ได้ (ตอนนี้ `ADMIN_OPEN_ACCESS = true`) |
| พร้อมเปิดรับสมัครจริง (production) | ❌ ยังไม่ได้ — รอข้อมูลลูกค้า + ตั้งค่า LINE/Auth + ปิด open access |

---

## Checklist ฟีเจอร์ (โค้ด)

### ฝั่งสมาชิก (LINE / LIFF / Web)

| # | รายการ | สถานะ | หลักฐานหลัก |
|---|--------|--------|-------------|
| 1 | สมัครสมาชิกใหม่ + แนบสลิป + เลขชั่วคราว | ✅ DONE | `apps/web/src/pages/RegisterPage.tsx`, `apps/functions/src/members/register.ts` |
| 2 | ยืนยันสมาชิกเก่า + ผูก LINE | ✅ DONE | `RegisterPage.tsx` (แท็บ legacy), `members/legacy-bind.ts` |
| 3 | ต่ออายุสมาชิก | ✅ DONE | `RenewPage.tsx`, `members/renew.ts` |
| 4 | สมัครสัมมนา 3 ประเภทราคา | ✅ DONE | `SeminarPage.tsx`, `seminars/register.ts` |
| 5 | เช็คสถานะ LINE OA (Flex + บัตร + ใบเสร็จ) | ✅ DONE | `line/webhook.ts`, `flex-status.ts`, `StatusPage.tsx` — mirror `seminarStatus` ตอนสมัครแล้ว |
| 6 | แจ้งเตือนก่อนหมดอายุ 45 / 15 วัน · หมดอายุ 31 ธ.ค. | ✅ DONE | `members/expiry-reminders.ts`, `membership.ts` |

### แจ้งเตือนเจ้าหน้าที่

| # | รายการ | สถานะ | หมายเหตุ |
|---|--------|--------|----------|
| 7 | Push LINE หา staff เมื่อมีสมัคร / ต่ออายุ / ส่งสลิปใหม่ / สมัครสัมมนา | ✅ DONE | ต้องใส่ `STAFF_LINE_USER_IDS` ถึงจะส่งจริง |

### Back Office

| # | รายการ | สถานะ | หลักฐานหลัก |
|---|--------|--------|-------------|
| 8 | บทบาท แอดมิน + นายทะเบียน + เหรัญญิก | ✅ DONE* | `staff/types.ts`, `admin/auth.ts`, `AdminApp.tsx` |
| 9 | ตรวจข้อมูล → promote เลขถาวร + ใบเสร็จชั่วคราว | ✅ DONE | `DataReviewPage.tsx`, `admin/reviews.ts` |
| 10 | ตรวจสลิป → ใบเสร็จตัวจริง / ปฏิเสธออกเลขใหม่ | ✅ DONE | `SlipReviewPage.tsx`, `admin/receipts.ts` |
| 11 | ค้นหา / แก้โปรไฟล์ / ลบสมาชิก / แก้เลข | ✅ DONE | `DashboardPage.tsx`, `MemberProfileEditPanel.tsx` |
| 12 | Dashboard สรุปเบื้องต้น | ✅ DONE | `DashboardPage.tsx`, `handleAdminDashboard` |
| 13 | กรองสมาชิกสามัญ · Active (ยังไม่หมดอายุ) | ✅ DONE | `MEMBER_STATUS_FILTER_OPTIONS`, `matchesOrdinaryActive` |
| 14 | นำเข้า Excel สมาชิกเก่า | ✅ DONE | `LegacyImportPage.tsx`, `legacy/import-xlsx.ts` |
| 15 | จัดการ / อนุมัติสัมมนา | ✅ DONE | `SeminarsPage.tsx` |
| 16 | จัดการเจ้าหน้าที่ (allowlist + บทบาท) | ✅ DONE | `StaffPage.tsx` |

\*บทบาทมีครบแล้ว แต่ `ADMIN_OPEN_ACCESS = true` ยังข้าม login สำหรับรีวิวลูกค้า — ต้องปิดก่อน production

### นอกขอบเขต Phase 1 (ไม่นับ)

| รายการ | เฟส | สถานะทีม |
|--------|------|----------|
| Broadcast ส่งข้อความกลุ่ม | Phase 3–4 | ⏸️ เลื่อนทำหลัง Phase 1 |
| Export Excel / OCR / QR / Self-Service / PDF เต็ม | P2–P4 | ❌ ยังไม่ทำ |

---

## ช่องว่างโค้ดที่ยังไม่ 100%

1. ~~สถานะสัมมนาในเช็คสถานะ~~ — ✅ แก้แล้ว (22 ก.ค.): mirror `registered` / `paid` ตอนสมัคร · `confirmed` ตอนอนุมัติ · เคลียร์ตอนปฏิเสธ
2. ~~แจ้ง staff ตอนสมัครสัมมนา~~ — ✅ แก้แล้ว (22 ก.ค.)
3. **`ADMIN_OPEN_ACCESS = true`** — ไฟล์:
   - `apps/web/src/lib/admin-open-access.ts`
   - `apps/functions/src/admin/open-access.ts`  
   ต้องตั้ง `false` + redeploy ก่อนเปิดจริง

---

## Go-live checklist (config / ลูกค้า — ไม่ใช่ฟีเจอร์ขาด)

รายละเอียดเต็ม: [10-Open-Items-Registration.md](./10-Open-Items-Registration.md)

| รายการ | สถานะ |
|--------|--------|
| บัญชีธนาคาร (ชื่อ / เลข / ธนาคาร) | ⬜ รอลูกค้า — UI โชว์ “รอข้อมูลจากสมาคม” |
| ยืนยันค่าธรรมเนียม 500 บาท | ⬜ รอลูกค้า |
| LIFF Endpoint ใน LINE Console | ⬜ ต้องชี้ `https://abta-member.web.app/register` |
| Rich Menu ปุ่มสมัคร / ยืนยันเก่า / ต่ออายุ / สัมมนา / สถานะ | ⬜ ตั้งใน OA Manager |
| `STAFF_LINE_USER_IDS` | ⬜ รอ LINE User ID เจ้าหน้าที่ |
| Firebase Auth — Google provider | ⬜ เปิดใน Console |
| ปิด `ADMIN_OPEN_ACCESS` | ⬜ ก่อน production |
| Deploy + ทดสอบ LIFF จริงใน LINE | ⬜ |
| Import Excel สมาชิกเก่าชุดจริง | ⬜ เมื่อลูกค้าส่งไฟล์เต็ม |

---

## สิ่งที่อัปเดตเอกสารรอบนี้

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| **เอกสารนี้** | สร้างใหม่ — สถานะ audit Phase 1 |
| [10-Open-Items-Registration.md](./10-Open-Items-Registration.md) | แก้ข้อความล้าสมัย (legacy bind ไม่ใช่ stub แล้ว) |
| [11-Legacy-Member-Import-Plan.md](./11-Legacy-Member-Import-Plan.md) | ติดสถานะว่า implement ครบแล้ว |
| [README.md](./README.md) | ชี้เอกสารนี้ + อัปเดตสถานะโครงการ |
| [03-Development-Plan.md](./03-Development-Plan.md) | ติ๊กงานฝั่งผู้พัฒนาที่ทำแล้ว |
| [12-Scope-Update-2026-07-21.md](./12-Scope-Update-2026-07-21.md) | จัดข้อความ Broadcast ให้สอดคล้อง (เลื่อนหลัง P1) |

---

## แนะนำลำดับถัดไป

1. ขอข้อมูล go-live จากลูกค้า (ธนาคาร / ค่าธรรมเนียม / staff LINE ID)
2. ตั้ง LIFF + Rich Menu + Google Sign-In
3. ปิด `ADMIN_OPEN_ACCESS` → deploy → ทดสอบใน LINE จริง
4. หลัง Phase 1 เสร็จ → ค่อยทำ Broadcast (Phase 3–4)
