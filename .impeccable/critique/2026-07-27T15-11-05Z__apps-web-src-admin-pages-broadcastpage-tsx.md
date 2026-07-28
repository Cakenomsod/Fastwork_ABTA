---
target: BroadcastPage
total_score: 32
p0_count: 0
p1_count: 1
timestamp: 2026-07-27T15-11-05Z
slug: apps-web-src-admin-pages-broadcastpage-tsx
---
# 17 — Admin Broadcast (LINE กลุ่ม)

⚠️ DEGRADED: single-context (nested Multitask subagent; dual-agent A/B spawn blocked)

> **Route:** `/admin/broadcast`  
> **Files:** `apps/web/src/admin/pages/BroadcastPage.tsx`, `apps/web/src/admin/ConfirmDialog.tsx`, `apps/web/src/admin/admin.css` (`.bo-broadcast*`, `.bo-wizard*`)  
> **Date:** 2026-07-27 (re-critique after fixes)  
> **Prior score:** 26/40 → **32/40**  
> **Method:** inline Assessment A + Assessment B (`detect.mjs`)  
> **Detector:** `detect.mjs --json` → `[]` (clean, exit 0)  
> **Browser overlay:** skipped — auth-gated Back Office  
> **Personas:** Alex · Riley · Jordan  
> **Register:** product · **Stakes:** irreversible mass LINE OA messaging

---

## Score card

| Metric | Value |
|--------|-------|
| **Design Health** | **32 / 40** — Good |
| **P0** | **0** |
| **P1** | **1** |
| **P2** | **3** |
| **Cognitive load** | Low–moderate (1–2/8 failures) |
| **AI slop** | Low — product wizard, not decorative SaaS |

### Heuristics

| # | Heuristic | Score | Key issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | Stats/`aria-live` good; meta/logs load still fail silently |
| 2 | Match System / Real World | 3 | Thai staff copy + irreversible LINE language clear |
| 3 | User Control and Freedom | 3 | Back/cancel/clear OK; leave to templates still drops draft |
| 4 | Consistency and Standards | 4 | Danger `ConfirmDialog` + typed count matches «ยืนยันก่อนทำลาย» |
| 5 | Error Prevention | 4 | No auto-select; broad-filter warn; typed count + danger confirm |
| 6 | Recognition Rather Than Recall | 4 | Step 3 `bo-broadcast-msg-bridge` keeps message + count visible |
| 7 | Flexibility and Efficiency | 2 | Presets help; typed confirm always (even n=1); no draft resume |
| 8 | Aesthetic and Minimalist Design | 3 | Focused 4-step wizard; step 1 still dense |
| 9 | Error Recovery | 3 | Thai send/load errors; form kept on send fail |
| 10 | Help and Documentation | 3 | Warn banners + «ส่งแล้วแก้ไม่ได้» on step 4 / confirm |
| **Total** | | **32/40** | **Good** |

### Top 3

1. **[P1]** ไปหน้าแม่แบบแล้วร่างหาย / `loadMeta` ล้มเงียบ  
2. **[P2]** ตัวกรองว่าง + «เลือกทั้งหมดที่แสดง» ยังเลือกทั้งสมาคมได้ในคลิกเดียว  
3. **[P2]** Preview ถูกตัดความสูง + badge ล้มเหลวใช้ `near-expiry`

### Fixes verified this run

| Prior issue | Status |
|-------------|--------|
| Auto-select all LINE recipients on load | ✅ Fixed — `setSelected(new Set())` + copy «ยังไม่เลือกผู้รับอัตโนมัติ» |
| Light green confirm / no typed count | ✅ Fixed — `variant="danger"`, `requireTypedConfirm={String(selectedCount)}` |
| Step 3 memory bridge (no message) | ✅ Fixed — `.bo-broadcast-msg-bridge` |
| Broad-filter warn | ✅ Added — steps 1 / 3 / 4 + confirm description |

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### ความประทับใจโดยรวม

หลังแก้รอบนี้ หน้า Broadcast **ปิดช่องโหว่ความปลอดภัยหลักแล้ว**: ไม่เลือกผู้รับให้อัตโนมัติ, มีแบนเนอร์เตือนเมื่อตัวกรองกว้าง, ขั้นตรวจรายชื่อเห็นข้อความ, และ confirm เป็น danger + พิมพ์จำนวนผู้รับก่อนส่งจริง

