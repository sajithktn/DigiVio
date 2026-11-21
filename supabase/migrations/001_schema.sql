-- ============================================================================
-- 001_schema.sql — Core Database Schema
-- Digital Heroes Web-to-Print Platform (PRD Level 2)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('quote', 'order', 'artwork', 'proof', 'production', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE proof_status AS ENUM ('pending', 'approved', 'changes_requested', 'superseded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE file_kind AS ENUM ('print_pdf', 'print_png', 'csv_row_artwork', 'csv_zip', 'customer_upload', 'proof_preview');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ORGANIZATIONS (Future-proofing corporate / multi-seat accounts)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATALOGUE
CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id) ON DELETE RESTRICT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    pricing_model TEXT NOT NULL DEFAULT 'area',   -- 'area' | 'flat' | 'per_unit'
    base_price_minor INT NOT NULL DEFAULT 0,      -- setup/base per unit in paise
    setup_fee_minor INT NOT NULL DEFAULT 0,       -- one-off per order in paise
    min_qty INT DEFAULT 1,
    max_qty INT DEFAULT 100000,
    min_width_mm NUMERIC,
    max_width_mm NUMERIC,
    min_height_mm NUMERIC,
    max_height_mm NUMERIC,
    bleed_mm NUMERIC DEFAULT 3,
    print_dpi INT DEFAULT 300,
    supports_csv_merge BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate_per_cm2_minor NUMERIC NOT NULL,          -- price per cm² per unit in paise
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    values JSONB NOT NULL,                        -- [{value:'gloss', label:'Gloss', price_delta_minor:0, multiplier:1.0}]
    UNIQUE(product_id, key)
);

CREATE TABLE IF NOT EXISTS public.volume_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, -- NULL = global default
    min_qty INT NOT NULL,
    discount_percent NUMERIC NOT NULL             -- e.g. 100 -> 5
);

-- 5. TEMPLATES & PLACEHOLDERS
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    preview_url TEXT,
    canvas JSONB NOT NULL,                        -- default elements
    print_areas JSONB NOT NULL,                   -- [{id,x,y,w,h}] in % of product size (or mm)
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.template_placeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
    key TEXT NOT NULL,                            -- e.g. 'runner_number','name'
    x NUMERIC, y NUMERIC, w NUMERIC, h NUMERIC,   -- mm inside print area
    font_family TEXT,
    font_size_default NUMERIC,
    min_font_size NUMERIC DEFAULT 6,
    max_font_size NUMERIC DEFAULT 120,
    shrink_to_fit BOOLEAN DEFAULT TRUE,
    tracking NUMERIC DEFAULT 0,
    max_tracking NUMERIC DEFAULT 0,
    min_tracking NUMERIC DEFAULT -2,
    align TEXT DEFAULT 'center'
);

-- 6. DESIGNS (saved artwork)
CREATE TABLE IF NOT EXISTS public.designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    template_id UUID REFERENCES public.templates(id),
    name TEXT,
    config JSONB NOT NULL,                        -- {width_mm,height_mm,material_id,options,qty}
    canvas_json JSONB,                            -- designer state (elements)
    upload_path TEXT,                             -- if customer uploaded finished artwork
    thumbnail_path TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS & PIPELINE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT UNIQUE NOT NULL,                -- e.g. DH-2026-000123
    user_id UUID REFERENCES public.profiles(id),
    status order_status NOT NULL DEFAULT 'order',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    subtotal_minor INT,
    tax_minor INT,
    total_minor INT,
    currency TEXT DEFAULT 'INR',
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    files_unlocked BOOLEAN DEFAULT FALSE,         -- approval gate flag
    reorder_of UUID REFERENCES public.orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    design_id UUID REFERENCES public.designs(id),
    config JSONB NOT NULL,                        -- frozen snapshot of configuration
    qty INT NOT NULL,
    unit_price_minor INT NOT NULL,
    line_total_minor INT NOT NULL,
    csv_upload_path TEXT                          -- for variable-data jobs
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status order_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROOFS (versioned)
CREATE TABLE IF NOT EXISTS public.proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
    version INT NOT NULL,                         -- v1, v2...
    canvas_snapshot JSONB NOT NULL,               -- exact design state at that version
    preview_path TEXT,
    status proof_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_item_id, version)
);

CREATE TABLE IF NOT EXISTS public.proof_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_id UUID REFERENCES public.proofs(id) ON DELETE CASCADE,
    event TEXT NOT NULL,                          -- 'created'|'approved'|'changes_requested'
    actor_id UUID REFERENCES public.profiles(id),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. GENERATED FILES
CREATE TABLE IF NOT EXISTS public.print_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id),
    kind file_kind NOT NULL,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    proof_id UUID REFERENCES public.proofs(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    invoice_no TEXT UNIQUE NOT NULL,
    pdf_path TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. GALLERY (live work examples)
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID REFERENCES public.divisions(id),
    title TEXT,
    image_path TEXT,
    sort_order INT DEFAULT 0
);

-- 12. EMAIL LOG
CREATE TABLE IF NOT EXISTS public.email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT,
    subject TEXT,
    kind TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_division ON public.products(division_id);
CREATE INDEX IF NOT EXISTS idx_materials_product ON public.materials(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_proofs_item ON public.proofs(order_item_id);
