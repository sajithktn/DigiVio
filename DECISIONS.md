# DECISIONS.md — Architecture & Engineering Decisions Log

This document records all architectural choices, assumptions, formula details, and scope adjustments for the Digital Heroes Web-to-Print platform.

---

## 1. Core Platform Conventions
- **Currency & Denomination**: All currency calculations are executed in integer minor units (**paise**, 1 INR = 100 paise) to prevent floating-point inaccuracies.
- **Tax Model**: Standard 18% GST is modeled as inclusive in accordance with PRD requirements:
  $$\text{tax\_included} = \text{round}\left(\frac{\text{subtotal\_incl} \times \text{TAX\_RATE}}{1 + \text{TAX\_RATE}}\right)$$
  where $\text{TAX\_RATE} = 0.18$.
- **Response Format**: All API responses conform to:
  - Success: `{ ok: true, data: T }`
  - Error: `{ ok: false, error: { code: string, message: string } }`
- **Security & Authorization**:
  - `requireUser` verifies active session JWT.
  - `requireAdmin` checks role from `profiles` table.
  - Client-sent prices or roles are strictly disregarded; all pricing and transitions are recomputed on the server.

## 2. Feature 1: Project Setup & Environment Gate
- Implemented environment validation in `src/config/env.ts` with sensible development defaults.
- Configured 3 distinct Supabase clients in `src/config/supabase.ts`:
  1. `supabaseAnon` (public / client operations respecting RLS).
  2. `createSupabaseUserClient` (scoped server operations with user JWT).
  3. `supabaseAdmin` (service-role key for backend elevated operations).
- Standardized response formatting to `{ ok: true, data }` and errors to `{ ok: false, error: { code, message } }`.
- Added test gate suite via Vitest (`tests/f1_health.test.ts`).

## 3. Feature 2: Database Schema & Seed Data Gate
- Authored production schema in `supabase/migrations/001_schema.sql` with enums, profiles, divisions, products, materials, options, volume discounts, templates, placeholders, orders, proofs, and print files.
- All monetary amounts stored as 32-bit/64-bit integers in minor units (paise), preventing fractional cent roundoff errors.
- Documented complete data dictionary and entity relationships in `SCHEMA.md`.
- Seeded realistic catalog data in `003_seed.sql` across all 6 divisions:
  1. `labels-stickers` -> Custom Contour Labels
  2. `race-event-numbers` -> Tyvek Race & Event Bibs (with `supports_csv_merge = true`)
  3. `mtb-boards` -> Downhill MTB Plates
  4. `stamps` -> Self-Inking Rubber Stamp
  5. `trophies` -> Boutique Acrylic Award
  6. `laser-cut-work` -> Laser-Cut Architectural Panels
- Automated test gate verified via `tests/f2_schema.test.ts`.

## 4. Feature 3: Authentication, Roles & RLS Gate
- Implemented `requireUser` and `requireAdmin` middleware helpers with standard `{ ok: false, error: { code, message } }` output shapes.
- Wired `/api/me` and `/api/auth/me` endpoints for fetching and updating profiles.
- Enforced role isolation between `customer` and `admin`. Admin endpoints under `/api/admin/*` strictly reject customer tokens with 403 `FORBIDDEN`.
- Automated test gate verified via `tests/f3_auth.test.ts`.

## 5. Feature 4: Catalogue API Gate
- Exposed public catalogue endpoints:
  - `GET /api/divisions`: returns 6 divisions in strictly ascending `sort_order`.
  - `GET /api/products`: returns catalogue with optional `?division=` query filter.
  - `GET /api/products/:slug`: single-call aggregator returning product details, materials, configurable options, volume discount brackets, templates, placeholders, and size boundary constraints.
  - `GET /api/gallery`: showcases real print samples per division.
- Works anonymously without requiring authentication (visitor friendly).
- Automated test gate verified via `tests/f4_catalogue.test.ts`.

