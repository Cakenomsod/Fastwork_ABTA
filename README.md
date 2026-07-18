# ABTA Member — Monorepo

ระบบสมาชิก ABTA (LINE OA + Firebase)

## โครงสร้าง

```
apps/
  web/         React (Vite) — LIFF + เว็บ
  functions/   Cloud Functions — API + LINE webhook
ABTA-System/   เอกสารโปรเจกต์
```

## Setup เครื่องตัวเอง

```bash
npm install
cp .env.example .env   # แล้วใส่ค่าจริง
npm run dev            # http://localhost:5173
```

## Deploy

| คำสั่ง | ผล |
|--------|-----|
| `npm run deploy:hosting` | build web → Firebase Hosting |
| `npm run deploy:functions` | build + deploy Cloud Functions |
| `npm run deploy` | ทั้ง Hosting + Functions |

**Production URL:** https://abta-member.web.app

**Webhook (หลัง deploy functions):** `https://abta-member.web.app/api/line/webhook`

## ทดสอบเช็คสถานะ LINE OA ⭐

ระบบ "เช็คสถานะ" ตอบกลับผ่าน LINE Messaging API เป็น **Flex Message** (บัตรสมาชิก + สถานะ + ใบเสร็จ)
พร้อมหน้าเว็บสถานะแบบเต็มที่ `https://abta-member.web.app/status`

### 1. Seed ข้อมูลสมาชิกตัวอย่าง

```bash
cd apps/functions
npm run seed
```

ใช้ Service Account JSON ที่ repo root โดยอัตโนมัติ (หรือกำหนด `GOOGLE_APPLICATION_CREDENTIALS`)
สร้างสมาชิกตัวอย่าง 3 ราย:

| Member ID | ชื่อ | สถานะ | ใบเสร็จ |
|-----------|------|-------|---------|
| `ABTA-2026-0001` | ธนกร วัฒนสมบัติ | สมาชิกสมบูรณ์ | ตัวจริง |
| `ABTA-T-2026-0087` | ศิริพร แสงทอง | สมาชิกชั่วคราว | ชั่วคราว |
| `ABTA-2025-0450` | ประเสริฐ ธำรงกิจ | หมดอายุ | — |

### 2. ผูก LINE userId ของคุณกับสมาชิกทดสอบ

สมาชิกหลัก `ABTA-2026-0001` ผูกกับ `lineUserId` ตัวอย่าง — ให้ใส่ userId จริงของคุณเพื่อทดสอบ:

```bash
# bash
DEMO_LINE_USER_ID=Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx npm run seed
```

```powershell
# PowerShell
$env:DEMO_LINE_USER_ID="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; npm run seed
```

> หา LINE userId ของตัวเองได้จาก log ของ webhook (เพิ่มเพื่อน OA แล้วพิมพ์อะไรก็ได้ → ดู `source.userId` ใน Cloud Functions logs) หรือจาก LIFF `liff.getProfile()`

### 3. ทดสอบบน LINE

1. เพิ่มเพื่อน LINE OA `ABTA สมาชิก`
2. พิมพ์ **"เช็คสถานะ"** (รองรับ `สถานะ`, `status`, `check status`, `ดูสถานะ` ฯลฯ)
3. บอทตอบกลับ Flex Message: บัตรสมาชิก + Member ID + สถานะ + วันหมดอายุ (พ.ศ.) + การชำระเงิน + ใบเสร็จ + สัมมนา + ปุ่มเปิดบัตร/ใบเสร็จ/ดูสถานะแบบเต็ม
4. พิมพ์ **"ช่วยเหลือ"** เพื่อดูเมนูคำสั่ง
5. ถ้ายังไม่ผูกบัญชี → ตอบ Flex แนะนำให้ลงทะเบียน/ยืนยันสมาชิก

### 4. ทดสอบหน้าเว็บสถานะ (สำหรับปุ่มใน Flex)

```
https://abta-member.web.app/status?m=<memberId>&t=<publicToken>
```

`publicToken` ถูกสร้างตอน seed (gating เพื่อไม่ให้เดา Member ID เปิดดู PII) — endpoint API:

```
GET /api/members/status?m=<memberId>&t=<publicToken>
```

## สมัครสมาชิกใหม่ (LIFF)

| รายการ | ค่า |
|--------|-----|
| หน้าฟอร์ม | `https://abta-member.web.app/register` |
| LIFF Endpoint (ตั้งใน LINE Console) | ชี้ URL ด้านบน |
| API | `POST /api/members/register` (ต้องมี LINE Login ID token) |

รายการค้างจากลูกค้า (บัญชีธนาคาร, ค่าธรรมเนียม, staff IDs): [ABTA-System/10-Open-Items-Registration.md](./ABTA-System/10-Open-Items-Registration.md)

### ทดสอบสมัคร

1. ตั้ง LIFF Endpoint = `/register` แล้วเปิดจาก `VITE_LIFF_URL` ใน LINE
2. กรอกฟอร์ม + แนบสลิป JPG/PNG ≤ 5MB → ส่ง
3. ตรวจข้อความยืนยันใน OA + Firestore `members` / `payments`
4. บัญชีที่ผูกแล้วจะสมัครซ้ำไม่ได้ → แนะนำให้เช็คสถานะ

```bash
# local UI
npm run dev
# เปิด http://localhost:5173/register (ส่งจริงต้องมี ID token จาก LIFF)
```

## GitHub Actions

Workflows:

- `.github/workflows/deploy-hosting.yml` — push `main` → Hosting live, PR → preview URL
- `.github/workflows/deploy-functions.yml` — เปลี่ยน functions → deploy

### Secrets ที่ต้องใส่ใน GitHub

Repo → **Settings → Secrets and variables → Actions**

| Secret | ค่า |
|--------|-----|
| `FIREBASE_SERVICE_ACCOUNT_ABTA_MEMBER` | เนื้อหา JSON ทั้งไฟล์ Service Account |
| `VITE_FIREBASE_API_KEY` | จาก `.env` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `abta-member.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `abta-member` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `abta-member` (bucket จริง — ไม่ใช่ `.firebasestorage.app`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | จาก `.env` |
| `VITE_FIREBASE_APP_ID` | จาก `.env` |
| `VITE_FIREBASE_MEASUREMENT_ID` | จาก `.env` |
| `VITE_LIFF_ID` | จาก `.env` |
| `VITE_LIFF_URL` | จาก `.env` |
| `LINE_MESSAGING_CHANNEL_ID` | สำหรับ Functions |
| `LINE_MESSAGING_CHANNEL_SECRET` | สำหรับ Functions |
| `LINE_MESSAGING_ACCESS_TOKEN` | สำหรับ Functions |
| `LINE_LOGIN_CHANNEL_ID` | สำหรับ Functions |
| `LINE_LOGIN_CHANNEL_SECRET` | สำหรับ Functions |

Service Account ต้องมีสิทธิ์ประมาณ: Firebase Hosting Admin, Cloud Functions Admin, Service Account User

เอกสารบัญชีแพลตฟอร์ม: [ABTA-System/09-Platform-Accounts.md](./ABTA-System/09-Platform-Accounts.md)
