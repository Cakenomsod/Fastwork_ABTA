# 16 — Admin Seminars (`/admin/seminars`)

⚠️ **DEGRADED: single-context** (nested Multitask subagent — dual Assessment A/B spawn blocked; design review + `detect.mjs` ran inline)

| Meta | Value |
|------|--------|
| **Score** | **28 / 40** · Good |
| **Prior** | **20 / 40** · Acceptable → **+8** after fixes |
| **P0** | 0 |
| **P1** | 2 |
| **P2** | 3 |
| **P3** | 2 |
| **Files** | `SeminarsPage.tsx`, `ConfirmDialog.tsx` (`requireReason`), `admin.css` (`.bo-seminar-*`) |
| **Detect** | `detect.mjs --json` → `[]` (clean, exit 0) |
| **Browser** | Skipped — page requires admin Google auth; no reliable live overlay |
| **Date** | 2026-07-27 (re-critique after fixes) |

**Fixes verified:** Reject `ConfirmDialog` + `requireReason` (no `window.prompt`) · `REG_STATUS_LABEL` + `.bo-badge` · registration «งาน» column joins `seminar.title` · Thai `ERROR_LABEL` · per-row `decidingId` busy label on approve

---

## สรุปสำหรับอ่าน (ภาษาไทย)

### คะแนนรวม: 28/40 (Good) · เดิม 20/40

คิวใบสมัครไม่ใช่ CRUD ดิบอีกต่อไปในจุดที่เคยทำร้ายความน่าเชื่อถือ: ปฏิเสธใช้ `ConfirmDialog` พร้อมเหตุผลบังคับ, สถานะเป็นไทย+badge, คอลัมน์งานแสดงชื่อสัมมนาแทน UUID — สอดคล้องหลัก «ยืนยันก่อนทำลาย» และ «สถานะชัดก่อนสวย»

**จุดแข็ง**
1. **Audience picker + สรุปสิทธิ์** — toggle กลุ่ม/ราคา + `aria-live` preview ยังเป็นจุดเด่นของหน้า
2. **ConfirmDialog สองเส้นทาง** — ปิดงาน (danger) และปฏิเสธ (`requireReason`) ใช้ pattern เดียวกัน
3. **สถานะ + ชื่องานอ่านได้** — badge ไทย + join title จากรายการงาน

**P0:** ไม่มี — `window.prompt` หายแล้ว

**Top 3 ที่เหลือ**
1. **[P1]** ยังไม่ queue-first — ไม่มีกรอง «รอพิจารณา» / นับ badge; ใบสมัครคละสถานะทั้งหมด
2. **[P1]** คอลัมน์งานเป็นช่องว่างเมื่องานไม่อยู่ในรายการที่เปิด (ปิดงานแล้ว) — ควร fallback ข้อความ
3. **[P2]** ไม่มี loading เริ่มต้น / toast สำเร็จ; `decidingId != null` ล็อกปุ่มทุกแถวระหว่างตัดสินใจใบเดียว

---

## English — Full critique for fix agents

### Method & evidence

⚠️ DEGRADED: single-context (nested Multitask; dual A/B disallowed)

- **Assessment A:** source read of post-fix `SeminarsPage.tsx` + `ConfirmDialog` `requireReason` path + seminar CSS patterns.
- **Assessment B:** `node .cursor/skills/impeccable/scripts/detect.mjs --json apps/web/src/admin/pages/SeminarsPage.tsx apps/web/src/admin/ConfirmDialog.tsx` → **`[]`**.
- **Agreement:** Detector clean. Prior P0 (`window.prompt`) and prior title/status recognition gaps are **resolved** in happy path. Remaining work is queue IA + closed-seminar title fallback + feedback polish.
- **Browser overlay:** not available (auth-gated BO).

### Heuristics scoring

