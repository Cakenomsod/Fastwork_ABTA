# เทคโนโลยีและค่าใช้จ่าย

> หมายเหตุ: เป็นแผนการพัฒนาของผู้พัฒนา ยังไม่ได้ระบุเป็นข้อกำหนดในสัญญา

---

## Tech Stack ที่วางแผนใช้

| ชั้น | เทคโนโลยี |
|------|----------|
| **Frontend** | React |
| **Backend** | Node.js |
| **Database** | Firebase (Firestore) |
| **LINE Integration** | LINE Messaging API + Webhook |
| **Hosting** | Firebase Hosting |

### ทางเลือกอื่นที่เคยพิจารณา

- Backend: Python
- Database: Supabase
- Hosting: Cloudflare Pages

---

## การตั้งค่า LINE Official Account

ขั้นตอนที่ลูกค้าต้องทำ (หรือทำร่วมกับผู้พัฒนา):

1. สร้าง **Gmail ใหม่** ชื่อสมาคม
2. สมัคร **LINE Official Account**
3. ตั้งค่า **Messaging API**
4. กำหนด **Webhook URL** ชี้ไปที่ Backend
5. เปิดใช้งาน Webhook

---

## สถาปัตยกรรมโดยย่อ

```mermaid
flowchart LR
    subgraph Client
        LINE[LINE OA]
        WEB[Web App / Back Office]
    end

    subgraph Backend
        API[Node.js API]
        WH[Webhook Handler]
    end

    subgraph Cloud
        FB[(Firebase Firestore)]
        HOST[Firebase Hosting]
        STORAGE[Firebase Storage]
    end

    LINE --> WH
    WEB --> API
    WH --> API
    API --> FB
    API --> STORAGE
    WEB --> HOST
```

### การไหลของข้อมูลหลัก

| Event | Flow |
|-------|------|
| สมาชิกสมัคร | Web Form → API → Firestore → LINE Notify |
| สมาชิกพิมพ์ "เช็คสถานะ" | LINE → Webhook → API → Firestore → LINE Reply |
| แอดมินอนุมัติข้อมูล | Back Office → API → Firestore → LINE Notify |
| เหรัญญิกอนุมัติสลิป | Back Office → API → Firestore → LINE Notify |
| อัปโหลดสลิป | Web/LINE → API → Firebase Storage → Firestore |

---

## ค่าใช้จ่ายรายเดือน (หลังส่งมอบ)

> **ลูกค้าเป็นผู้รับผิดชอบ** ค่าบริการภายนอก

| บริการ | ค่าใช้จ่ายโดยประมาณ | หมายเหตุ |
|--------|---------------------|----------|
| LINE Official Account | 400–1,500 บาท/เดือน | ตามแพ็กเกจ |
| Firebase | ฟรี – 500+ บาท/เดือน | ฟรีถ้าไม่เกิน Free Tier |
| AI API (ถ้าเพิ่ม OCR) | 200–500 บาท/เดือน | ขึ้นกับจำนวนสลิป |

### สรุปค่ารายเดือน

| แพ็กเกจ | ประมาณ |
|---------|--------|
| Phase 1 (ไม่มี AI) | **400–2,000 บาท/เดือน** |
| Phase 3–4 (มี OCR) | **600–2,500 บาท/เดือน** |

> ถ้าสมาชิกน้อยและใช้งานไม่หนัก อาจอยู่ใน Free Tier ได้

---

## ข้อมูลที่ต้องเก็บในฐานข้อมูล

> อัปเดต schema ตาม Flow Phase 1 ที่ยืนยัน (11 ก.ค. 2569)

### ตาราง Members

| Field | Type | หมายเหตุ |
|-------|------|----------|
| memberId | string | ชั่วคราว → ถาวร; ไม่ผ่านแอดมิน → regenerate |
| tempMemberId | string | เลขชั่วคราว (ก่อน promote) |
| firstName | string | |
| lastName | string | |
| phone | string | ใช้ค้นหา + ผูก LINE |
| email | string | |
| organization | string | หน่วยงาน/ตึก |
| lineUserId | string | ผูกกับ LINE OA |
| status | enum | ดู [05-Status-and-SLA.md](./05-Status-and-SLA.md) |
| memberCardUrl | string | URL บัตรสมาชิก (ID Card) — แสดงใน LINE OA |
| expiryDate | timestamp | วันหมดอายุ |
| dataReviewStatus | enum | `pending` / `approved` / `rejected` — ขั้นที่ 1 แอดมิน |
| dataReviewedBy | string | นายทะเบียนที่ตรวจ |
| dataReviewedAt | timestamp | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### ตาราง Seminars

| Field | Type | หมายเหตุ |
|-------|------|----------|
| seminarId | string | |
| title | string | ชื่องาน |
| pricingType | enum | `public_paid` / `member_free` / `member_paid` |
| publicPrice | number | ราคาคนทั่วไป |
| memberPrice | number | ราคาสมาชิก (ถ้า member_paid) |
| eventDate | timestamp | |
| status | enum | `open` / `closed` / `cancelled` |

### ตาราง Registrations (สมัครสัมมนา)

| Field | Type | หมายเหตุ |
|-------|------|----------|
| registrationId | string | |
| seminarId | string | |
| memberId | string | null ได้ถ้าเป็นคนทั่วไป |
| applicantType | enum | `public` / `member` — ตาม pricingType ของงาน |
| shirtSize | string | |
| foodPreference | string | |
| paymentStatus | enum | |
| registrationStatus | enum | |
| amount | number | 0 ถ้า member_free |

### ตาราง Payments

| Field | Type | หมายเหตุ |
|-------|------|----------|
| paymentId | string | |
| memberId | string | |
| receiptNumber | string | เลขใบเสร็จ — ชั่วคราว → ตัวจริง |
| receiptStatus | enum | `temp` / `pending_review` / `official` / `rejected` |
| receiptUrl | string | URL ใบเสร็จ — แสดงใน LINE OA |
| previousReceiptNumber | string | เลขเดิมก่อน reject (audit) |
| slipUrl | string | |
| amount | number | |
| status | enum | ดู Payment Status ใน [05-Status-and-SLA.md](./05-Status-and-SLA.md) |
| dataReviewStatus | enum | สถานะขั้นที่ 1 (แอดมิน) |
| verifiedBy | string | เหรัญญิกที่ตรวจสลip (ขั้นที่ 2) |
| verifiedAt | timestamp | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Enum สำคัญ

**Seminar.pricingType**

| ค่า | ความหมาย |
|-----|----------|
| `public_paid` | คนทั่วไป — ต้องชำระ |
| `member_free` | สมาชิก — เข้าฟรี |
| `member_paid` | สมาชิก — ต้องชำระ |

**Receipt.receiptStatus**

| ค่า | ความหมาย |
|-----|----------|
| `temp` | ใบเสร็จชั่วคราว — ออกหลังนายทะเบียนอนุมัติข้อมูล |
| `pending_review` | รอเหรัญญิกตรวจสลิป |
| `official` | ใบเสร็จตัวจริง |
| `rejected` | ไม่ผ่าน — ระบบออกเลขใบเสร็จใหม่ |

---

## ผลงานอ้างอิง

- Portfolio: https://pkfreelancebs.web.app/
