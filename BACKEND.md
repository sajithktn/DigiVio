# BACKEND.md — Digital Heroes Web-to-Print Platform (PRD Level 2)

> **How to use this file with Antigravity:** Paste/attach this file and tell the agent:
> *"Read BACKEND.md fully. Build ONE feature at a time in the order given. After each feature, run its TEST GATE. Do not start the next feature until the current gate passes. Log every decision in `DECISIONS.md`."*

---

## 0. PROJECT SUMMARY

A **subscription-free, per-order web-to-print platform** for a print house with **6 divisions**:
1. Labels & Stickers
2. Race & Event Numbers
3. MTB Boards
4. Stamps
5. Trophies
6. Laser-Cut Work

**Customer journey:** Browse → Configure (size/material/qty) → Instant price → Design in browser OR upload artwork → Proof → Approve → Pay → Track → One-click reorder.
**Staff journey:** Quote → Order → Artwork → Proof → Production → Completed, with print-file download and reports.

**Three roles:** `visitor` (not logged in), `customer`, `admin`.

**Deadline mode:** This is due tomorrow. Priority order = (1) things listed in the PRD testing checklist, (2) things that are visible in a demo, (3) polish. Anything cut must be written in `DECISIONS.md`.

---

## 1. LOCKED TECH STACK

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router, TypeScript)** | PRD reference stack; API routes = "server APIs" |
| Styling | Tailwind CSS | PRD |
| DB / Auth / Storage | **Supabase** (Postgres + Auth + Storage + RLS) | PRD; must be a **NEW** Supabase project |
| Hosting | **Vercel** (NEW account) | PRD |
| Payments | **Stripe Checkout (test mode)** | PCI-compliant, hosted checkout |
| Email | **Resend** (or Nodemailer SMTP) | Order/proof/completion emails |
| Validation | **Zod** | Every API input validated |
| Print-file render | **`@napi-rs/canvas` + `pdf-lib`** (works on Vercel serverless) | Server-side PNG/PDF |
| CSV | **papaparse** | Variable-data merge |
| ZIP | **archiver** or **jszip** | Bundle one-file-per-row output |
| Tests | **Vitest** (unit) + **curl/REST client scripts** (API smoke) | Fast gates |

**Rules**
- All money stored as **integers in minor units (paise)**. Never floats.
- Currency: INR. Tax: **18% GST, inclusive** (configurable constant `TAX_RATE`). PRD says "VAT-inclusive" → we show tax-inclusive totals.
- Never commit `.env`. Provide `.env.example` only.
- Heavy work (print-file gen, CSV merge) runs **server-side only**.
- Service-role Supabase key is used **only** in server code, never shipped to browser.

---

## 2. FOLDER STRUCTURE

```
/src
  /app
    /api
      /products            GET list, GET [slug]
      /pricing/quote       POST
      /designs             CRUD
      /uploads             POST artwork
      /orders              POST create, GET mine
      /orders/[id]/reorder POST
      /orders/[id]/invoice GET
      /proofs              POST generate, GET list
      /proofs/[id]/approve POST
      /proofs/[id]/changes POST
      /checkout            POST create Stripe session
      /webhooks/stripe     POST
      /admin
        /orders            GET (search/filter), PATCH status
        /orders/[id]/files GET download
        /users             GET, PATCH
        /products          CRUD
        /templates         CRUD
        /reports           GET
        /export/xero       GET csv
  /lib
    /supabase              client.ts, server.ts, admin.ts
    /pricing               engine.ts, engine.test.ts
    /printfile             render.ts, fit.ts, naming.ts, csvMerge.ts
    /proofs                versioning.ts
    /auth                  guards.ts (requireUser, requireAdmin)
    /email                 send.ts, templates.ts
    /validation            schemas.ts
    /errors                api-error.ts
/supabase
  /migrations              001_schema.sql, 002_rls.sql, 003_seed.sql
/tests
  api-smoke.http / smoke.sh
DECISIONS.md
SCHEMA.md
.env.example
```

---

## 3. GLOBAL CONVENTIONS (apply to every feature)

