# DigiVio — Digital Heroes Web-to-Print Platform (Backend Engine)

Production-grade Web-to-Print backend engine built strictly according to **PRD Level 2** specifications. DigiVio delivers parametric pricing, dynamic template text fitting, high-resolution 300 DPI PDF rendering, CSV variable-data merge, proof versioning with approval gates, Stripe checkout integration, customer dashboard APIs, admin production console, analytics reporting, and Xero accounting exports.

---

## 1. System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Client Frontends               │
                    │   (Public Store, Customer Portal, Admin UI)  │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTPS / JSON / Multipart
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Express API Gateway                                    │
│   ├── Security Headers (CSP, X-Content-Type, X-Frame)                                  │
│   ├── Sliding Window Rate Limiting (Quote & Auth protection)                           │
│   ├── Zod Request Validation & Strict Central Error Handling                           │
│   └── Multi-Tier RBAC Middleware (requireAuth, requireUser, requireAdmin)              │
└──────┬───────────────┬────────────────┬───────────────┬────────────────┬───────────────┘
       │               │                │               │                │
       ▼               ▼                ▼               ▼                ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌────────────────┐
│   Catalogue  ││   Pricing    ││  Print-File  ││    Proofs    ││    Orders &    │
│  Management  ││    Engine    ││    Engine    ││  Versioning  ││    Pipeline    │
│  6 Divisions ││ Pure Math /  ││  300 DPI PDF ││ SHA-256 Hash ││ State Machine │
│  Parametric  ││ Integer      ││  Bleed Margins││ Approval     ││ Quote -> Comp │
│  Templates   ││ Paise (INR)  ││  CSV Merge   ││ Hard Gates   ││ Reorders      │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘└──────┬─────────┘
                                                                       │
                               ┌───────────────────────────────────────┴─────────────────┐
                               ▼                                                         ▼
                 ┌───────────────────────────┐                             ┌───────────────────────────┐
                 │     Payment & Billing     │                             │    Production & Reports   │
                 │  - Stripe PAISÉ Checkout  │                             │  - Admin Order Console    │
                 │  - Idempotent Webhooks    │                             │  - Division Throughput    │
                 │  - A4 Tax Invoice PDF     │                             │  - Signed Print Downloads │
                 │  - Xero CSV Accounting    │                             │  - Permanent Job Archive  │
                 └───────────────────────────┘                             └───────────────────────────┘
