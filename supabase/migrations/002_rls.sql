-- ============================================================================
-- 002_rls.sql — Row Level Security Policies
-- Digital Heroes Web-to-Print Platform (PRD Level 2)
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volume_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_placeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 1. PROFILES
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins full manage profiles" ON public.profiles FOR ALL USING (is_admin());

-- Profile auto-creation trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PUBLIC CATALOGUE READ POLICIES
CREATE POLICY "Public read active divisions" ON public.divisions FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Public read active materials" ON public.materials FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Public read product options" ON public.product_options FOR SELECT USING (TRUE);
CREATE POLICY "Public read volume discounts" ON public.volume_discounts FOR SELECT USING (TRUE);
CREATE POLICY "Public read active templates" ON public.templates FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Public read template placeholders" ON public.template_placeholders FOR SELECT USING (TRUE);
CREATE POLICY "Public read gallery items" ON public.gallery_items FOR SELECT USING (TRUE);

-- ADMIN CATALOGUE MANAGE POLICIES
CREATE POLICY "Admins manage divisions" ON public.divisions FOR ALL USING (is_admin());
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (is_admin());
CREATE POLICY "Admins manage materials" ON public.materials FOR ALL USING (is_admin());
CREATE POLICY "Admins manage options" ON public.product_options FOR ALL USING (is_admin());
CREATE POLICY "Admins manage volume discounts" ON public.volume_discounts FOR ALL USING (is_admin());
CREATE POLICY "Admins manage templates" ON public.templates FOR ALL USING (is_admin());
CREATE POLICY "Admins manage placeholders" ON public.template_placeholders FOR ALL USING (is_admin());
CREATE POLICY "Admins manage gallery" ON public.gallery_items FOR ALL USING (is_admin());

-- 3. DESIGNS
CREATE POLICY "Users read own designs" ON public.designs FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users insert own designs" ON public.designs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own designs" ON public.designs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own designs" ON public.designs FOR DELETE USING (user_id = auth.uid());

-- 4. ORDERS & ORDER ITEMS
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage all orders" ON public.orders FOR ALL USING (is_admin());

CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL USING (is_admin());

CREATE POLICY "Users read order history" ON public.order_status_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_history.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Admins manage status history" ON public.order_status_history FOR ALL USING (is_admin());

-- 5. PROOFS & PROOF EVENTS
CREATE POLICY "Users read own proofs" ON public.proofs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.order_items 
        JOIN public.orders ON orders.id = order_items.order_id
        WHERE order_items.id = proofs.order_item_id AND (orders.user_id = auth.uid() OR is_admin())
    )
);
CREATE POLICY "Admins manage proofs" ON public.proofs FOR ALL USING (is_admin());

CREATE POLICY "Users read proof events" ON public.proof_events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.proofs
        JOIN public.order_items ON order_items.id = proofs.order_item_id
        JOIN public.orders ON orders.id = order_items.order_id
        WHERE proofs.id = proof_events.proof_id AND (orders.user_id = auth.uid() OR is_admin())
    )
);
CREATE POLICY "Admins manage proof events" ON public.proof_events FOR ALL USING (is_admin());

-- 6. PRINT FILES (Strict admin-only / approved-only access)
CREATE POLICY "Admins access print files" ON public.print_files FOR ALL USING (is_admin());

-- 7. INVOICES
CREATE POLICY "Users view own invoices" ON public.invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = invoices.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Admins manage invoices" ON public.invoices FOR ALL USING (is_admin());

-- 8. EMAIL LOG (Admin only)
CREATE POLICY "Admins view email logs" ON public.email_log FOR ALL USING (is_admin());
