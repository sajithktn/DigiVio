# FRONTEND.md — DigiVio Web-to-Print Platform (Purple & Lavender Theme)

> **How to use this file with Antigravity:** Attach this file together with `backend.md` and the reference image. Tell the agent:
> *"Read FRONTEND.md fully. Build the frontend one section at a time in the order given. After each section, do the quick manual CHECK listed (open the page, look at it, click through it). Do NOT create test files, test specs or test folders. Do NOT change backend logic, API routes, database, or auth behaviour. Log any decision in DECISIONS.md."*

---

## 0. PROJECT SUMMARY

**Project name:** **DigiVio**
**What it is:** A subscription-free, per-order web-to-print platform with six print divisions:
1. Labels & Stickers
2. Race & Event Numbers
3. MTB Boards
4. Stamps
5. Trophies
6. Laser-Cut Work

**Customer flow:** Browse → Configure (size / material / qty) → Instant price → Design in browser OR upload artwork → Proof → Approve → Pay → Track → One-click reorder.
**Staff flow:** Quote → Order → Artwork → Proof → Production → Completed, with print-file download and reports.

**Look & feel in one line:** *Modern · Creative · Premium · Minimal · Elegant* — a premium sneaker-store aesthetic (big confident product imagery, lots of white space, deep purple contrast sections) adapted for a professional print SaaS.

**Reference image:** Use the attached image as the primary visual inspiration for palette, contrast, gradients, spacing, and card style. If no image is available to the agent, follow the palette and rules in this file exactly.

---

## 1. TECH RULES (frontend)

- **Framework:** Next.js (App Router, TypeScript) + React + Tailwind CSS (same as backend.md).
- **Mobile-first, fully responsive** (mobile → tablet → desktop). Preserve any existing responsive layouts.
- **Do not change** existing business logic, API integrations, routing, or functionality. Only build UI and restyle.
- **Do not restructure** existing components unnecessarily; extend them.
- **No test files.** Verification is a short manual CHECK after each section (open in browser, resize, click). Do not create `*.test.*`, `*.spec.*`, `__tests__`, Storybook, or Playwright/Cypress files.
- **Icons:** `lucide-react` (one consistent line-icon set).
- **Charts:** `recharts`, using only theme purples.
- **Motion:** CSS transitions + optional `framer-motion` for small entrances. Respect `prefers-reduced-motion`.
- **Fonts (via `next/font`, no render-blocking):** Headings = **Plus Jakarta Sans** (700/800, geometric). Body = **Inter** (400/500/600). Numbers/prices use tabular numerals (`font-variant-numeric: tabular-nums`).
- **Images:** `next/image`, lazy-loaded, with fixed aspect ratios to avoid layout shift. Use soft placeholder blur in `#F2ECF7`.

---

## 2. DESIGN TOKENS (build FIRST — everything else uses these)

### 2.1 Color palette (use ONLY these colors)

| Token | Hex | Use |
|---|---|---|
| `primary` | `#7542D8` | Primary buttons, links, active states, price highlights |
| `deep` | `#291747` | Hero/promo sections, dashboard sidebar, footer |
| `plum` | `#1E1530` | Darkest surfaces, logo, headings on light |
| `violet` | `#8B50F5` | Gradient end, focus glow, charts accent, hover highlights |
| `lavender` | `#E8DDF0` | Secondary button bg, tags, soft section bg |
| `lavender-light` | `#F2ECF7` | Subtle panels, table header, image placeholders |
| `bg` | `#F8F5FA` | Main page background |
| `card` | `#FFFFFF` | Cards, inputs, modals |
| `text` | `#211B27` | Primary text |
| `text-muted` | `#777080` | Secondary text |
| `border` | `#E5DCEB` | Borders, dividers |
| `success` | `#16A34A` | Success states |
| `error` | `#DC2626` | Error states |

**Derived shades allowed (same hue family only):** `primary-hover` = `#6535C0` (≈ 10% darker primary), `primary-pressed` = `#582BA6`, `primary-tint` = `#7542D8` at 8–12% opacity for soft backgrounds, `success-tint` / `error-tint` = the success/error colors at 10% opacity. **No other hues** (no blue, orange, teal, etc.).

### 2.2 Tailwind config