1. **Response shape:** `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
2. **Auth guards:** `requireUser()` and `requireAdmin()` helpers used in every protected route.
3. **Validation:** every request body/query parsed with Zod; bad input → `400`.
4. **Error handling:** central `ApiError` class; never leak stack traces; log server-side.
5. **Status codes:** 200/201 success, 400 validation, 401 unauthenticated, 403 wrong role, 404 not found, 409 conflict (e.g., approval gate), 500 unexpected.
6. **Comment the code** (PRD requires "well-commented").
7. **After each feature:** run the TEST GATE → tick the checkbox in `PROGRESS.md` → commit.

---

## 4. DATABASE SCHEMA (build in Feature 2)

Document in `SCHEMA.md` too (PRD demands a documented schema).

```sql
-- ENUMS
create type user_role as enum ('customer','admin');
create type order_status as enum ('quote','order','artwork','proof','production','completed','cancelled');
create type proof_status as enum ('pending','approved','changes_requested','superseded');
create type payment_status as enum ('unpaid','paid','failed','refunded');
create type file_kind as enum ('print_pdf','print_png','csv_row_artwork','csv_zip','customer_upload','proof_preview');

-- PROFILES (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, phone text,
  role user_role not null default 'customer',
  organization_id uuid null,            -- future corporate/multi-account
  created_at timestamptz default now()
);

-- FUTURE-PROOFING: corporate accounts
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null, created_at timestamptz default now()
);

-- CATALOGUE
create table divisions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null,
  description text, sort_order int default 0, is_active bool default true
);

create table products (
  id uuid primary key default gen_random_uuid(),
  division_id uuid references divisions(id),
  slug text unique not null, name text not null, description text,
  pricing_model text not null default 'area',   -- 'area' | 'flat' | 'per_unit'
  base_price_minor int not null default 0,      -- setup/base per unit
  setup_fee_minor int not null default 0,       -- one-off per order
  min_qty int default 1, max_qty int default 100000,
  min_width_mm numeric, max_width_mm numeric,
  min_height_mm numeric, max_height_mm numeric,
  bleed_mm numeric default 3,
  print_dpi int default 300,
  supports_csv_merge bool default false,
  is_active bool default true
);

create table materials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null,
  rate_per_cm2_minor numeric not null,          -- price per cm² per unit
  is_active bool default true
);

create table product_options (                    -- orientation, finish, shape etc.
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  key text not null, label text not null,
  values jsonb not null,                        -- [{value:'gloss', label:'Gloss', price_delta_minor:0, multiplier:1.0}]
  unique(product_id,key)
);

create table volume_discounts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade, -- null = global default
  min_qty int not null, discount_percent numeric not null    -- e.g. 100 -> 5
);

-- TEMPLATES & PLACEHOLDERS
create table templates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null, preview_url text,
  canvas jsonb not null,                        -- default elements
  print_areas jsonb not null,                   -- [{id,x,y,w,h}] in % of product size (or mm)
  is_active bool default true
);

create table template_placeholders (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete cascade,
  key text not null,                            -- e.g. 'runner_number','name'
  x numeric, y numeric, w numeric, h numeric,   -- mm inside print area
  font_family text, font_size_default numeric,
  min_font_size numeric default 6, max_font_size numeric default 120,
  shrink_to_fit bool default true,
  tracking numeric default 0,                   -- letter-spacing
  max_tracking numeric default 0, min_tracking numeric default -2,
  align text default 'center'
);

-- DESIGNS (saved artwork)
create table designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id),
  template_id uuid references templates(id),
  name text,
  config jsonb not null,                        -- {width_mm,height_mm,material_id,options,qty}
  canvas_json jsonb,                            -- designer state (elements)
  upload_path text,                             -- if customer uploaded finished artwork
  thumbnail_path text,
  is_approved bool default false,
  created_at timestamptz default now()
);

-- ORDERS
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,                -- e.g. DH-2026-000123
  user_id uuid references profiles(id),
  status order_status not null default 'order',
  payment_status payment_status not null default 'unpaid',
  subtotal_minor int, tax_minor int, total_minor int,
  currency text default 'INR',
  stripe_session_id text, stripe_payment_intent text,
  shipping_address jsonb, billing_address jsonb,
  files_unlocked bool default false,            -- approval gate flag
  reorder_of uuid references orders(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  design_id uuid references designs(id),
  config jsonb not null,                        -- frozen snapshot of configuration
  qty int not null, unit_price_minor int not null, line_total_minor int not null,
  csv_upload_path text                          -- for variable-data jobs
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  from_status order_status, to_status order_status not null,
  changed_by uuid references profiles(id), note text, created_at timestamptz default now()
);

