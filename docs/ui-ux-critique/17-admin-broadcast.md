# 17 — Admin Broadcast (LINE กลุ่ม)

> **Route:** `/admin/broadcast`  
> **Files:** `apps/web/src/admin/pages/BroadcastPage.tsx`, `apps/web/src/admin/admin.css` (`.bo-broadcast*`, `.bo-wizard*`)  
> **Date:** 2026-07-27  
> **Method:** ⚠️ DEGRADED: single-context (critique run as nested subagent; dual-agent spawn blocked)  
> **Detector:** `detect.mjs --json` → `[]` (clean, exit 0)  
> **Browser overlay:** skipped — auth-gated Back Office; no reliable localhost session for injection  
> **Personas:** Alex · Riley · Jordan (staff first-timers)  
> **Register:** product · **Stakes:** irreversible mass LINE OA messaging

---

## Score card

| Metric | Value |
|--------|-------|
| **Design Health** | **26 / 40** — Acceptable |
| **P0** | **1** |
| **P1** | **3** |
| **Cognitive load** | Moderate (3/8 checklist failures) |
| **AI slop** | Low — product wizard, not decorative SaaS |

### Heuristics

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Stats/`aria-live` good; meta/logs load fail silently |
| 2 | Match System / Real World | 3 | Thai staff copy clear; empty filter = “ทุกประเภท” easy to misread |
| 3 | User Control and Freedom | 3 | Back/cancel/clear OK; leave page loses draft |
| 4 | Consistency and Standards | 3 | Uses `bo-*`; mass send confirm not danger-weighted like other destructive actions |
| 5 | Error Prevention | 2 | Confirm exists, but **default-all + select-all + light confirm** still allow accidental blast |
| 6 | Recognition Rather Than Recall | 2 | Step 3 (audience) has **no message preview** — memory bridge |
| 7 | Flexibility and Efficiency | 2 | Presets help Alex; no shortcuts / draft resume |
| 8 | Aesthetic and Minimalist Design | 3 | Focused 4-step wizard; step 1 still dense |
| 9 | Error Recovery | 3 | Thai errors, form kept on send fail |
| 10 | Help and Documentation | 2 | Hints present; no “irreversible / who will receive” guidance for first-timers |
| **Total** | | **26/40** | **Acceptable** |

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### ความประทับใจโดยรวม

หน้า Broadcast ถูกออกแบบเป็น **วิซาร์ด 4 ขั้น** (กรอง → ข้อความ → รายชื่อ → ยืนยัน) ซึ่งสอดคล้องหลัก Back Office ของ ABTA และลดความสับสนเมื่อเทียบกับฟอร์มยาวหน้าเดียว จุดแข็งคือภาษาไทยชัด สถิติผู้รับมี `aria-live` และมี `ConfirmDialog` ก่อนส่ง

แต่ภารกิจนี้เป็น **การส่ง LINE แบบกลุ่มที่แก้ไม่ได้** — ความเสี่ยงหลักไม่ใช่ “กดส่งไม่ได้” แต่คือ **ส่งผิดกลุ่ม/ส่งทั้งสมาคมโดยไม่ตั้งใจ** ค่าเริ่มต้น (ไม่เลือกตัวกรอง = ทุกประเภท/ทุกสถานภาพ) + เลือกผู้รับทั้งหมดอัตโนมัติ + ยืนยันแค่กดปุ่ม ทำให้เจ้าหน้าที่มือใหม่ (Jordan) ส่งมวลชนได้ง่ายเกินไป

### จุดแข็ง

1. **วิซาร์ดทีละขั้น** — แยกกรอง / ข้อความ / รายชื่อ / ยืนยัน ลด cognitive load เทียบ one-page compose  
2. **สรุปตัวกรอง + จำนวนผู้รับ** เห็นชัดในขั้น 4 และใน dialog  
3. **ทางลัด preset** (กรรมการ มี.ค. / แม่แบบเชิญประชุม) และ empty state เมื่อไม่มี LINE — ช่วยงานซ้ำของเจ้าหน้าที่

