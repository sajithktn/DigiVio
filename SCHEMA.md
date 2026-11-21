# SCHEMA.md — Database Schema & Data Dictionary

Comprehensive documentation for all tables, types, relationships, and constraints in the Digital Heroes Web-to-Print platform.

---

## 1. Custom Types & Enums

### `user_role`
* **Values**: `'customer'`, `'admin'`
* **Purpose**: Primary role definition for authorization and access control.

### `order_status`
* **Values**: `'quote'`, `'order'`, `'artwork'`, `'proof'`, `'production'`, `'completed'`, `'cancelled'`
* **Purpose**: Full lifecycle pipeline transitions for client orders.

### `proof_status`
* **Values**: `'pending'`, `'approved'`, `'changes_requested'`, `'superseded'`
* **Purpose**: Proof review state. Superseded occurs when revised proof versions are generated.

### `payment_status`
* **Values**: `'unpaid'`, `'paid'`, `'failed'`, `'refunded'`
* **Purpose**: Financial settlement states via Stripe Checkout webhooks.

### `file_kind`
* **Values**: `'print_pdf'`, `'print_png'`, `'csv_row_artwork'`, `'csv_zip'`, `'customer_upload'`, `'proof_preview'`
* **Purpose**: Categorization of production and asset files stored in Supabase Storage.

---

## 2. Table Specifications

### `profiles`
Links directly 1:1 with `auth.users(id)`.
* `id` (UUID, PK) -> references `auth.users(id)` ON DELETE CASCADE
* `full_name` (TEXT)
* `phone` (TEXT)
* `role` (user_role, default `'customer'`)
* `organization_id` (UUID, NULL) -> future corporate / multi-seat accounts
* `created_at` (TIMESTAMPTZ, default `NOW()`)

### `organizations`
Supports corporate accounts, teams, and bulk invoicing.
* `id` (UUID, PK, default `gen_random_uuid()`)
* `name` (TEXT, NOT NULL)
* `created_at` (TIMESTAMPTZ, default `NOW()`)

### `divisions`
The 6 core business divisions of the print house.
* `id` (UUID, PK)
* `slug` (TEXT, UNIQUE, NOT NULL)
* `name` (TEXT, NOT NULL)
* `description` (TEXT)
* `sort_order` (INT, default `0`)
* `is_active` (BOOL, default `true`)

### `products`
Parameter-driven print products (no SKU-per-size proliferation).
* `id` (UUID, PK)
* `division_id` (UUID) -> references `divisions(id)`
* `slug` (TEXT, UNIQUE, NOT NULL)
* `name` (TEXT, NOT NULL)
* `description` (TEXT)
* `pricing_model` (TEXT, default `'area'`) — `'area'` | `'flat'` | `'per_unit'`
* `base_price_minor` (INT, default `0`) — setup or base unit price in paise
* `setup_fee_minor` (INT, default `0`) — one-off order setup fee in paise
* `min_qty` (INT, default `1`)
* `max_qty` (INT, default `100000`)
* `min_width_mm` (NUMERIC), `max_width_mm` (NUMERIC)
* `min_height_mm` (NUMERIC), `max_height_mm` (NUMERIC)
* `bleed_mm` (NUMERIC, default `3`)
* `print_dpi` (INT, default `300`)
* `supports_csv_merge` (BOOL, default `false`)
* `is_active` (BOOL, default `true`)

### `materials`
Substrates and print materials associated with products.
* `id` (UUID, PK)
* `product_id` (UUID) -> references `products(id)` ON DELETE CASCADE
* `name` (TEXT, NOT NULL)
* `rate_per_cm2_minor` (NUMERIC, NOT NULL) — price in paise per cm² per unit
* `is_active` (BOOL, default `true`)

### `product_options`
Configurable attributes such as finish, orientation, shape, pin holes, etc.
* `id` (UUID, PK)
* `product_id` (UUID) -> references `products(id)` ON DELETE CASCADE
* `key` (TEXT, NOT NULL)
* `label` (TEXT, NOT NULL)
* `values` (JSONB, NOT NULL) — Array of `{ value, label, price_delta_minor, multiplier }`
* UNIQUE(`product_id`, `key`)

### `volume_discounts`
Automatic volume discount tiers.
* `id` (UUID, PK)
* `product_id` (UUID, NULL) -> references `products(id)` ON DELETE CASCADE (NULL = global default)
* `min_qty` (INT, NOT NULL)
* `discount_percent` (NUMERIC, NOT NULL)

### `templates`
Pre-designed designer layouts and print area boundaries.
* `id` (UUID, PK)
* `product_id` (UUID) -> references `products(id)` ON DELETE CASCADE
* `name` (TEXT, NOT NULL)
* `preview_url` (TEXT)
* `canvas` (JSONB, NOT NULL) — default elements snapshot
* `print_areas` (JSONB, NOT NULL) — `[{ id, x, y, w, h }]` in mm or % of product size
* `is_active` (BOOL, default `true`)

