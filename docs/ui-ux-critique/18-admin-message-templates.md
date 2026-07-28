# 18 — Admin Message Templates (`/admin/message-templates`)

⚠️ DEGRADED: single-context (nested Multitask subagent; dual-agent A/B spawn blocked)

> **Date:** 2026-07-27 (re-critique after fixes)  
> **Target:** `apps/web/src/admin/pages/MessageTemplatesPage.tsx` + `.bo-templates*` in `admin.css`  
> **Register:** product · Back Office · LINE OA template library  
> **Prior score:** 26/40 → **31/40**  
> **Design health:** **31 / 40** — Good  
> **P0:** 0 · **P1:** 2 · **P2:** 3 · **P3:** 2  
> **Detector:** `detect.mjs --json` → `[]` (clean)  
> **Browser overlay:** skipped — auth-gated Back Office  
> **Personas:** Alex · Sam · นายทะเบียน ABTA  
> **Focus lens:** edit safety · preview honesty · plain-text contract

---

## Score card

| Metric | Value |
|--------|-------|
| **Design Health** | **31 / 40** — Good |
| **P0** | **0** |
| **P1** | **2** |
| **P2** | **3** |

### Heuristics

| # | Heuristic | Score | Key issue |
|---|-----------|------:|-----------|
| 1 | Visibility of system status | 3 | Load/save/success OK; no persistent «unsaved» badge on edit |
| 2 | Match system / real world | 4 | Honest «ตัวอย่างข้อความ» + plain-text / no-merge contract |
| 3 | User control & freedom | 3 | In-page discard + `beforeunload`; SPA sidebar leave still bypasses |
| 4 | Consistency & standards | 4 | Matches BO `bo-btn` / `bo-panel` / `ConfirmDialog` |
| 5 | Error prevention | 3 | Page discard unified; AGM save still casual; shell leave hole |
| 6 | Recognition rather than recall | 3 | Plain-text contract visible; no token chips (OK if product stays plain) |
| 7 | Flexibility & efficiency | 2 | No duplicate, search, Ctrl+S, broadcast deep-link |
| 8 | Aesthetic and minimalist design | 3 | Clean editor; hero packs 3 CTAs vs Save |
| 9 | Error recovery | 3 | Mapped Thai `ERROR_LABEL`; some ops jargon (`route_not_found`) |
| 10 | Help and documentation | 3 | Plain-text + AGM footer; thin on LINE wrap/emoji limits |
| **Total** | | **31/40** | **Good** |

### Top 3

1. **[P1]** SPA / sidebar leave still discards dirty without dialog  
2. **[P1]** Saving `agm_invite` is still casual (no confirm)  
3. **[P2]** Dirty state under-signaled on edit (no unsaved badge)

### Fixes verified this run

| Prior issue | Status |
|-------------|--------|
| Preview overclaim «ตัวอย่างใน LINE» | ✅ Fixed — label «ตัวอย่างข้อความ» |
| No variable / plain-text contract | ✅ Fixed — hint «ข้อความตรง ๆ — ไม่แทนชื่อ… ไม่มี merge fields» |
| Cancel / refresh / broadcast bypass dirty | ✅ Fixed — unified `PendingNav` + discard dialog |
| Tab close / hard refresh | ✅ Fixed — `beforeunload` when `dirty` |

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 31/40 (Good) — ขึ้นจาก 26

หน้าแม่แบบข้อความเป็นเครื่องมือ CRUD ชัดเจน โทนเขียวสมาคม ไม่ดู AI-slop มีรายการซ้าย–แก้ไขขวา ป้าย «ระบบ» สำหรับเชิญประชุม และตอนนี้ **discard ครอบคลุมทางออกในหน้า** + ป้ายตัวอย่างซื่อสัตย์ + สัญญาข้อความตรง ๆ