| # | Heuristic | Score | Key issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | Thai status badges + row «กำลังบันทึก…»; no initial load skeleton; no success toast after approve/reject/save |
| 2 | Match System / Real World | 3 | Thai create form + status + errors; unknown `status` / `applicantType` still fall through raw |
| 3 | User Control and Freedom | 3 | Cancel/Escape on both ConfirmDialogs; form cancel; no undo after reject (acceptable if rare) |
| 4 | Consistency and Standards | 3 | Close + reject both use branded ConfirmDialog; reg table still not `bo-table--cards` |
| 5 | Error Prevention | 3 | Danger + required reason on reject; deactivate confirm; queue still mixed so wrong-row risk remains |
| 6 | Recognition Rather Than Recall | 3 | Title column via `seminarById`; **blank cell** when seminar not in active list |
| 7 | Flexibility and Efficiency | 2 | Row busy label; but `decidingId != null` disables *all* row actions; no pending filter / bulk |
| 8 | Aesthetic and Minimalist Design | 3 | Audience block still focused; reg table is denser but purposeful |
| 9 | Error Recovery | 3 | Thai `ERROR_LABEL` incl. `reason_required` / `decide_failed`; unknown codes may still surface raw |
| 10 | Help and Documentation | 2 | Create-form hints strong; no guidance for registration queue workflow |
| **Total** | | **28/40** | **Good** |

### Anti-patterns verdict

**LLM:** Does not look AI-generated. The previous anti-reference hit (`window.prompt` for reject) is **gone**. Surface now matches BO ConfirmDialog vocabulary. Residual “CRUD list” feel remains because the registrations panel is still not queue-first.

**Deterministic scan:** 0 findings on SeminarsPage / ConfirmDialog markup.

**Visual overlays:** none (auth).

### Overall impression

Create/edit seminar (audience + pricing) was already the strong half; the registration half is now **safe enough to use** for approve/reject. The biggest remaining gap vs PRODUCT «คิวเป็นศูนย์กลาง» is that staff still scan a mixed-status table instead of a default pending queue — and closed-seminar rows can show an empty title cell.

### What's working

1. **Reject ConfirmDialog + `requireReason`** — danger variant, Thai labels, reason passed to `decideSeminarRegistration`; cancel gated while busy.
2. **Thai status badges** — `REG_STATUS_LABEL` + semantic `.bo-badge` classes (`pending` / `slip` / `active` / `expired`).
3. **Title column** — `seminarById.get(r.seminarId)?.title` replaces raw `<code>{seminarId}</code>`; reject modal also names the seminar when known.
4. **Audience picker** — still the page’s craft highlight (toggle + price reveal + `aria-live` summary).

### Priority issues

#### [P1] Registrations panel is not queue-first
- **What:** All registrations render mixed; no default «รอพิจารณา» filter, count badge, or pending-only view.
- **Why:** PRODUCT principle is queue-centric BO. Staff hunting actionable rows among confirmed/rejected is slow and error-prone.
- **Fix:** Default filter to actionable statuses (`registered` / `paid`); show count; optional tabs or chips; keep “ทั้งหมด” as secondary.
- **Command:** `/impeccable distill SeminarsPage queue` + `/impeccable harden`

#### [P1] Title cell blank when seminar not in active list
- **What:** `seminarTitle = seminarById.get(...)?.title?.trim() ?? ""` — deactivated/closed seminars drop out of «งานที่เปิดอยู่», leaving empty «งาน» cells (and weaker reject copy).
- **Why:** Recognition regresses exactly when historical registrations matter most.
- **Fix:** Fallback «งานที่ปิดแล้ว» / keep closed seminars in a lookup map / show truncated id as secondary only when title missing.
- **Command:** `/impeccable clarify SeminarsPage title fallback`

#### [P2] Feedback + global decide lock
- **What:** No initial loading state (empty flash «ยังไม่มีงานสัมมนา» / empty regs); save/approve/reject success is silent (list just refreshes). While `decidingId != null`, **every** row’s approve/reject is disabled.
- **Why:** Alex loses parallel triage; Casey/Jordan get no confirmation peak after a high-stakes reject.
- **Fix:** Page-level loading flag; short inline success; disable only the active row (`rowBusy`), leave siblings enabled.
- **Command:** `/impeccable polish SeminarsPage feedback`