```ts
// tailwind.config.ts → theme.extend
colors: {
  primary: { DEFAULT:'#7542D8', hover:'#6535C0', pressed:'#582BA6' },
  deep: '#291747',
  plum: '#1E1530',
  violet: '#8B50F5',
  lavender: { DEFAULT:'#E8DDF0', light:'#F2ECF7' },
  surface: { bg:'#F8F5FA', card:'#FFFFFF' },
  ink: { DEFAULT:'#211B27', muted:'#777080' },
  line: '#E5DCEB',
  success: '#16A34A',
  danger: '#DC2626',
},
borderRadius: { card:'16px', btn:'12px', pill:'999px' },
boxShadow: {
  soft:  '0 2px 8px rgba(41,23,71,0.06)',
  card:  '0 8px 24px rgba(117,66,216,0.10)',
  lift:  '0 16px 40px rgba(117,66,216,0.18)',
  focus: '0 0 0 4px rgba(117,66,216,0.20)',
},
backgroundImage: {
  'hero-gradient': 'linear-gradient(135deg,#291747 0%,#1E1530 55%,#7542D8 140%)',
  'promo-gradient': 'linear-gradient(120deg,#7542D8 0%,#8B50F5 100%)',
  'soft-gradient': 'linear-gradient(180deg,#F2ECF7 0%,#F8F5FA 100%)',
}
```

Also expose the same values as CSS variables in `globals.css` (`--primary`, `--deep`, etc.) so any non-Tailwind code can use them.

### 2.3 Gradient rules
- Allowed gradients: `hero-gradient`, `promo-gradient`, `soft-gradient` only.
- Use gradients **only** on: hero, promo banner, one CTA strip, and the active sidebar indicator glow.
- Do **not** put gradients on regular cards, tables, forms or body backgrounds.

### 2.4 Shape, spacing, depth
- Cards: radius 16px, 1px `line` border, `shadow-soft`; hover → `shadow-card` + `translateY(-4px)`.
- Buttons/inputs: radius 12px. Tags/badges: pill.
- Spacing scale: 4/8/12/16/24/32/48/64/96. Section padding: 64px mobile / 96px desktop.
- Max content width: 1200px (marketing), 1440px (dashboards).
- Transitions: 200ms `ease-out` for hover/focus; 300–400ms for entrances.

### 2.5 Typography scale
- Display (hero): 40px mobile / 64px desktop, 800, tight tracking, `plum` on light or white on deep. One key phrase highlighted in `primary` (on dark backgrounds use `violet`/white-lavender for contrast).
- H1 36–48 / H2 28–36 / H3 20–24 / Body 16 / Small 14 / Caption 12.
- Line-height: headings 1.1–1.2, body 1.6.

### 2.6 Accessibility rules (apply everywhere)
- Body text must meet **WCAG AA (4.5:1)**. `ink` on white/bg ✔. `ink-muted (#777080)` is ~4.7:1 on white but ~4.4:1 on `#F8F5FA` → use muted text **on white cards** or at **16px+** on lavender backgrounds; for small text on lavender backgrounds use `ink`.
- `primary` on white ≈ 6:1 ✔ (safe for links and buttons with white text). `violet #8B50F5` on white is ≈ 4.6:1 → fine for large text/icons, not for tiny text.
- `success #16A34A` fails for small text on white → use it for icons/badges with a tinted background and `ink`/dark green-free text (`ink`), not as tiny body text.
- Visible focus ring on **every** interactive element (`shadow-focus` + 2px `primary` outline offset).
- Minimum touch target 44×44px. Never rely on color alone for status (add icon + label).
- All images have `alt`; icon-only buttons have `aria-label`; forms use real `<label>`.

---

## 3. GLOBAL COMPONENT LIBRARY (build SECOND)

Create reusable components in `/src/components/ui/`. Every page reuses them (this is what keeps the theme consistent).