คะแนนขึ้นจาก **26 → 32/40 (Good)** · **P0 = 0** · เหลือ P1 เรื่องร่างหาย/โหลดแม่แบบเงียบเป็นหลัก

### จุดแข็ง

1. **Opt-in audience** — โหลดรายชื่อแล้ว `selected` ว่าง; ต้องเลือกเองหรือกด «เลือกทั้งหมดที่แสดง»  
2. **Confirm ตามความเสี่ยง** — danger + typed count + ข้อความเต็มใน dialog  
3. **Memory bridge ขั้น 3** — preview ข้อความ + จำนวนที่เลือกติดเหนือตาราง

### ปัญหาเรียงตามความสำคัญ

#### [P1] ไปหน้าแม่แบบแล้วร่างหาย / `loadMeta` ล้มเหลวเงียบ
- **คืออะไร:** `goMessageTemplates()` เปลี่ยน route; state ข้อความอยู่ใน memory; `loadMeta` / `loadLogs` catch ว่าง  
- **ทำไมสำคัญ:** เจ้าหน้าที่ไปแก้แม่แบบแล้วกลับมาเริ่มใหม่; หรือไม่มีแม่แบบโดยไม่รู้ว่าโหลดพลาด  
- **แก้:** draft ใน `sessionStorage`; แสดง error + retry เมื่อโหลด tags/templates ล้มเหลว  
- **คำสั่ง:** `/impeccable harden`

#### [P2] ตัวกรองว่าง + «เลือกทั้งหมดที่แสดง» ยังเลือกทั้งสมาคมได้ในคลิกเดียว
- **คืออะไร:** ไม่บังคับเลือกประเภท/สถานภาพก่อนโหลด; กดเลือกทั้งหมด = ทุกคนที่มี LINE  
- **ทำไมสำคัญ:** typed confirm กันพลาดแล้ว แต่เส้นทางยังสั้นสำหรับ blast กว้าง  
- **แก้:** disable/confirm ซ้ำตอนเลือกทั้งหมดเมื่อ `!filtersActive`  
- **คำสั่ง:** `/impeccable harden`

#### [P2] Preview ยังถูกตัดความสูง + badge ล้มเหลวใช้ `near-expiry`
- **คืออะไร:** bridge/`step 4` มี `max-height`; log failed ใช้คลาส near-expiry  
- **ทำไมสำคัญ:** อ่านข้อความยาวไม่ครบ; สีสถานะผิดความหมาย  
- **แก้:** ขยาย/ขยายได้ + badge semantic สำหรับ failed  
- **คำสั่ง:** `/impeccable polish`

#### [P2] Typed confirm ทุกขนาด blast (รวม 1 คน)
- **คืออะไร:** ไม่มี threshold — ส่งกลุ่มเล็กก็ต้องพิมพ์จำนวน  
- **แก้:** typed เมื่อ `selectedCount ≥ 20`; ต่ำกว่านั้น danger confirm พอ  
- **คำสั่ง:** `/impeccable distill`

### Personas (ย่อ)

- **Jordan:** แบนเนอร์ + opt-in + พิมพ์จำนวน ลดความเสี่ยงส่งมวลชนได้ชัด  
- **Alex:** preset ดี; typed ทุกครั้ง + ไม่มี draft resume = friction  
- **Riley:** confirm scroll ดี; bridge ยัง clip; ไป templates ร่างหาย

### Cognitive load

Failures ≈ 1–2 (progressive disclosure ขั้น 1 ยังหนา) → low–moderate

---

## English — full critique (for fix agents)

### Anti-patterns verdict

**LLM:** Not AI-slop marketing UI. Restrained association-green wizard. Post-fix, matches PRODUCT principle **«ยืนยันก่อนทำลาย»** for mass LINE send. Remaining gaps are resilience (draft/meta) and polish.

**Detector:** `detect.mjs` → **0 findings**.

**Overlays:** Not available (auth-gated admin).

### Overall impression