ยังไม่ปิดสนิท: **เมนูซ้ายของ Back Office** ยังสลับหน้าแล้วทิ้งงานเงียบ (SPA ไม่ยิง `beforeunload`) และ **บันทึกแม่แบบเชิญประชุมระบบ** ยังกดง่ายเหมือนแม่แบบทั่วไป

### จุดแข็ง

1. **Dirty guard ในหน้าครบ** — สลับแม่แบบ / สร้างใหม่ / ยกเลิก / รีเฟรช / ไป broadcast → «ทิ้งการแก้ไข?»  
2. **Preview ซื่อสัตย์** — «ตัวอย่างข้อความ» ไม่แอบอ้างว่าเหมือน LINE จริง  
3. **สัญญา plain text** — บอกชัดว่าไม่แทนชื่อ/เลขสมาชิก และไม่มี merge fields  
4. **แม่แบบระบบชัด** — `agm_invite` มี badge «ระบบ» ลบไม่ได้

### ปัญหาสำคัญ

| ระดับ | ปัญหา |
|-------|--------|
| **P1** | Sidebar / `AdminApp.go()` ทิ้ง dirty โดยไม่ถาม — `beforeunload` ไม่ยิงบน SPA |
| **P1** | บันทึก `agm_invite` ไม่มี confirm เพิ่ม — ความเสี่ยงข้อความเชิญประชุมทั้งสมาคม |
| **P2** | โหมดแก้ไขไม่มีป้าย «ยังไม่บันทึก» (มีแค่ตอนสร้างใหม่) |
| **P2** | บันทึกแล้วไป broadcast ไม่พก `templateId` |
| **P2** | รายการแม่แบบไม่มีค้นหาเมื่อจำนวนโต |

### Personas (สรุป)

- **Alex:** ไม่มี Cmd/Ctrl+S; sidebar ยังทิ้งงาน; อยาก one-click ไปส่งด้วยแม่แบบนี้  
- **Sam:** preview เป็น `<pre>`; delete ไม่มี typed confirm  
- **นายทะเบียน:** เชื่อ preview มากขึ้น; ยังกลัวแก้ `agm_invite` พลาด และกลัวเสียงานผ่านเมนูซ้าย

---

## English — Fix-agent brief

### Provenance

`⚠️ DEGRADED: single-context` · Assessment A inline · Assessment B `detect.mjs` clean · browser skipped (auth-gated)

Sources: `MessageTemplatesPage.tsx`, `admin.css` (`.bo-templates*`), `ConfirmDialog.tsx`, `AdminApp.tsx` (`go()` / `pushState`)

### Anti-patterns verdict

**LLM:** Not AI marketing slop. Restrained association green, master–detail tool. Prior **task-trust** failures (preview honesty, variable silence, leaky in-page discard) largely closed. Remaining: **shell-level leave** + **high-stakes AGM save**.

**Deterministic scan:** 0 findings.

### Overall impression

Strong recovery from 26 → 31. The page now *means* its discard dialog and tells the truth about copy. Biggest remaining opportunity: **don’t let the admin shell silently undo that trust**, and treat **system AGM save** with the same gravity as delete.

### What's working

1. Unified `PendingNav` discard for select / create / cancel / reload / broadcast + `beforeunload`.  
2. Honest preview + explicit plain-text / no-merge contract under body.  
3. System template (`agm_invite`) delete-protected with clear footer; operational load/empty/error states intact.

### Priority issues

#### [P1] SPA / sidebar leave still discards dirty without dialog

- **What:** Page guards cancel / refresh / in-page «ไปส่งข้อความแบบกลุ่ม». `AdminApp.go()` uses `history.pushState` + `popstate` — unmounts page **without** discard UI. `beforeunload` does **not** fire on SPA route change.  
- **Why:** Staff re-learn «ทิ้งการแก้ไข?» then lose Thai drafts via left nav.  
- **Fix:** Shell-level dirty registry that `go()` consults → same `ConfirmDialog`.  
- **Command:** `/impeccable harden` (page + `AdminApp.tsx`)

