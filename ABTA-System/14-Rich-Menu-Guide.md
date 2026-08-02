# LINE Rich Menu — ABTA สมาชิก (Phase 1)

> ตั้งค่าใน LINE Official Account Manager · ไม่ได้อยู่ในโค้ดรีโป  
> อัปเดต: 2026-08-02 · ใช้คู่กับ LIFF Endpoint `https://abta-member.web.app/register`

## ภาพรวม

แนะนำ **เมนู 6 ช่อง** (2×3) ให้ครบเส้นทางหลักของสมาชิก โดยไม่ต้องพิมพ์คำสั่ง

| ตำแหน่ง | ป้าย | ประเภท | ปลายทาง |
|---------|------|--------|---------|
| ซ้ายบน | สมัครสมาชิก | Link (LIFF) | `{LIFF_URL}` หรือ `{LIFF_URL}/register` |
| กลางบน | ยืนยันสมาชิกเก่า | Link (LIFF) | `{LIFF_URL}/register?flow=legacy` |
| ขวาบน | ต่ออายุ | Link (LIFF) | `{LIFF_URL}/renew` |
| ซ้ายล่าง | สัมมนา | Link (LIFF) | `{LIFF_URL}/seminar` |
| กลางล่าง | เช็คสถานะ | ข้อความ | `เช็คสถานะ` |
| ขวาล่าง | ช่วยเหลือ | ข้อความ | `ช่วยเหลือ` |

> `{LIFF_URL}` = ค่า `VITE_LIFF_URL` เช่น `https://liff.line.me/<LIFF_ID>`  
> ปุ่มข้อความให้บอทตอบจาก `apps/functions/src/line/messages.ts` / `flex-status.ts`

## ทำไมจัดแบบนี้

1. **สมัคร / ยืนยันเก่า** — แยกชัด ไม่ให้สมาชิกเก่าสับสนกับฟอร์มใหม่  
2. **ต่ออายุ / สัมมนา** — ธุรกรรมที่ต้องเปิด LIFF + แนบสลิป  
3. **เช็คสถานะ** — ใช้ keyword ที่มีอยู่แล้ว (Flex + บัตร + ใบเสร็จ) ไม่ต้องสร้างหน้า LIFF แยก  
4. **ช่วยเหลือ** — สำรองเมื่อสมาชิกไม่รู้จะกดอะไร

## ขนาดภาพแนะนำ

- Template: **Large** (สูง 843px) หรือ Compact ตามแบรนด์  
- ความละเอียดภาพพื้นหลัง: 2500×1686 (Large) ตามสเปก LINE  
- ใช้เขียวสมาคม + ทอง ตาม DESIGN.md · ข้อความอ่านง่ายบนมือถือ  
- ไฟล์ Export พร้อมใช้: [`assets/line-rich-menu.html`](./assets/line-rich-menu.html) — เปิดใน Chrome แล้วกด **ดาวน์โหลด PNG**

## Checklist ตั้งค่า

1. LINE Official Account Manager → Rich Menu → Create  
2. ผูกเมนูกับ OA หลักของสมาชิก (ไม่ใช่ช่องทาง staff)  
3. ตั้ง default display: **แสดงตลอด** (หรือตามแคมเปญ)  
4. ทดสอบทุกช่องบนมือถือจริงหลัง deploy Hosting + Functions  
5. ตรวจว่า LIFF Endpoint = `https://abta-member.web.app/register`

## ไม่ต้องใส่ใน Rich Menu (Phase 1)

- Back Office /admin  
- ส่งสลิปใหม่ (`/slip`) — เข้าถึงจากปุ่มในข้อความปฏิเสธสลิป  
- ใบเสร็จ / บัตร — เปิดจาก Flex เช็คสถานะ