### ปัญหาเรียงตามความสำคัญ

#### [P0] ค่าเริ่มต้น = ส่งได้ทั้งกลุ่มที่มี LINE + เลือกทั้งหมดอัตโนมัติ
- **คืออะไร:** ไม่เลือกประเภท/สถานภาพ = “ทุกประเภท · ทุกสถานภาพ”; โหลดรายชื่อแล้ว `selected` = ทุกคนที่มี LINE  
- **ทำไมสำคัญ:** เจ้าหน้าที่มือใหม่อาจคิดว่า “ยังไม่ได้เลือกใคร” แล้วกดไปจนส่งจริง — ความเสียหายต่อสมาคมสูงมาก  
- **แก้:** บังคับเลือกตัวกรองอย่างน้อยหนึ่งมิติก่อนโหลด/ก่อนไปขั้นถัดไป *หรือ* เริ่มด้วยผู้รับว่างแล้วให้ opt-in; แสดงแบนเนอร์เตือนสี warn เมื่อ audience = ทุกสถานภาพ/ทุกประเภท

#### [P1] Dialog ยืนยันเบาเกินไปสำหรับ blast ที่แก้ไม่ได้
- **คืออะไร:** `ConfirmDialog` แบบ default (เขียว) ป้าย “ส่งเลย” — ไม่มี typed confirm จำนวนคน, ไม่ใช้ `variant="danger"` / `requireTypedConfirm`  
- **ทำไมสำคัญ:** ขัดหลัก PRODUCT “ยืนยันก่อนทำลาย”; กดพลาดครั้งเดียว = ส่ง LINE จริง  
- **แก้:** เมื่อ `selectedCount ≥ N` (เช่น 20) บังคับพิมพ์จำนวนผู้รับ; ใช้ danger/warn visual; แสดงข้อความเต็มใน dialog (ไม่ตัดที่ 400 ตัวอักษรโดยไม่มี “ดูทั้งหมด”)

#### [P1] ขั้นตรวจรายชื่อไม่มีบริบทข้อความ (memory bridge)
- **คืออะไร:** ขั้น 3 แสดงตารางอย่างเดียว — ต้องจำข้อความจากขั้น 2  
- **ทำไมสำคัญ:** Riley/Jordan ตรวจรายชื่อแล้วไม่เห็นว่าจะส่งอะไร → ตรวจไม่ครบ  
- **แก้:** sticky preview ย่อของข้อความ + จำนวนที่เลือก ข้างตาราง หรือแถบสรุปเหนือตาราง

#### [P1] ออกไปหน้าแม่แบบแล้วร่างหาย / โหลดแม่แบบล้มเหลวเงียบ
- **คืออะไร:** `goMessageTemplates()` เปลี่ยน route; state ข้อความอยู่ใน memory; `loadMeta` catch ว่าง  
- **ทำไมสำคัญ:** เจ้าหน้าที่ไปแก้แม่แบบแล้วกลับมาเริ่มใหม่; หรือไม่มีแม่แบบโดยไม่รู้ว่าโหลดพลาด  
- **แก้:** draft ใน `sessionStorage`; แสดง error เมื่อโหลด tags/templates ล้มเหลว

### Persona (เจ้าหน้าที่)

**Jordan (มือใหม่):** อ่าน “ไม่เลือก = รวมทุกค่า” แล้วอาจเข้าใจว่าไม่ต้องเลือก; ปุ่มส่งสีเขียวดูเหมือนงานปกติไม่ใช่ความเสี่ยงสูง; ไม่มีคำอธิบายว่าส่งแล้วแก้ไม่ได้  

**Alex (มือโปร):** preset ดี แต่ไม่มีคีย์ลัด / bulk exclude ที่เร็ว; ยืนยันซ้ำทุกครั้งเมื่อส่งกลุ่มเล็กอาจรำคาญ — ควร threshold ตามจำนวน  