-- PROOFS (versioned)
create table proofs (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) on delete cascade,
  version int not null,                         -- v1, v2...
  canvas_snapshot jsonb not null,               -- exact design state at that version
  preview_path text,
  status proof_status not null default 'pending',
  created_at timestamptz default now(),
  unique(order_item_id, version)
);

create table proof_events (                     -- approval / change log
  id uuid primary key default gen_random_uuid(),
  proof_id uuid references proofs(id) on delete cascade,
  event text not null,                          -- 'created'|'approved'|'changes_requested'
  actor_id uuid references profiles(id), message text, created_at timestamptz default now()
);

-- GENERATED FILES
create table print_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  order_item_id uuid references order_items(id),
  kind file_kind not null, storage_path text not null, filename text not null,
  proof_id uuid references proofs(id),
  created_at timestamptz default now()
);

-- INVOICES
create table invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references orders(id) on delete cascade,
  invoice_no text unique not null, pdf_path text, issued_at timestamptz default now()
);

-- GALLERY (live work examples)
create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  division_id uuid references divisions(id), title text,
  image_path text, sort_order int default 0
);

-- EMAIL LOG
create table email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text, subject text, kind text, status text, created_at timestamptz default now()
);
```

**RLS rules (Feature 3):** customers read/write only rows where `user_id = auth.uid()` (or via their order); admins read all; catalogue tables are public-read; storage buckets are private with signed URLs.

**Storage buckets:** `uploads` (customer artwork), `previews` (proof/thumbnails), `printfiles` (admin/approved only), `gallery` (public), `invoices` (private).

---

## 5. FEATURE LIST — BUILD IN THIS ORDER

Each feature has: **Goal → Tasks → API → TEST GATE (run immediately)**. Do not skip the gate.

---

### FEATURE 1 — Project setup & environment
**Goal:** Running Next.js app connected to a new Supabase project.

**Tasks**
- `create-next-app` (TS, Tailwind, App Router). Install: `@supabase/supabase-js @supabase/ssr zod papaparse pdf-lib @napi-rs/canvas stripe resend archiver vitest`.
- Create `.env.example` with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`.
- Add `.env*` to `.gitignore`.
- Create three Supabase clients (browser / server / admin-service-role).
- Add `/api/health` returning DB connectivity.

**TEST GATE**
- [ ] `npm run dev` starts with zero errors.
- [ ] `curl localhost:3000/api/health` → `{ok:true, db:"connected"}`.
- [ ] `git status` shows `.env.local` is NOT tracked.

---

### FEATURE 2 — Database schema & seed data
**Goal:** All tables from §4 exist with realistic seed data.

**Tasks**
- Write `001_schema.sql` (§4), run on Supabase.
- Write `003_seed.sql`: 6 divisions; at least **1 product per division** (parameter-driven — e.g., Labels: width/height free-form, materials: vinyl/paper/matt; Race Numbers: `supports_csv_merge = true`); materials; options (finish, orientation, shape); volume discounts (e.g., 100→5%, 250→10%, 500→15%, 1000→20%); 2 templates (a race-number template with placeholders `runner_number`, `name`; a label template); 6+ gallery rows.
- Create `SCHEMA.md` describing every table and relation.

**TEST GATE**
- [ ] Query `select count(*) from divisions` = 6.
- [ ] Each division has ≥1 active product.
- [ ] Race-number template has ≥2 placeholders with min/max font size set.
- [ ] No product has more than ~1 row per concept (confirm **no SKU-per-size** — proves parameter-driven design).

---

### FEATURE 3 — Authentication, roles & RLS
**Goal:** Secure signup/login, roles enforced at API **and** DB level.

**Tasks**
- Supabase Auth email+password. Trigger: on `auth.users` insert → create `profiles` row (role=`customer`).
- Helpers: `requireUser()`, `requireAdmin()` (reads role from `profiles`).
- Write `002_rls.sql` for all tables per §4 notes.
- Seed one **admin** user and one **customer** test user (credentials go in the final handover doc).
- Middleware protecting `/dashboard/*` (customer) and `/admin/*` (admin).
- Session via Supabase cookies (JWT), HTTPS enforced on Vercel.

**API:** `POST /api/auth/signup`, `/login` (or use Supabase client directly), `GET /api/me`, `PATCH /api/me`.

**TEST GATE**
- [ ] Sign up new user → row appears in `profiles` with role `customer`.
- [ ] `GET /api/me` without token → **401**.
- [ ] Customer token calling any `/api/admin/*` → **403**.
- [ ] Customer A cannot read Customer B's order (try direct DB query with A's JWT → 0 rows).
- [ ] Admin token → can access `/api/admin/orders`.

