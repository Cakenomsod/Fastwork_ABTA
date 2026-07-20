# แผนนำเข้าฐานข้อมูลสมาชิกเก่า (Legacy Import)

> แหล่งข้อมูล: [`Data/NewMemDatabase.xlsx`](./Data/NewMemDatabase.xlsx)  
> อ้างอิง Flow: [02-Phase-1-Confirmed.md](./02-Phase-1-Confirmed.md), [04-Workflows.md](./04-Workflows.md)  
> อ้างอิง Schema: [07-Tech-Stack.md](./07-Tech-Stack.md)  
> วันที่จัดทำ: 19 ก.ค. 2569

---

## 1. สรุปสั้น ๆ

| รายการ | รายละเอียด |
|--------|------------|
| **เป้าหมาย** | นำข้อมูลสมาชิกเก่าจาก Excel เข้าระบบ เพื่อรองรับ Flow **ยืนยันสมาชิกเก่า + ผูก LINE** |
| **แหล่งข้อมูล** | `NewMemDatabase.xlsx` — Sheet `Member` + `Transaction` |
| **ที่เก็บในระบบ** | Firestore collection `legacyMembers` (+ ประวัติจ่ายเงินเก่าแยก) |
| **ไม่ทำ** | ไม่เขียนทับ collection `members` ของระบบใหม่ด้วยเลขสมาชิกเก่า |
| **DB ที่แนะนำ** | **NoSQL (Firestore) ตามระบบเดิม** — ไม่แยกไป SQL |

---

## 2. SQL vs NoSQL — ควรใช้อะไร?

### คำตอบสั้น ๆ

**ใช้ NoSQL (Firestore) แบบเดิม** — ไม่ควรแยกฐานข้อมูลสมาชิกเก่าไป SQL ใน Phase นี้

### เหตุผล

| มุมมอง | Firestore (NoSQL) เดิม | SQL แยก (เช่น Postgres / Supabase) |
|--------|------------------------|-------------------------------------|
| สอดคล้องระบบปัจจุบัน | ✅ ทั้งโปรเจกต์ใช้ Firebase แล้ว | ❌ ต้องดูแล 2 ฐานข้อมูล |
| Flow ผูก LINE | ✅ `legacyMembers` → สร้าง `members` ในที่เดียว | ❌ ต้อง sync ข้ามระบบ |
| รูปแบบข้อมูล Excel | ✅ เอกสารต่อสมาชิก + nested ประวัติได้ | ใช้ได้ แต่เกินความจำเป็น |
| การค้นหายืนยันตัวตน | ✅ query หลายฟิลด์ + ให้ผู้ใช้เลือกเมื่อซ้ำ | SQL เก่งกว่าถ้าข้อมูลใหญ่มาก |
| ค่าใช้จ่าย / ops | ✅ รวมใน Firebase เดิม | ❌ hosting, connection, backup เพิ่ม |
| ขอบเขต Phase 1 | ✅ ตามสเปกที่มีอยู่แล้ว | ❌ เปลี่ยนสถาปัตย์กลางคัน |

### เมื่อไหร่ถึงจะพิจารณา SQL

- ต้องรายงาน / join ซับซ้อนข้ามตารางจำนวนมาก
- ข้อมูลสมาชิกเก่าหลายหมื่น–แสนรายการ และต้อง full-text / fuzzy search จริงจัง
- มีทีมดูแล DB แยก หรือย้ายทั้งระบบออกจาก Firebase

→ **ตอนนี้ยังไม่ถึงจุดนั้น** — Excel ตัวอย่างมีจำนวนน้อย และ use case หลักคือ lookup เพื่อผูก LINE

### ข้อสรุปสถาปัตย์

```
NewMemDatabase.xlsx
        │
        ▼ (สคริปต์ import ครั้งเดียว / รอบอัปเดต)
┌───────────────────┐
│  legacyMembers    │  ← อ่านอย่างเดียวจากฝั่งสมาชิก
│  legacyPayments?  │  ← ประวัติจาก Sheet Transaction (optional)
└─────────┬─────────┘
          │ Flow: ยืนยันตัวตน + ผูก LINE
          ▼
┌───────────────────┐
│  members          │  memberId ใหม่ (ABTA-YYYY-####)
│  payments         │  + legacyMemberId อ้างอิง
└───────────────────┘
```

---

## 3. สิ่งที่อยู่ในไฟล์ Excel (ณ วันที่สำรวจ)