High-stakes tool with **credible guardrails**. Biggest remaining opportunity: **don’t throw away the compose draft** when staff open templates, and don’t fail open on meta load.

### What's working

1. Empty selection on load + explicit opt-in — accidental association-wide blast path closed.  
2. Danger typed-count confirm with irreversible copy and scrollable full message.  
3. Step 3 message bridge removes the prior Recognition failure.

### Priority issues

| Sev | Issue | Why | Fix | Suggested command |
|-----|-------|-----|-----|-------------------|
| **P1** | Navigate to templates loses draft; silent `loadMeta`/`loadLogs` | Draft loss / empty templates without explanation | `sessionStorage` draft; surface meta errors + retry | `/impeccable harden` |
| **P2** | Empty filters + one-click «เลือกทั้งหมดที่แสดง» | Short intentional path to max audience (mitigated by typed confirm) | Extra confirm or block select-all when `!filtersActive` | `/impeccable harden` |
| **P2** | Preview `max-height` clip; failed log badge = `near-expiry` | Long copy hard to review; wrong semantic color | Taller/resizable preview; failed badge token | `/impeccable polish` |
| **P2** | Typed confirm for every send including n=1 | Friction for small/routine blasts | Threshold (e.g. ≥20) for typed; danger always | `/impeccable distill` |

### Persona red flags

**Alex:** Presets good. Always-on typed confirm + lost draft after templates = avoidable slowdown.

**Jordan:** Warn + opt-in + typed count are the right training wheels.

**Riley:** Confirm scroll works. Mid-flow navigation / refresh still drops state.

### Minor observations

- Step 2 still shows recipient stats — useful, minor focus steal.  
- `aria-hidden="false"` on compact wizard label is noisy.  
- After successful send, reset to step 1 + open logs remains a good peak-end.

### Questions to consider

1. Should opening templates open in a new tab / drawer so the compose draft never unmounts?  
2. At what recipient count should typed confirmation kick in (always / 10 / 20 / 50)?  
3. Should «เลือกทั้งหมดที่แสดง» require a second confirm when filters are inactive?

---

## Concrete fix backlog (English)

### P1 — Draft & meta resilience

1. Persist `{ message, templateId, filters, step, selectedIds }` to `sessionStorage`; restore on mount; clear after successful send.  
2. On `loadMeta` failure, set visible error + retry (do not fail open).

### P2 — Audience / polish

3. When `!filtersActive`, disable or second-confirm «เลือกทั้งหมดที่แสดง».  
4. Increase preview max-height or make expandable.  
5. Semantic badge for log failures (not `near-expiry`).  
6. Optional: typed confirm only when `selectedCount >= 20`.

### Suggested command sequence

1. `/impeccable harden` — draft persistence + meta errors  
2. `/impeccable polish` — preview height, failed badge, select-all guard  
3. Re-run `/impeccable critique` — target **≥ 34/40**, keep **P0 = 0**

---

## Evidence pointers (code)

```152:153:apps/web/src/admin/pages/BroadcastPage.tsx
      // Safety: never auto-blast — staff must opt in (เลือกทั้งหมด / ทีละคน)
      setSelected(new Set());
```

```918:936:apps/web/src/admin/pages/BroadcastPage.tsx
          <div
            className="bo-broadcast-msg-bridge"
            aria-label="ข้อความที่จะส่ง"
          >
            ...
            <pre className="bo-broadcast-msg-bridge-body">
              {message.trim() || "—"}
            </pre>
          </div>
```

```1248:1261:apps/web/src/admin/pages/BroadcastPage.tsx
      <ConfirmDialog
        open={confirmOpen}
        title="ยืนยันส่งข้อความแบบกลุ่ม"
        description={confirmDescription}
        confirmLabel="ยืนยันส่ง LINE จริง"
        variant="danger"
        requireTypedConfirm={typedConfirmCount}
        ...
      />
```

---

## Detector snapshot

```json
{ "target": "BroadcastPage.tsx", "findings": [], "exitCode": 0 }
```

**Trend:** 26 → **32** (+6). First clean re-critique after safety fixes.

*End of report 17 — Admin Broadcast (re-critique after fixes)*