```

---

## 2. Core Technical Standards

| Standard | Rule / Formula | Details |
| :--- | :--- | :--- |
| **Currency** | Integer **paise** (1 INR = 100 paise) | Stored and computed strictly as integers (`_minor`). No floating-point money. |
| **Tax Model** | 18% GST (Tax-Inclusive) | $\text{tax\_included} = \text{round}\left(\frac{\text{subtotal\_incl} \times 0.18}{1.18}\right)$, $\text{total} = \text{subtotal\_incl}$. |
| **API Envelope** | Standard response payload | Success: `{ ok: true, data }`<br>Error: `{ ok: false, error: { code, message } }` |
| **Print Resolution** | 300 DPI with 3mm Bleed | $90 \times 50\text{ mm} \to 96 \times 56\text{ mm} = 1134 \times 661\text{ px}$. DTP Points: $\text{mm} \times 72 / 25.4$. |
| **Proof Locking** | SHA-256 Canvas Digest | Approval of latest proof version supersedes previous versions and unlocks print production files. |
| **Security** | Zero Stack Leakage + CSP | Hardened central error handler never leaks call stacks or internal paths. |

---

## 3. Database Schema Overview

DigiVio runs on Supabase (PostgreSQL 15+) with Row-Level Security (RLS) enabled on all tables:

1. `profiles`: User accounts, RBAC roles (`customer`, `admin`), active status.
2. `divisions`: 6 parameter-driven divisions (Labels & Stickers, Race Numbers, MTB Boards, Stamps, Trophies, Laser Cut).
3. `products`: Physical dimensions, allowed min/max boundaries, pricing models (`area`, `fixed`, `quantity_tier`).
4. `materials`: Substrates and papers with individual rate per $\text{cm}^2$ in paise.
5. `product_options`: Configurable choices (finishes, lamination, cut styles) with price deltas and multipliers.
6. `volume_discounts`: Ascending quantity-based discount tiers (100 $\to$ 5%, 250 $\to$ 10%, 500 $\to$ 15%, 1000 $\to$ 20%).
7. `templates`: Bounding canvas and print areas for visual online designer.
8. `template_placeholders`: Bounded variable-data fields with text fitting constraints.
9. `designs`: Customer saved visual artwork with automated boundary clamping.
10. `orders`: Order records, sequential numbers (`DH-YYYY-XXXXXX`), financial totals, addresses.
11. `order_items`: Frozen configuration snapshot and line prices.
12. `order_status_history`: Complete state machine transition audit trail.
13. `proofs`: Versioned proofs (`v1`, `v2`, ...), canvas snapshots, and approval status.
14. `proof_events`: Immutable audit trail of proof reviews, approvals, and change requests.
15. `email_log`: Non-blocking tracking of transactional customer notifications.

SQL migrations are located in:
- `supabase/migrations/001_schema.sql`
- `supabase/migrations/002_rls.sql`
- `supabase/migrations/003_seed.sql`

---

## 4. Credentials Table

| Role | Email | Password / Token | Purpose | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@digitalheroes.print` | `Bearer test-admin-token` | Production floor, catalogue management, analytics, Xero exports | Full `/api/admin/*`, all customer records, printfiles |
| **Customer A** | `customer@test.com` | `Bearer test-customer-token` | Ordering, proof review, saved designs, invoices, reorders | Customer dashboard, own orders only |
| **Customer B** | `user_b@test.com` | `Bearer test-user-b-token` | Multi-tenant customer isolation testing | Customer dashboard, own orders only |

---

## 5. Environment Variables Dictionary

Copy `.env.example` to `.env` in the `backend/` directory:

```ini
# Application Port & Environment
PORT=3000
NODE_ENV=production

# Supabase Database & Auth (PRD: Dedicated fresh project)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Stripe Payment Processing (Paise INR)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://digitalheroes.print

# Transactional Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM="Digital Heroes Print <orders@digitalheroes.print>"

# Financial & Tax Rules
CURRENCY=INR
TAX_RATE=0.18
```

---

## 6. Complete API Reference

### Public Endpoints (No Auth Required)
- `GET /api/health`: Health status and database connectivity check.
- `GET /api/divisions`: Retrieves 6 core divisions sorted in ascending order.
- `GET /api/products`: Full product catalogue, filterable by `?division=slug`.
- `GET /api/products/:slug`: Complete product detail (materials, options, discounts, templates).
- `GET /api/templates`: Public print templates and fitting boundaries.
- `GET /api/gallery`: Division print showcase and sample work.
- `POST /api/pricing/quote`: Instant parametric price calculator (sub-300ms, rate-limited).
- `POST /api/webhooks/stripe`: Idempotent Stripe webhook receiver.

### Customer Endpoints (`requireUser`)
- `GET /api/me`: Customer profile, account status, and order counts.
- `PATCH /api/me`: Update profile details.
- `GET /api/orders`: Order history (customer-isolated, customer response strips internal print paths).
- `GET /api/orders/:id`: Detailed order record.
- `POST /api/orders`: Submit new order (server recalculates all prices).
- `POST /api/orders/:id/reorder`: One-click reorder cloning configuration and re-pricing.
- `GET /api/orders/:id/invoice`: Stream formatted A4 tax invoice PDF.
- `POST /api/orders/:id/csv`: Variable-data CSV upload and ZIP merge.
- `GET /api/designs`, `POST /api/designs`: Saved designs with automatic boundary clamping.
- `POST /api/uploads`: Multipart upload (PNG, PDF, SVG, AI up to 25MB) with expiring signed URLs.
- `GET /api/proofs/active`: Customer pending proofs for review.
- `POST /api/proofs/:id/approve`: Approve proof (unlocks production print files).
- `POST /api/proofs/:id/request-changes`: Submit revision notes (supersedes proof).
- `POST /api/checkout/create-session`: Generate Stripe checkout URL in integer paise.