### `template_placeholders`
Dynamic variable data placeholders (e.g., runner number, name, barcode).
* `id` (UUID, PK)
* `template_id` (UUID) -> references `templates(id)` ON DELETE CASCADE
* `key` (TEXT, NOT NULL)
* `x`, `y`, `w`, `h` (NUMERIC) — mm coordinates within print area
* `font_family` (TEXT)
* `font_size_default` (NUMERIC)
* `min_font_size` (NUMERIC, default `6`), `max_font_size` (NUMERIC, default `120`)
* `shrink_to_fit` (BOOL, default `true`)
* `tracking` (NUMERIC, default `0`), `max_tracking` (NUMERIC, default `0`), `min_tracking` (NUMERIC, default `-2`)
* `align` (TEXT, default `'center'`)

### `designs`
Saved customer artwork configurations and canvas states.
* `id` (UUID, PK)
* `user_id` (UUID) -> references `profiles(id)` ON DELETE CASCADE
* `product_id` (UUID) -> references `products(id)`
* `template_id` (UUID) -> references `templates(id)`
* `name` (TEXT)
* `config` (JSONB, NOT NULL) — `{ width_mm, height_mm, material_id, options, qty }`
* `canvas_json` (JSONB)
* `upload_path` (TEXT)
* `thumbnail_path` (TEXT)
* `is_approved` (BOOL, default `false`)
* `created_at` (TIMESTAMPTZ, default `NOW()`)

### `orders`
Master order records with frozen financial snapshot and approval gate flags.
* `id` (UUID, PK)
* `order_no` (TEXT, UNIQUE, NOT NULL) — format: `DH-YYYY-XXXXXX`
* `user_id` (UUID) -> references `profiles(id)`
* `status` (order_status, default `'order'`)
* `payment_status` (payment_status, default `'unpaid'`)
* `subtotal_minor` (INT)
* `tax_minor` (INT)
* `total_minor` (INT)
* `currency` (TEXT, default `'INR'`)
* `stripe_session_id` (TEXT)
* `stripe_payment_intent` (TEXT)
* `shipping_address` (JSONB), `billing_address` (JSONB)
* `files_unlocked` (BOOL, default `false`) — Unlocked only after proof approval
* `reorder_of` (UUID) -> references `orders(id)`
* `created_at`, `updated_at` (TIMESTAMPTZ)

### `order_items`
Frozen snapshots of product configuration per order line.
* `id` (UUID, PK)
* `order_id` (UUID) -> references `orders(id)` ON DELETE CASCADE
* `product_id` (UUID) -> references `products(id)`
* `design_id` (UUID) -> references `designs(id)`
* `config` (JSONB, NOT NULL)
* `qty` (INT, NOT NULL)
* `unit_price_minor` (INT, NOT NULL)
* `line_total_minor` (INT, NOT NULL)
* `csv_upload_path` (TEXT)

### `order_status_history`
Full audit trail of status transitions.
* `id` (UUID, PK)
* `order_id` (UUID) -> references `orders(id)` ON DELETE CASCADE
* `from_status` (order_status), `to_status` (order_status, NOT NULL)
* `changed_by` (UUID) -> references `profiles(id)`
* `note` (TEXT)
* `created_at` (TIMESTAMPTZ, default `NOW()`)

### `proofs`
Versioned proofs with immutable canvas snapshots.
* `id` (UUID, PK)
* `order_item_id` (UUID) -> references `order_items(id)` ON DELETE CASCADE
* `version` (INT, NOT NULL) — v1, v2, v3...
* `canvas_snapshot` (JSONB, NOT NULL)
* `preview_path` (TEXT)
* `status` (proof_status, default `'pending'`)
* `created_at` (TIMESTAMPTZ, default `NOW()`)
* UNIQUE(`order_item_id`, `version`)

### `proof_events`
Audit log of proof creation, approval, and revisions.
* `id` (UUID, PK)
* `proof_id` (UUID) -> references `proofs(id)` ON DELETE CASCADE
* `event` (TEXT, NOT NULL) — `'created'`, `'approved'`, `'changes_requested'`
* `actor_id` (UUID) -> references `profiles(id)`
* `message` (TEXT)
* `created_at` (TIMESTAMPTZ, default `NOW()`)

### `print_files`
Production outputs generated server-side once proofs are approved.
* `id` (UUID, PK)
* `order_id` (UUID) -> references `orders(id)` ON DELETE CASCADE
* `order_item_id` (UUID) -> references `order_items(id)`
* `kind` (file_kind, NOT NULL)
* `storage_path` (TEXT, NOT NULL)
* `filename` (TEXT, NOT NULL)
* `proof_id` (UUID) -> references `proofs(id)`
* `created_at` (TIMESTAMPTZ, default `NOW()`)

### `invoices`
Tax invoices generated upon payment.
* `id` (UUID, PK)
* `order_id` (UUID, UNIQUE) -> references `orders(id)` ON DELETE CASCADE
* `invoice_no` (TEXT, UNIQUE, NOT NULL)
* `pdf_path` (TEXT)
* `issued_at` (TIMESTAMPTZ, default `NOW()`)

### `gallery_items`
Public gallery showcases by division.
* `id` (UUID, PK)
* `division_id` (UUID) -> references `divisions(id)`
* `title` (TEXT)
* `image_path` (TEXT)
* `sort_order` (INT, default `0`)

### `email_log`
Auditing outgoing customer and internal emails.
* `id` (UUID, PK)
* `to_email` (TEXT)
* `subject` (TEXT)
* `kind` (TEXT)
* `status` (TEXT)
* `created_at` (TIMESTAMPTZ, default `NOW()`)