### Sheet `Member` (20 คอลัมน์)

| # | คอลัมน์ Excel | ใช้ทำอะไร |
|---|---------------|-----------|
| 0 | DateStamp | วันนำเข้า / audit |
| 1 | ที่อยู่อีเมล | `email` (secondary match) |
| 2 | เบอร์โทรติดต่อ | `phone` (secondary match) |
| 3 | ประเภทสมาชิก | สามัญ / วิสามัญ / กิตติมาศักดิ์ → เก็บเพิ่ม |
| 4 | เลขที่สมาชิก | **`legacyMemberId`** (เช่น `1-014`) |
| 5 | ชื่อสถานประกอบการ | `buildingName` / `organization` |
| 6 | เบอร์โทรสถานประกอบการ | เก็บเพิ่ม |
| 7 | ที่อยู่สถานประกอบการ | เก็บเพิ่ม |
| 8 | เป็นสมาชิกสมาคมแบบ | นิติบุคคล / บุคคลธรรมดา |
| 9 | ชื่อบุคคล/นิติบุคคล | `legalEntityName` หรือชื่อบุคคล |
| 10 | ชื่อ-นามสกุลผู้แทนนิติฯ | แยกเป็น `firstName` + `lastName` |
| 11 | เลขที่บัตรประชาชน/นิติบุคคล | เก็บเพิ่ม (sensitive) |
| 12 | ที่อยู่บุคคล/นิติบุคคล | เก็บเพิ่ม |
| 13–15 | ไฟล์แนบ | ข้ามถ้ายังไม่มี URL |
| 16–18 | นายทะเบียน / วันที่ตรวจ / วันที่รับรอง | audit |
| 19 | สถานะ | Active / Expired / NonActive / Pending |

**ตัวอย่างสถานะในไฟล์ตัวอย่าง:** Active 2, Expired 1, NonActive 1, Pending 1

### Sheet `Transaction` (11 คอลัมน์)

| # | คอลัมน์ | หมายเหตุ |
|---|--------|----------|
| 1–4 | วันโอน / รายการ / ประเภท / จำนวนเงิน | ประวัติหรือ master ราคา |
| 5 | เลขที่สมาชิก | เชื่อมกับ Member |
| 6 | เลขที่ใบเสร็จ | อ้างอิงเก่า (เช่น `M-999`) |
| 7–8 | เหรัญญิกตรวจสอบ / วันที่ | audit |
| 9 | วันที่พ้นสมาชิกภาพ | → `expiryDate` |
| 10 | อีเมล์ใบเสร็จ | flag / ช่องทาง |

แถวที่มีเลขสมาชิก = ประวัติจริง · แถวไม่มีเลขสมาชิก = master ค่าธรรมเนียม (สมัครใหม่ / เปลี่ยนประเภท / ต่ออายุ)

---

## 4. Mapping เข้า Schema ระบบ

### 4.1 `legacyMembers` (อ่านอย่างเดียว)

ตาม [07-Tech-Stack.md](./07-Tech-Stack.md) + ฟิลด์ขยายจาก Excel:

| Field | แหล่ง / กติกา |
|-------|----------------|
| `legacyMemberId` | เลขที่สมาชิก |
| `firstName`, `lastName` | นิติบุคคล → แยกจากผู้แทน · บุคคลธรรมดา → แยกจากชื่อบุคคล/นิติบุคคล |
| `legalEntityName` | ชื่อบุคคล/นิติบุคคล (กรณีนิติฯ) หรือว่าง/ซ้ำชื่อได้ตามกฎ match |
| `buildingName` | ชื่อสถานประกอบการ |
| `organization` | ชื่อสถานประกอบการ (หรือคัดลอก buildingName) |
| `phone`, `email` | จากคอลัมน์ติดต่อ |
| `status` | map จาก Excel (ตารางด้านล่าง) |
| `expiryDate` | จาก Transaction `วันที่พ้นสมาชิกภาพ` ล่าสุดของเลขนั้น (ถ้ามี) |
| `memberType` | สามัญ / วิสามัญ / กิตติมาศักดิ์ |
| `entityType` | นิติบุคคล / บุคคลธรรมดา |
| `idNumber` | เลขบัตร/นิติบุคคล (เก็บแบบจำกัดสิทธิ์) |
| `businessPhone`, `businessAddress`, `personAddress` | จาก Excel |
| `registrarChecked`, `reviewedAt`, `certifiedAt` | จาก Excel |
| `importedAt` | เวลาที่รันสคริปต์ |
| `sourceFile` | `NewMemDatabase.xlsx` |