**Riley (ทดสอบขอบ):** ข้อความยาวถูกตัดใน preview (`max-height: 7.5rem`, confirm 400 ตัวอักษร); ค้นหาแล้ว “เลือกทั้งหมดที่แสดง” อาจทำให้เข้าใจผิดเรื่องทั้งชุด; refresh กลางทางร่างหาย  

### Cognitive load (checklist ที่ไม่ผ่าน)

- [ ] Progressive disclosure บนขั้น 1 (filters + tags + presets พร้อมกัน)  
- [ ] Working memory — ข้อความไม่อยู่ในขั้น 3  
- [ ] Minimal choices — สถานภาพ 6 ปุ่ม + ประเภท 4 + แท็ก + preset ในจอเดียว  

---

## English — full critique (for fix agents)

### Anti-patterns verdict

**LLM:** Does **not** read as AI-slop marketing UI. It is a restrained product wizard with association-green tokens, sticky footer CTAs, and real Thai staff language. Risks are **safety/defaults**, not decorative gradients or card grids. Unused legacy layout classes (`.bo-broadcast-layout` two-column) exist in CSS but the live page is a single-column wizard — fine, not harmful.

**Detector:** `detect.mjs` returned **0 findings** on `BroadcastPage.tsx`. No contrast/slop rules fired on this markup path (CSS-only anti-patterns not fully covered by the HTML detector).

**Overlays:** Not available (auth-gated admin).

### Overall impression

Solid **structure** for a high-stakes tool; weak **guardrails** for the irreversible send. Biggest opportunity: make “who receives this” impossible to misunderstand before confirm, and make confirm proportional to blast size.

### What's working

1. Four-step wizard with disabled future steps and sticky primary footer — correct task model.  
2. Filter summary chips + live recipient counts reduce ambiguity at step 4.  
3. Empty states (no LINE / no templates / no search hits) include recovery actions.

### Priority issues

| Sev | Issue | Why | Fix | Suggested command |
|-----|-------|-----|-----|-------------------|
| **P0** | Empty filters = all types/statuses; load auto-selects every LINE recipient | Accidental association-wide blast | Require intentional audience OR start with zero selection + warn banner when “ทุกประเภท/ทุกสถานภาพ” | `/impeccable harden` then `/impeccable clarify` |
| **P1** | Confirm is default primary “ส่งเลย”; no typed count; preview truncated to 400 chars | One misclick = real LINE messages | `requireTypedConfirm` with count (threshold); danger/warn styling; full message or expandable preview | `/impeccable harden` |
| **P1** | Step 3 audience table has no message preview | Memory bridge; incomplete review | Compact sticky message strip on step 3 | `/impeccable layout` |
| **P1** | Navigate to templates loses draft; silent `loadMeta` failure | Draft loss / empty templates without explanation | `sessionStorage` draft; surface meta errors | `/impeccable harden` |

### Persona red flags

**Alex:** Presets are good accelerators. Missing: keyboard path for send/cancel beyond dialog Esc; no “send to filtered minus exclusions” mental model beyond checkboxes; small blasts still pay full confirm friction if you later add typed confirm without a threshold.

**Jordan (staff first-timer):** Lead copy “ทำทีละขั้น” helps, but “ไม่เลือก = รวมทุกค่า” + auto-checked table feels like the system already decided the audience. Primary green send looks like approve-queue, not irreversible broadcast. No plain-language “ส่งแล้วแก้ไขไม่ได้บน LINE ของสมาชิก”.

**Riley:** Long message clipped in `.bo-broadcast-preview-body` (`max-height: 7.5rem`); confirm truncates at 400; `selectAll` API path when `selected.size === recipients.length` after search toggles needs careful QA; mid-flow navigation to `/admin/message-templates` drops compose state; logs fail open silently.

### Minor observations

- Step 2 still shows recipient stats — useful, but can steal focus from “compose”.  
- Failed log badge reuses `near-expiry` styling — semantic mismatch.  
- `aria-hidden="false"` on compact wizard label is noisy; compact mode CSS hides desktop grid inconsistently at narrow widths (verify 720px).  
- After successful send, reset to step 1 + open logs is good peak-end; keep success banner visible above the fold.