---

### FEATURE 4 — Catalogue API (divisions, products, options)
**Goal:** Public read API powering the product hub.

**API**
- `GET /api/divisions`
- `GET /api/products?division=labels-stickers`
- `GET /api/products/[slug]` → returns product + materials + options + volume discount tiers + templates (everything the configurator needs in **one call**).
- `GET /api/gallery?division=...`

**TEST GATE**
- [ ] `/api/divisions` returns 6 items in `sort_order`.
- [ ] `/api/products/<slug>` includes `materials[]`, `options[]`, `volume_discounts[]`, size limits.
- [ ] Unknown slug → 404 with error shape.
- [ ] Works **without** auth (public visitor).

---

### FEATURE 5 — Pricing engine (instant calculator) ⭐ high-scoring
**Goal:** Pure, tested function + public API. Updates instantly as options change.

**Formula (document in DECISIONS.md)**
```
area_cm2        = (width_mm/10) * (height_mm/10)
unit_base       = product.base_price_minor
                  + area_cm2 * material.rate_per_cm2_minor
option_adjust   = Σ option.price_delta_minor   (and × option.multiplier)
unit_before_disc= (unit_base + option_adjust)
discount_pct    = highest tier where qty >= tier.min_qty
unit_price      = round(unit_before_disc * (1 - discount_pct/100))
subtotal_incl   = unit_price * qty + product.setup_fee_minor
tax_included    = round(subtotal_incl * TAX_RATE / (1 + TAX_RATE))   // tax-INCLUSIVE
total           = subtotal_incl
```
Return: `unit_price, qty, discount_percent, savings, subtotal, tax_included, total, breakdown[]`.

**Tasks**
- `lib/pricing/engine.ts` — **pure function, no DB calls inside** (data passed in) so it is unit-testable.
- `POST /api/pricing/quote` `{product_slug, width_mm, height_mm, material_id, options, qty}` — recomputes from DB (never trust client price).
- Validate: size within min/max, qty within min/max, material belongs to product.
- **Server re-prices at order creation** (Feature 12) with the same engine.

**TEST GATE (Vitest — write these tests FIRST)**
- [ ] qty 99 → 0% discount; qty 100 → 5%; qty 250 → 10%; qty 1000 → 20% (boundary tests).
- [ ] Doubling area increases unit price proportionally.
- [ ] Width below min → 400 with clear message.
- [ ] Tax-inclusive: `total === subtotal` and `tax_included` matches manual calc.
- [ ] All values are integers.
- [ ] Anonymous user (no auth) can call quote endpoint.
- [ ] Response time < 300 ms locally.

---

### FEATURE 6 — Templates, print areas & fitting rules
**Goal:** Data + server logic so content always fits the print area.

**Tasks**
- `GET /api/templates?product=slug` → template + `print_areas` + `placeholders` (with min/max font size, tracking, shrink flag).
- `lib/printfile/fit.ts`: `fitText({text, boxW, boxH, fontFamily, startSize, minSize, maxSize, tracking, minTracking, shrink})`
  Algorithm: measure text with canvas → if too wide, **first reduce tracking down to `min_tracking`, then reduce font size step-by-step to `min_font_size`**; if still too wide, return `{overflow:true}` and a clamped result (never exceed print area).
- `lib/printfile/clampToPrintArea(element, area)` — forces any element inside the area.
- Register a bundled `.ttf` font (e.g., Inter/Oswald) for server rendering — **do not rely on system fonts**.

**TEST GATE**
- [ ] `fitText("1")` keeps max size; `fitText("1234567890")` shrinks but ≥ min size.
- [ ] A 60-character string returns `overflow:true` and never exceeds box width.
- [ ] `clampToPrintArea` moves/resizes an out-of-bounds element back inside.
- [ ] Placeholder with `shrink_to_fit=false` is not shrunk.

---

### FEATURE 7 — Designs (save, load, upload artwork)
**Goal:** Customers save in-browser designs or upload finished artwork.

**API**
- `POST /api/designs` — save `{product_id, template_id, config, canvas_json, name}` (server clamps all elements to print areas before saving).
- `GET /api/designs` (mine) / `GET /api/designs/[id]` / `PATCH` / `DELETE`.
- `POST /api/uploads` — multipart; allowed types: **PDF, SVG, AI, PNG**; max size (e.g., 25 MB); store in `uploads` bucket under `userId/…`; sanitize filename; verify MIME + extension.

