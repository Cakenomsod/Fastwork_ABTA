# ABTA UI/UX Critique Index (Impeccable)

> Generated: 2026-07-27 · Method: Multitask per-page critique · Skill: Impeccable (`critique`)  
> Register: **product** · Platform: **web**  
> Note: Most page runs were **DEGRADED single-context** (nested under Multitask — dual A/B agents not spawned). Detector (`detect.mjs`) still ran per page. Browser overlay skipped (LIFF/auth-gated).

แต่ละไฟล์มี **ภาษาไทย** (อ่านเอง) + **English** (สำหรับแชทตัวถัดไปที่มาแก้)

---

## สรุปภาพรวม / Executive summary

| เมตริก | ค่า |
|--------|-----|
| หน้า critiqued | **17** |
| คะแนนเฉลี่ย | **~23/40** (Acceptable — ต้องแก้ก่อนใช้งานจริงหลายจุด) |
| คะแนนต่ำสุด | **17/40** Landing · **19/40** Slip Resubmit / Legacy Members |
| คะแนนสูงสุด | **26/40** Register · Status · Broadcast · Templates · AGM |
| รวม P0 (โดยประมาณ) | **~15** ทั่วระบบ |
| รวม P1 (โดยประมาณ) | **~50+** |

### ธีมร่วมที่ควรแก้ก่อน (Cross-cutting P0/P1)

1. **บัญชีรับโอนยังเป็น placeholder** — `/register`, `/renew`, `/seminar` โชว์「รอข้อมูลจากสมาคม」แต่บังคับแนบสลิป → สมาชิกโอนจริงไม่ได้  
   → ใส่ข้อมูลบัญชีจริง + ยืนยันก่อนส่ง (`clarify` / `harden`)
2. **`window.confirm` / `window.prompt`** — Staff ลบ, Seminars ปฏิเสธ ยังไม่ใช้ `ConfirmDialog`  
   → รวม pattern ยืนยันก่อนทำลาย (`harden`)
3. **ข้อความ error / สถานะเป็นอังกฤษดิบ** — `load_failed`, `promote`, `Active`/`NonActive`, `cannot_delete_self`  
   → แปลไทย + actionable (`clarify`)
4. **ตารางคลิกได้แต่ไม่มีคีย์บอร์ด** — Dashboard, Staff (และแนวเดียวกัน)  
   → `tabIndex` / Enter·Space / focus-visible (`audit` / `adapt`)
5. **Contrast / a11y** — status pills, card labels, receipt fineprint  
   → ปรับสีตาม DESIGN.md ≥4.5:1 (`audit` / `colorize`)
6. **Memory bridge หลังปฏิเสธสลิป** — `/slip` ไม่โชว์เหตุผลปฏิเสธที่ `/status` มีแล้ว  
   → ดึง `rejectReason` มาโชว์ (`clarify` / `harden`)
7. **Import / Broadcast ความเสี่ยงสูง** — Legacy Import ไม่มี dry-run+confirm; Broadcast default = ทั้งสมาคมง่ายเกินไป  
   → ConfirmDialog + preview (`harden` / `distill`)

---

## ตารางคะแนนทุกหน้า

### Member (LIFF)

| # | ไฟล์ | Route | Score | P0 | P1 | Top issue |
|---|------|-------|------:|---:|---:|-----------|
| 00 | [00-landing.md](./00-landing.md) | `/` | **17** | 1 | 3 | ไม่มีทางกู้ LINE (QR/deep link) |
| 01 | [01-register.md](./01-register.md) | `/register` | **26** | 1 | 3 | บัญชีธนาคาร placeholder แต่บังคับสลิป |
| 02 | [02-status.md](./02-status.md) | `/status`, `/card` | **26** | 1 | 3 | Pill สถานะ contrast ไม่ผ่าน AA |
| 03 | [03-receipt.md](./03-receipt.md) | `/receipt` | **25** | 1 | 3 | ใบเสร็จ rejected/draft ยังพิมพ์ได้เหมือนตัวจริง |
| 04 | [04-renew.md](./04-renew.md) | `/renew` | **23** | 1 | 3 | บัญชี placeholder + ไม่ยืนยันก่อนส่งต่ออายุ |
| 05 | [05-slip-resubmit.md](./05-slip-resubmit.md) | `/slip` | **19** | 0 | 4 | ไม่โชว์เหตุผลปฏิเสธสลิป |
| 06 | [06-seminar.md](./06-seminar.md) | `/seminar` | **22** | 1 | 3 | เส้นทางเสียเงินโดน bank placeholder |

### Back Office

