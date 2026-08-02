# ABTA UI/UX Critique Index (Impeccable) — รอบหลังแก้

> Re-critique: 2026-07-27 · Method: Multitask per-page · Skill: Impeccable (`critique`)  
> Register: **product** · Platform: **web**  
> Note: Nested Multitask runs were often **DEGRADED single-context**; `detect.mjs` still ran. Browser overlay skipped (LIFF/auth).

แต่ละไฟล์มี **ภาษาไทย** + **English** (สำหรับแชทตัวถัดไป)

---

## สรุปภาพรวมหลังแก้ / Post-fix summary

| เมตริก | รอบแรก | รอบนี้ (หลังแก้) |
|--------|--------|------------------|
| หน้า | 17 | **17** |
| คะแนนเฉลี่ย | ~23/40 | **~27.5/40** |
| คะแนนต่ำสุด | 17 Landing / 19 Slip·Legacy | **14 Landing** / **19 Legacy Members** |
| คะแนนสูงสุด | 26 | **32 Broadcast / AGM** · **31** Renew / Templates |
| หน้า Good (28+) | น้อย | **12 หน้า** |
| P0 ที่เหลือชัด | ~15 | **Landing + Legacy Members** เป็นหลัก (หน้าอื่น P0 เคลียร์เกือบหมด) |

### Delta ที่สำคัญ

| หน้า | ก่อน → หลัง | หมายเหตุ |
|------|-------------|----------|
| Slip Resubmit | 19 → **29** | เหตุผลปฏิเสธ + upload + checklist |
| Renew | 23 → **31** | confirm + เกตบัญชีว่าง |
| Broadcast | 26 → **32** | ไม่ auto-select + danger typed confirm |
| Legacy Import | 21 → **28** | dry-run + ConfirmDialog (ยังขาด created/updated + template) |
| Staff | 22 → **29** | ConfirmDialog + keyboard |
| Seminars BO | 20 → **28** | ConfirmDialog + Thai status |
| Status | 26 → **30** | contrast + a11y |
| Receipt | 25 → **30** | watermark / บล็อกพิมพ์ |
| AGM | 26 → **32** | truncation warn + keep table + print |
| Templates | 26 → **31** | dirty guard + honest preview |
| Data / Slip Review | 23/25 → **27/30** | stale-detail + sticky actions + Thai paymentStatus |
| Legacy Members | 19 → **19** | ยังไม่แก้ (ไม่มี drawer) |
| Landing | 17 → **14** | ยังไม่แก้ (คะแนน recalibrate) |

### ธีมที่เหลือ (หลังแก้)

1. **Landing** — ไม่มี LINE recovery จริง · meta สาธารณะ · CTA เท่ากัน (อย่า invent QR)
2. **Legacy Members** — รายการตัน · สถานะอังกฤษ · ไม่มี drawer
3. **บัญชีรับโอนว่าง** — intentional; เกตแล้วบน Register/Renew/Seminar — ใส่เลขจริงเมื่อพร้อม
4. **Polish ที่เหลือ** — progressive disclosure ฟอร์มสมัคร · listbox keyboard · stats คลิกกรอง · draft Broadcast/Templates

---

## ตารางคะแนนทุกหน้า (รอบหลังแก้)

### Member (LIFF)

| # | ไฟล์ | Route | Score | Δ | P0 | P1 | Top remaining |
|---|------|-------|------:|:-:|---:|---:|---------------|
| 00 | [00-landing.md](./00-landing.md) | `/` | **14** | −3 | 1 | 3 | ไม่มี LINE recovery (ห้าม invent QR) |
| 01 | [01-register.md](./01-register.md) | `/register` | **28** | +2 | 0 | 3 | ฟอร์มยาว · PhoneDigitInput · error ท้ายฟอร์ม |
| 02 | [02-status.md](./02-status.md) | `/status`, `/card` | **30** | +4 | 0 | 1 | Error ลิงก์ไม่มีปุ่ม CTA |
| 03 | [03-receipt.md](./03-receipt.md) | `/receipt` | **30** | +5 | 0 | 2 | Ctrl+P ยังพิมพ์ rejected ได้ · แถบ「ใช้เป็นหลักฐานได้ไหม」 |
| 04 | [04-renew.md](./04-renew.md) | `/renew` | **31** | +8 | 0 | 3 | Pending dead-end · a11y live/focus |
| 05 | [05-slip-resubmit.md](./05-slip-resubmit.md) | `/slip` | **29** | +10 | 0 | 0 | P2: clear-file · success peak-end |
| 06 | [06-seminar.md](./06-seminar.md) | `/seminar` | **26** | +4 | 0 | 2 | List empty-flash · success/a11y บาง |
| 20 | [20-member-audit-2026-08-02.md](./20-member-audit-2026-08-02.md) | Member surfaces | — | 2026-08-02 | 0 | — | Bank+fees+สมทบ+Landing/Renew polish |