**TEST GATE**
- [ ] Save design with an element outside print area → saved element is clamped inside.
- [ ] Upload `.png`, `.pdf`, `.svg` succeed; `.exe` / `.zip` → 400.
- [ ] Upload > size limit → 413/400.
- [ ] User A cannot GET user B's design (403/404).
- [ ] Signed URL expires and cannot be guessed.

---

### FEATURE 8 — Print-file engine (PDF + PNG) ⭐ the differentiator
**Goal:** Turn a design snapshot into production-ready files server-side.

**Tasks**
- `lib/printfile/render.ts`:
  - Input: product (w, h, bleed, dpi), `canvas_json` elements (text, image, shape), values.
  - Pixel size: `px = mm / 25.4 * dpi`; canvas size = `(w + 2*bleed)` × `(h + 2*bleed)` mm.
  - Draw elements → export **PNG** buffer at `print_dpi` (default 300).
  - Build **PDF** with `pdf-lib`: page size = trim + bleed in points (`mm * 72/25.4`); embed PNG; set TrimBox/BleedBox.
- `lib/printfile/naming.ts`: filename `OrderID_ProductType_Date_Output.ext` (e.g., `DH-2026-000123_race-numbers_20260319_print.pdf`).
- Store under `printfiles/{order_no}/…` (order-based directories) and insert `print_files` rows.
- `POST /api/admin/orders/[id]/generate-files` and auto-trigger on proof approval (Feature 10).
- **Gate:** refuse to generate (409) unless `orders.files_unlocked = true` (set by proof approval).

**TEST GATE**
- [ ] Generate for a sample 90×50 mm label @300 dpi → PNG dimensions ≈ `(96×50 incl. bleed)` → **1134 × 618 px** (for 3 mm bleed) ✔ verify with `sharp`/`file`.
- [ ] PDF opens; page size matches trim+bleed in points.
- [ ] Filename matches `OrderID_ProductType_Date_Output` pattern (regex test).
- [ ] Files saved in folder named after the order.
- [ ] Calling generate on an order with **unapproved proof → 409**.
- [ ] Generation of one file < 10 s (Vercel limit awareness; set `maxDuration`).

---

### FEATURE 9 — CSV variable-data merge ⭐
**Goal:** One artwork file per CSV row (race numbers / bulk jobs).

**Tasks**
- `POST /api/orders/[id]/csv` — upload CSV (customer) → validate with papaparse: required headers must match template placeholder keys (e.g., `runner_number,name`), max rows (e.g., 5,000), trim values, reject empty required cells, report row-numbered errors.
- `lib/printfile/csvMerge.ts`: for each row → apply values to placeholders → `fitText` → render PNG (+ PDF) → save as `…_row0001.png`.
- Process in **batches** (e.g., 25 at a time) to avoid timeouts; create a `csv_jobs` status (`queued/processing/done/failed`) if time permits, otherwise synchronous with row cap.
- Zip all outputs → `…_csv_zip` file entry; add also a combined multi-page PDF if time permits.

**TEST GATE**
- [ ] CSV with 10 rows → exactly 10 files + 1 zip.
- [ ] Row with very long name → fitted (shrunk) or flagged, never overflowing.
- [ ] Missing header → 400 listing which header is missing.
- [ ] Empty `runner_number` on row 4 → error mentions "row 4".
- [ ] Unicode / commas-in-quotes / BOM CSV parse correctly.
- [ ] Only works for products with `supports_csv_merge = true`.
- [ ] 500-row CSV finishes without crashing (or is cleanly queued).

---

### FEATURE 10 — Proof versioning & approval gate ⭐
**Goal:** Every revision logged; approval unlocks print files.

**API**
- `POST /api/proofs` `{order_item_id}` — creates **next version** (v1, v2…) with an immutable `canvas_snapshot` + generated preview image; marks previous pending proof `superseded`.
- `GET /api/orders/[id]/proofs` — list versions (customer sees only own).
- `POST /api/proofs/[id]/approve` — only the **owner**, only if proof is the **latest** version and status `pending`. Writes `proof_events` (who, which version, when). Sets `orders.files_unlocked = true` (only when **all** items on the order are approved) and `designs.is_approved = true`. Moves order status → `production`-ready; triggers print-file generation + email.
- `POST /api/proofs/[id]/changes` `{message}` — marks `changes_requested`, logs event, notifies admin; order status back to `artwork`.
- Admin uploads/creates revised proof → new version.