### Admin Production Console (`requireUser, requireAdmin`)
- `GET /api/admin/orders`: Filterable (`status`, `from`, `to`, `product_type`), searchable (`q`), paginated. Each order displays `ready_for_production` (`files_unlocked && paid`).
- `GET /api/admin/orders/:id`: Full order audit trail and proof history.
- `GET /api/admin/orders/:id/files`: Generates time-limited signed download URLs for PDF, PNG, and CSV zip.
- `GET /api/admin/orders/:id/download`: Verifies signed token and streams production print file.
- `PATCH /api/admin/orders/:id/status`: Advances state machine (`order -> artwork -> proof -> production -> completed`).
- `POST /api/admin/orders/:id/generate-files`: Hard gate: generates 300 DPI PDF only if proof approved.
- `GET /api/admin/users`, `PATCH /api/admin/users/:id`: Manage user roles and active status.
- `POST /api/admin/divisions`, `PATCH /api/admin/divisions/:id`, `DELETE /api/admin/divisions/:id`: Dynamic division CRUD.
- `POST /api/admin/products`, `PATCH /api/admin/products/:id`, `DELETE /api/admin/products/:id`: Product CRUD with range validation (`min < max`).
- `POST /api/admin/materials`, `PATCH /api/admin/materials/:id`, `DELETE /api/admin/materials/:id`: Material management.
- `POST /api/admin/options`: Custom product options and multipliers.
- `POST /api/admin/volume-discounts`: Ascending discount tier configuration.
- `POST /api/admin/templates`: Visual designer template configuration.
- `POST /api/admin/placeholders`: Variable-data field creation with boundary containment check.
- `POST /api/admin/gallery`, `DELETE /api/admin/gallery/:id`: Showcase management.
- `GET /api/admin/reports?from=&to=`: Analytics reporting (`total_orders`, `revenue_minor`, `orders_by_status`, `throughput_by_division`, `top_products`, `daily_series[]`).
- `GET /api/admin/archive?q=`: Permanent completed orders archive search.
- `GET /api/admin/export/xero?from=&to=`: Export settled orders into Xero-compliant invoice CSV.

---

## 7. Testing & Quality Gates

Every feature has an automated integration test gate verified using Vitest:

```bash
# Navigate to backend directory
cd backend

# Run the complete test suite across all 19 feature gates
npx vitest run

# Run individual test gates
npx vitest run tests/f1_health.test.ts
npx vitest run tests/f5_pricing.test.ts
npx vitest run tests/f8_printfile.test.ts
npx vitest run tests/f10_proofs.test.ts
npx vitest run tests/f11_orders.test.ts
npx vitest run tests/f12_checkout.test.ts
npx vitest run tests/f15_admin.test.ts
npx vitest run tests/f18_xero.test.ts
npx vitest run tests/f19_hardening.test.ts
```

---

## 8. Production Deployment Guide

### Vercel Deployment
1. Import repository into Vercel.
2. Root Directory: `backend`.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. In `vercel.json`, configure maximum serverless execution duration for compute-intensive print rendering and CSV merges:
   ```json
   {
     "functions": {
       "api/orders/*/csv.ts": { "maxDuration": 60 },
       "api/admin/orders/*/generate-files.ts": { "maxDuration": 60 }
     }
   }
   ```
6. Add environment variables from section 5 into Vercel Project Settings.

### Supabase Setup
1. In a new Supabase project SQL Editor, run `supabase/migrations/001_schema.sql`.
2. Run `supabase/migrations/002_rls.sql`.
3. Run `supabase/migrations/003_seed.sql`.
4. Copy Project URL, Anon Key, and Service Role Key to Vercel environment variables.

### Stripe Webhook Configuration
1. In Stripe Dashboard $\to$ Developers $\to$ Webhooks:
2. Add Endpoint: `https://your-api.vercel.app/api/webhooks/stripe`.
3. Select Events: `checkout.session.completed`, `payment_intent.payment_failed`.
4. Copy Signing Secret into `STRIPE_WEBHOOK_SECRET`.
