# รายการค้างก่อนเปิดรับสมัครจริง (Go-live)

> สร้างเมื่อ: 18 ก.ค. 2569 · **อัปเดตสถานะโค้ด:** 22 ก.ค. 2569  
> ใช้คู่กับ: [13-Phase-1-Status-Audit-2026-07-22.md](./13-Phase-1-Status-Audit-2026-07-22.md), [04-Workflows.md](./04-Workflows.md), [07-Tech-Stack.md](./07-Tech-Stack.md), [09-Platform-Accounts.md](./09-Platform-Accounts.md)  
> **สถานะโค้ด:** ฟีเจอร์สมัคร / ผูก LINE สมาชิกเก่า / ต่ออายุ / สัมมนา / Back Office ทำครบแล้ว — รายการด้านล่างยังต้องยืนยันก่อน go-live

---

## 1. ข้อมูลบัญชีธนาคาร (จำเป็นก่อนเปิดรับสมัครจริง)

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| ชื่อบัญชี | ⬜ รอลูกค้า | แสดงในฟอร์มสมัคร |
| เลขบัญชี | ⬜ รอลูกค้า | **ห้ามเดาเลขในระบบ** — UI ใช้ข้อความ “รอข้อมูลจากสมาคม” ชั่วคราว |
| ธนาคาร | ⬜ รอลูกค้า | เช่น กรุงไทย / กสิกร ฯลฯ |
| QR พร้อมเพย์ (ถ้ามี) | ⬜ ไม่บังคับ | ถ้ามีรูป QR จะอัปโหลดขึ้น Hosting/Storage ได้ |

---

## 2. ค่าธรรมเนียมสมาชิก

| รายการ | ค่าที่ใช้ชั่วคราว | สถานะ |
|--------|-------------------|--------|
| ค่าสมัคร / ต่ออายุ | **500 บาท** (จาก mockup) | ⬜ รอลูกค้ายืนยันหรือแก้ |

ถ้าจำนวนจริงต่างจาก 500 บาท แจ้งทีมเพื่ออัปเดตค่าคงที่ `MEMBERSHIP_FEE_THB` และข้อความบนฟอร์ม

---

## 3. LINE Login + LIFF — checklist Endpoint

โทเค็นใน `.env` มีรูปแบบครบ (Channel Login + LIFF ID/URL) แล้ว แต่ยังต้องยืนยันใน LINE Developers Console ว่า Endpoint ชี้ถูกหน้า