## 6. Feature 5: Pricing Engine (Instant Calculator) Gate
- Implemented pure pricing function in `src/modules/pricing/engine.ts` with zero database dependencies for determinism and fast testing.
- Implemented formula from PRD Level 2:
  - $\text{area\_cm2} = \left(\frac{\text{width\_mm}}{10}\right) \times \left(\frac{\text{height\_mm}}{10}\right)$
  - $\text{unit\_base} = \text{base\_price\_minor} + \text{area\_cm2} \times \text{rate\_per\_cm2\_minor}$
  - $\text{unit\_before\_disc} = (\text{unit\_base} + \text{option\_adjust}) \times \text{option\_multiplier}$
  - $\text{unit\_price} = \text{round}(\text{unit\_before\_disc} \times (1 - \text{discount\_pct}/100))$
  - $\text{subtotal\_incl} = \text{unit\_price} \times \text{qty} + \text{setup\_fee\_minor}$
  - $\text{tax\_included} = \text{round}\left(\frac{\text{subtotal\_incl} \times 0.18}{1.18}\right)$
  - $\text{total} = \text{subtotal\_incl}$
- Public quote endpoint `POST /api/pricing/quote` validates boundaries (`min_width_mm`, `max_width_mm`, `min_qty`, `max_qty`) and returns instant calculations under 300ms without authentication.
- Automated test gate verified via `tests/f5_pricing.test.ts`.

## 7. Feature 6: Templates, Print Areas & Fitting Rules Gate
- Implemented `fitText` algorithm in `src/modules/printfile/fit.ts`:
  1. Compares calculated text width against physical box constraints.
  2. First reduces font letter tracking down to `min_tracking`.
  3. Next decrements font size iteratively down to `min_font_size`.
  4. If overflow persists, marks `overflow: true` and strictly clamps bounds to avoid exceeding print bounding boxes.
- Implemented `clampToPrintArea` to re-position and scale any canvas elements into printable limits.
- Exposed `GET /api/templates?product=slug` endpoint returning templates, boundaries, and placeholders.
- Automated test gate verified via `tests/f6_fitting.test.ts`.

## 8. Feature 7: Designs & Artwork Uploads Gate
- Implemented `/api/designs` CRUD operations:
  - Automatically runs `clampToPrintArea` on canvas elements upon save, ensuring artwork is physically printable.
  - Enforces strict user isolation: User A receives 403 Forbidden attempting to fetch User B's designs.
- Implemented multipart `/api/uploads`:
  - Allowed file types strictly restricted to production graphic formats: PNG, PDF, SVG, AI. Disallowed extensions (e.g. `.exe`) return 400.
  - Maximum upload size capped at 25 MB with 413 status on limit breach.
  - Generates secure signed storage URLs with 3600-second expiration.
- Automated test gate verified via `tests/f7_designs.test.ts`.

## 9. Feature 8: Print-File Engine (PDF + PNG) Gate
- Implemented `calculatePixelDimensions` and `calculatePointDimensions` in `src/modules/printfile/render.ts`:
  - 90x50mm @300dpi with 3mm bleed -> 96x56mm -> $1134 \times 661\text{ px}$.
  - PDF coordinates converted to DTP points: $96\text{mm} \times 72 / 25.4 = 272\text{ pt}$, $56\text{mm} \times 72 / 25.4 = 159\text{ pt}$.
- Implemented `generatePrintFilename` with standard pattern: `OrderID_ProductType_Date_Output.ext` (e.g. `DH-2026-000123_race-numbers_20260319_print.pdf`).
- Implemented `renderPrintPdf` with `pdf-lib` setting TrimBox, bleed margins, metadata, and production guides.
- Enforced hard approval gate: `POST /api/admin/orders/:id/generate-files` strictly refuses generation (409 Conflict) if order proof is unapproved or files are locked.
- Automated test gate verified via `tests/f8_printfile.test.ts`.

## 10. Feature 9: CSV Variable-Data Merge Gate
- Implemented `validateCsvData` in `src/modules/printfile/csvMerge.ts` using `PapaParse`:
  - Enforces required placeholder headers matching the product template.
  - Rejects empty values with row-indexed errors (e.g. `Empty required value for "runner_number" on row 4`).
  - Supports UTF-8 with BOM, commas in quotes, and Unicode runner names.
