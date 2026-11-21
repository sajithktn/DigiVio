-- ============================================================================
-- Migration: 002_products_and_pricing.sql
-- Description: The 6 Product Divisions, Dynamic Parameters, Pricing Rules & Volume Discounts
-- ============================================================================

-- 1. Products Table (The 6 Divisions)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division TEXT NOT NULL CHECK (division IN (
        'labels_stickers',
        'race_event_numbers',
        'mtb_boards',
        'stamps',
        'trophies',
        'laser_cut'
    )),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url TEXT,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 15.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_division ON public.products(division);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- 2. Product Parameters Table (Dynamic Configurator Options)
CREATE TABLE IF NOT EXISTS public.product_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    parameter_type TEXT NOT NULL CHECK (parameter_type IN ('dimension', 'material', 'finish', 'shape', 'feature')),
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]', -- Array of { id, label, multiplier, addon_price, description }
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_parameters_product ON public.product_parameters(product_id);

-- 3. Pricing Rules Table (Parametric Formula Values)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    base_setup_fee NUMERIC(10,2) NOT NULL DEFAULT 15.00,
    cost_per_sq_cm NUMERIC(10,4) NOT NULL DEFAULT 0.025,
    min_width_mm NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    max_width_mm NUMERIC(10,2) NOT NULL DEFAULT 1200.00,
    min_height_mm NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    max_height_mm NUMERIC(10,2) NOT NULL DEFAULT 1200.00,
    min_quantity INTEGER NOT NULL DEFAULT 1,
    min_total_price NUMERIC(10,2) NOT NULL DEFAULT 15.00,
    material_multipliers JSONB NOT NULL DEFAULT '{}', -- { "white_vinyl": 1.0, "holographic": 1.6 }
    finish_addons JSONB NOT NULL DEFAULT '{}',       -- { "matte_lam": 0.05, "gloss_lam": 0.05 }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Volume Discounts Table (Automated Tier Calculations)
CREATE TABLE IF NOT EXISTS public.volume_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, -- NULL for global fallback
    min_quantity INTEGER NOT NULL,
    discount_percentage NUMERIC(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_prod_qty_tier UNIQUE(product_id, min_quantity)
);

CREATE INDEX IF NOT EXISTS idx_volume_discounts_product ON public.volume_discounts(product_id, min_quantity);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volume_discounts ENABLE ROW LEVEL SECURITY;

-- Public can read active products and pricing rules
CREATE POLICY "Public can view active products" 
    ON public.products FOR SELECT 
    USING (is_active = TRUE);

CREATE POLICY "Public can view product parameters" 
    ON public.product_parameters FOR SELECT 
    USING (TRUE);

CREATE POLICY "Public can view pricing rules" 
    ON public.pricing_rules FOR SELECT 
    USING (TRUE);

CREATE POLICY "Public can view volume discounts" 
    ON public.volume_discounts FOR SELECT 
    USING (TRUE);

-- Only Admins can modify products & pricing
CREATE POLICY "Admins can manage products" 
    ON public.products FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage parameters" 
    ON public.product_parameters FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage pricing rules" 
    ON public.pricing_rules FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage volume discounts" 
    ON public.volume_discounts FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
