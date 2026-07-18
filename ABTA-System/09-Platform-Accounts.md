# บัญชีแพลตฟอร์มและบัญชีอีเมล — ABTA

> **วัตถุประสงค์:** รวมจุดเดียวว่าแต่ละแพลตฟอร์มใช้อีเมลอะไร เชื่อมกับอะไร และอันไหนรอโอนให้ลูกค้า  
> **อัปเดตล่าสุด:** 17 ก.ค. 2569  
> **สถานะ:** ตั้งค่าด้วย**ชื่อส่งมอบจริง** ตั้งแต่แรก — พัฒนา/ทดสอบบนชุดเดียวกัน แล้วโอน Ownership + Billing ให้ลูกค้าตอนส่งมอบ

---

## หลักการตั้งค่า (สำคัญ)


| ประเภท                          | ตอนเริ่มพัฒนา                                 | ตอนส่งมอบ                                      |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| **ชื่อโปรเจกต์ / OA**           | ใช้ชื่อจริงสำหรับส่งมอบเลย (ไม่ใส่ demo/test) | **ชุดเดิม** — เพิ่ม Owner ลูกค้า แล้วถอดของเรา |
| **อีเมล Owner**                 | `phetklaowork01@gmail.com` (ของเรา)           | เพิ่ม Gmail ลูกค้าเป็น Owner ทุกที่            |
| **ต้องผูกบัตรเดบิต / เติมเงิน** | **ใช้ Billing ใต้บัญชีนี้ที่มีอยู่แล้ว**      | ลูกค้าผูก Billing ของตัวเอง แล้วถอดของเราออก   |
| **Credentials / Secrets**       | เก็บใน env ของเรา (อย่า commit)               | ส่งให้ลูกค้าทางช่องทางปลอดภัย                  |


> ไม่สร้างชุด “demo” แยก — ไม่สร้าง Gmail ใหม่สำหรับโปรเจกต์นี้

---

## Naming Convention (ใช้ทั้งโปรเจกต์ — ชื่อส่งมอบ)


| รายการ                 | ชื่อที่แนะนำ                                  | เหตุผล                                             |
| ---------------------- | --------------------------------------------- | -------------------------------------------------- |
| อีเมล Owner / Billing  | `phetklaowork01@gmail.com`                    | บัญชีงานของเรา — มีบัตรอยู่แล้ว                    |
| ชื่อโปรเจกต์สั้น       | `abta-member`                                 | สั้น จำง่าย ใช้ซ้ำได้ทุกที่                        |
| Firebase Project ID    | `abta-member`                                 | Project ID เปลี่ยนทีหลังไม่ได้ — ตั้งชื่อส่งมอบเลย |
| Firebase Display Name  | `ABTA Member`                                 | เห็นใน Console ชัด                                 |
| Google Cloud Project   | ใช้ตัวเดียวกับ Firebase (สร้างอัตโนมัติ)      | ไม่ต้องตั้งแยก                                     |
| LINE Provider          | `ABTA`                                        | กลุ่ม Channel ทั้งหมด                              |
| LINE OA ชื่อแสดง       | `ABTA สมาชิก`                                 | หรือชื่อเต็มสมาคมถ้าลูกค้ายืนยันแล้ว               |
| LINE Messaging Channel | `ABTA Messaging`                              |                                                    |
| LINE Login Channel     | `ABTA Login`                                  | สำหรับ LIFF                                        |
| GitHub repo            | `Fastwork_ABTA`                               |                                                    |
| Hosting URL            | `abta-member.web.app` (Firebase ให้อัตโนมัติ) |                                                    |


> หลีกเลี่ยง: `demo`, `test`, `tmp`, `project1`, `line-bot`

---

## อีเมลที่ใช้

### อีเมลหลัก — ผู้พัฒนา (ใช้ทุกแพลตฟอร์มตอนนี้)


| ฟิลด์    | ค่า                                                                    |
| -------- | ---------------------------------------------------------------------- |
| อีเมล    | `phetklaowork01@gmail.com`                                             |
| ใช้กับ   | LINE Developers, LINE OA, Firebase Owner, GCP Billing, Cloud Functions |
| หมายเหตุ | บัญชีเดียวทั้ง Owner + Billing — ไม่สร้าง Gmail แยก                    |