1. **Button** — variants: `primary` (bg primary, white text, hover primary-hover, pressed primary-pressed), `secondary` (bg lavender, text deep, hover lavender-light + border), `ghost` (text primary, hover primary-tint), `danger` (bg danger). Sizes sm/md/lg. Loading state (spinner, disabled). Icon slot.
2. **Input / Textarea / Select / NumberStepper** — white bg, 1px `line` border, hover border `lavender`, focus border `primary` + `shadow-focus`, error border `danger` + message with icon, success border `success`.
3. **Label + helper text + error text** pattern.
4. **Checkbox, Radio, Switch** — primary when checked.
5. **Card** — white, `line` border, radius 16, `shadow-soft`, optional hover lift.
6. **Badge / StatusPill** — pill, tinted background + icon + text. Order status colors (purple family only): Quote = lavender; Order = primary-tint; Artwork = lavender-light w/ primary text; Proof = violet tint; Production = deep (white text); Completed = success tint; Cancelled = danger tint.
7. **Modal / Drawer / Toast** — white card on `plum/60` overlay; toasts: success (success border-left), error (danger border-left), info (primary border-left).
8. **Tabs** — underline active in `primary`.
9. **Table** — header `lavender-light`, row hover `lavender-light/50`, sticky header, mobile → stacked cards.
10. **Pagination, Breadcrumbs, Skeleton loaders** (shimmer in lavender tones).
11. **EmptyState** — soft illustration (simple SVG in lavender/primary) + title + CTA.
12. **Stepper / ProgressTracker** — for the order pipeline (see §8).
13. **FileDropzone** — dashed `line` border, hover → primary border + primary-tint bg; shows file type/size error states.
14. **PriceTag** — large tabular numbers in `primary`; small "incl. tax" caption in muted.

**CHECK after §3:** Build a throwaway `/dev/ui` page showing every component in all states (do not commit it as a test; delete it before final). Confirm hover, focus ring, disabled, loading, error look correct.

---

## 4. LAYOUT SHELLS

### 4.1 Public site shell
**Navbar**
- White (or `#F2ECF7` on scroll) background, 1px `line` bottom border, sticky, soft blur.
- Logo "DigiVio" in `plum`, with a small purple mark.
- Links: Products (mega-menu of 6 divisions), Gallery, How it works, Pricing calculator, Contact. Active link = `primary` text + 2px primary underline.
- Right side: search icon, cart icon with count badge (primary), **Login** (ghost) and **Get started** (primary CTA). Logged-in: avatar dropdown (Dashboard, Orders, Designs, Sign out).
- Mobile: hamburger → full-height drawer, large tap targets.

**Footer**
- `deep` background, `lavender` text, headings white, links hover to white with primary underline.
- Columns: Brand blurb, Products (6 divisions), Company, Support, Newsletter input.
- Bottom bar: © DigiVio, payment-safety note.

### 4.2 Customer dashboard shell
- **Deep purple (`#291747`) sidebar** (collapsible on tablet, bottom tab bar or drawer on mobile).
- Nav items: Overview, Orders, Saved designs, Proofs, Invoices, Profile & settings.
- Active item: `primary` pill/left indicator bar with subtle violet glow; inactive: `lavender` text at 80%; hover: white text + `white/5` bg.
- Main area: `#F2ECF7`/`#F8F5FA` background; top bar white with page title, search, notifications bell, avatar.

### 4.3 Admin dashboard shell
- Same shell as customer but sidebar is `plum (#1E1530)` to distinguish role, same purple active indicator.
- Nav items: Overview, Orders (pipeline), Production queue, Customers, Products, Templates, Gallery, Reports, Archive, Accounting export.
- Admin badge in top bar ("Admin" pill in `primary-tint`).

**CHECK after §4:** Resize to 360px, 768px, 1280px. Navbar collapses properly, sidebar behaves, no horizontal scroll, keyboard Tab order is sensible.

---

## 5. PUBLIC PAGES (customer-facing)

### 5.1 Home page — build in this section order
1. **Hero**
   - Large, soft-lavender / `soft-gradient` backdrop with a **deep-purple gradient panel** (`hero-gradient`) holding the main product showcase.
   - Bold dark headline (e.g., "Print that looks as good as your idea.") with key phrase in `primary` (on the deep panel use white + `violet` highlight).
   - Subtext in `ink-muted`.
   - Two CTAs: **Start designing** (primary) and **Get instant price** (secondary).
   - Right/under: large hero product image (sneaker-store style — one hero product floating with soft shadow, angled, with small floating "spec chips": "300 DPI", "Instant price", "Proof in minutes").
   - Trust row: "Pay per order · No subscription · Print-ready files".
2. **Division hub (Product Categories)**
   - **Six equal-weight white tiles** on light lavender background (PRD requirement: product hub of equal-weight tiles as navigation).
   - Each tile: product image as main focus, clean line icon, division name, 1-line description, arrow. Hover: lift + purple shadow + image gently zooms 1.04.