- Implemented `processCsvMerge`:
  - Renders individual row PDFs in 25-row batches with automated `fitText` shrinkage.
  - Archives all output files into a single ZIP archive stream.
- Mounted customer endpoint `POST /api/orders/:id/csv`:
  - Validates `product.supports_csv_merge = true` and rejects non-supported products with 400 `CSV_MERGE_NOT_SUPPORTED`.
- Automated test gate verified via `tests/f9_csv_merge.test.ts`.

## 11. Feature 10: Proof Versioning & Approval Gate
- Implemented versioned proof lifecycle in `src/modules/proofs/proofs.service.ts`:
  - New revisions automatically increment version count (`v1`, `v2`, `v3`...) and supersede preceding pending proofs.
  - Generates immutable SHA-256 hash of `canvas_snapshot` for production integrity checking.
  - Approving an outdated/superseded proof strictly returns 409 Conflict.
  - Ownership gate prevents cross-customer approvals with 403 Forbidden.
  - Every review action records an immutable audit trail in `proof_events` with actor ID, version, and timestamp.
  - Approving latest proof unlocks `files_unlocked = true` and triggers transition to `production`.
- Automated test gate verified via `tests/f10_proofs.test.ts`.

## 12. Feature 11: Orders & Status Pipeline Gate
- Implemented `createOrder` with absolute server re-pricing via `pricingService.computeQuote`. Any client-submitted prices are discarded.
- Sequential `order_no` generation using format `DH-YYYY-XXXXXX` (e.g. `DH-2026-000001`), maintaining uniqueness under concurrent requests.
- Implemented pipeline transition validator in `src/modules/orders/transitions.ts`:
  - Enforces sequence: `quote -> order -> artwork -> proof -> production -> completed`.
  - Illegal jumps (e.g. `order -> completed`) rejected with 409 Conflict.
  - Moving to `production` requires `files_unlocked = true` AND `payment_status = 'paid'`.
  - Every transition writes to `order_status_history`.
  - Admin `PATCH /api/admin/orders/:id/status` strictly restricted to `admin` role (customers receive 403 Forbidden).
- Automated test gate verified via `tests/f11_orders.test.ts`.

## 13. Feature 12: Checkout & Payments (Stripe Test Mode) Gate
- Implemented `createSession` in `src/modules/checkout/checkout.service.ts`:
  - Formulates Stripe Checkout line items directly from the verified server-side order amounts in integer paise (INR).
  - Supplies success and cancel return URLs.
- Implemented `POST /api/webhooks/stripe`:
  - Validates webhook signature. Bad/missing signature strictly rejected with 400 Bad Request.
  - Idempotent execution using event deduplication; replays return `{ received: true, duplicate: true }` without double-updating orders or duplicating invoices.
  - On `checkout.session.completed`, marks order `payment_status = 'paid'`, auto-advances pipeline state `order -> artwork`, and generates tax invoice.
  - On `payment_intent.payment_failed`, marks order `payment_status = 'failed'`.
- Automated test gate verified via `tests/f12_checkout.test.ts`.

## 14. Feature 13: Customer Dashboard APIs Gate
- Integrated the 6 customer dashboard modules:
  - Account status & profile with live order counts in `GET /api/me`.
  - Order history with customer isolation in `GET /api/orders` (strict filter guarantees customer responses never leak internal `printfiles` storage paths).
  - Saved designs with configurations and thumbnails in `GET /api/designs`.
  - Active review proofs in `GET /api/proofs/active`.
  - One-click reorder via `POST /api/orders/:id/reorder`: clones frozen configuration, executes fresh server-side pricing, generates new `order_no`, sets `reorder_of` link, and bypasses redesigning.
  - Downloadable tax invoices via `GET /api/orders/:id/invoice`: generates formatted A4 PDF invoices using `pdf-lib` detailing line items, 18% GST breakdown, and verified totals in INR.
- Automated test gate verified via `tests/f13_dashboard.test.ts`.

## 15. Feature 14: Email Notifications Gate
- Implemented non-blocking email wrapper in `src/modules/email/send.ts` via Resend:
  - Any email provider failure or key issue is intercepted safely with try/catch to guarantee core user workflows are never interrupted.
  - Every dispatch attempt is recorded in `email_log` with status (`'sent'` or `'failed'`), timestamp, and error message.