| # | ไฟล์ | Route | Score | P0 | P1 | Top issue |
|---|------|-------|------:|---:|---:|-----------|
| 10 | [10-admin-dashboard.md](./10-admin-dashboard.md) | `/admin` | **24** | 1 | 4 | แถวตาราง mouse-only (ไม่มีคีย์บอร์ด) |
| 11 | [11-admin-data-review.md](./11-admin-data-review.md) | `/admin/data` | **23** | 1 | 3 | สลับคิวแล้ว detail ค้าง → อนุมัติคนผิดได้ |
| 12 | [12-admin-slip-review.md](./12-admin-slip-review.md) | Slip Review | **25** | 1 | 4 | (ดูรายละเอียดในไฟล์) คิวสลิป + a11y/copy |
| 13 | [13-admin-legacy-members.md](./13-admin-legacy-members.md) | Legacy Members | **19** | 1 | 3 | รายการตัน — ไม่มี drawer; ซ่อน phone/email |
| 14 | [14-admin-legacy-import.md](./14-admin-legacy-import.md) | Legacy Import | **21** | 2 | 3 | ไม่มี confirm + ไม่มี dry-run ก่อน merge |
| 15 | [15-admin-staff.md](./15-admin-staff.md) | Staff | **22** | 0 | 3 | ลบใช้ `window.confirm` |
| 16 | [16-admin-seminars.md](./16-admin-seminars.md) | Seminars BO | **20** | 1 | 3 | Reject ใช้ `window.prompt` |
| 17 | [17-admin-broadcast.md](./17-admin-broadcast.md) | Broadcast | **26** | 1 | 3 | Default ส่งทั้งสมาคมง่ายเกินไป |
| 18 | [18-admin-message-templates.md](./18-admin-message-templates.md) | Templates | **26** | 0 | 3 | Preview อ้าง LINE แต่ไม่เหมือนจริง |
| 19 | [19-admin-agm-report.md](./19-admin-agm-report.md) | AGM Report | **26** | 1 | 3 | Pagination cap เงียบ → รายชื่อไม่ครบ |

---

## แนะนำลำดับแก้ (สำหรับแชทตัวถัดไป)

### Round 1 — Safety / money / wrong-person (P0)

| ลำดับ | หน้า | คำสั่งแนะนำ | โฟกัส |
|------:|------|-------------|--------|
| 1 | Register + Renew + Seminar | `/impeccable clarify` + `/impeccable harden` | บัญชีรับโอนจริง + confirm ก่อนส่ง |
| 2 | Data Review | `/impeccable harden` | เคลียร์ stale detail ตอนสลับคิว |
| 3 | Legacy Import | `/impeccable harden` | ConfirmDialog + dry-run |
| 4 | Receipt | `/impeccable harden` | บล็อก/watermark เอกสารที่ไม่ใช่ตัวจริง |
| 5 | Admin Seminars | `/impeccable harden` | แทน `window.prompt` ด้วย ConfirmDialog |
| 6 | AGM Report | `/impeccable harden` | แจ้งเมื่อโหลดไม่ครบ / ยกเพดาน pagination |

### Round 2 — Clarity / a11y / consistency (P1)

| โฟกัส | หน้า | คำสั่ง |
|--------|------|--------|
| Reject reason บน `/slip` | Slip Resubmit | `/impeccable clarify` |
| Contrast pills/labels | Status, Receipt | `/impeccable audit` / `colorize` |
| Keyboard rows | Dashboard, Staff | `/impeccable adapt` / `audit` |
| แปล error/status ไทย | ทั้ง BO | `/impeccable clarify` |
| ConfirmDialog แทน window.* | Staff | `/impeccable harden` |
| Broadcast safety defaults | Broadcast | `/impeccable harden` / `distill` |
| Legacy list → detail | Legacy Members | `/impeccable shape` / `harden` |
| Form progressive disclosure | Register | `/impeccable distill` / `layout` |

### Round 3 — Polish

รัน `/impeccable polish` ทีละหน้าหลัง Round 1–2 แล้ว re-critique เพื่ออัปเดตคะแนน

---

## How to use in the next chat (English)

1. Open the page file under `docs/ui-ux-critique/`.
2. Jump to **English (for follow-up fix agents)** → Priority Issues + Concrete fix backlog.
3. Run the suggested `/impeccable …` command scoped to that page’s files.
4. After fixes, re-run critique on that slug and update scores in this INDEX.

Example prompt for a fix agent:

```text
Read docs/ui-ux-critique/01-register.md English section.
Fix all P0 and P1 items using the Concrete fix backlog.
Stay on-brand (green+gold, PRODUCT.md / DESIGN.md).
```

---

## วิธีอ่าน (ภาษาไทย)

1. เปิดไฟล์หน้าที่มีปัญหาสนใจจากตารางด้านบน  
2. อ่านส่วน **สรุปสำหรับอ่าน (ภาษาไทย)** — คะแนน / จุดแข็ง / P0–P3  
3. ส่งลิงก์ไฟล์หรือบอกหมายเลขหน้าให้แชทตัวถัดไป โดยอ้าง English backlog  

---

*Index updated after all 17 Multitask page critiques completed.*
