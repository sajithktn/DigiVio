-- ============================================================================
-- Migration: 003_orders_and_proofs.sql
-- Description: Orders, Line Items, Versioned Proofs, and Approval Gate Logic
-- ============================================================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN (
        'quote',
        'order',
        'artwork',
        'proof',
        'production',
        'completed',
        'cancelled'
    )) DEFAULT 'order',
    subtotal NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'paid',
    payment_reference TEXT,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    billing_address JSONB,
    xero_invoice_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    product_slug TEXT NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb, -- { width_mm, height_mm, material_id, finish_id, shape_id }
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,4) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    artwork_source TEXT NOT NULL CHECK (artwork_source IN ('designer', 'upload')) DEFAULT 'designer',
    artwork_url TEXT,
    canvas_json JSONB, -- Serialized Fabric.js canvas state if designed in browser
    has_variable_data BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 3. Proofs Table (Versioned v1, v2... and Customer Approval Gate)
CREATE TABLE IF NOT EXISTS public.proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    proof_preview_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'revision_requested')) DEFAULT 'pending',
    feedback_notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_order_item_proof_version UNIQUE(order_item_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_proofs_order_item_id ON public.proofs(order_item_id);
CREATE INDEX IF NOT EXISTS idx_proofs_order_id ON public.proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_proofs_status ON public.proofs(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

-- Orders RLS: Customers can view only their own orders
CREATE POLICY "Customers view own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Customers create orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all orders" 
    ON public.orders FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Order Items RLS
CREATE POLICY "Customers view own order items" 
    ON public.order_items FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    );

CREATE POLICY "Admins manage all order items" 
    ON public.order_items FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Proofs RLS
CREATE POLICY "Customers view own proofs" 
    ON public.proofs FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = proofs.order_id AND orders.user_id = auth.uid())
    );

CREATE POLICY "Customers approve own proofs" 
    ON public.proofs FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = proofs.order_id AND orders.user_id = auth.uid())
    );

CREATE POLICY "Admins manage all proofs" 
    ON public.proofs FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