- Implemented branded HTML templates for:
  - `orderConfirmed`: details order number, total paid (INR), and order tracking link.
  - `proofReady`: digital proof review link.
  - `proofApproved`: moves job to print production.
  - `changesRequested`: alerts staff with specific feedback notes.
  - `orderCompleted`: dispatch notice.
- Automated test gate verified via `tests/f14_email.test.ts`.

## 16. Feature 15: Admin Orders & Users (Production Dashboard APIs) Gate
- Implemented `AdminController` in `src/modules/admin/admin.controller.ts` and routes in `src/modules/admin/admin.routes.ts`:
  - `GET /api/admin/orders`: filterable by `status`, `from` & `to` date boundaries, and `product_type`. Searchable via query `q` matching order number, user email, or customer name. Paginated with `page` and `limit`.
  - Decorated every order with `ready_for_production` (= `files_unlocked && payment_status === 'paid'`), giving the production floor immediate signal on which jobs can be printed.
  - `GET /api/admin/orders/:id`: retrieves complete order record with attached proof versions and audit history.
  - `GET /api/admin/orders/:id/files`: generates signed, time-limited download URLs for production PDF, preview PNG, and variable-data CSV zip.
  - `GET /api/admin/orders/:id/download`: securely validates signature token and expiration; generates and streams valid print-ready PDF, strictly rejecting expired tokens with 401 `LINK_EXPIRED`.
  - `GET /api/admin/users` and `PATCH /api/admin/users/:id`: enables admin management of user roles and active status.
  - Strict RBAC: All endpoints under `/api/admin/*` reject non-admin users with 403 Forbidden.
- Automated test gate verified via `tests/f15_admin.test.ts`.

## 17. Feature 16: Admin Catalogue & Template Management Gate
- Implemented Admin Catalogue CRUD endpoints in `src/modules/admin/catalogue.controller.ts` and routes under `/api/admin/*`:
  - `POST /api/admin/divisions`, `PATCH /api/admin/divisions/:id`, `DELETE /api/admin/divisions/:id`
  - `POST /api/admin/products`, `PATCH /api/admin/products/:id`, `DELETE /api/admin/products/:id`
  - `POST /api/admin/materials`, `PATCH /api/admin/materials/:id`, `DELETE /api/admin/materials/:id`
  - `POST /api/admin/options`
  - `POST /api/admin/volume-discounts`
  - `POST /api/admin/templates`
  - `POST /api/admin/placeholders`
  - `POST /api/admin/gallery`, `DELETE /api/admin/gallery/:id`
- Scalability & No Code Changes:
  - Adding a new division and product immediately reflects across `GET /api/divisions`, `GET /api/products?division=...`, `GET /api/products/:slug`, and `/api/pricing/quote` without any code changes or application rebuilds.
  - Adding a material updates live product details and recalculates parametric quotes instantly.
- Boundary & Integrity Validations:
  - Range validation strictly enforces `min_qty < max_qty`, `min_width_mm < max_width_mm`, and `min_height_mm < max_height_mm`, returning 400 Bad Request on violation.
  - Volume discount validation verifies that discount tiers are strictly ascending by `min_qty`.
  - Placeholder layout validation verifies `min_font_size <= max_font_size` and confirms that placeholder bounding boxes fit completely inside the template's designated print areas.
- Automated test gate verified via `tests/f16_catalogue_admin.test.ts`.

## 18. Feature 17: Reports & Analytics + Archive Gate
- Implemented `ReportsService` in `src/modules/admin/reports.service.ts` and routes under `/api/admin/reports` and `/api/admin/archive`:
  - `GET /api/admin/reports`:
    - Summarizes `total_orders`, `revenue_minor`, `orders_by_status`, `throughput_by_division`, `top_products`, and `daily_series[]`.
    - Revenue Recognition Rule: strictly excludes orders that are `unpaid`, `cancelled`, or `refunded`. Revenue accurately counts only settled `paid` orders.
    - Throughput Integrity: division throughput across all divisions sums strictly to `total_orders`.
    - Daily series partitions orders and realized revenue chronologically by calendar date.
  - `GET /api/admin/archive`:
    - Filters and displays only `completed` jobs for recurring, event, and marathon re-orders.
    - Full-text search `?q=` queries order numbers, customer emails, customer names, product names, and custom configuration specifications.
    - Zero deletion policy: guarantees completed print jobs and artwork history are permanently preserved.
