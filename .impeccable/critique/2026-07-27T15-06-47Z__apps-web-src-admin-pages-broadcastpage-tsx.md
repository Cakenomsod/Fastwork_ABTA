---
target: BroadcastPage.tsx + ConfirmDialog + admin.css (re-critique after fixes)
total_score: 32
p0_count: 0
p1_count: 1
timestamp: 2026-07-27T15-06-47Z
slug: apps-web-src-admin-pages-broadcastpage-tsx
---
# 17 — Admin Broadcast (LINE กลุ่ม)

> **Route:** `/admin/broadcast`  
> **Files:** `apps/web/src/admin/pages/BroadcastPage.tsx`, `apps/web/src/admin/ConfirmDialog.tsx`, `apps/web/src/admin/admin.css` (`.bo-broadcast*`, `.bo-wizard*`, `.bo-modal*`)  
> **Date:** 2026-07-27 (re-critique after fixes)  
> **Prior score:** 26/40 → **32/40**  
> **Method:** ⚠️ DEGRADED: single-context (critique run as nested subagent; dual-agent spawn blocked)  
> **Detector:** `detect.mjs --json` → `[]` (clean, exit 0)  
> **Browser overlay:** skipped — auth-gated Back Office; no reliable localhost session for injection  
> **Personas:** Alex · Riley · Jordan (staff first-timers)  
> **Register:** product · **Stakes:** irreversible mass LINE OA messaging

---

## Score card

| Metric | Value |
|--------|-------|
| **Design Health** | **32 / 40** — Good |
| **P0** | **0** |
| **P1** | **1** |
| **P2** | **3** |
| **Cognitive load** | Low–moderate (1–2/8 checklist failures) |
| **AI slop** | Low — product wizard, not decorative SaaS |

### Heuristics

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Stats/`aria-live` good; meta/logs load still fail silently |
| 2 | Match System / Real World | 3 | Thai staff copy + irreversible LINE language clear |
| 3 | User Control and Freedom | 3 | Back/cancel/clear OK; leave to templates still drops draft |
| 4 | Consistency and Standards | 4 | Danger `ConfirmDialog` + typed count matches “ยืนยันก่อนทำลาย” |
| 5 | Error Prevention | 4 | No auto-select; warn when broad filters; typed count + danger confirm |
| 6 | Recognition Rather Than Recall | 4 | Step 3 `bo-broadcast-msg-bridge` keeps message + count visible |
| 7 | Flexibility and Efficiency | 2 | Presets help; typed confirm always (even n=1); no draft resume |
| 8 | Aesthetic and Minimalist Design | 3 | Focused 4-step wizard; step 1 still dense |
| 9 | Error Recovery | 3 | Thai send/load errors; form kept on send fail |
| 10 | Help and Documentation | 3 | Warn banners + “ส่งแล้วแก้ไม่ได้” on step 4 / confirm |
| **Total** | | **32/40** | **Good** |

### Fixes verified this run

| Prior issue | Status |
|-------------|--------|
| Auto-select all LINE recipients on load | ✅ Fixed — `setSelected(new Set())` + copy “ยังไม่เลือกผู้รับอัตโนมัติ” |
| Light green confirm / no typed count | ✅ Fixed — `variant="danger"`, `requireTypedConfirm={String(selectedCount)}`, label “ยืนยันส่ง LINE จริง” |
| Step 3 memory bridge (no message) | ✅ Fixed — `.bo-broadcast-msg-bridge` with template title, char count, selected count |
| Broad-filter warn | ✅ Added — steps 1 / 3 / 4 + confirm description |

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### ความประทับใจโดยรวม

หลังแก้รอบนี้ หน้า Broadcast **ปิดช่องโหว่ความปลอดภัยหลักแล้ว**: ไม่เลือกผู้รับให้อัตโนมัติ, มีแบนเนอร์เตือนเมื่อตัวกรองกว้าง, ขั้นตรวจรายชื่อเห็นข้อความ, และ confirm เป็น danger + พิมพ์จำนวนผู้รับก่อนส่งจริง

คะแนนขึ้นจาก **26 → 32/40 (Good)** · **P0 = 0** · เหลือ P1 เรื่องร่างหาย/โหลดแม่แบบเงียบเป็นหลัก