### 4.2 Map สถานะ Excel → ระบบ

| Excel `สถานะ` | `legacyMembers.status` (แนะนำ) | หมายเหตุตอน bind |
|---------------|--------------------------------|-------------------|
| `Active` | `active` | ผูก LINE ได้ตามปกติ |
| `Expired` | `expired` | ผูกได้ แต่ควรพาไปต่ออายุ |
| `NonActive` | `non_active` | แจ้ง / ให้แอดมินช่วย |
| `Pending` | `pending` | ยังไม่รับรอง — ระวังก่อนผูกอัตโนมัติ |

### 4.3 หลังยืนยันตัวตนสำเร็จ → สร้างใน `members`

| Field | ค่า |
|-------|-----|
| `memberId` | เลขรูปแบบใหม่ `ABTA-YYYY-####` |
| `legacyMemberId` | เลขเก่าจาก Excel |
| `linkType` | `legacy_bind` |
| `lineUserId` / `lineLinkedAt` | จาก LIFF |
| ชื่อ / นิติฯ / ตึก / โทร / อีเมล | คัดลอกจาก legacy ที่ยืนยันแล้ว |
| `status` | ตามสถานะ legacy (หรือ `active` ถ้ายืนยันว่ายังมีสิทธิ์) |
| `expiryDate` | จาก legacy |

**ห้าม** ใช้เลข Excel (`1-014`) เป็น `memberId` ของระบบใหม่

### 4.4 Transaction

| ประเภทแถว | แผน |
|-----------|------|
| มี `เลขที่สมาชิก` | เก็บใน `legacyPayments` หรือ subcollection `legacyMembers/{id}/transactions` |
| ไม่มีเลขสมาชิก (master ราคา) | ย้ายไป config / เอกสารค่าธรรมเนียม — **ไม่** ปนกับประวัติสมาชิก |

อย่า seed ทับ `payments` ของระบบใหม่จนกว่าจะ bind แล้ว และมีเหตุผลทางธุรกิจให้แสดงใบเสร็จเก่า

---

## 5. แผนงานเป็น Phase

### Phase A — Import ข้อมูลเก่า (Foundation)

**เป้าหมาย:** มี `legacyMembers` ใน Firestore พร้อมค้นหา

1. นิยาม TypeScript types สำหรับ `LegacyMemberDoc` (+ optional `LegacyPaymentDoc`)
2. สร้างสคริปต์ `apps/functions/scripts/import-legacy-from-xlsx.ts`
   - อ่าน `ABTA-System/Data/NewMemDatabase.xlsx`
   - normalize วันที่ (รองรับ พ.ศ. / รูปแบบปนกัน)
   - แยกชื่อ–นามสกุลอย่างมีกฎ (และ log กรณีแยกไม่ชัด)
   - upsert ตาม `legacyMemberId` (รันซ้ำได้)
3. รันกับไฟล์ตัวอย่าง → ตรวจใน Console
4. เอกสารวิธีรันเมื่อได้ Excel จริงชุดเต็มจากลูกค้า

**ผลลัพธ์:** collection พร้อม · ยังไม่มี UI สมาชิก

### Phase B — Flow ยืนยันสมาชิกเก่า + ผูก LINE

**เป้าหมาย:** สมาชิกเก่าใช้งานระบบใหม่ได้โดยไม่สมัครซ้ำ / ไม่แนบสลิป

1. API ค้นหา legacy (match ชื่อ+นามสกุล+นิติบุคคล+ชื่อตึก · phone/email เป็น secondary)
2. LIFF หน้า “ยืนยันสมาชิกเก่า” (ตามสเปกที่มีอยู่)
3. กรณีพบหลายรายการ → ให้เลือก
4. กรณีไม่พบ → นำทางไปสมัครใหม่
5. ยืนยันแล้ว → สร้าง `members` + ผูก `lineUserId` + `linkType: legacy_bind`
6. Back Office: มองเห็น `legacyMemberId` / ค้นหาสมาชิกที่มาจาก legacy

**ผลลัพธ์:** Flow ใน [04-Workflows.md](./04-Workflows.md) ใช้งานได้จริง

### Phase C — ประวัติ Transaction + ค่าธรรมเนียม