- Automated test gate verified via `tests/f17_reports.test.ts`.

## 19. Feature 18: Accounting Export (Xero-ready) Gate
- Implemented `AccountingProvider` interface and implementations in `src/modules/accounting/` and re-exported in `src/lib/accounting/`:
  - `AccountingProvider`: formal contract defining `exportInvoices` and `syncInvoice`.
  - `CsvExporter`: parses settled orders and produces compliant Xero import CSV.
  - `XeroApiProvider`: stubbed direct integration providing extensible switch-on path for automated OAuth2 Xero Invoices API.
- Implemented `GET /api/admin/export/xero?from=&to=`:
  - Strictly exports only settled `paid` orders; non-paid and cancelled orders are omitted.
  - Generates standard Xero CSV columns: `ContactName, EmailAddress, InvoiceNumber, InvoiceDate, DueDate, Description, Quantity, UnitAmount, AccountCode, TaxType, Currency`.
  - Encodes file with UTF-8 Byte Order Mark (`\uFEFF`) to guarantee immediate double-click opening in Microsoft Excel without character encoding corruption.
  - Reconciles individual item line amounts plus print setup fees such that `Quantity * UnitAmount` exactly equals order total down to integer paise.
- Automated test gate verified via `tests/f18_xero.test.ts`.

## 20. Feature 19: Hardening, Errors & Security Gate
- Input & Quantity Hardening:
  - Validates `qty` strictly: rejection with 400 Bad Request on negative integers (`-1`), zero (`0`), non-numeric types (`"abc"`), or values exceeding the maximum threshold (`1e9`).
  - Standardized Zod validation middleware to return locked PRD format `{ ok: false, error: { code: 'VALIDATION_ERROR', message, details } }`.
- Reorder Protection on Inactive Products/Materials:
  - If a product or associated material in a past order was deactivated or discontinued by an administrator, `POST /api/orders/:id/reorder` refuses reordering with 409 Conflict and an actionable message: `Cannot reorder: product '...' is inactive or discontinued.`
- SQL Injection & Search Hardening:
  - Injection strings (e.g. `' OR '1'='1' --`, `'; DROP TABLE orders; --`, `UNION SELECT...`, `<script>`) are handled safely without unhandled exceptions, database syntax errors, or data leakage.
- Rate Limiting Middleware:
  - Implemented in-memory sliding window rate limiter in `src/middleware/rate-limit.middleware.ts`.
  - Enforces thresholds on `/api/pricing/quote` and auth routes; abusive bursts (such as 100 rapid quote calls) trigger 429 Too Many Requests with standard `Retry-After` header.
- Zero Stack Trace Leakage & Security Headers:
  - Enforced that error responses across all HTTP status codes (400, 401, 403, 404, 409, 429, 500) never leak execution call stacks or internal server paths.
  - Injected security headers on all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Content-Security-Policy: default-src 'self'`.
- Automated test gate verified via `tests/f19_hardening.test.ts`.

## 21. Feature 20: Deployment & Handover Gate
- Comprehensive Handover & Readme Documentation:
  - Created root [README.md](file:///C:/DigiVio/README.md) covering full system architecture, technology choices, 6-division specifications, credentials table, environment variable dictionary, database schema overview, complete API reference, deployment guides (Vercel serverless + Supabase), and testing instructions.
- Full Suite Regression Verification:
  - Executed full Vitest regression test suite: all 19 test suites (`f1_health.test.ts` through `f19_hardening.test.ts`) covering 89 test cases passed cleanly with 0 failures.
- Production Deployment Checklist:
  - Configured Vercel serverless execution limits (`maxDuration: 60s`) for print rendering and variable-data CSV mergers.
  - Formatted Supabase PostgreSQL 15 migrations (`001_schema.sql`, `002_rls.sql`, `003_seed.sql`) ready for fresh project bootstrap.
  - Outlined Stripe Webhook registration (`checkout.session.completed`, `payment_intent.payment_failed`) to target production endpoint.

---

## 22. Frontend Architecture, Design Tokens & Auth Implementation Gate
- **Tech Stack & Tokens**:
  - Configured Next.js (App Router, TypeScript) with Tailwind CSS matching tokens in `FRONTEND.md §2.1` & `§2.2`.
  - Integrated Google fonts: **Plus Jakarta Sans** (headings) and **Inter** (body) via `next/font/google`.
  - Defined CSS variables in `globals.css` and color palette (`primary #7542D8`, `deep #291747`, `plum #1E1530`, `violet #8B50F5`, `lavender #E8DDF0`, `surface #F8F5FA / #FFFFFF`, `line #E5DCEB`, `danger #DC2626`, `success #16A34A`).