### จุดแข็ง

1. **Opt-in audience** — โหลดรายชื่อแล้ว `selected` ว่าง; ต้องเลือกเองหรือกด «เลือกทั้งหมดที่แสดง»  
2. **Confirm ตามความเสี่ยง** — danger + typed count + ข้อความเต็มใน dialog (`white-space: pre-line`, scroll)  
3. **Memory bridge ขั้น 3** — preview ข้อความ + จำนวนที่เลือกติดเหนือตาราง

### ปัญหาเรียงตามความสำคัญ

#### [P1] ไปหน้าแม่แบบแล้วร่างหาย / `loadMeta` ล้มเหลวเงียบ
- **คืออะไร:** `goMessageTemplates()` เปลี่ยน route; state ข้อความอยู่ใน memory; `loadMeta` / `loadLogs` catch ว่าง  
- **ทำไมสำคัญ:** เจ้าหน้าที่ไปแก้แม่แบบแล้วกลับมาเริ่มใหม่; หรือไม่มีแม่แบบโดยไม่รู้ว่าโหลดพลาด  
- **แก้:** draft ใน `sessionStorage`; แสดง error + retry เมื่อโหลด tags/templates ล้มเหลว

#### [P2] ตัวกรองว่าง + «เลือกทั้งหมดที่แสดง» ยังเลือกทั้งสมาคมได้ในคลิกเดียว
- **คืออะไร:** ไม่บังคับเลือกประเภท/สถานภาพก่อนโหลด; กดเลือกทั้งหมด = ทุกคนที่มี LINE  
- **ทำไมสำคัญ:** typed confirm กันพลาดแล้ว แต่เส้นทางยังสั้นสำหรับ blast กว้าง  
- **แก้:** disable/confirm ซ้ำตอนเลือกทั้งหมดเมื่อ `!filtersActive` หรือบังคับเลือกอย่างน้อยหนึ่งมิติก่อนไปขั้น 3

#### [P2] Preview ยังถูกตัดความสูง + badge ล้มเหลวใช้ `near-expiry`
- **คืออะไร:** bridge `max-height: 4.8rem`, step 4 `7.5rem`; log failed ใช้คลาส near-expiry  
- **ทำไมสำคัญ:** Riley อ่านข้อความยาวไม่ครบบนหน้า; สีสถานะผิดความหมาย  
- **แก้:** ขยาย/ขยายได้ + badge semantic สำหรับ failed

#### [P2] Typed confirm ทุกขนาด blast (รวม 1 คน)
- **คืออะไร:** ไม่มี threshold — Alex ส่งกลุ่มเล็กก็ต้องพิมพ์จำนวนทุกครั้ง  
- **ทำไมสำคัญ:** ปลอดภัย แต่เสียประสิทธิภาพงานซ้ำ  
- **แก้:** typed เมื่อ `selectedCount ≥ 20` (หรือตาม product); ต่ำกว่านั้น danger confirm พอ

### Persona (เจ้าหน้าที่)

**Jordan (มือใหม่):** แบนเนอร์ + “ต้องเลือกผู้รับเอง” + พิมพ์จำนวน ลดความเสี่ยงส่งมวลชนโดยไม่ตั้งใจได้ชัด — ยังอาจสับสนว่า “ทุกประเภท” หมายถึงอะไรถ้าไม่ได้อ่าน warn  

**Alex (มือโปร):** preset ยังดี; typed confirm ทุกครั้ง + ไม่มี draft resume หลังเปิดแม่แบบ = friction  

**Riley (ทดสอบขอบ):** ข้อความยาว scroll ใน confirm ดีขึ้น; bridge/step-4 ยัง clip; refresh / ไป templates ร่างหาย; select-all หลังค้นหายังต้อง QA

### Cognitive load (checklist)

- [x] Single focus / chunking / grouping / hierarchy / one thing at a time  
- [ ] Progressive disclosure บนขั้น 1 (filters + tags + presets พร้อมกัน) — ยังหนา  
- [x] Working memory — ข้อความอยู่ขั้น 3 แล้ว  
- [~] Minimal choices — สถานภาพหลายปุ่มยังหนา แต่ warn ช่วย