| ขั้นตอน | รายละเอียด | สถานะ |
|---------|------------|--------|
| 1 | เปิด [LINE Developers](https://developers.line.biz/) → Provider ของสมาคม → **LINE Login** channel (`ABTA Login`) | ⬜ ตรวจด้วยลูกค้า/ทีม |
| 2 | แท็บ **LIFF** → เลือก LIFF app ที่ใช้สมัคร | ⬜ |
| 3 | ตั้ง **Endpoint URL** = `https://abta-member.web.app/register` | ⬜ สำคัญ |
| 4 | Size: Full (แนะนำ) · Scope: `openid` + `profile` (อย่างน้อย) | ⬜ |
| 5 | เปิดใช้งาน LIFF (Enabled) | ⬜ |
| 6 | ตรวจว่า **LIFF ID** ตรงกับ `VITE_LIFF_ID` ใน `.env` (ขึ้นต้นด้วย Login Channel ID) | ✅ รูปแบบใน `.env` ตรง prefix |
| 7 | ตรวจ `VITE_LIFF_URL` = `https://liff.line.me/<LIFF_ID>` | ✅ มีใน `.env` |
| 8 | Deploy Hosting ให้มี route `/register` ก่อนทดสอบใน LINE จริง | ดูขั้นตอน deploy ด้านล่าง |
| 9 | ทดสอบเปิด LIFF จากแชท OA / Rich Menu → เห็นฟอร์มสมัคร + login สำเร็จ | ⬜ |

### สิ่งที่ทีมตรวจแล้ว (ไม่เผยค่าลับ)

| รายการ | ผล |
|--------|-----|
| `LINE_LOGIN_CHANNEL_ID` | มี · เป็นตัวเลข |
| `LINE_LOGIN_CHANNEL_SECRET` | มี · ความยาวปกติ |
| `VITE_LIFF_ID` | มี · รูปแบบ `channelId-xxxx` · prefix ตรง Login Channel |
| `VITE_LIFF_URL` | มี · เป็น `https://liff.line.me/...` |
| Messaging API token | มี (ใช้ push ยืนยันหลังสมัคร) |
| ยืนยัน ID token จริงกับ LINE | ⬜ ต้องทดสอบใน LIFF (ต้องมี user login) |

> **หมายเหตุ:** การมีค่าใน `.env` ไม่เท่ากับ Endpoint ใน Console ตั้งถูกแล้ว — ต้องเช็คข้อ 3 เป็นพิเศษ

---

## 4. แจ้งเตือนเจ้าหน้าที่หลังมีใบสมัครใหม่

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| LINE User ID ของเจ้าหน้าที่ | ⬜ รอลูกค้า | ใส่ใน env `STAFF_LINE_USER_IDS` คั่นด้วย comma เช่น `Uaaa,Ubbb` |
| โค้ดรองรับแล้ว | ✅ | ถ้าว่าง ระบบ**ข้าม**การ push หา staff (ไม่ error) |
| ครอบคลุมเหตุการณ์ | ✅ | สมัครสมาชิก / ต่ออายุ / ส่งสลิปใหม่ / สมัครสัมมนา |

วิธีหา userId: ให้เจ้าหน้าที่เพิ่มเพื่อน OA แล้วพิมพ์ข้อความ → ดู `source.userId` ใน Cloud Functions logs หรือจาก LIFF `liff.getProfile()`

---

## 5. Rich Menu / ปุ่มใน LINE OA

| รายการ | สถานะ |
|--------|--------|
| ปุ่ม “สมัครสมาชิก” → LIFF `/register` | ⬜ ตั้งใน LINE Official Account Manager |
| ปุ่ม “ยืนยันสมาชิกเก่า” → LIFF `/register?flow=legacy` | ⬜ โค้ดพร้อมแล้ว — รอตั้งเมนู |
| ปุ่ม “ต่ออายุ” → LIFF `/renew` | ⬜ |
| ปุ่ม “สมัครสัมมนา” → LIFF `/seminar` | ⬜ |
| เช็คสถานะ (พิมพ์คำสั่ง / ปุ่ม) | ⬜ บอทตอบ Flex แล้ว — ตั้งปุ่มตามต้องการ |

---

## 6. อื่น ๆ ที่ต้องก่อน go-live

| รายการ | สถานะ |
|--------|--------|
| นโยบายใบเสร็จ / เลขที่ใบเสร็จชั่วคราว | ✅ ออกอัตโนมัติ `RC-T-YYYY-####` / `RC-YYYY-####` ตอนอนุมัติ |
| รายชื่อนายทะเบียน / เหรัญญิกใน Back Office | ✅ มี `/admin` + หน้าจัดการเจ้าหน้าที่ |
| ผูก LINE สมาชิกเก่า (legacy bind) | ✅ ค้นหา + ยืนยัน + bind ครบแล้ว |
| นำเข้า Excel สมาชิกเก่า | ✅ มีหน้า `/admin/legacy/import` — รอไฟล์ชุดจริงจากลูกค้า |
| สมาชิกส่งใหม่หลังถูกปฏิเสธ (LIFF) | ✅ หลัง data reject เปิด `/register` (prefill) |
| Firebase Auth Google provider | ⬜ ดูขั้นตอนใน [09-Platform-Accounts.md](./09-Platform-Accounts.md) |
| ปิด `ADMIN_OPEN_ACCESS` | ⬜ ตั้ง `false` ใน web + functions ก่อน production |
| ยืนยันข้อความไทยบนฟอร์ม / Flex | ⬜ ปรับตามลูกค้าได้ (ไม่บล็อกเปิดระบบ) |

---

## 7. Deploy (เมื่อพร้อม)

จาก root ของ repo (ต้อง login Firebase แล้ว และมีสิทธิ์โปรเจกต์ `abta-member`):

```bash
# สร้างไฟล์ env ของ Functions ให้ครบ (รวม LINE_LOGIN_*, WEB_ORIGIN, VITE_LIFF_URL, STAFF_LINE_USER_IDS)
# แล้ว:
npm run build:functions
npm run build:web
npx firebase deploy --only functions,hosting
```

หลัง deploy:

1. ตั้ง LIFF Endpoint = `https://abta-member.web.app/register`
2. เปิด LIFF จาก LINE → กรอกฟอร์ม + สลิปทดสอบ
3. ตรวจ Firestore `members` / `payments` + Storage `slips/`
4. ตรวจข้อความยืนยันในแชท OA
5. ปิด `ADMIN_OPEN_ACCESS` → เปิด Google Sign-In → ทดสอบ `https://abta-member.web.app/admin`

---

## สรุปสั้น ๆ สำหรับลูกค้า

กรุณาส่ง / ยืนยันสิ่งนี้:

1. **บัญชีธนาคาร** (ชื่อบัญชี, เลขบัญชี, ธนาคาร)  
2. **ยืนยันค่าธรรมเนียม 500 บาท** หรือแจ้งจำนวนจริง  
3. **LINE User ID ของเจ้าหน้าที่** ที่ต้องการรับแจ้งใบสมัครใหม่ (ถ้าต้องการ)  
4. ช่วยตรวจใน LINE Console ว่า **LIFF Endpoint** ชี้ `https://abta-member.web.app/register` แล้ว