**TEST GATE**
- [ ] First proof is `v1`; after change request, next is `v2`; `v1` becomes `superseded`.
- [ ] Approving an **old** version (v1 after v2 exists) → **409**.
- [ ] Another customer approving my proof → **403**.
- [ ] `proof_events` contains actor id + version + timestamp.
- [ ] Before approval: files endpoint → 409; after approval: files exist and download works.
- [ ] Approved snapshot is **byte-identical** to the snapshot used to generate the print file (hash compare).

---

### FEATURE 11 — Orders & status pipeline
**Goal:** Create orders (server-priced), enforce valid status transitions.

**Pipeline:** `quote → order → artwork → proof → production → completed` (+ `cancelled`).

**Tasks**
- `POST /api/orders` — body has product configs + design ids only; **server recomputes prices** with the engine; freezes `config` snapshot in `order_items`; generates `order_no` (`DH-YYYY-000001` via sequence).
- Allowed transition map in `lib/orders/transitions.ts`; invalid jump (e.g., `order → completed`) → 409.
- Every change writes `order_status_history`.
- Admin `PATCH /api/admin/orders/[id]/status`.
- Cannot move to `production` unless `files_unlocked = true` AND `payment_status = 'paid'`.

**TEST GATE**
- [ ] Tampering client price (sending `unit_price: 1`) is ignored; stored price = server price.
- [ ] `order_no` unique & sequential under 5 parallel creations.
- [ ] Invalid transition → 409; valid transition writes history row.
- [ ] Move to `production` without approval/payment → 409.
- [ ] Customer cannot call status PATCH (403).

---

### FEATURE 12 — Checkout & payments (Stripe test mode)
**Goal:** Integrated, PCI-compliant checkout; order data written against the account.

**Tasks**
- `POST /api/checkout` `{order_id}` → creates Stripe Checkout Session (line items from the **server** order; amounts in paise; `metadata.order_id`).
- `POST /api/webhooks/stripe` — **verify signature**; on `checkout.session.completed` → `payment_status='paid'`, status `order → artwork`, create invoice, send email. **Idempotent** (ignore duplicate events).
- `payment_intent.payment_failed` → `failed`.
- Success/cancel return URLs.

**TEST GATE**
- [ ] Use Stripe test card `4242 4242 4242 4242` → order becomes `paid`.
- [ ] Declined card `4000 0000 0000 0002` → order stays `unpaid`/`failed`.
- [ ] Webhook with bad signature → 400.
- [ ] Same webhook event replayed twice → only one invoice, no duplicate email.
- [ ] `stripe listen --forward-to localhost:3000/api/webhooks/stripe` works locally.

---

### FEATURE 13 — Customer dashboard APIs
**Goal:** Back the 6 required customer modules (PRD §10).

| Module | Endpoint |
|---|---|
| Account & profile status | `GET /api/me` (+ order counts) |
| Order history + current status + files | `GET /api/orders` , `GET /api/orders/[id]` |
| Score/config of saved designs | `GET /api/designs` (returns `config`, thumbnail, approved flag) |
| Active proofs + version state | `GET /api/proofs/active` |
| One-click reorder | `POST /api/orders/[id]/reorder` |
| Downloadable invoices | `GET /api/orders/[id]/invoice` (PDF) |

**Tasks**
- Customer order detail shows **proof previews and invoices only — never print-ready production files or other customers' data** (PRD note).
- **Reorder:** clones items using the **saved approved design + frozen config**, re-prices at **current** prices, creates new order with `reorder_of`, skips redesign; proof auto-carries approved status (document decision: approved design reused → proof pre-approved so production can proceed after payment).
- Invoice: generate PDF with `pdf-lib` (invoice no., order no., items, tax-inclusive total, GST line) and store in `invoices` bucket.

**TEST GATE**
- [ ] Order history returns only my orders, newest first.
- [ ] Reorder creates a new order with identical config and **no designer step**; new `order_no`; `reorder_of` set.
- [ ] Reorder uses today's pricing (change a price, reorder, confirm).
- [ ] Invoice PDF downloads and totals match order.
- [ ] Customer response never contains `printfiles` paths.

---

### FEATURE 14 — Email notifications
**Goal:** Order updates, proof status, completion alerts (PRD non-negotiable).

**Triggers:** order paid (confirmation), proof ready, proof approved, changes requested (to admin), status changed to production, completed.

