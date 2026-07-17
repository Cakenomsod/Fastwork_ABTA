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