### Questions to consider

1. Should “no filter” mean “blocked until you pick a segment” rather than “everyone”?  
2. At what recipient count does typed confirmation become mandatory (10 / 20 / 50)?  
3. Should step 3 and step 4 share one persistent preview rail so the message never leaves the viewport?

---

## Concrete fix backlog (English — execute in order)

Use this section as the implementation checklist for the next chat.

### P0 — Safe audience defaults

1. **Stop silent “everyone”.** Either:
   - Block “ถัดไป” until at least one of: member type, status, board, or tag is set; **or**
   - Keep broad filters but **do not** auto-`selected = all` — start empty and require “เลือกทั้งหมดที่แสดง”.
2. Add a persistent **warn callout** when `!filtersActive`: e.g. “กำลังรวมทุกประเภทและทุกสถานภาพที่มี LINE — ตรวจจำนวนก่อนส่ง”.
3. Mirror the same warning on step 4 summary and in `confirmDescription`.

### P1 — Confirm proportional to blast

4. For `selectedCount >= 20` (tune with product): `ConfirmDialog` with `requireTypedConfirm={String(selectedCount)}` and copy “พิมพ์จำนวนผู้รับเพื่อยืนยัน”.
5. Use warn/danger visual weight for mass send (label e.g. “ยืนยันส่ง LINE จริง”); keep cancel as the safe default focus (already focuses cancel — keep it).
6. Stop hard-truncating confirm body at 400 without affordance — show full text in scrollable region or “ข้อความเต็ม” expand.

### P1 — Recognition on step 3

7. Add a read-only **message preview strip** (2–4 lines + char count + template title) above the recipient table on step 3.
8. Keep selected-count chip in sync (`aria-live` already on selection meta — preserve).

### P1 — Draft & meta resilience

9. Persist `{ message, templateId, filters, step, selectedIds }` to `sessionStorage` keyed by staff session; restore on mount; clear after successful send.
10. On `loadMeta` failure, set visible error: “โหลดแม่แบบ/แท็กไม่สำเร็จ” + retry (do not fail open).

### P2 — Polish (after P0/P1)

11. Semantic badge for log failures (not `near-expiry`).  
12. Clarify search + “เลือกทั้งหมดที่แสดง” helper text when `hasSearch`.  
13. Increase preview `max-height` on step 4 or make it resizable.  
14. Optional: draft autosave indicator for Alex.

### Suggested command sequence

1. `/impeccable harden apps/web/src/admin/pages/BroadcastPage.tsx` — defaults, confirm, draft, meta errors  
2. `/impeccable clarify` — warn copy, irreversible LINE language for Jordan  
3. `/impeccable layout` — step 3 preview strip  
4. `/impeccable polish` — badges, preview height, search helper  
5. Re-run `/impeccable critique` on this page — target **≥ 32/40**, **P0 = 0**

---

## Evidence pointers (code)

```152:152:apps/web/src/admin/pages/BroadcastPage.tsx
      setSelected(new Set(data.recipients.map((r) => r.memberId)));
```

```217:230:apps/web/src/admin/pages/BroadcastPage.tsx
    } else {
      parts.push("ทุกประเภท");
    }
    // ...
    } else {
      parts.push("ทุกสถานภาพ");
    }
```

```1182:1193:apps/web/src/admin/pages/BroadcastPage.tsx
      <ConfirmDialog
        open={confirmOpen}
        title="ยืนยันส่งข้อความแบบกลุ่ม"
        description={confirmDescription}
        confirmLabel="ส่งเลย"
        // no variant="danger" / requireTypedConfirm
```

```3521:3531:apps/web/src/admin/admin.css
.bo-broadcast-preview-body {
  /* ... */
  max-height: 7.5rem;
  overflow: auto;
}
```

---

*End of report 17 — Admin Broadcast*