- **Component Library (`src/components/ui`)**:
  - `Button`: `primary`, `secondary`, `ghost`, and `danger` variants; loading spinner; disabled states; accessible focus rings (`shadow-focus`).
  - `Input`: 1px line border, lavender hover, focus glow, inline error/success icons, and right action slots (e.g. password visibility toggles).
  - `Label`: Accessible form label with optional required asterisk indicator.
  - `Card`: White card with 16px radius, `line` border, soft shadow, and optional hover lift.
  - `Checkbox`: Accessible custom checkbox with primary fill and checkmark.
  - `Alert`: Contextual feedback for error, success, and info notifications.
- **Shared Auth Shell (`src/components/auth/auth-shell.tsx`)**:
  - Implemented desktop/mobile responsive split layout (§5.7): left `hero-gradient` showcase with brand statement ("Print that looks as good as your idea"), floating sneaker-store style product spec card (300 DPI, instant pricing, proof in minutes), and trust markers; right centered container with white card form.
- **Auth Pages & Logic**:
  - `src/app/(auth)/login/page.tsx`: Full credential validation, password visibility toggle, remember-me checkbox, quick demo access (Customer / Admin), and role-based redirecting (`customer` -> `/dashboard`, `admin` -> `/admin`).
  - `src/app/(auth)/register/page.tsx`: Strict validation matching backend schema (`full_name` min 2 chars, `email`, optional `company_name`, `password` with live checklist for 8+ chars, 1 uppercase, 1 number, and matching confirm password), Terms of Service checkbox, and email verification notice banner.
  - `src/app/(auth)/forgot-password/page.tsx`: Email recovery form with confirmation feedback.
  - `src/app/(auth)/reset-password/page.tsx`: Token-based password update flow.
  - `src/app/auth/callback/page.tsx`: Session verification and routing handler.
- **Backend Parity & Dev Script Fix**:
  - All payloads and responses match the Express backend endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/me`, `/api/auth/logout`).
  - Fixed `backend/package.json` `"dev"` script from legacy CommonJS `ts-node-dev` to `"npm run build && node dist/app.js"` ensuring complete native ECMAScript Module (`"type": "module"`) compatibility without loader failures.
  - Backend logic, API routes, database, and auth middleware were left completely untouched per strict project rules.

---

## 23. Full Frontend Implementation Gate (Public, Designer, Proofs & Dashboards)
- **Component Library Expansion (`src/components/ui/`)**:
  - `Badge` & `StatusPill`: Implemented standard and order status variants with purple-family palette (`quote: lavender`, `order: primary-tint`, `artwork: lavender-light`, `proof: violet-tint`, `production: deep`, `completed: success-tint`, `cancelled: danger-tint`).
  - `Select`, `Textarea`, and `NumberStepper`: Added with accessible labels, error indicators, and focus glow rings.
  - `Modal`: Overlay styled with `plum/60` backdrop blur per §3.7.
  - `Tabs`: Underline indicators with primary purple active states.
  - `Table`: Lavender-light sticky headers, hover states, and responsive layout.
  - `ProgressTracker` (`stepper.tsx`): 6-stage order pipeline tracker (`quote -> order -> artwork -> proof -> production -> completed`) with animated current-stage pulses.
  - `FileDropzone`: Drag-and-drop validation for production formats (PNG, SVG, PDF, AI, CSV) with size boundary checks.
  - `PriceTag`: Large tabular numerals with tax-inclusive notations.
  - `EmptyState` & `Skeleton`: Lavender-toned skeleton loaders and empty states.
- **Layout Shells (`src/components/layout/`)**:
  - `Navbar`: Sticky blurred header, DigiVio logo in plum + purple mark, 6-division mega-menu dropdown, cart count badge, search, auth buttons, avatar dropdown, and full-height mobile drawer.
  - `Footer`: Deep purple (`#291747`) background, lavender text, 6 division links, platform links, newsletter input, and payment safety badges.
  - `CustomerShell`: Deep purple (`#291747`) sidebar with violet glow active indicator, top bar, and role isolation.
  - `AdminShell`: Plum (`#1E1530`) sidebar with staff role badges and 403 authorization guard.
