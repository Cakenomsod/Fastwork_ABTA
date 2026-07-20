---
name: ABTA Member
description: ระบบสมาชิกสมาคม ABTA — เขียวสมาคม + ทอง บน LIFF และ Back Office
colors:
  green-deep: "#0b3a29"
  green-mid: "#186b4a"
  green-primary: "#0f4c36"
  green-highlight: "#12513a"
  green-darker: "#082a1e"
  green-card-mid: "#14503a"
  green-card-light: "#1c6f4c"
  green-active: "#157a52"
  green-sidebar-end: "#0a2e22"
  green-mist: "#d4e8dc"
  green-text-soft: "#bcd8c9"
  green-text-muted: "#9fc4b2"
  gold: "#c9a24b"
  gold-soft: "#e4ce93"
  gold-pale: "#f4e9cc"
  paper: "#f4f7f4"
  bg-light: "#eef2ea"
  bg-soft: "#eef3ef"
  form-surface: "#f7faf7"
  card: "#ffffff"
  ink: "#12211b"
  ink-link: "#1e3a2f"
  muted: "#4a5c52"
  field-muted: "#3d5248"
  line: "#d5e0d9"
  line-soft: "#dce6e0"
  danger: "#b42318"
  success: "#027a48"
  warn: "#b54708"
typography:
  display:
    fontFamily: "DM Sans, Sarabun, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Sarabun, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Sarabun, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  card: "24px"
spacing:
  xs: "0.35rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.green-primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "0.7rem 1.25rem"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "0.7rem 1.25rem"
  card-member:
    backgroundColor: "{colors.green-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.card}"
    padding: "1.5rem"
---

## Overview

ABTA Member ใช้ visual identity ของสมาคมการค้า: **เขียวป่า (association green)** เป็นสีหลัก **ทอง** เป็น accent สำหรับ brand mark และ highlight สถานะ

มี 2 register ใน codebase:
- **Member surfaces** (`shared.css`, `status.css`, `register.css`, `receipt.css`) — mobile-first, บัตรสมาชิก gradient เขียว, พื้นหลัง radial จาก `#12513a` → `#0b3a29` → `#082a1e`
- **Back Office** (`admin.css`) — sidebar gradient `#0b3a29 → #12211b → #0a2e22`, เนื้อหา paper/card, queue-first layout

Typography: **Sarabun** สำหรับ body ภาษาไทย, **DM Sans** สำหรับ display/headings ใน admin

## Colors

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Primary | `--page-green-primary` / `--bo-green` | `#0f4c36` | ปุ่มหลัก, links, focus rings |
| Deep | `--page-green-deep` / `--bo-green-deep` | `#0b3a29` | Sidebar, member card base, receipt headers |
| Mid | `--page-green-mid` | `#186b4a` | Button gradients, atmosphere overlays |
| Highlight | `--page-green-highlight` | `#12513a` | Hero radial gradient top stop |
| Darker | `--page-green-darker` | `#082a1e` | Hero radial gradient bottom stop |
| Card gradient | green-card-mid / green-card-light | `#14503a` / `#1c6f4c` | `.mcard` mid-to-light stops |
| Active | green-active | `#157a52` | Status pill, primary CTA gradient |
| Sidebar end | green-sidebar-end | `#0a2e22` | Admin sidebar gradient terminus |
| Mist | green-mist | `#d4e8dc` | Admin page radial wash |
| Accent | `--page-gold` / `--bo-gold` | `#c9a24b` | Brand mark, active nav, print button |
| Gold soft | `--page-gold-soft` | `#e4ce93` | Kicker text, member ID highlight |
| Surface | `--page-bg` / `--bo-paper` | `#eef2ea` / `#f4f7f4` | Page background, form panels |
| Form | form-surface | `#f7faf7` | Registration form card |
| Ink | `--page-ink` / `--bo-text` | `#12211b` | Body text on light surfaces |
| Ink (link) | ink-link | `#1e3a2f` | App shell default text/links |
| Muted | `--page-muted` / muted | `#4a5c52` | Labels, secondary text (≥4.5:1 on light bg) |
| Field muted | field-muted | `#3d5248` | Form field labels |
| On-card soft | green-text-soft / green-text-muted | `#bcd8c9` / `#9fc4b2` | Secondary text on dark member card |
| Danger | `--bo-danger` | `#b42318` | Delete, reject actions |

Member pages ใช้ `--page-*` tokens จาก `apps/web/src/pages/shared.css`. Admin ใช้ `--bo-*` จาก `admin.css`. ค่า hex ตรงกันระหว่าง register ที่ overlap.

Canonical OKLCH reference อยู่ใน `ABTA-System/mockup/index.html` — ใช้เป็น north star สำหรับ token ใหม่

## Typography

- Body: Sarabun 400/500, 1rem, line-height 1.5
- Headings: DM Sans 700, letter-spacing -0.02em to -0.03em
- Labels: 0.72–0.86rem, weight 500, color muted token
- Hero/display ceiling: clamp max ≤ 6rem
- ภาษาไทยทั้งหมด — ไม่ใช้ font ที่ไม่รองรับ Thai glyphs

## Elevation

- **Member card**: neutral shadow `rgba(0,0,0,0.25)` — ไม่ใช้ colored glow
- **Admin cards**: `--bo-shadow` — subtle layered shadow
- **Modal**: OKLCH soft overlay + backdrop blur 10px, z-index 100
- Z-index scale: modal 100, sticky sidebar default

## Components

### Member card (`.mcard`)
Gradient `#0b3a29 → #14503a → #1c6f4c`, gold border tint (`rgba(201,162,75,0.28)`), white text hierarchy with gold-soft accents

### Member page shell (`.reg-shell`, `.status-shell`, `.rcpt-shell`)
Shared radial hero: `#12513a → #0b3a29 → #082a1e` plus gold/green atmosphere overlays

### Back Office sidebar
Dark gradient `#0b3a29 → #12211b → #0a2e22`, gold brand mark, active nav = inset gold bar (not side-tab on content cards)

### ConfirmDialog (`.bo-modal`)
Centered modal, danger variant สำหรับ delete, typed confirm สำหรับ destructive actions

### Status badges
Semantic colors: success/warn/danger/info soft backgrounds

## Do's and Don'ts

**Do**
- ใช้ CSS custom properties จาก `shared.css` (`--page-*`) สำหรับ member pages หรือ `--bo-*` ใน admin
- ใช้ muted color `#4a5c52` บนพื้นอ่อน (contrast ≥4.5:1)
- Confirm ก่อน destructive actions
- รองรับ reduced motion

**Don't**
- Side-tab accent (`border-left: 3px solid`) บน notice cards
- Colored box-shadow glow บนพื้นมืด (AI slop tell)
- Gray `#6b7c72` บนพื้น `#eef2ea` (contrast fail)
- Nested cards ใน admin detail panels
- Bounce/elastic easing