#### [P1] Saving `agm_invite` is still casual

- **What:** System invite editable with only soft footer; same save path as custom templates.  
- **Why:** Wrong AGM copy can hit association-wide invites — «ยืนยันก่อนทำลาย» should extend here.  
- **Fix:** Soft/typed confirm when `selected.id === agm_invite` before save.  
- **Command:** `/impeccable harden`

#### [P2] Dirty state under-signaled on edit

- **What:** Creating shows «ยังไม่บันทึก»; editing dirty only enables Save / Reset.  
- **Fix:** Unsaved pill on editor head + active list item when `dirty`.  
- **Command:** `/impeccable clarify` / `/impeccable polish`

#### [P2] Split-brain workflow with Broadcast

- **What:** Ghost CTA navigates bare `/admin/broadcast` — no `templateId` handoff.  
- **Fix:** «ไปส่งด้วยแม่แบบนี้» → preselected template.  
- **Command:** `/impeccable harden`

#### [P2] Unbounded template list without search

- **Fix:** Filter input when `templates.length > 5`.  
- **Command:** `/impeccable distill` / `/impeccable polish`

### Persona red flags

**Alex:** No Cmd/Ctrl+S; sidebar still nukes dirty; wants edit → broadcast with template.

**Sam:** Long `<pre>` preview; muted labels — verify ≥4.5:1; delete without typed confirm.

**นายทะเบียน:** Preview honesty improved; still fears casual AGM save + left-nav draft loss.

### Cognitive load

Failures ≈ 2 (hero CTAs compete; list without search grows) → moderate-low.

### Minor observations (P3)

- Hero three CTAs — demote refresh/broadcast (`/impeccable quieter`)  
- `route_not_found` ops-jargony (`/impeccable clarify`)  
- Delete success copy thin (`/impeccable clarify`)

### Questions to consider

1. Should dirty state live in AdminApp so every sidebar click respects «ทิ้งการแก้ไข?»  
2. Is editing «แม่แบบเชิญประชุม · ระบบ» allowed to feel as casual as a seminar reminder?  
3. After save, is the job “library curated” or “ready to send”?

### Concrete fix backlog

| ID | Sev | File(s) | Change |
|----|-----|---------|--------|
| MT1 | ✅ | `MessageTemplatesPage.tsx` | Done — honest «ตัวอย่างข้อความ» |
| MT2 | ✅ | `MessageTemplatesPage.tsx` | Done — plain-text / no-merge hint |
| MT3 | ✅ | `MessageTemplatesPage.tsx` | Done — cancel/reload/broadcast dirty → discard + beforeunload |
| MT3b | P1 | `MessageTemplatesPage.tsx`, `AdminApp.tsx` | Bridge dirty to shell `go()` |
| MT4 | P1 | `MessageTemplatesPage.tsx` | Soft/typed confirm when saving `agm_invite` |
| MT5 | P2 | `MessageTemplatesPage.tsx`, `admin.css` | Unsaved badge when `dirty` |
| MT6 | P2 | templates + broadcast | Broadcast with template preselected |
| MT7 | P2 | `MessageTemplatesPage.tsx` | Search/filter when count > 5 |

### Suggested command sequence

1. `/impeccable harden` — SPA dirty bridge; AGM save confirm; optional broadcast deep-link  
2. `/impeccable clarify` — unsaved badge  
3. `/impeccable polish` — list filter, success copy  
4. Re-`critique` — target **≥ 34/40**, keep **P0 = 0**

### Trend

| Run | Score | Notes |
|-----|------:|-------|
| Prior | 26/40 | Preview overclaim · no variable contract · leaky discard |
| **This** | **31/40** | +5 after MT1–MT3; remaining P1 = shell leave + AGM save |

---

## Detector snapshot

```json
{ "target": "MessageTemplatesPage.tsx", "findings": [], "exitCode": 0 }
```

*End of report 18 — Admin Message Templates (re-critique after fixes)*
