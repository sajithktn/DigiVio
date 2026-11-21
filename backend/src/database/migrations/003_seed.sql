-- ============================================================================
-- 003_seed.sql — Realistic Seed Data for 6 Divisions, Products, Materials, Options,
-- Templates, Placeholders, Volume Discounts, and Gallery Showcase
-- Digital Heroes Web-to-Print Platform (PRD Level 2)
-- ============================================================================

-- Reset volume_discounts to clean PRD Level 2 schema (removes legacy min_quantity / discount_percentage columns)
DROP TABLE IF EXISTS public.volume_discounts CASCADE;

CREATE TABLE public.volume_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    min_qty INT NOT NULL,
    discount_percent NUMERIC NOT NULL
);

ALTER TABLE public.volume_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read volume discounts" ON public.volume_discounts;
CREATE POLICY "Public read volume discounts" ON public.volume_discounts FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admins manage volume discounts" ON public.volume_discounts;
CREATE POLICY "Admins manage volume discounts" ON public.volume_discounts FOR ALL USING (public.is_admin());

DO $$
DECLARE
    -- Division IDs
    div_labels_id UUID := '11111111-1111-1111-1111-111111111111';
    div_race_id UUID   := '22222222-2222-2222-2222-222222222222';
    div_mtb_id UUID    := '33333333-3333-3333-3333-333333333333';
    div_stamps_id UUID := '44444444-4444-4444-4444-444444444444';
    div_trophies_id UUID := '55555555-5555-5555-5555-555555555555';
    div_laser_id UUID  := '66666666-6666-6666-6666-666666666666';

    -- Product IDs (1 per division, parameter-driven, NO SKU-per-size)
    prod_labels_id UUID := 'aaaaaaaa-1111-4aaa-aaaa-aaaaaaaaaaaa';
    prod_race_id UUID   := 'bbbbbbbb-2222-4bbb-bbbb-bbbbbbbbbbbb';
    prod_mtb_id UUID    := 'cccccccc-3333-4ccc-cccc-cccccccccccc';
    prod_stamps_id UUID := 'dddddddd-4444-4ddd-dddd-dddddddddddd';
    prod_trophies_id UUID := 'eeeeeeee-5555-4eee-eeee-eeeeeeeeeeee';
    prod_laser_id UUID  := 'ffffffff-6666-4fff-ffff-ffffffffffff';

    -- Template IDs
    tpl_race_id UUID  := '77777777-7777-4777-7777-777777777777';
    tpl_label_id UUID := '88888888-8888-4888-8888-888888888888';