#### [P2] Unknown status / applicantType fall through
- **What:** `REG_STATUS_LABEL[status] ?? status` and `PRICING_LABEL[…] ?? applicantType` can show English API tokens.
- **Fix:** Explicit «ไม่ทราบสถานะ» / «ประเภทอื่น» fallbacks + keep raw in `title` for support.
- **Command:** `/impeccable clarify`

#### [P3] Table / empty markup polish
- Empty regs cell uses inline `style={{ color: "var(--bo-muted)" }}`; no `bo-table--cards` / `data-label` on narrow viewports; actions column has label (good) but still dense.
- **Command:** `/impeccable adapt`

#### [P3] ConfirmDialog focus restore (shared)
- Same shared gap as Staff: focus not restored to trigger on close.
- **Command:** `/impeccable audit ConfirmDialog focus restore`

### Cognitive load

| Checklist item | Pass? |
|----------------|-------|
| Single focus | Fail — create form + open list + full reg table compete |
| Chunking | Pass (audience grid ≤2) |
| Grouping | Pass |
| Visual hierarchy | Pass on create; weaker on regs |
| One thing at a time | Pass for reject modal |
| Minimal choices | Fail on regs — all statuses visible with no filter |
| Working memory | Pass for title (happy path); Fail for closed-seminar blank |
| Progressive disclosure | Pass — price fields appear when audience selected |

**Failures: 3 → moderate.** Create path is low load; registration queue still adds extraneous load.

### Persona red flags

**Alex (power user / เจ้าหน้าที่ประจำ)**  
- Reject no longer blocked by native prompt.  
- Still no pending filter / bulk; deciding one row locks all actions.  
- Soft success feedback missing → re-checks table to confirm.

**Sam (a11y)**  
- ConfirmDialog reason field focusable; Escape works.  
- Status color + Thai text (not color alone) — good.  
- No live region for decide success/errors beyond top `bo-error`.

**Jordan / นายทะเบียน (first-time)**  
- Create form still teachable.  
- Mixed reg table without “what do I do next?” guidance.  
- Blank title on closed seminars looks like a bug.

**Riley (edge)**  
- Reject without reason blocked by `requireReason`.  
- Empty title fallback missing when seminar map miss.  
- Initial empty flash before fetch completes.

### Minor observations

- Approve path has no confirm (by design for speed) — OK if pending filter lands first.
- Pricing summary on open seminars list uses Thai fee formatting — consistent with create preview.
- Detector clean; no AI-slop markup rules triggered.

### Questions to consider

- Should closed seminars stay in a hidden lookup for titles, or should the API return `seminarTitle` on each registration?
- Default queue = `registered` only, or `registered` + `paid`?
- Is bulk approve in scope for Phase 1, or only filter + per-row busy?

### Detector summary

```text
detect.mjs targets: SeminarsPage.tsx, ConfirmDialog.tsx
result: [] (exit 0)
false positives: n/a
```

---

## Concrete fix backlog

| # | Sev | Task | Files | Suggested command |
|---|-----|------|-------|-------------------|
| 1 | P1 | Default pending/actionable filter + count on regs panel | `SeminarsPage.tsx` | `/impeccable distill` / `harden` |
| 2 | P1 | Title fallback when seminar missing from active list | `SeminarsPage.tsx` (+ API if needed) | `/impeccable clarify` |
| 3 | P2 | Initial loading; success feedback; disable only active row | `SeminarsPage.tsx` | `/impeccable polish` |
| 4 | P2 | Unknown status/type Thai fallbacks | `SeminarsPage.tsx` | `/impeccable clarify` |
| 5 | P3 | `bo-table--cards` + drop inline empty color | `SeminarsPage.tsx` | `/impeccable adapt` |
| 6 | P3 | Focus restore on ConfirmDialog close | `ConfirmDialog.tsx` | `/impeccable audit` |

**Recommended sequence:** `distill`/`harden` (1) → `clarify` (2,4) → `polish` (3) → `adapt` (5) → optional shared `audit` (6).

---

## Trend / snapshot

Re-critique after P0/P1 fixes. Prior docs score **20/40** → **28/40**. Impeccable storage slug: `apps-web-src-admin-pages-seminarspage-tsx`.