### ตอนส่งมอบ


| ขั้นตอน | ทำอย่างไร                                                          |
| ------- | ------------------------------------------------------------------ |
| 1       | ลูกค้าสร้าง/ให้อีเมลสมาคม                                          |
| 2       | เพิ่มอีเมลลูกค้าเป็น **Owner** ใน Firebase + LINE (แอดมิน OA)      |
| 3       | ลูกค้าผูก **Billing** ของตัวเอง → ถอด Billing ของเรา               |
| 4       | ถอด `phetklaowork01@gmail.com` ออกจาก Owner หลังลูกค้ายืนยันรับงาน |


---

## แผนที่แพลตฟอร์ม (ใครใช้อีเมลอะไร + เชื่อมยังไง)

```
┌─────────────────────────────────────────────────────────────┐
│  Gmail: phetklaowork01@gmail.com                            │
│  (Owner + Billing ระหว่างพัฒนา)                              │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
     ┌──────────────────┐          ┌──────────────────────┐
     │ LINE Developers  │          │ Firebase / GCP       │
     │ Provider: ABTA   │          │ Project: abta-member │
     └────────┬─────────┘          └──────────┬───────────┘
              │                               │
     ┌────────┴────────┐                      │
     │                 │                      │
     ▼                 ▼                      ▼
 Messaging API    LINE Login         Hosting + Firestore
 (LINE OA)        (LIFF apps)        + Storage + Functions
     │                 │                      │
     │                 └──────────┬───────────┘
     │                            │
     │                     LIFF Endpoint URL
     │                     → Firebase Hosting
     │                            │
     └────── Webhook URL ─────────┘
             → Cloud Functions / Backend
```

---

## ตารางรายละเอียดแพลตฟอร์ม

กรอกคอลัมน์ **สถานะ** ตอนตั้งค่าเสร็จ

### 1. Google / Gmail


| รายการ                     | อีเมล                      | ผูกบัตร?      | สถานะ        |
| -------------------------- | -------------------------- | ------------- | ------------ |
| บัญชีงาน (Owner + Billing) | `phetklaowork01@gmail.com` | ✅ ใช้บัญชีนี้ | ✅ ยืนยันแล้ว |


---

### 2. Firebase + Google Cloud


| รายการ                             | ชื่อ / ค่า                      | อีเมล Owner                | Billing                   | เชื่อมกับ            | สถานะ               |
| ---------------------------------- | ------------------------------- | -------------------------- | ------------------------- | -------------------- | ------------------- |
| Firebase Project                   | `abta-member`                   | `phetklaowork01@gmail.com` | **บัญชีเดียวกัน**         | GCP Project เดียวกัน | ✅                   |
| Firestore                          | (ในโปรเจกต์เดียวกัน)            | —                          | รวมใน Firebase            | Members, Payments, … | ⬜ เปิดใช้ใน Console |
| Firebase Hosting                   | `abta-member.web.app`           | —                          | รวม                       | LIFF + Back Office   | ✅ (URL ตาม project) |
| Firebase Storage                   | สลิป / เอกสาร                   | —                          | รวม                       | อัปโหลดสลิป          | ⬜ เปิดใช้ใน Console |
| Cloud Functions                    | webhook + API                   | —                          | **Blaze — บัญชีเดียวกัน** | LINE Webhook         | ⬜ ทีหลัง            |
| Firebase Auth (Back Office) | **Google Sign-In only** | — | รวม | `/admin` login | ⬜ เปิด Google provider ใน Console |
| Web config ใน `.env`               | apiKey, projectId, appId, …     | —                          | —                         | Frontend             | ✅ มีแล้ว            |


**Firebase Auth — Google Sign-In (Back Office) — ต้องทำใน Console**

