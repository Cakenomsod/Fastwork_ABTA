# Member UI Audit + Go-live polish (2026-08-02)

Impeccable product-register audit of LINE member surfaces, plus fixes shipped the same evening.

## Scope

Landing `/`, Register, Renew, Seminar, Slip, Status/Card, Receipt — not Back Office.

## Findings (P0–P2)

### P0 — fixed

| Issue | Fix |
|-------|-----|
| บัญชีรับโอนว่าง → สมัคร/ต่ออายุ/สัมมนาส่งเงินไม่ได้ | ใส่บัญชีกรุงไทยใน `TransferBank.tsx` |
| ค่าธรรมเนียม flat 500 ไม่ตรงลูกค้า | ตารางราคาตามประเภท + ประเภท **สมทบ** |

### P1 — fixed / improved

| Issue | Fix |
|-------|-----|
| สมัครบังคับ ordinary | เลือก สามัญ / วิสามัญ / สมทบ + คิดราคา |
| ต่ออายุไม่มีเปลี่ยนประเภท | เลือกประเภท + คิดราคาต่ออายุ |
| Renew pending เป็น dead-end | CTA «ดูสถานะคำขอ» |
| Landing อ่อน / คนละแบรนด์ | atmosphere เขียวทอง + CTA สมัคร/ยืนยันเก่า |
| คำพูดบอทแข็ง / มี emoji มาก | ปรับ copy สุภาพใน `messages.ts` |

### P1–P2 — remaining (ไม่บล็อกส่งดู UI)

| Issue | Notes |
|-------|-------|
| Register ฟอร์มยังยาว (แม้มี 3 ขั้นแล้ว) | progressive disclosure พอใช้; polish ต่อได้ |
| Rich Menu ใน OA | เอกสาร `14-Rich-Menu-Guide.md` — ตั้งใน OA Manager |
| LIFF Endpoint / staff LINE IDs / `ADMIN_OPEN_ACCESS` | รายการ go-live ops ยังต้องยืนยัน |

### P1 เก็บเพิ่มหลัง audit subagent (2026-08-02 ค่ำ)

| Issue | Fix |
|-------|-----|
| Seminar empty-flash | `listPhase` loading/ready/error |
| Register copy “Member ID” | → เลขสมาชิก |
| Receipt Ctrl+P บน rejected | CSS print hide + beforeprint |
| Status error ไม่มี CTA | ปุ่มเปิดจาก LINE OA อีกครั้ง |

## Fee table (source of truth)

| | สามัญ | วิสามัญ | สมทบ |
|--|------:|--------:|-----:|
| สมัครใหม่ (รวมค่าแรกเข้า 500) | 1,500 | 1,000 | 5,500 |
| ต่ออายุ / เปลี่ยนประเภท | 1,000 | 500 | 5,000 |

Code: `apps/functions/src/members/fees.ts` · `apps/web/src/lib/membership-fees.ts`

## Bank

- ชื่อบัญชี: สมาคมการค้าผู้ประกอบการห้องเช่า  
- เลขบัญชี: 766-0-35634-8  
- ธนาคาร: กรุงไทย สาขาวงศ์สว่าง ทาวน์ เซ็นเตอร์  

## Rich Menu

See [14-Rich-Menu-Guide.md](../ABTA-System/14-Rich-Menu-Guide.md) — 6 shortcuts recommended.
