# X Akademi — design style reference

Taste notes from reference apps (coach dashboard + student RPG tracker). **Not a copy brief.** Use this for future admin web + mobile redesigns: capture the *feel* (dark surfaces, soft geometry, boxed sections), not specific screens, chrome, or branding.

Last updated: 2026-07-31

---

## North star

- **Dark-first.** Light themes are not the preferred default for product UI.
- Soft, modern “app” language: layered dark panels, generous rounding, clear section boxes.
- **Role × form-factor split:**
  - **Admin / coach** → mostly **wide desktop** (web dashboard).
  - **Student** → mostly **mobile** (native app + narrow layouts).
- Same family of surfaces and radii across both; density, navigation, and accent energy differ.

---

## Shared DNA (both surfaces)

### Surfaces & depth
- Page background: near-black with a **cool navy / indigo** undertone (not flat pure black only, not warm cream).
- Content lives in **distinct boxes** (cards / panels) that sit one step lighter than the page.
- Nesting is normal: outer section card → inner metric rows / mini-panels.
- Separation via **subtle borders** and tone steps more than heavy multi-layer shadows.
- Soft glow is OK sparingly on primary CTAs / active nav — not neon chrome everywhere.

### Geometry
- **Large border radii** everywhere that feels interactive or sectional:
  - Section cards ≈ `16–32px`
  - Controls / chips / segmented pills ≈ `12–24px` or fully pill
  - Avatars: circle or soft squircle
- Avoid sharp enterprise rectangles and hairline “newspaper” grids.

### Typography & hierarchy
- Clean rounded **sans** (reference student UI used Nunito-like).
- Hierarchy by size + weight + color, not decoration:
  - **Large bold numbers** for KPIs
  - Short muted labels above/under
  - Secondary copy in cool gray
- Prefer short Turkish labels; keep chrome text sparse.

### Color roles (inspirational, not locked brand)
| Role | Feel | Notes |
|------|------|--------|
| Page bg | Deep navy / indigo-black | Admin ~`#0B1D3A`; student ~`#08081A` |
| Panel | Slate navy | ~`#0F172A` → `#1E293B` |
| Text | Near-white primary, cool-gray secondary | High contrast on dark |
| Primary accent | Warm magenta / pink-violet | Coach CTAs, active states (~`#C72C79` family) |
| Success / live | Teal / emerald | Active pills, healthy metrics |
| Warn / alert | Soft red / coral | Badges, negative deltas |
| Student energy | Purple→magenta gradient, lime & gold highlights | Gamified emphasis only on student side |

Do **not** treat magenta or purple as mandatory forever — keep a single vivid accent + a small status palette. Avoid default AI purple-on-white light themes.

### Components that “feel right”
- Segmented controls / pill tab bars inside a section header
- Status pills with a small colored dot
- Metric tiles in a grid (desktop) or stacked / 2-col mini-boxes (mobile)
- Soft icon wells (rounded square behind line icons)
- Floating / sticky primary action when it earns its place

---

## Admin — wide desktop language

**Audience:** coach / admin on web, large viewport.

### Layout
- Top utility bar: brand + notifications + profile (compact).
- Main content as a **vertical stack of wide section cards**, not one giant table-only page.
- **KPI strip / grid** near the top (2×2 or 4-up metric cards).
- Below: primary work area (student list, overview, alerts) as another large card with header + tools (search, count badge, primary CTA).
- Inside a student detail: **header identity card** (avatar, name, class/track) + **horizontal tabs** + **overview cockpit** of nested panels (pulse, warnings, charts, activity).
- Optional **floating bottom nav** can work on desktop when it stays compact; wide layouts may also grow a clearer side/top IA later — keep nav quiet either way.

### Density
- More information per viewport than mobile, but still **boxed and scannable**.
- Prefer “do I need to act?” signals (status pills, alert cards, unread badges) over wall-of-text.
- Multi-column where it helps (metric grids, side-by-side TYT/AYT boxes) without turning into a dense spreadsheet.

### Interaction chrome
- Primary CTA as filled accent pill (`+ Öğrenci Ekle` energy).
- Secondary actions as bordered dark buttons.
- Filters as segmented pills (Genel / TYT / AYT…).
- Lists: each student as a soft card row with avatar, status, nested score boxes, clear “open profile” affordance.

### What admin should *not* feel like
- Light gray SaaS default
- Gamified XP / bosses / neon game HUD
- Tiny dense admin tables with no section framing

---

## Student — mobile language

**Audience:** student on phone (and narrow web if needed).

### Layout
- Single-column stack; one job per card.
- Hero identity / progress card at top (avatar, level-or-status line, countdown or streak, XP-style progress optional).
- Horizontal **stat pills** or compact metric chips under the hero.
- Then feature modules: timer, daily message, subjects, deneme, plan — each its own rounded panel.
- Bottom or drawer navigation for destinations; keep targets thumb-friendly.

### Tone
- More **motivational and playful** than admin (quotes, streaks, soft glow, optional light gamification).
- Gradients on primary CTAs are welcome on student side.
- Texture OK in small doses (dot grid inside a hero card) — keep it subtle.

### Density
- Fewer numbers at once; larger tap targets; more vertical rhythm.
- Nested mini-boxes (e.g. TYT / AYT side-by-side) work well inside a student card.

### What student should *not* feel like
- Mini replica of the coach desktop dashboard
- Wide multi-tab cockpits squeezed onto a phone
- Cold “enterprise portal” chrome

---

## Desktop vs mobile — how to decide

| Concern | Admin (desktop) | Student (mobile) |
|---------|-----------------|------------------|
| Default theme | Dark | Dark |
| Width strategy | Multi-column grids, wide cards | Single column, stacked cards |
| Navigation | Top bar + section tabs; optional floating nav | Bottom tabs / compact destination list |
| Accent energy | Magenta/pink for CTA & active | Magenta/purple + lime/gold highlights |
| Gamification | Minimal / none | Allowed if it supports habit |
| Primary question | “Who needs action?” | “What do I do next today?” |

When a coach UI is used on a narrow screen, **stack** the desktop cards (metric grid → 2×2, student rows → full-width cards) rather than inventing a second visual language.

---

## Implementation hints for our stack

- Prefer CSS variables for: `--bg`, `--panel`, `--panel-2`, `--text`, `--muted`, `--accent`, `--success`, `--danger`, `--radius-lg`, `--radius-md`.
- Web admin: Tailwind-friendly `slate`/`navy` dark panels + one accent; `rounded-2xl` / `rounded-3xl` section cards.
- Mobile: same tokens; slightly stronger accent/glow and larger touch padding.
- Keep public marketing site free to diverge; this doc targets **product UI** (admin dashboard + Gelişim / X Akademi app).

---

## Explicit non-goals

- Do not clone KoclukApp or YKS RPG layouts, icons, copy, or feature IA.
- Do not paste light-theme screenshots as the target look.
- Do not force RPG vocabulary into admin.
- Do not “card-wash” every pixel — cards should mark **sections / interactive units**, not decorate empty space.

---

## Reference sources (inspiration only)

1. Coach dashboard product (dark mode) — wide admin patterns, magenta accent, nested panels, metric grids, student list cards.
2. Student YKS RPG tracker (guest) — mobile dark indigo, purple CTAs, hero progress card, stacked modules, playful energy.

Credentials and private demo accounts are **not** stored in this file.

---

## Admin design preview (in progress)

- Branch: `preview/admin-design`
- Hidden route (admin login required): `/app/admin/preview`
- Existing `/app/admin` is unchanged. Use the preview page to iterate on the new layout.