3. **Instant price calculator teaser**
   - White card on lavender: pick division → size → material → qty → live price with volume-discount hint. "Customize this" CTA goes to full configurator.
4. **How it works** — 4 steps (Configure → Design → Proof → Print & deliver) with numbered purple circles and a connecting line.
5. **Featured products** — product card carousel/grid (see §5.3 card spec).
6. **Promotional banner** — `promo-gradient` strip (e.g., "Volume discounts from 100 units") with white text + white button.
7. **Gallery preview** — masonry of real work, filter chips by division.
8. **Why DigiVio** — 3–4 benefit cards (Instant pricing, Print-ready files, Proof versioning, One-click reorder).
9. **Testimonials / event partners** (optional, simple cards).
10. **Final CTA band** — `deep` background, white heading, primary CTA.

### 5.2 Division / category page
- Page header on `soft-gradient` with breadcrumb + title + description.
- Filter/sort bar (sticky): size, material, price range, sort. Chips in lavender; active chip = primary.
- Product grid (1/2/3/4 columns responsive) using Product Card.
- Empty/loading states (skeleton cards).

### 5.3 Product card (spec)
- White bg, 1px `line` border, radius 16, `shadow-soft`.
- Image area on `lavender-light`, aspect 4:3, product as visual focus.
- Division tag (small pill, lavender), title (`ink`, 600), 1-line description (muted).
- **"From ₹X"** price in `primary`, bold; "incl. tax" caption.
- Action: **Customize** (primary button) + wishlist/save icon (ghost).
- Hover: `translateY(-4px)`, `shadow-lift`, border → `primary/30`, image zoom.

### 5.4 Product detail + configurator page (core page)
Layout: **left = product visual/preview** (large, on lavender-light), **right = configuration panel** (white card, sticky on desktop). On mobile: preview on top, config below, sticky bottom bar with price + CTA.

Configuration panel features, in order:
1. Product title, breadcrumbs, short description.
2. **Size**: width & height inputs (mm) with min/max hints, preset chips, orientation toggle.
3. **Material** selector (cards with swatch/thumbnail).
4. **Options** (finish, shape, etc.) as radio cards or selects, driven by API data (not hard-coded).
5. **Quantity** stepper + quick quantity chips (50 / 100 / 250 / 500 / 1000).
6. **Live price block**: unit price, total (tax-inclusive), "You save X%" badge when a volume discount applies, **volume discount tier table** with the active tier highlighted in purple. Price updates instantly (debounced ~150 ms, with a subtle number-tick animation, skeleton on first load).
7. Validation messages inline (size out of range, qty out of range) with error styling.
8. Two CTAs: **Design online** (primary) and **Upload your artwork** (secondary). Plus "Add to cart / Continue".
9. Trust notes: "Proof before print", "Print-ready files", "Pay per order".

### 5.5 Gallery page
- Division filter tabs (purple active), masonry/grid of real work, click → lightbox with title/division and "Order something like this" CTA.

### 5.6 Cart & checkout pages
- **Cart:** item cards (thumbnail, config summary, edit, remove), qty stepper, order summary card (subtotal, tax included, total), primary **Checkout** button.
- **Checkout:** 2-column on desktop (details + summary). Steps indicator (Details → Review → Pay). Address forms with clear validation. Pay button → Stripe hosted checkout. Secure-payment note.
- **Order confirmation page:** success icon (success tint), order number, summary, "Next: approve your proof" CTA, link to dashboard.

### 5.7 Auth pages (login / signup / forgot password)
- Split layout: left `hero-gradient` panel with brand statement + product image; right white card form.
- Inputs per §3; show password toggle; inline errors; primary submit; "Continue as…" not needed.
- After login redirect by role (customer → dashboard, admin → admin).

### 5.8 Static/support pages
- How it works, Contact (form), FAQ (accordion), Terms/Privacy — simple, same typography, lavender header band.
- Custom **404** and **error** pages in theme with a CTA back to home.

**CHECK after §5:** Walk through Home → Division → Product → Configure → Cart → Checkout on mobile and desktop. Confirm price updates live, tiers highlight correctly, no layout shift.

---

## 6. WEB-TO-PRINT DESIGNER (the signature screen)

**Layout (desktop):** top toolbar · left tool panel · center canvas · right properties panel. **Mobile:** canvas fills screen; tools in a bottom sheet / tab bar.