BEGIN

    -- 1. SIX DIVISIONS
    INSERT INTO public.divisions (id, slug, name, description, sort_order, is_active)
    VALUES
        (div_labels_id, 'labels-stickers', 'Labels & Stickers', 'Custom cut vinyl and paper labels with protective coatings', 1, TRUE),
        (div_race_id, 'race-event-numbers', 'Race & Event Numbers', 'Waterproof Tyvek bibs with CSV variable data numbering', 2, TRUE),
        (div_mtb_id, 'mtb-boards', 'MTB Boards', 'Flexible weather-proof mountain bike handlebars and number plates', 3, TRUE),
        (div_stamps_id, 'stamps', 'Stamps', 'Self-inking and traditional rubber stamps with crisp laser engraving', 4, TRUE),
        (div_trophies_id, 'trophies', 'Trophies', 'Custom engraved acrylic, wooden, and metallic boutique awards', 5, TRUE),
        (div_laser_id, 'laser-cut-work', 'Laser-Cut Work', 'Architectural vector cutting and raster engraving in wood & acrylic', 6, TRUE)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

    -- 2. PRODUCTS (One parameter-driven product per division)
    -- All money in integer minor units (paise). Example: 1500 paise = 15.00 INR
    INSERT INTO public.products (
        id, division_id, slug, name, description, pricing_model, base_price_minor, setup_fee_minor,
        min_qty, max_qty, min_width_mm, max_width_mm, min_height_mm, max_height_mm,
        bleed_mm, print_dpi, supports_csv_merge, is_active
    ) VALUES
        -- 1. Labels: Freeform width/height, 3mm bleed, 300dpi
        (prod_labels_id, div_labels_id, 'custom-labels-stickers', 'Custom Contour Labels',
         'Full-color die-cut labels with 3mm bleed margin. Fully parametric width and height.', 'area',
         50, 1500, 25, 50000, 20, 600, 20, 600, 3, 300, FALSE, TRUE),

        -- 2. Race Numbers: Standard/custom size, supports CSV merge
        (prod_race_id, div_race_id, 'tyvek-race-numbers', 'Tyvek Race & Event Bibs',
         'Tear-proof waterproof marathon numbers. Fully compatible with automated CSV variable data merge.', 'area',
         100, 2000, 10, 25000, 100, 300, 100, 250, 3, 300, TRUE, TRUE),

        -- 3. MTB Boards
        (prod_mtb_id, div_mtb_id, 'downhill-mtb-number-boards', 'Downhill MTB Plates',
         'Heavy-duty polypropylene front number boards with pre-cut zip-tie slots.', 'area',
         150, 2500, 5, 5000, 140, 240, 120, 200, 3, 300, FALSE, TRUE),

        -- 4. Stamps
        (prod_stamps_id, div_stamps_id, 'self-inking-rubber-stamps', 'Self-Inking Rubber Stamp',
         'Sharp laser-engraved rubber stamps with internal replaceable ink pad.', 'area',
         250, 1000, 1, 1000, 20, 120, 10, 80, 2, 300, FALSE, TRUE),

        -- 5. Trophies
        (prod_trophies_id, div_trophies_id, 'custom-engraved-acrylic-trophy', 'Boutique Acrylic Award',
         'High-clarity optical acrylic trophy with precision laser edge polishing and surface text engraving.', 'area',
         500, 3000, 1, 500, 80, 300, 100, 400, 0, 300, FALSE, TRUE),

        -- 6. Laser-Cut Work
        (prod_laser_id, div_laser_id, 'architectural-laser-cut-panel', 'Laser-Cut Architectural Panels',
         'Precision vector cutting and raster engraving in birch plywood and cast acrylic.', 'area',
         300, 2500, 1, 2000, 50, 1200, 50, 800, 3, 300, FALSE, TRUE)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, base_price_minor = EXCLUDED.base_price_minor;

    -- 3. MATERIALS (rate_per_cm2_minor in paise)
    -- Labels materials
    INSERT INTO public.materials (product_id, name, rate_per_cm2_minor, is_active) VALUES
        (prod_labels_id, 'Gloss Vinyl', 1.5, TRUE),
        (prod_labels_id, 'Matte Vinyl', 1.6, TRUE),
        (prod_labels_id, 'Recycled Paper', 1.0, TRUE),
        (prod_labels_id, 'Holographic Vinyl', 2.5, TRUE);

    -- Race numbers materials
    INSERT INTO public.materials (product_id, name, rate_per_cm2_minor, is_active) VALUES
        (prod_race_id, 'Tyvek 54gsm (Standard)', 1.8, TRUE),
        (prod_race_id, 'Tyvek 75gsm (Heavy Duty)', 2.2, TRUE),
        (prod_race_id, 'Synthetic Waterproof Poly', 2.8, TRUE);

    -- MTB Boards materials
    INSERT INTO public.materials (product_id, name, rate_per_cm2_minor, is_active) VALUES
        (prod_mtb_id, 'Polypropylene 0.8mm', 2.2, TRUE),
        (prod_mtb_id, 'Polypropylene 1.2mm Heavy Duty', 2.8, TRUE);

    -- Stamps materials
    INSERT INTO public.materials (product_id, name, rate_per_cm2_minor, is_active) VALUES
        (prod_stamps_id, 'Micro-porous Rubber (Standard)', 4.0, TRUE),
        (prod_stamps_id, 'Laser-Grade Odorless Polymer', 5.5, TRUE);

    -- Trophies materials
    INSERT INTO public.materials (product_id, name, rate_per_cm2_minor, is_active) VALUES
        (prod_trophies_id, 'Cast Acrylic 10mm Clear', 6.0, TRUE),
        (prod_trophies_id, 'Cast Acrylic 15mm Smoked', 8.5, TRUE);

    -- Laser-cut materials
    INSERT INTO public.materials (product_id, name, rate_per_cm2_minor, is_active) VALUES
        (prod_laser_id, 'Birch Plywood 3mm', 3.0, TRUE),
        (prod_laser_id, 'Birch Plywood 6mm', 4.5, TRUE),
        (prod_laser_id, 'Cast Acrylic 3mm', 5.0, TRUE);

    -- 4. PRODUCT OPTIONS
    -- Options for Labels
    INSERT INTO public.product_options (product_id, key, label, values) VALUES
        (prod_labels_id, 'finish', 'Lamination Finish', '[
            {"value": "none", "label": "No Lamination", "price_delta_minor": 0, "multiplier": 1.0},
            {"value": "gloss_lam", "label": "Gloss Laminate", "price_delta_minor": 20, "multiplier": 1.05},
            {"value": "matte_lam", "label": "Soft-Touch Matte Laminate", "price_delta_minor": 25, "multiplier": 1.08}
        ]'::jsonb),
        (prod_labels_id, 'cut_type', 'Cut Style', '[
            {"value": "kiss_cut", "label": "Kiss Cut (Sheet)", "price_delta_minor": 0, "multiplier": 1.0},
            {"value": "die_cut", "label": "Die Cut (Individual)", "price_delta_minor": 10, "multiplier": 1.0}
        ]'::jsonb);

    -- Options for Race Numbers
    INSERT INTO public.product_options (product_id, key, label, values) VALUES
        (prod_race_id, 'pin_holes', 'Hole Punching', '[
            {"value": "4_corner", "label": "4 Corner Holes (Safety Pins)", "price_delta_minor": 15, "multiplier": 1.0},
            {"value": "none", "label": "No Holes", "price_delta_minor": 0, "multiplier": 1.0}
        ]'::jsonb),
        (prod_race_id, 'tear_tag', 'Tear-Off Baggage Tag', '[
            {"value": "none", "label": "Standard Bib (No Tag)", "price_delta_minor": 0, "multiplier": 1.0},
            {"value": "single_tag", "label": "Perforated Bottom Tag", "price_delta_minor": 30, "multiplier": 1.0}
        ]'::jsonb);

    -- 5. VOLUME DISCOUNTS (Global & Product specific)
    -- Global tiers: 100 -> 5%, 250 -> 10%, 500 -> 15%, 1000 -> 20%
    DELETE FROM public.volume_discounts;
    INSERT INTO public.volume_discounts (product_id, min_qty, discount_percent) VALUES
        (NULL, 100, 5.0),
        (NULL, 250, 10.0),
        (NULL, 500, 15.0),
        (NULL, 1000, 20.0);

    -- 6. TEMPLATES (2 templates: 1 race number with placeholders, 1 label template)
    INSERT INTO public.templates (id, product_id, name, preview_url, canvas, print_areas, is_active)
    VALUES
        (tpl_race_id, prod_race_id, 'Standard Marathon Bib Template', '/previews/race_tpl_default.png',
         '{"background": "#ffffff", "elements": [{"type": "text", "text": "CITY MARATHON 2026", "x": 105, "y": 25, "fontSize": 24, "align": "center"}]}'::jsonb,
         '[{"id": "main_area", "x": 10, "y": 10, "w": 190, "h": 130}]'::jsonb, TRUE),

        (tpl_label_id, prod_labels_id, 'Minimalist Brand Label', '/previews/label_tpl_default.png',
         '{"background": "transparent", "elements": [{"type": "rect", "x": 5, "y": 5, "w": 80, "h": 40, "stroke": "#333333"}]}'::jsonb,
         '[{"id": "label_area", "x": 5, "y": 5, "w": 80, "h": 40}]'::jsonb, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 7. TEMPLATE PLACEHOLDERS (Race Bib has runner_number, name)
    DELETE FROM public.template_placeholders WHERE template_id = tpl_race_id;
    INSERT INTO public.template_placeholders (
        template_id, key, x, y, w, h, font_family, font_size_default,
        min_font_size, max_font_size, shrink_to_fit, tracking, max_tracking, min_tracking, align
    ) VALUES
        (tpl_race_id, 'runner_number', 15, 45, 180, 50, 'Space Grotesk', 96, 24, 120, TRUE, 0, 0, -2, 'center'),
        (tpl_race_id, 'name', 15, 105, 180, 20, 'Inter', 28, 12, 40, TRUE, 0, 0, -1, 'center');

    -- 8. GALLERY ITEMS (6+ showcase items across divisions)
    DELETE FROM public.gallery_items;
    INSERT INTO public.gallery_items (division_id, title, image_path, sort_order) VALUES
        (div_labels_id, 'Holographic Craft Brewery Labels', '/images/gallery/beer_labels.png', 1),
        (div_race_id, 'Ultra Trail 100k Tyvek Bibs', '/images/gallery/ultra_bib.png', 2),
        (div_mtb_id, 'Red Bull Downhill Pro Plates', '/images/gallery/mtb_plate.png', 3),
        (div_stamps_id, 'Custom Architect Office Wood Stamp', '/images/gallery/architect_stamp.png', 4),
        (div_trophies_id, 'Industrial Brushed Steel & Oak Plaque', '/images/gallery/oak_plaque.png', 5),
        (div_laser_id, 'Geometric Birch Wall Lattice', '/images/gallery/laser_lattice.png', 6);

END $$;
