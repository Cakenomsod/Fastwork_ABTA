# รายการค้าง — สมัครสมาชิกใหม่ (รอข้อมูลจากลูกค้า / ตั้งค่า)

> สร้างเมื่อ: 18 ก.ค. 2569  
> ใช้คู่กับ: [04-Workflows.md](./04-Workflows.md), [07-Tech-Stack.md](./07-Tech-Stack.md), [09-Platform-Accounts.md](./09-Platform-Accounts.md), mockup  
> **สถานะโค้ด:** มี vertical slice สมัครใหม่แล้ว (`/register` + `POST /api/members/register`) — รายการด้านล่างยังต้องยืนยันก่อน go-live

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
| ยืนยัน ID token จริงกับ LINE | ⬜ ต้องทดสอบใน LIFF (ต้องมี user login) — API verify ของ LINE เข้าถึงได้ |

> **หมายเหตุ:** การมีค่าใน `.env` ไม่เท่ากับ Endpoint ใน Console ตั้งถูกแล้ว — ต้องเช็คข้อ 3 เป็นพิเศษ

---

## 4. แจ้งเตือนเจ้าหน้าที่หลังมีใบสมัครใหม่

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| LINE User ID ของเจ้าหน้าที่ | ⬜ รอลูกค้า | ใส่ใน env `STAFF_LINE_USER_IDS` คั่นด้วย comma เช่น `Uaaa,Ubbb` |
| ว่างไว้ | ✅ รองรับแล้ว | ถ้าว่าง ระบบ**ข้าม**การ push หา staff (ไม่ error) |

วิธีหา userId: ให้เจ้าหน้าที่เพิ่มเพื่อน OA แล้วพิมพ์ข้อความ → ดู `source.userId` ใน Cloud Functions logs หรือจาก LIFF `liff.getProfile()`

---

## 5. Rich Menu / ปุ่มใน LINE OA

| รายการ | สถานะ |
|--------|--------|
| ปุ่ม “สมัครสมาชิก” → `VITE_LIFF_URL` (หรือ deep link LIFF) | ⬜ ตั้งใน LINE Official Account Manager |
| ปุ่ม “ยืนยันสมาชิกเก่า” | ⬜ Phase ถัดไป (ตอนนี้บนฟอร์มมีแค่ปุ่ม stub) |

---

## 6. อื่น ๆ ที่ยังไม่บล็อกโค้ด แต่ต้องก่อน go-live

| รายการ | สถานะ |
|--------|--------|
| นโยบายใบเสร็จ / เลขที่ใบเสร็จชั่วคราว | ⬜ ตาม Back Office ขั้นที่ 1 |
| รายชื่อนายทะเบียน / เหรัญญิกใน Back Office | ⬜ ยังไม่มี BO UI |
| ฐานข้อมูลสมาชิกเก่า (legacy bind) | ⬜ ยังเป็น stub CTA |
| ยืนยันข้อความไทยบนฟอร์ม / Flex หลังสมัคร | ⬜ ปรับตามลูกค้าได้ |

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

---

## สรุปสั้น ๆ สำหรับลูกค้า

กรุณาส่ง / ยืนยันสิ่งนี้:

1. **บัญชีธนาคาร** (ชื่อบัญชี, เลขบัญชี, ธนาคาร)  
2. **ยืนยันค่าธรรมเนียม 500 บาท** หรือแจ้งจำนวนจริง  
3. **LINE User ID ของเจ้าหน้าที่** ที่ต้องการรับแจ้งใบสมัครใหม่ (ถ้าต้องการ)  
4. ช่วยตรวจใน LINE Console ว่า **LIFF Endpoint** ชี้ `https://abta-member.web.app/register` แล้ว