1. Import ประวัติจ่ายเงินเก่าที่ผูกเลขสมาชิก
2. แสดง expiry / ใบเสร็จเก่าหลัง bind (ถ้าต้องการ)
3. แยก master ราคาไปเป็น config ค่าสมัคร / ต่ออายุ / เปลี่ยนประเภท

**ผลลัพธ์:** ข้อมูลครบสำหรับต่ออายุและ audit

---

## 6. กฎสำคัญตอน Implement

1. **อย่า match ด้วยอีเมลหรือเบอร์อย่างเดียว** — ข้อมูลเก่าอาจซ้ำ (แอดมินสมัครแทน)
2. **เลขเก่า ≠ เลขใหม่** — `legacyMemberId` เป็นอ้างอิงเท่านั้น
3. **Import แบบ upsert** — รันซ้ำเมื่อลูกค้าส่งไฟล์อัปเดตได้โดยไม่สร้างซ้ำ
4. **Sensitive fields** (`idNumber`) — ไม่ส่งออกไป LIFF / public API โดยไม่จำเป็น
5. **Pending / NonActive** — กำหนดนโยบายชัดก่อนอนุญาต bind อัตโนมัติ
6. **ไฟล์แนบใน Excel** — ข้ามจนกว่าจะมีที่เก็บไฟล์จริง

---

## 7. Checklist งาน

### Phase A
- [x] เพิ่ม `LegacyMemberDoc` (+ types สถานะ legacy)
- [x] สคริปต์ import จาก xlsx
- [x] รันทดสอบกับ `NewMemDatabase.xlsx` (5 สมาชิก)
- [x] ตรวจเอกสารใน Firestore
- [x] เขียนคำสั่งรัน + หมายเหตุวันที่ พ.ศ.

### Phase B
- [x] API ค้นหา / ยืนยัน legacy
- [x] LIFF ฟอร์มยืนยันสมาชิกเก่า
- [x] สร้าง `members` + `legacy_bind`
- [x] ทดสอบ edge: ไม่พบ / พบหลายรายการ / Active vs Expired
- [x] แสดงใน Back Office

### Phase C
- [x] Import Transaction ที่ผูกเลขสมาชิก
- [x] แยก master ราคา
- [x] (ถ้าต้องการ) แสดงประวัติใบเสร็จเก่าหลัง bind

---

## 8. ความเสี่ยงและสิ่งที่ต้องถามลูกค้า

| ความเสี่ยง | แนวทาง |
|------------|--------|
| ชื่อ–นามสกุลในช่องเดียว แยกยาก | กฎแยกคำท้ายเป็นนามสกุล + ให้แอดมินแก้ใน BO |
| วันที่ พ.ศ. / format ปน | normalize ในสคริปต์ + ทดสอบกับไฟล์จริง |
| สมาชิก Pending ควรผูก LINE ได้หรือไม่ | ถามสมาคมก่อน lock นโยบาย |
| Excel ชุดเต็มมีกี่แถว / อัปเดตบ่อยแค่ไหน | ถ้าอัปเดตบ่อย → upsert + เก็บ `importedAt` |
| ไฟล์แนบจะย้ายมา Storage หรือไม่ | Phase หลัง — ไม่บล็อก import ตัวตน |

---

## 9. ลำดับแนะนำให้เริ่มทันที

1. **ยืนยันใช้ Firestore** สำหรับ legacy (เอกสารนี้)  
2. Implement **Phase A** — สคริปต์ import + `legacyMembers`  
3. ต่อด้วย **Phase B** เมื่อ LIFF / register flow พร้อมต่อยอด  
4. **Phase C** เมื่อมีไฟล์ Transaction ครบและต้องการแสดงประวัติ

---

## 10. อ้างอิงไฟล์ในโค้ด (จุดต่อ)

| ส่วน | พาธโดยประมาณ |
|------|----------------|
| Member types ปัจจุบัน | `apps/functions/src/members/types.ts` |
| Seed ตัวอย่าง | `apps/functions/scripts/seed-demo-members.ts` |
| สคริปต์ import (ใหม่) | `apps/functions/scripts/import-legacy-from-xlsx.ts` |
| Schema เอกสาร | `ABTA-System/07-Tech-Stack.md` → ตาราง LegacyMembers |
| ข้อมูลต้นทาง | `ABTA-System/Data/NewMemDatabase.xlsx` |