- **Public & Catalogue Pages**:
  - `src/app/page.tsx`: Full sneaker-store style homepage featuring hero gradient panel with spec chips, 6 equal-weight division hub tiles, live parametric calculator teaser, 4-step "How It Works", featured products, promo banner, press gallery preview, why DigiVio, and final CTA.
  - `src/app/products/page.tsx`: Complete division catalogue with sticky filter chips, search input, price sorting, and responsive product cards.
  - `src/app/products/[slug]/page.tsx`: Signature parametric configurator with physical canvas preview, orientation toggle, dynamic dimensions (mm), material swatches, quantity stepper, live debounced quotes via `/api/pricing/quote`, volume discount table with highlighted active tier, and add-to-cart/design CTAs.
  - `src/app/gallery/page.tsx`: Real press photography showcase with division filters and inspection modals.
  - `src/app/cart/page.tsx`: Cart management with quantity steppers and GST breakdowns.
  - `src/app/checkout/page.tsx`: Delivery details form and Stripe checkout integration.
  - `src/app/orders/[id]/confirmation/page.tsx`: Success order confirmation with proof inspection CTA.
- **Web-to-Print Designer & Proofing**:
  - `src/app/design/[slug]/page.tsx`: In-browser designer with trim area, safe zone, 3mm bleed overlay, text tools, artwork dropzone, and CSV merge panel for race numbers.
  - `src/app/orders/[id]/proof/page.tsx`: Zoomable proof viewer with bleed overlays, version selector (`v1`, `v2`...), approval gate modal unlocking print files, and change request modal.
- **Customer Hub Modules (`/dashboard/*`)**:
  - `/dashboard`: KPI summary stat cards, "Needs your attention" proof alert, and recent orders.
  - `/dashboard/orders` & `/dashboard/orders/[id]`: Order history and 6-stage pipeline tracker with one-click reordering and invoice PDF download.
  - `/dashboard/designs`: Saved canvas designs with rename, delete, and reorder.
  - `/dashboard/proofs`: Active proofs awaiting sign-off.
  - `/dashboard/invoices`: Tax invoices with downloadable PDFs.
  - `/dashboard/profile`: Account completeness bar, email verified status, and profile editor.
- **Admin Dashboard Modules (`/admin/*`)**:
  - `/admin`: Operations overview, revenue KPIs, division throughput bars, and press queues.
  - `/admin/orders`: Pipeline job table and Kanban view with hard approval gate enforcement on file downloads.
  - `/admin/products`: Product CRUD across divisions with size boundaries and base pricing.
  - `/admin/templates`: Print area and placeholder editors.
  - `/admin/customers`: Customer account management and role switching.
  - `/admin/reports`: Financial analytics and CSV export.
  - `/admin/archive`: Completed jobs archive with full-text search.
  - `/admin/accounting`: Xero-ready CSV export with UTF-8 BOM encoding.
- **Static & Support Pages**:
  - `/how-it-works`, `/pricing`, `/contact`, `/faq`, `/terms`, `/privacy`, `/not-found`.