**Tasks**
- `lib/email/send.ts` wrapper (Resend). Failures **must not break the main request** (try/catch, log to `email_log`).
- Plain, branded HTML templates (simple).

**TEST GATE**
- [ ] Each trigger inserts an `email_log` row with `status='sent'`.
- [ ] Break the API key → request still succeeds, log shows `failed`.
- [ ] Email contains correct order number & link.

---

### FEATURE 15 — Admin: users & orders (production dashboard APIs)
**Goal:** Back PRD §11 capabilities 01–04.

**API**
- `GET /api/admin/orders?status=&q=&customer=&from=&to=&product_type=&page=&limit=` — searchable/filterable, paginated.
- Each row includes `ready_for_production` (= `files_unlocked && paid`).
- `GET /api/admin/orders/[id]` — full record: config, design, proofs, events, history, files.
- `GET /api/admin/orders/[id]/files` — **signed download URLs** for PDF, PNG, per-row CSV artwork zip.
- `PATCH /api/admin/orders/[id]/status` — advance pipeline (Feature 11 rules).
- `GET /api/admin/users`, `PATCH /api/admin/users/[id]` (role, active).

**TEST GATE**
- [ ] Filter by status + date range + product type returns expected subset.
- [ ] Text search by order no / customer email works.
- [ ] `ready_for_production` false before approval, true after approval + payment.
- [ ] Signed URL downloads a valid PDF and expires.
- [ ] Non-admin → 403 on all `/api/admin/*`.

---

### FEATURE 16 — Admin: catalogue & template management
**Goal:** Manage products/templates without code (PRD §3 admin role).

**API**
- CRUD: `/api/admin/products`, `/materials`, `/options`, `/volume-discounts`, `/templates`, `/placeholders`, `/gallery`.
- Validate: min < max, discount tiers ascending, placeholders inside print area.

**TEST GATE**
- [ ] Admin adds a new material → appears in `GET /api/products/[slug]` and pricing quote immediately.
- [ ] Adding a new **division** + product requires **no code change** (scalability proof).
- [ ] Invalid ranges (min > max) → 400.

---

### FEATURE 17 — Reports & analytics + Archive
**Goal:** PRD §11 items 05–06.

**API**
- `GET /api/admin/reports?from=&to=` → `{ total_orders, revenue_minor, orders_by_status, throughput_by_division, top_products, daily_series[] }`.
- Archive: completed orders are retained & searchable (`status=completed`), with `GET /api/admin/archive?q=` for repeat/event order lookup; no deletion of completed work.

**TEST GATE**
- [ ] Insert 5 known orders → revenue/total counts match hand calculation.
- [ ] Throughput per division sums to total orders.
- [ ] Revenue excludes `unpaid` / `cancelled`.
- [ ] Archive search finds a completed event order by name.

---

### FEATURE 18 — Accounting export (Xero-ready)
**Goal:** Clean export shape + path for full Xero API later.

**API:** `GET /api/admin/export/xero?from=&to=` → CSV with Xero invoice import columns:
`ContactName, EmailAddress, InvoiceNumber, InvoiceDate, DueDate, Description, Quantity, UnitAmount, AccountCode, TaxType, Currency`.
Put an `AccountingProvider` interface in `lib/accounting/` with a `CsvExporter` implementation and a stubbed `XeroApiProvider` (documents the "switch-on-later" path).

**TEST GATE**
- [ ] CSV opens in Excel; headers match exactly; totals equal order totals.
- [ ] Only paid orders exported.

---

### FEATURE 19 — Hardening: errors, edge cases, security
**Goal:** Cover PRD checklist "Error handling & edge cases".

**Tasks / checks**
- Rate-limit auth + quote endpoints (simple in-memory or Upstash).
- Zod on **every** route; central error handler.
- Security headers (CSP basics, `X-Content-Type-Options`), HTTPS-only cookies.
- Sanitize filenames; verify storage paths belong to user.
- Handle: zero/negative qty, absurd sizes, deleted product on reorder (clear message), inactive material, payment succeeded but webhook delayed (poll status), duplicate click on pay.

**TEST GATE**
- [ ] qty `-1`, `0`, `1e9`, `"abc"` → 400 each.
- [ ] Reorder of a product that is now inactive → 409 with helpful message.
- [ ] SQL-injection-style strings in search → no error/leak.
- [ ] 100 rapid quote calls → rate-limit kicks in (429) only for abusive burst.
- [ ] No stack traces in any error response.

---