### Back Office

| # | ไฟล์ | Route | Score | Δ | P0 | P1 | Top remaining |
|---|------|-------|------:|:-:|---:|---:|---------------|
| 10 | [10-admin-dashboard.md](./10-admin-dashboard.md) | `/admin` | **26** | +2 | 0 | 2 | Stats ไม่ลิงก์คิว · filter 8 chips |
| 11 | [11-admin-data-review.md](./11-admin-data-review.md) | Data Review | **27** | +4 | 0 | 3 | CTA `promote` · permanent ID · listbox keyboard |
| 12 | [12-admin-slip-review.md](./12-admin-slip-review.md) | Slip Review | **30** | +5 | 0 | 2 | listbox keyboard · conflict Esc/focus |
| 13 | [13-admin-legacy-members.md](./13-admin-legacy-members.md) | Legacy Members | **19** | 0 | 1 | 3 | ไม่มี drawer · สถานะ EN · stats ไม่กรอง |
| 14 | [14-admin-legacy-import.md](./14-admin-legacy-import.md) | Legacy Import | **28** | +7 | 0 | 2 | created/updated + template Excel |
| 15 | [15-admin-staff.md](./15-admin-staff.md) | Staff | **29** | +7 | 0 | 0 | P2 busy/cards/hints |
| 16 | [16-admin-seminars.md](./16-admin-seminars.md) | Seminars BO | **28** | +8 | 0 | 2 | ยังไม่ queue-first · ชื่องานหลังปิดงาน |
| 17 | [17-admin-broadcast.md](./17-admin-broadcast.md) | Broadcast | **32** | +6 | 0 | 1 | Draft หายตอนไปแม่แบบ |
| 18 | [18-admin-message-templates.md](./18-admin-message-templates.md) | Templates | **31** | +5 | 0 | 2 | Sidebar ทิ้ง dirty · AGM save confirm |
| 19 | [19-admin-agm-report.md](./19-admin-agm-report.md) | AGM Report | **32** | +6 | 0 | 2 | Stats คลิกไม่ได้ · DOM ทั้ง roster |

---

## แนะนำรอบถัดไป (ถ้าจะแก้ต่อ)

| ลำดับ | โฟกัส | หน้า | คำสั่ง |
|------:|--------|------|--------|
| 1 | Landing recovery (env-gated เท่านั้น) | Landing | `/impeccable clarify` / `onboard` |
| 2 | Drawer + แปลสถานะ | Legacy Members | `/impeccable shape` / `harden` |
| 3 | Progressive disclosure | Register | `/impeccable distill` / `layout` |
| 4 | Queue keyboard + Esc dialog | Data/Slip Review | `/impeccable adapt` / `audit` |
| 5 | Stats → filter shortcuts | Dashboard / AGM | `/impeccable distill` |
| 6 | Polish | Slip / Staff / Broadcast draft | `/impeccable polish` |

---

## How to use (English)

1. Open the page file under `docs/ui-ux-critique/`.
2. Read **English** → Priority Issues + fix backlog.
3. Run scoped `/impeccable …` then re-critique that page.

Example:

```text
Read docs/ui-ux-critique/13-admin-legacy-members.md English section.
Fix P0/P1 only. Do not invent missing PII — show API fields that already exist.
```

---

*Index updated after full post-fix Multitask re-critique (2026-07-27 evening).*
