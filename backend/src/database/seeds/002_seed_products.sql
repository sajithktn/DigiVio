-- ============================================================================
-- Seed: 002_seed_products.sql
-- Description: Seeds the 6 Product Divisions with Parameters, Rules & Volume Discounts
-- ============================================================================

DO $$
DECLARE
    prod_labels_id UUID := gen_random_uuid();
    prod_race_id UUID := gen_random_uuid();
    prod_mtb_id UUID := gen_random_uuid();
    prod_stamps_id UUID := gen_random_uuid();
    prod_trophies_id UUID := gen_random_uuid();
    prod_laser_id UUID := gen_random_uuid();
BEGIN

    -- 1. Division: Labels & Stickers
    INSERT INTO public.products (id, division, name, slug, description, thumbnail_url, base_price)
    VALUES (
        prod_labels_id,
        'labels_stickers',
        'Custom Die-Cut Labels & Stickers',
        'labels-stickers',
        'Premium waterproof custom-cut vinyl labels and stickers with vibrant UV inks and 3mm bleed margin.',
        '/images/divisions/labels.png',
        18.00
    ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO prod_labels_id;

    -- 2. Division: Race & Event Numbers
    INSERT INTO public.products (id, division, name, slug, description, thumbnail_url, base_price)
    VALUES (
        prod_race_id,
        'race_event_numbers',
        'Tyvek Race Bibs & Event Numbers',
        'race-event-numbers',
        'Tear-proof waterproof marathon and cycling race numbers with 4 pin holes and CSV variable data merge support.',
        '/images/divisions/race_bibs.png',
        25.00
    ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO prod_race_id;

    -- 3. Division: MTB Boards
    INSERT INTO public.products (id, division, name, slug, description, thumbnail_url, base_price)
    VALUES (
        prod_mtb_id,
        'mtb_boards',
        'Downhill & Enduro MTB Number Boards',
        'mtb-boards',
        'Heavy-duty flexible polypropylene mountain bike number plates with pre-cut zip-tie slots.',
        '/images/divisions/mtb_boards.png',
        22.00
    ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO prod_mtb_id;

    -- 4. Division: Stamps
    INSERT INTO public.products (id, division, name, slug, description, thumbnail_url, base_price)
    VALUES (
        prod_stamps_id,
        'stamps',
        'Self-Inking & Traditional Rubber Stamps',
        'stamps',
        'Laser-engraved rubber stamps with sharp monochrome line detail and vibrant ink cartridges.',
        '/images/divisions/stamps.png',
        16.00
    ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO prod_stamps_id;

    -- 5. Division: Trophies
    INSERT INTO public.products (id, division, name, slug, description, thumbnail_url, base_price)
    VALUES (
        prod_trophies_id,
        'trophies',
        'Custom Engraved Acrylic & Wood Trophies',
        'trophies',
        'Contemporary boutique-industrial awards, plaques, and commemorative trophies with precision laser text engraving.',
        '/images/divisions/trophies.png',
        35.00
    ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO prod_trophies_id;

    -- 6. Division: Laser-Cut Work
    INSERT INTO public.products (id, division, name, slug, description, thumbnail_url, base_price)
    VALUES (
        prod_laser_id,
        'laser_cut',
        'Architectural Laser Cutting & Engraving',
        'laser-cut',
        'Precision vector laser cutting in birch plywood, acrylic, and MDF with distinct cut lines and raster engraving.',
        '/images/divisions/laser_cut.png',
        30.00
    ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO prod_laser_id;

    -- =========================================================================
    -- PRICING RULES FOR EACH DIVISION
    -- =========================================================================

    -- Labels & Stickers Pricing Rule
    INSERT INTO public.pricing_rules (
        product_id, base_setup_fee, cost_per_sq_cm, min_width_mm, max_width_mm, min_height_mm, max_height_mm, min_quantity, min_total_price,
        material_multipliers, finish_addons
    ) VALUES (
        prod_labels_id, 12.00, 0.0150, 20.00, 600.00, 20.00, 600.00, 25, 20.00,
        '{"gloss_vinyl": 1.0, "matte_vinyl": 1.05, "clear_vinyl": 1.25, "holographic": 1.55, "paper": 0.85}'::jsonb,
        '{"none": 0.0, "matte_laminate": 0.03, "gloss_laminate": 0.03, "uv_spot": 0.08}'::jsonb
    ) ON CONFLICT (product_id) DO UPDATE SET base_setup_fee = EXCLUDED.base_setup_fee;

    -- Race & Event Numbers Pricing Rule
    INSERT INTO public.pricing_rules (
        product_id, base_setup_fee, cost_per_sq_cm, min_width_mm, max_width_mm, min_height_mm, max_height_mm, min_quantity, min_total_price,
        material_multipliers, finish_addons
    ) VALUES (
        prod_race_id, 20.00, 0.0180, 100.00, 300.00, 100.00, 250.00, 50, 35.00,
        '{"tyvek_standard": 1.0, "tyvek_heavy": 1.2, "synthetic_waterproof": 1.35}'::jsonb,
        '{"none": 0.0, "corner_pin_holes": 0.02, "tear_off_tag": 0.05, "barcode_qr": 0.03}'::jsonb
    ) ON CONFLICT (product_id) DO UPDATE SET base_setup_fee = EXCLUDED.base_setup_fee;

    -- MTB Boards Pricing Rule
    INSERT INTO public.pricing_rules (
        product_id, base_setup_fee, cost_per_sq_cm, min_width_mm, max_width_mm, min_height_mm, max_height_mm, min_quantity, min_total_price,
        material_multipliers, finish_addons
    ) VALUES (
        prod_mtb_id, 18.00, 0.0250, 140.00, 240.00, 120.00, 200.00, 10, 25.00,
        '{"polypropylene_08mm": 1.0, "polypropylene_12mm": 1.25, "carbon_look": 1.50}'::jsonb,
        '{"none": 0.0, "zip_tie_slots": 0.00, "heavy_duty_gloss": 0.06}'::jsonb
    ) ON CONFLICT (product_id) DO UPDATE SET base_setup_fee = EXCLUDED.base_setup_fee;

    -- Stamps Pricing Rule
    INSERT INTO public.pricing_rules (
        product_id, base_setup_fee, cost_per_sq_cm, min_width_mm, max_width_mm, min_height_mm, max_height_mm, min_quantity, min_total_price,
        material_multipliers, finish_addons
    ) VALUES (
        prod_stamps_id, 10.00, 0.0500, 20.00, 100.00, 10.00, 80.00, 1, 16.00,
        '{"self_inking": 1.0, "wood_handle": 0.85, "pocket_stamp": 1.15}'::jsonb,
        '{"black_ink": 0.0, "blue_ink": 0.0, "red_ink": 0.0, "green_ink": 0.50}'::jsonb
    ) ON CONFLICT (product_id) DO UPDATE SET base_setup_fee = EXCLUDED.base_setup_fee;

    -- Trophies Pricing Rule
    INSERT INTO public.pricing_rules (
        product_id, base_setup_fee, cost_per_sq_cm, min_width_mm, max_width_mm, min_height_mm, max_height_mm, min_quantity, min_total_price,
        material_multipliers, finish_addons
    ) VALUES (
        prod_trophies_id, 25.00, 0.0650, 80.00, 300.00, 100.00, 400.00, 1, 35.00,
        '{"acrylic_block": 1.0, "solid_wood_oak": 1.35, "brushed_aluminum": 1.45}'::jsonb,
        '{"laser_engraving": 0.0, "gold_plate_inlay": 5.00, "presentation_box": 8.00}'::jsonb
    ) ON CONFLICT (product_id) DO UPDATE SET base_setup_fee = EXCLUDED.base_setup_fee;

    -- Laser-Cut Work Pricing Rule
    INSERT INTO public.pricing_rules (
        product_id, base_setup_fee, cost_per_sq_cm, min_width_mm, max_width_mm, min_height_mm, max_height_mm, min_quantity, min_total_price,
        material_multipliers, finish_addons
    ) VALUES (
        prod_laser_id, 22.00, 0.0350, 50.00, 1200.00, 50.00, 800.00, 1, 30.00,
        '{"birch_plywood_3mm": 1.0, "birch_plywood_6mm": 1.4, "cast_acrylic_3mm": 1.6, "mdf_3mm": 0.75}'::jsonb,
        '{"standard_cut": 0.0, "detailed_engraving": 0.08, "edge_sanding": 0.04}'::jsonb
    ) ON CONFLICT (product_id) DO UPDATE SET base_setup_fee = EXCLUDED.base_setup_fee;

    -- =========================================================================
    -- VOLUME DISCOUNT BRACKETS (Applied automatically across all products)
    -- =========================================================================
    DELETE FROM public.volume_discounts WHERE product_id IS NULL;

    INSERT INTO public.volume_discounts (product_id, min_quantity, discount_percentage)
    VALUES 
        (NULL, 50, 5.00),
        (NULL, 100, 12.00),
        (NULL, 250, 20.00),
        (NULL, 500, 30.00),
        (NULL, 1000, 40.00);

END $$;