Library: **Fabric.js or Konva** (pick one, document why). Canvas state saved as JSON compatible with `backend.md` (`canvas_json`).

Features (build line by line):
1. Canvas sized to the product's trim size, with **bleed area** shown as a soft purple hatched band and **safe zone** as a dashed `primary` line.
2. **Print-area lock:** all elements constrained inside the print area; dragging outside snaps back; show a gentle warning toast "Keep artwork inside the print area."
3. **Template picker:** thumbnails of templates for this product; applying a template loads placeholders.
4. **Text tool:** add text, edit inline, font family dropdown (limited curated list), font size, bold/italic, alignment, color picker, letter-spacing (tracking).
5. **Placeholder fitting:** variable fields show shrink-to-fit behaviour; min/max font size respected; overflow indicator (danger outline + tooltip) if content cannot fit.
6. **Image/logo upload** (PNG, SVG, PDF, AI) with dropzone, progress, error states; low-resolution warning (below the product's DPI) with an amber-free warning style (use `danger` tint + icon, not a new color).
7. **Shapes** (rectangle, circle, line) with fill/stroke from the theme-based color swatches + custom hex.
8. **Transform:** move, resize, rotate, flip, duplicate, delete, lock, layer order (bring forward/back).
9. **Alignment tools:** align to print area (left/center/right/top/middle/bottom), distribute.
10. **Undo / redo** (keyboard Ctrl/Cmd+Z / Shift+Z), zoom in/out/fit, pan.
11. **Real-time proof preview toggle:** shows the final look with bleed/safe overlays hidden.
12. **Upload-finished-artwork path:** switch tab "Upload artwork" → dropzone → preview with trim/bleed overlay → confirm.
13. **Save design** (named, to account) + autosave indicator ("Saved • just now") and unsaved-changes guard.
14. **Variable data (CSV) panel** for race-number products: download sample CSV, upload CSV, show header validation and row-level errors, preview first row / row picker, row count, "Generate" progress.
15. **Continue to proof** primary button (disabled with reason until valid).

Visual styling: canvas area on `#F2ECF7` with subtle dot grid; panels white; selected-element handles in `primary`; toolbar buttons use secondary/ghost styles; active tool = primary-tint bg + primary icon.

**CHECK after §6:** Try dragging text outside the print area (must snap back), long text in a placeholder (must shrink), undo/redo, save and reload design, mobile bottom-sheet tools.

---

## 7. PROOF VIEWER & APPROVAL (customer)

1. **Proof page layout:** large proof preview (zoom/pan, trim + bleed overlays toggle) on lavender background; right/below info card.
2. **Version selector:** pills/timeline **v1, v2, v3…** with status badge each (Pending, Approved, Changes requested, Superseded). Latest highlighted in primary.
3. **Compare versions:** side-by-side or slider overlay (nice-to-have).
4. **Order/config summary card:** product, size, material, qty.
5. **Actions:** **Approve proof** (primary, opens confirm modal stating version number and "This will unlock printing") and **Request changes** (secondary, opens textarea modal with validation).
6. **Approval log:** who/which version/when, in a simple vertical timeline (purple dots).
7. **Gate messaging:** if not approved, show "Print files unlock after approval"; if older version, approve button disabled with tooltip "A newer version exists."
8. **States:** loading skeleton, error toast, success toast + confetti-free subtle success banner.

**CHECK after §7:** Approve and request-changes both show correct modal, disabled states, toasts and updated badges.

---

## 8. CUSTOMER DASHBOARD (6 required modules)

Shell per §4.2. Build line by line:

1. **Overview page:** greeting, summary stat cards (Active orders, Proofs awaiting you, Saved designs, Total spent) in white cards with purple icon chips; "Needs your attention" list (proofs to approve); recent orders table (5); quick action buttons (New order, Reorder last).
2. **Account & profile status:** profile completeness bar (primary fill), email verified badge, edit profile form, change password, address book.
3. **Order history with current status:** searchable/filterable table (status filter chips), columns: order no, date, items, total, status pill, actions. Mobile → stacked cards.
4. **Order detail page:** **pipeline progress tracker** (Quote → Order → Artwork → Proof → Production → Completed) with completed steps filled primary, current step ringed with violet glow; items with config summary; proofs list; payment status; timeline of status history; invoice download; **Reorder** button.
5. **Saved designs gallery:** grid of design cards (thumbnail, name, product, config summary — size/material/qty, approved badge), actions: Reorder, Edit, Rename, Delete (confirm modal).
6. **Active proofs:** list with version state badges and **Review proof** CTA.
7. **One-click reorder:** button on order cards / design cards → confirmation drawer showing config, **current** price (may differ from last time, show notice), address, then confirm → success toast + navigate to the new order.
8. **Invoices / receipts:** table with invoice no, date, amount, **Download PDF** button.
9. **Notifications dropdown:** list of recent events (proof ready, order status), mark as read.
10. **Strict separation:** the customer UI never shows production files, internal notes, or other customers' data.

**CHECK after §8:** Log in as test customer; walk each of the six modules; confirm no admin-only items appear; test on mobile.

---

## 9. ADMIN DASHBOARD

Shell per §4.3 (plum sidebar). Build line by line:

1. **Overview:** KPI cards (Orders, Revenue, In production, Awaiting proof), line/area chart of orders by day (purple line `#7542D8` with `#8B50F5` gradient fill at low opacity), bar chart of throughput by division (purple shades only: primary, violet, deep, lavender), recent orders list, "Ready for production" count.
2. **Orders / production pipeline:**
   - Searchable job table: filter by status, customer, date range, product type; paginated; sticky filters.
   - Columns: order no, customer, product(s), qty, total, status pill, payment badge, **Ready-for-production indicator** (success icon + "Files unlocked" or lock icon + "Awaiting approval"), date, actions.
   - **Kanban view toggle** (columns = pipeline stages) with drag-to-advance (respect backend transition rules; show error toast on invalid move).
3. **Order detail (admin):** config snapshot, design preview, proof versions and approval log, status history, internal notes, **Advance status** control (dropdown showing only valid next stages), **Download production files** panel (PDF, PNG, CSV row-artwork zip) — disabled with explanation until files are unlocked.
4. **Proof management:** upload/create revised proof (new version), see customer change requests highlighted.
5. **Customers / users:** table, view profile + their orders, change role, deactivate (confirm modal).
6. **Products:** list by division; create/edit forms for product, size limits, bleed, DPI, CSV-merge flag; **materials**, **options**, **volume-discount tiers** (editable table with validation: ascending quantities).
7. **Templates & placeholders:** list, create/edit, print-area editor (draggable rectangles on a preview), placeholder editor (key, position, min/max font, tracking, shrink flag).
8. **Gallery manager:** upload images, assign division, reorder (drag), delete.
9. **Reports & analytics:** date range picker; cards for totals; charts (revenue over time, orders by status, throughput per division, top products); export CSV button.
10. **Archive:** completed orders, search by name/event/customer for repeat/event orders, "Reorder for customer" action.
11. **Accounting export:** date range → download Xero-ready CSV; preview table of rows.
12. **Role protection:** non-admin visiting `/admin/*` sees a themed 403 page (not a blank screen).

**CHECK after §9:** Log in as admin; filter orders, open one, try to download files before approval (must be blocked in UI), advance status, open reports. Confirm charts use only theme purples.

---

## 10. EMAIL & SYSTEM MESSAGES (UI side)

1. In-app toast patterns: success / error / info (see §3).
2. Branded email HTML templates (if frontend owns them): white card on `#F8F5FA`, `deep` header with DigiVio logo, primary button, muted footer. Templates for: order confirmation, proof ready, proof approved, changes requested, in production, completed.
3. Form-level error summaries and field-level errors for every form.
4. Global error boundary pages (404, 500, offline) in theme.

---

## 11. MOTION & MICROINTERACTIONS (subtle only)

1. Buttons: hover darken + 1px lift; active press scale 0.98.
2. Cards: hover lift 4px + purple shadow (200 ms).
3. Product images: zoom 1.04 on card hover.
4. Page sections: fade-up on scroll (once, 300–400 ms, 12px travel).
5. Price numbers: quick tick/fade when value changes.
6. Pipeline tracker: current step has a slow soft pulse (violet glow).
7. Sidebar: active indicator slides between items.
8. Skeleton shimmer in lavender tones for loading.
9. Honor `prefers-reduced-motion`: disable all non-essential animation.

---

## 12. RESPONSIVENESS CHECKLIST

1. Breakpoints: 360 / 640 / 768 / 1024 / 1280 / 1440.
2. No horizontal scroll at any width.
3. Tables become stacked cards on mobile.
4. Configurator: sticky bottom price bar on mobile.
5. Designer: bottom-sheet tools on mobile, pinch-zoom on canvas.
6. Dashboards: sidebar → drawer on mobile.
7. Touch targets ≥ 44px.

---

## 13. PERFORMANCE CHECKLIST

1. `next/font` for fonts, `next/image` for images, lazy-load below-the-fold.
2. Code-split the designer (dynamic import) and charts.
3. Debounce live price calls; cache last quote per config.
4. Avoid layout shift: reserve image and chart heights.
5. No unused libraries; keep one icon set.

---

## 14. BUILD ORDER (do in this exact sequence)

| # | Section | Output |
|---|---|---|
| 1 | §2 Design tokens | Tailwind config, `globals.css`, fonts |
| 2 | §3 Component library | `/components/ui/*` |
| 3 | §4 Layout shells | Public navbar/footer, customer shell, admin shell |
| 4 | §5.7 Auth pages | Login / signup / forgot |
| 5 | §5.1–5.3 Home + division + product card | Hero, hub tiles, cards |
| 6 | §5.4 Configurator | Live price, tiers |
| 7 | §5.5–5.6, 5.8 Gallery, cart, checkout, static | Remaining public pages |
| 8 | §6 Designer | Canvas + panels |
| 9 | §7 Proof viewer | Versions + approval |
| 10 | §8 Customer dashboard | 6 modules |
| 11 | §9 Admin dashboard | Pipeline, products, reports |
| 12 | §10–13 Polish | Motion, emails, responsive, performance |

**If time is short, cut in this order:** compare-versions slider → Kanban drag → gallery manager polish → testimonials → animations. **Never cut:** configurator with live price, designer print-area lock, proof approval UI, customer dashboard modules, admin file download/pipeline, mobile responsiveness.

---

## 15. FINAL VISUAL REVIEW (manual, no test files)

Open the live app and check, then fix anything off:

- [ ] Only palette colors appear anywhere (no stray blues/oranges/greys outside tokens).
- [ ] Navbar: white/lavender, plum text, purple active link, purple CTA.
- [ ] Hero: lavender backdrop + deep purple gradient panel, bold headline with purple highlight.
- [ ] Division tiles: equal-weight white cards, image-first, purple hover shadow.
- [ ] Product cards: white, light purple border, purple price + button, smooth hover.
- [ ] Forms: white inputs, lavender borders, purple focus ring, clear error/success states.
- [ ] Buttons: primary purple / secondary lavender, correct hover.
- [ ] Customer dashboard: deep purple sidebar, lavender content, white cards, purple active indicator.
- [ ] Admin dashboard: plum sidebar, same system, purple charts.
- [ ] Text contrast passes (spot-check small muted text on lavender).
- [ ] Keyboard focus visible everywhere; reduced-motion respected.
- [ ] Works at 360px, 768px, 1280px.
- [ ] No backend, routing or API behaviour was changed.
- [ ] No test files were added (`git status` shows none).

---

## 16. ANTIGRAVITY AGENT RULES (copy into the agent's workspace rules)

```
1. Build in the order in FRONTEND.md §14, one section at a time.
2. Use ONLY the palette in §2.1 (and the allowed derived shades). No other hues.
3. Reuse components from /components/ui — do not restyle ad hoc per page.
4. Do NOT modify backend logic, API routes, database schema, auth behaviour, or routing.
5. Do NOT create test files, specs, or test folders. Verify visually and by clicking through.
6. Mobile-first: design the 360px layout first, then scale up.
7. Accessibility is mandatory: focus rings, labels, alt text, AA contrast, 44px targets.
8. Gradients only where §2.3 allows. Keep the UI clean, spacious, premium.
9. Use API data for products/options/prices — never hard-code business data in the UI.
10. After each section, do the manual CHECK, fix issues, then commit: "feat(ui): <section> done".
11. Log any ambiguity or decision in DECISIONS.md.
```

---

## 17. NOTE ON THE REFERENCE IMAGE

The "premium sneaker-store" look means: **one hero product per section, generous white space, soft shadows, big bold type, a dark purple contrast block next to light lavender areas, and floating product imagery.** Reproduce that composition language with print products (stickers, race bibs, MTB number boards, stamps, trophies, laser-cut pieces) instead of shoes. Use real or high-quality placeholder product images with transparent/soft backgrounds, placed on `#F2ECF7` or the deep purple gradient.