1. เปิด [Firebase Console](https://console.firebase.google.com/) → โปรเจกต์ `abta-member`
2. **Authentication** → **Sign-in method** → เปิด **Google** → บันทึก (ใช้ support email ของโปรเจกต์)
3. **Authentication** → **Settings** → **Authorized domains** ให้มีอย่างน้อย:
   - `abta-member.web.app`
   - `abta-member.firebaseapp.com`
   - `localhost` (สำหรับ dev)
4. เข้า BO ที่ `https://abta-member.web.app/admin` ด้วย Google บัญชี `phetklaowork01@gmail.com`  
   → ระบบ bootstrap เป็น super-admin อัตโนมัติ (คอลเลกชัน `staffUsers`)
5. จากหน้า **จัดการเจ้าหน้าที่** เพิ่มอีเมลเจ้าหน้าที่อื่น + เลือกบทบาท (แอดมิน / นายทะเบียน / เหรัญญิก — เลือกได้หลายอัน)

> **นโยบายสิทธิ์:** ผู้ที่มีบทบาท `admin` หรือ `isSuperAdmin` จัดการเจ้าหน้าที่ได้ · Firestore ยัง deny client R/W ทั้งหมด — BO เรียก Cloud Functions + Admin SDK เท่านั้น

**ตอนส่งมอบ:**

1. เพิ่มอีเมลลูกค้าเป็น Owner
2. ลูกค้าผูก Billing ของตัวเองเข้าโปรเจกต์ `abta-member`
3. ถอด Billing / Owner ของเราออก

**Credentials ที่จะได้ (เก็บนอก repo):**


| ตัวแปร                 | จากที่ไหน                           |
| ---------------------- | ----------------------------------- |
| `FIREBASE_PROJECT_ID`  | Project settings                    |
| `FIREBASE_WEB_API_KEY` | Project settings → General          |
| Service Account JSON   | Project settings → Service accounts |
| Hosting URL            | Hosting dashboard                   |


---

### 3. LINE Developers + LINE Official Account


| รายการ                  | ชื่อแนะนำ                        | อีเมลที่ใช้                | ผูกบัตร/แพ็กเกจ?                              | เชื่อมกับ                   | สถานะ                            |
| ----------------------- | -------------------------------- | -------------------------- | --------------------------------------------- | --------------------------- | -------------------------------- |
| LINE Developers ล็อกอิน | —                                | `phetklaowork01@gmail.com` | ไม่ตอนสร้าง                                   | —                           | ✅                                |
| Provider                | `ABTA` (หรือชื่อที่สร้าง)        | อีเมลเดียวกัน              | ไม่                                           | รวม Channel                 | ✅ น่าจะมีแล้ว                    |
| Messaging API Channel   | Channel ID ใน `.env`             | อีเมลเดียวกัน              | ไม่ตอนสร้าง                                   | Webhook → Cloud Functions   | ✅ ID + Secret มีใน `.env`        |
| LINE Official Account   | `ABTA สมาชิก`                    | อีเมลเดียวกัน              | **แพ็กเกจ OA — ใช้ของเราก่อนถ้าต้องเติมเงิน** | Rich Menu → LIFF URL        | ✅                                |
| Channel Access Token    | —                                | —                          | ไม่                                           | Backend ส่งข้อความ          | ⬜ ยังไม่มีใน `.env`              |
| LINE Login Channel      | `ABTA Login`                     | อีเมลเดียวกัน              | ไม่                                           | LIFF apps                   | ⬜ ยังไม่สร้าง / ยังไม่ใส่ `.env` |
| LIFF App(s)             | ตาม Flow (register / legacy / …) | —                          | ไม่                                           | Endpoint = Firebase Hosting | ⬜ ทำหลังมี Hosting deploy        |


**Credentials ที่ Backend ต้องเก็บ:**


| ตัวแปร                          | จาก Channel                      |
| ------------------------------- | -------------------------------- |
| `LINE_MESSAGING_CHANNEL_SECRET` | Messaging API                    |
| `LINE_MESSAGING_ACCESS_TOKEN`   | Messaging API                    |
| `LINE_LOGIN_CHANNEL_ID`         | LINE Login                       |
| `LINE_LOGIN_CHANNEL_SECRET`     | LINE Login (ถ้า verify ID token) |
| `LIFF_ID_`*                     | แต่ละ LIFF app                   |


> ตามนโยบาย LINE: **LIFF ต้องอยู่บน LINE Login channel** ไม่ใช่ Messaging API — ดู [07-Tech-Stack.md](./07-Tech-Stack.md)

**ตอนส่งมอบ:** เพิ่มลูกค้าเป็นแอดมิน OA + สิทธิ์ LINE Developers แล้วถอดของเราหลังยืนยันรับงาน

---

### 4. GitHub (รหัสโปรเจกต์)


| รายการ             | ชื่อแนะนำ     | อีเมล / บัญชี                | ผูกบัตร?            | สถานะ    |
| ------------------ | ------------- | ---------------------------- | ------------------- | -------- |
| Repository         | `abta-member` | บัญชี GitHub ที่ผูกกับงานเรา | ไม่ (Private ฟรีพอ) | ⬜        |
| Secrets (CI ถ้ามี) | —             | —                            | ไม่                 | ⬜ ทีหลัง |


> ส่งมอบด้วย transfer ownership / เชิญลูกค้าเป็น Owner / ส่ง zip ตามที่ตกลง

---

### 5. Fastwork


| รายการ    | ค่า                             | หมายเหตุ            |
| --------- | ------------------------------- | ------------------- |
| งาน       | ABTA ระบบสมาชิก                 | มีอยู่แล้ว          |
| อีเมล     | ของเราบน Fastwork               | ไม่ต้องสร้างใหม่    |
| สถานะเงิน | งวดแรก 30% รับแล้ว → เริ่มพัฒนา | อัปเดต 17 ก.ค. 2569 |


---

### 6. อื่น ๆ (ยังไม่จำเป็น Phase 1)


| แพลตฟอร์ม                     | ต้องตอนนี้?     | หมายเหตุ                                         |
| ----------------------------- | --------------- | ------------------------------------------------ |
| Domain จริง (เช่น abta.or.th) | ❌ ยังไม่        | ใช้ `abta-member.web.app` พอ — ผูกโดเมนทีหลังได้ |
| Google Workspace              | ❌ ไม่           | Gmail ธรรมดาพอ                                   |
| สมุดบัญชีธนาคารรับโอน         | ข้อมูลจากลูกค้า | ใส่ในฟอร์ม/ใบเสร็จ — ไม่ใช่บัญชีแพลตฟอร์ม        |
| PromptPay / Payment Gateway   | ❌ Phase 1       | Phase 1 = แนบสลิปแมนนวล                          |


---

## ลำดับตั้งค่าที่แนะนำ (ทำตามนี้)

ทำทีละขั้น แล้วติ๊กในตารางด้านบน

### วัน Setup (วันที่ 1–2)

1. **ล็อกอิน Google** ด้วย `phetklaowork01@gmail.com`
2. สร้าง [Firebase project](https://console.firebase.google.com/) ชื่อ `abta-member` (Billing ใช้บัญชีนี้)
3. เปิดใช้: **Firestore, Hosting, Storage** (+ Functions เมื่อพร้อม — แผน Blaze)
4. **ล็อกอิน [LINE Developers](https://developers.line.biz/console/)** ด้วยอีเมลเดียวกัน → สร้าง Provider `ABTA`
5. สร้าง **Messaging API channel** + ผูก/สร้าง **LINE OA** ชื่อ `ABTA สมาชิก`
6. สร้าง **LINE Login channel** ใต้ Provider เดียวกัน → เพิ่ม LIFF (Endpoint ชี้ Hosting ทีหลังได้)
7. สร้าง **GitHub repo** `abta-member`
8. กรอกค่าที่ได้กลับมาในตารางนี้ + เก็บ secrets ใน `.env.local` / Password Manager

### ยังไม่ทำตอนนี้

- สร้าง Gmail ใหม่ชื่อสมาคม / ชื่อโปรเจกต์แยก
- ซื้อ Domain / Workspace

---

## สรุปสั้น: สร้างใหม่ vs ใช้ของที่มี


| สร้างใหม่ (ชื่อส่งมอบ)                               | ใช้บัญชีที่มีอยู่                                  |
| ---------------------------------------------------- | -------------------------------------------------- |
| Firebase `abta-member`                               | อีเมล `phetklaowork01@gmail.com` (Owner + Billing) |
| LINE Provider `ABTA` + 2 Channels + OA `ABTA สมาชิก` | บัตรเดบิตที่ผูก GCP อยู่แล้ว                       |
| GitHub `abta-member`                                 | Fastwork / เบอร์ติดต่อ                             |


---

## Checklist ส่งมอบ

- เพิ่มอีเมลลูกค้าเป็น Owner ใน Firebase + LINE
- ลูกค้าผูก Billing ของตัวเอง → ถอด Billing ของเรา
- ส่งคู่มือ + credentials (ช่องทางปลอดภัย)
- ถอด `phetklaowork01@gmail.com` ออกหลังลูกค้ายืนยันรับงาน

---

## บันทึกค่าจริงหลังตั้งค่า (กรอกเอง — อย่า commit secrets)


| ค่า                       | ใส่ตรงนี้ (หรือชี้ไป Password Manager)                  |
| ------------------------- | ------------------------------------------------------- |
| Gmail Owner               | `phetklaowork01@gmail.com`                              |
| Firebase Project ID       | `abta-member`                                           |
| Hosting URL               | `https://abta-member.web.app`                           |
| Messaging Channel ID      | ✅ ใน `.env` (`Channel_ID_messaging_api`)               |
| Messaging Channel Secret  | ✅ ใน `.env`                                            |
| Channel Access Token      | ✅ ใน `.env`                                            |
| LINE Login Channel ID     | ✅ ใน `.env` (`Channel_ID_line_login`)                  |
| LINE Login Channel Secret | ✅ ใน `.env`                                            |
| LIFF ID / URL             | ✅ ใน `.env` (`LIFF_ID`, `LIFF_URL`)                    |
| Service Account JSON      | ✅ ไฟล์ `abta-member-firebase-adminsdk-*.json` (นอก git)|
| Webhook URL               | ⬜ ตั้งหลังมี Cloud Functions / Backend                  |


> **ห้าม** ใส่ Channel Secret / Access Token / Service Account JSON ในไฟล์ doc นี้ — ใช้ `.env` + JSON ที่อยู่ใน `.gitignore`

---

## สถานะ `.env` (อัปเดต 17 ก.ค. 2569)

### ครบแล้ว — พอเริ่มพัฒนา

| กลุ่ม | สถานะ |
|-------|-------|
| Firebase web config | ✅ |
| Messaging API (ID + Secret + Access Token) | ✅ |
| LINE Login (ID + Secret) | ✅ |
| LIFF (ID + URL) | ✅ |
| Admin SDK JSON | ✅ ไฟล์แยก |

### ยังไม่ต้องใส่ใน `.env` ตอนนี้

| ค่า | เมื่อไหร่ |
|-----|----------|
| Webhook URL | หลังมี Backend / Cloud Functions |
| `GOOGLE_APPLICATION_CREDENTIALS` | ตอนเขียน Backend — ชี้ path ไปไฟล์ JSON |
| Hosting URL แยกตัวแปร | optional (`https://abta-member.web.app`) |

### หมายเหตุรูปแบบ `.env`

ตอนเขียนโค้ดจริง แนะนำปรับเป็นมาตรฐาน dotenv:

- คอมเมนต์ใช้ `#` ไม่ใช่ `//`
- ไม่มีช่องว่างรอบ `=` เช่น `KEY=value`
- ชื่อตัวแปรแบบ `LINE_MESSAGING_ACCESS_TOKEN` จะอ่านง่ายตอน import

ยังไม่จำเป็นต้องแก้วันนี้ — เก็บค่าครบแล้วพอ Setup

### ลำดับทำต่อ

1. ยืนยัน LIFF Endpoint ใน Console = `https://abta-member.web.app`
2. เริ่มโครงสร้างโปรเจกต์ + ระบบเช็คสถานะ LINE OA
3. ตั้ง Webhook เมื่อมี Backend URL แล้ว