**Failures ≈ 1–2 → low–moderate**

---

## English — full critique (for fix agents)

### Anti-patterns verdict

**LLM:** Still **not** AI-slop marketing UI. Restrained association-green wizard. Post-fix, the surface finally matches PRODUCT principle **“ยืนยันก่อนทำลาย”** for mass LINE send. Remaining gaps are resilience (draft/meta) and polish, not accidental-blast defaults.

**Detector:** `detect.mjs` → **0 findings** on `BroadcastPage.tsx` + `ConfirmDialog.tsx`.

**Overlays:** Not available (auth-gated admin).

### Overall impression

High-stakes tool with **credible guardrails** after this pass. Biggest remaining opportunity: **don’t throw away the compose draft** when staff open templates, and don’t fail open on meta load.

### What's working

1. Empty selection on load + explicit opt-in — accidental association-wide blast path closed.  
2. Danger typed-count confirm with irreversible copy and scrollable full message.  
3. Step 3 message bridge removes the memory bridge that previously scored Recognition at 2.

### Priority issues

| Sev | Issue | Why | Fix | Suggested command |
|-----|-------|-----|-----|-------------------|
| **P1** | Navigate to templates loses draft; silent `loadMeta`/`loadLogs` failure | Draft loss / empty templates without explanation | `sessionStorage` draft; surface meta errors + retry | `/impeccable harden` |
| **P2** | Empty filters + one-click “เลือกทั้งหมดที่แสดง” still selects everyone with LINE | Short intentional path to max audience (mitigated by typed confirm) | Extra confirm or block select-all when `!filtersActive` | `/impeccable harden` |
| **P2** | Preview `max-height` clip; failed log badge = `near-expiry` | Long copy hard to review; wrong semantic color | Taller/resizable preview; failed badge token | `/impeccable polish` |
| **P2** | Typed confirm for every send including n=1 | Friction for small/routine blasts | Threshold (e.g. ≥20) for typed; danger always | `/impeccable distill` |

### Persona red flags

**Alex:** Presets good. Always-on typed confirm + lost draft after templates = avoidable slowdown.

**Jordan:** Warn + opt-in + typed count are the right training wheels. Lead copy still helps; keep “ส่งแล้วแก้ไม่ได้” visible.

**Riley:** Confirm scroll works (`pre-line` + max-height). Mid-flow navigation / refresh still drops state. Search + select-all semantics need regression QA.

### Minor observations

- Step 2 still shows recipient stats — useful, minor focus steal.  
- `aria-hidden="false"` on compact wizard label is noisy.  
- After successful send, reset to step 1 + open logs remains a good peak-end.

### Questions to consider

1. Should opening templates open in a new tab / drawer so the compose draft never unmounts?  
2. At what recipient count should typed confirmation kick in (always / 10 / 20 / 50)?  
3. Should “เลือกทั้งหมดที่แสดง” require a second confirm when filters are inactive?

---

## Concrete fix backlog (English — execute in order)

### P1 — Draft & meta resilience

1. Persist `{ message, templateId, filters, step, selectedIds }` to `sessionStorage`; restore on mount; clear after successful send.  
2. On `loadMeta` failure, set visible error: “โหลดแม่แบบ/แท็กไม่สำเร็จ” + retry (do not fail open). Optionally surface log-load failure in the history panel.

### P2 — Audience / polish

3. When `!filtersActive`, either disable “เลือกทั้งหมดที่แสดง” until a segment is chosen, or require an inline second confirm.  
4. Increase `.bo-broadcast-msg-bridge-body` / `.bo-broadcast-preview-body` max-height or make expandable.  
5. Semantic badge for log failures (not `near-expiry`).  
6. Optional: typed confirm only when `selectedCount >= 20`; keep `variant="danger"` always.

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

```918:937:apps/web/src/admin/pages/BroadcastPage.tsx
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

```126:136:apps/web/src/admin/pages/BroadcastPage.tsx
  const loadMeta = useCallback(async () => {
    try {
      ...
    } catch {
      /* non-blocking */
    }
  }, []);
```

---

*End of report 17 — Admin Broadcast (re-critique after fixes)*