### FEATURE 20 — Deployment & handover
**Tasks**
- **New** Vercel account + **new** Supabase project (PRD hard rule).
- Set env vars in Vercel dashboard; set function `maxDuration` for print/CSV routes; register Stripe webhook to the production URL.
- Run migrations on the production Supabase; seed data; create admin + test customer.
- Write `README.md`: setup, env vars, schema overview, how to run tests, **credentials table** (admin + customer), design decisions.
- Final `DECISIONS.md`: every ambiguity & decision (currency, tax rate, discount tiers, reorder-proof behaviour, bleed defaults, CSV row cap, font choices, etc.).

**FINAL TEST GATE — Full PRD checklist (run on the LIVE URL)**
- [ ] Signup & login
- [ ] Product configuration & live pricing
- [ ] Volume-discount calculation
- [ ] Designer — print-area constraints (server clamps)
- [ ] Proof versioning & approval gate
- [ ] Print-file & CSV merge output
- [ ] Reorder flow
- [ ] Admin pipeline & file download
- [ ] Responsive on mobile & desktop
- [ ] Error handling & edge cases
- [ ] `.env` never committed (`git log -p | grep -i secret` returns nothing)

---

## 6. SUGGESTED TIME PLAN (≈ 1 day)

| Block | Features | Notes |
|---|---|---|
| 1 | F1–F3 | Setup, schema, auth/RLS — don't rush RLS |
| 2 | F4–F5 | Catalogue + pricing (unit tests first) |
| 3 | F6–F9 | Fitting, designs, print-file engine, CSV merge (the "wow" part) |
| 4 | F10–F12 | Proofs, orders, Stripe |
| 5 | F13–F15 | Customer + admin APIs |
| 6 | F16–F19 | Admin CRUD, reports, export, hardening (cut F16/F18 depth first if short on time) |
| 7 | F20 | Deploy, README, credentials |

**If time runs out, cut in this order:** F18 (Xero CSV) → F16 (admin CRUD UI; keep seed data) → F17 polish → CSV queueing (keep sync with row cap). **Never cut:** pricing, proof gate, print-file output, CSV merge, reorder, RLS.

---

## 7. ANTIGRAVITY AGENT RULES (copy into the agent's rules/workspace instructions)

```
1. Build one FEATURE at a time, in the order in BACKEND.md.
2. Write the TEST first when the feature has pure logic (pricing, fitting, naming).
3. After finishing a feature, RUN its TEST GATE (unit tests + curl/API calls). Show the results.
4. If any gate item fails, fix it before moving on. Do not proceed with failing tests.
5. Never trust client-sent prices, roles, or user ids — always derive from server/session.
6. Money = integer paise. No floats.
7. Never commit secrets. Use .env.local and .env.example.
8. All heavy work (print files, CSV merge) runs server-side.
9. Add comments explaining WHY, not just WHAT.
10. Update PROGRESS.md (checkbox per feature) and DECISIONS.md after each feature.
11. Commit after each passing feature with message "feat(Fx): <name> — gate passed".
```

---

## 8. PROGRESS.md TEMPLATE (create this file)

```
- [ ] F1  Setup & env
- [ ] F2  Schema & seed
- [ ] F3  Auth, roles, RLS
- [ ] F4  Catalogue API
- [ ] F5  Pricing engine
- [ ] F6  Templates & fitting
- [ ] F7  Designs & uploads
- [ ] F8  Print-file engine
- [ ] F9  CSV merge
- [ ] F10 Proofs & approval gate
- [ ] F11 Orders & pipeline
- [ ] F12 Stripe checkout
- [ ] F13 Customer dashboard APIs
- [ ] F14 Email notifications
- [ ] F15 Admin orders & users
- [ ] F16 Admin catalogue CRUD
- [ ] F17 Reports & archive
- [ ] F18 Xero export
- [ ] F19 Hardening
- [ ] F20 Deploy & handover
```

---

## 9. NEXT FILES TO REQUEST (after the backend is done)

1. `FRONTEND.md` — "Boutique industrial" UI: product hub tiles, live calculator, gallery, designer canvas (Fabric.js/Konva), proof viewer, customer dashboard, admin console.
2. `DESIGN_SYSTEM.md` — colors (neutral base + one confident accent, e.g., warm cream `#F4F0E8`, deep ink `#0B0B1A`, green `#6BA37B`, copper `#C9803F`), geometric headings (Space Grotesk), body (Inter), mono accents, motion rules.
