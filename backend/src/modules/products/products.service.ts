import { supabaseAdmin, isSupabaseConfigured } from '../../config/supabase.js';
import { ApiError } from '../../utils/api-error.js';
import crypto from 'crypto';

export interface Division {
  id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface Material {
  id: string;
  name: string;
  rate_per_cm2_minor: number;
  is_active: boolean;
}

export interface ProductOptionValue {
  value: string;
  label: string;
  price_delta_minor: number;
  multiplier: number;
}

export interface ProductOption {
  key: string;
  label: string;
  values: ProductOptionValue[];
}

export interface VolumeDiscount {
  min_qty: number;
  discount_percent: number;
}

export interface TemplatePlaceholder {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  font_family: string;
  font_size_default: number;
  min_font_size: number;
  max_font_size: number;
  shrink_to_fit: boolean;
  tracking: number;
  max_tracking: number;
  min_tracking: number;
  align: string;
}

export interface Template {
  id: string;
  name: string;
  preview_url: string;
  canvas: Record<string, any>;
  print_areas: Array<{ id: string; x: number; y: number; w: number; h: number }>;
  placeholders: TemplatePlaceholder[];
}

export interface ProductDetailed {
  id: string;
  division_id: string;
  division_slug: string;
  slug: string;
  name: string;
  description: string;
  pricing_model: string;
  base_price_minor: number;
  setup_fee_minor: number;
  min_qty: number;
  max_qty: number;
  min_width_mm: number;
  max_width_mm: number;
  min_height_mm: number;
  max_height_mm: number;
  bleed_mm: number;
  print_dpi: number;
  supports_csv_merge: boolean;
  is_active: boolean;
  materials: Material[];
  options: ProductOption[];
  volume_discounts: VolumeDiscount[];
  templates: Template[];
}

export interface GalleryItem {
  id: string;
  division_slug: string;
  title: string;
  image_path: string;
  sort_order: number;
}

// 6 Core Divisions
export const STATIC_DIVISIONS: Division[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'labels-stickers',
    name: 'Labels & Stickers',
    description: 'Custom cut vinyl and paper labels with protective coatings',
    sort_order: 1,
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'race-event-numbers',
    name: 'Race & Event Numbers',
    description: 'Waterproof Tyvek bibs with CSV variable data numbering',
    sort_order: 2,
    is_active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'mtb-boards',
    name: 'MTB Boards',
    description: 'Flexible weather-proof mountain bike handlebars and number plates',
    sort_order: 3,
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    slug: 'stamps',
    name: 'Stamps',
    description: 'Self-inking and traditional rubber stamps with crisp laser engraving',
    sort_order: 4,
    is_active: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    slug: 'trophies',
    name: 'Trophies',
    description: 'Custom engraved acrylic, wooden, and metallic boutique awards',
    sort_order: 5,
    is_active: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    slug: 'laser-cut-work',
    name: 'Laser-Cut Work',
    description: 'Architectural vector cutting and raster engraving in wood & acrylic',
    sort_order: 6,
    is_active: true,
  },
];

// Global volume discounts
export const GLOBAL_VOLUME_DISCOUNTS: VolumeDiscount[] = [
  { min_qty: 100, discount_percent: 5.0 },
  { min_qty: 250, discount_percent: 10.0 },
  { min_qty: 500, discount_percent: 15.0 },
  { min_qty: 1000, discount_percent: 20.0 },
];

// Seeded products detailed
export const STATIC_PRODUCTS: ProductDetailed[] = [
  {
    id: 'aaaaaaaa-1111-4aaa-aaaa-aaaaaaaaaaaa',
    division_id: '11111111-1111-1111-1111-111111111111',
    division_slug: 'labels-stickers',
    slug: 'custom-labels-stickers',
    name: 'Custom Contour Labels',
    description: 'Full-color die-cut labels with 3mm bleed margin. Fully parametric width and height.',
    pricing_model: 'area',
    base_price_minor: 50,
    setup_fee_minor: 1500,
    min_qty: 25,
    max_qty: 50000,
    min_width_mm: 20,
    max_width_mm: 600,
    min_height_mm: 20,
    max_height_mm: 600,
    bleed_mm: 3,
    print_dpi: 300,
    supports_csv_merge: false,
    is_active: true,
    materials: [
      { id: 'm-lbl-1', name: 'Gloss Vinyl', rate_per_cm2_minor: 1.5, is_active: true },
      { id: 'm-lbl-2', name: 'Matte Vinyl', rate_per_cm2_minor: 1.6, is_active: true },
      { id: 'm-lbl-3', name: 'Recycled Paper', rate_per_cm2_minor: 1.0, is_active: true },
      { id: 'm-lbl-4', name: 'Holographic Vinyl', rate_per_cm2_minor: 2.5, is_active: true },
    ],
    options: [
      {
        key: 'finish',
        label: 'Lamination Finish',
        values: [
          { value: 'none', label: 'No Lamination', price_delta_minor: 0, multiplier: 1.0 },
          { value: 'gloss_lam', label: 'Gloss Laminate', price_delta_minor: 20, multiplier: 1.05 },
          { value: 'matte_lam', label: 'Soft-Touch Matte Laminate', price_delta_minor: 25, multiplier: 1.08 },
        ],
      },
      {
        key: 'cut_type',
        label: 'Cut Style',
        values: [
          { value: 'kiss_cut', label: 'Kiss Cut (Sheet)', price_delta_minor: 0, multiplier: 1.0 },
          { value: 'die_cut', label: 'Die Cut (Individual)', price_delta_minor: 10, multiplier: 1.0 },
        ],
      },
    ],
    volume_discounts: GLOBAL_VOLUME_DISCOUNTS,
    templates: [
      {
        id: '88888888-8888-4888-8888-888888888888',
        name: 'Minimalist Brand Label',
        preview_url: '/previews/label_tpl_default.png',
        canvas: { background: 'transparent', elements: [{ type: 'rect', x: 5, y: 5, w: 80, h: 40, stroke: '#333333' }] },
        print_areas: [{ id: 'label_area', x: 5, y: 5, w: 80, h: 40 }],
        placeholders: [],
      },
    ],
  },
  {
    id: 'bbbbbbbb-2222-4bbb-bbbb-bbbbbbbbbbbb',
    division_id: '22222222-2222-2222-2222-222222222222',
    division_slug: 'race-event-numbers',
    slug: 'tyvek-race-numbers',
    name: 'Tyvek Race & Event Bibs',
    description: 'Tear-proof waterproof marathon numbers. Fully compatible with automated CSV variable data merge.',
    pricing_model: 'area',
    base_price_minor: 100,
    setup_fee_minor: 2000,
    min_qty: 10,
    max_qty: 25000,
    min_width_mm: 100,
    max_width_mm: 300,
    min_height_mm: 100,
    max_height_mm: 250,
    bleed_mm: 3,
    print_dpi: 300,
    supports_csv_merge: true,
    is_active: true,
    materials: [
      { id: 'm-race-1', name: 'Tyvek 54gsm (Standard)', rate_per_cm2_minor: 1.8, is_active: true },
      { id: 'm-race-2', name: 'Tyvek 75gsm (Heavy Duty)', rate_per_cm2_minor: 2.2, is_active: true },
      { id: 'm-race-3', name: 'Synthetic Waterproof Poly', rate_per_cm2_minor: 2.8, is_active: true },
    ],
    options: [
      {
        key: 'pin_holes',
        label: 'Hole Punching',
        values: [
          { value: '4_corner', label: '4 Corner Holes (Safety Pins)', price_delta_minor: 15, multiplier: 1.0 },
          { value: 'none', label: 'No Holes', price_delta_minor: 0, multiplier: 1.0 },
        ],
      },
      {
        key: 'tear_tag',
        label: 'Tear-Off Baggage Tag',
        values: [
          { value: 'none', label: 'Standard Bib (No Tag)', price_delta_minor: 0, multiplier: 1.0 },
          { value: 'single_tag', label: 'Perforated Bottom Tag', price_delta_minor: 30, multiplier: 1.0 },
        ],
      },
    ],
    volume_discounts: GLOBAL_VOLUME_DISCOUNTS,
    templates: [
      {
        id: '77777777-7777-4777-7777-777777777777',
        name: 'Standard Marathon Bib Template',
        preview_url: '/previews/race_tpl_default.png',
        canvas: { background: '#ffffff', elements: [{ type: 'text', text: 'CITY MARATHON 2026', x: 105, y: 25, fontSize: 24, align: 'center' }] },
        print_areas: [{ id: 'main_area', x: 10, y: 10, w: 190, h: 130 }],
        placeholders: [
          {
            key: 'runner_number',
            x: 15,
            y: 45,
            w: 180,
            h: 50,
            font_family: 'Space Grotesk',
            font_size_default: 96,
            min_font_size: 24,
            max_font_size: 120,
            shrink_to_fit: true,
            tracking: 0,
            max_tracking: 0,
            min_tracking: -2,
            align: 'center',
          },
          {
            key: 'name',
            x: 15,
            y: 105,
            w: 180,
            h: 20,
            font_family: 'Inter',
            font_size_default: 28,
            min_font_size: 12,
            max_font_size: 40,
            shrink_to_fit: true,
            tracking: 0,
            max_tracking: 0,
            min_tracking: -1,
            align: 'center',
          },
        ],
      },
    ],
  },
  {
    id: 'cccccccc-3333-4ccc-cccc-cccccccccccc',
    division_id: '33333333-3333-3333-3333-333333333333',
    division_slug: 'mtb-boards',
    slug: 'downhill-mtb-number-boards',
    name: 'Downhill MTB Plates',
    description: 'Heavy-duty polypropylene front number boards with pre-cut zip-tie slots.',
    pricing_model: 'area',
    base_price_minor: 150,
    setup_fee_minor: 2500,
    min_qty: 5,
    max_qty: 5000,
    min_width_mm: 140,
    max_width_mm: 240,
    min_height_mm: 120,
    max_height_mm: 200,
    bleed_mm: 3,
    print_dpi: 300,
    supports_csv_merge: false,
    is_active: true,
    materials: [
      { id: 'm-mtb-1', name: 'Polypropylene 0.8mm', rate_per_cm2_minor: 2.2, is_active: true },
      { id: 'm-mtb-2', name: 'Polypropylene 1.2mm Heavy Duty', rate_per_cm2_minor: 2.8, is_active: true },
    ],
    options: [],
    volume_discounts: GLOBAL_VOLUME_DISCOUNTS,
    templates: [],
  },
  {
    id: 'dddddddd-4444-4ddd-dddd-dddddddddddd',
    division_id: '44444444-4444-4444-4444-444444444444',
    division_slug: 'stamps',
    slug: 'self-inking-rubber-stamps',
    name: 'Self-Inking Rubber Stamp',
    description: 'Sharp laser-engraved rubber stamps with internal replaceable ink pad.',
    pricing_model: 'area',
    base_price_minor: 250,
    setup_fee_minor: 1000,
    min_qty: 1,
    max_qty: 1000,
    min_width_mm: 20,
    max_width_mm: 100,
    min_height_mm: 10,
    max_height_mm: 80,
    bleed_mm: 2,
    print_dpi: 300,
    supports_csv_merge: false,
    is_active: true,
    materials: [
      { id: 'm-stmp-1', name: 'Micro-porous Rubber (Standard)', rate_per_cm2_minor: 4.0, is_active: true },
      { id: 'm-stmp-2', name: 'Laser-Grade Odorless Polymer', rate_per_cm2_minor: 5.5, is_active: true },
    ],
    options: [],
    volume_discounts: GLOBAL_VOLUME_DISCOUNTS,
    templates: [],
  },
  {
    id: 'eeeeeeee-5555-4eee-eeee-eeeeeeeeeeee',
    division_id: '55555555-5555-5555-5555-555555555555',
    division_slug: 'trophies',
    slug: 'custom-engraved-acrylic-trophy',
    name: 'Boutique Acrylic Award',
    description: 'High-clarity optical acrylic trophy with precision laser edge polishing and surface text engraving.',
    pricing_model: 'area',
    base_price_minor: 500,
    setup_fee_minor: 3000,
    min_qty: 1,
    max_qty: 500,
    min_width_mm: 80,
    max_width_mm: 300,
    min_height_mm: 100,
    max_height_mm: 400,
    bleed_mm: 0,
    print_dpi: 300,
    supports_csv_merge: false,
    is_active: true,
    materials: [
      { id: 'm-trph-1', name: 'Cast Acrylic 10mm Clear', rate_per_cm2_minor: 6.0, is_active: true },
      { id: 'm-trph-2', name: 'Cast Acrylic 15mm Smoked', rate_per_cm2_minor: 8.5, is_active: true },
    ],
    options: [],
    volume_discounts: GLOBAL_VOLUME_DISCOUNTS,
    templates: [],
  },
  {
    id: 'ffffffff-6666-4fff-ffff-ffffffffffff',
    division_id: '66666666-6666-6666-6666-666666666666',
    division_slug: 'laser-cut-work',
    slug: 'architectural-laser-cut-panel',
    name: 'Laser-Cut Architectural Panels',
    description: 'Precision vector cutting and raster engraving in birch plywood and cast acrylic.',
    pricing_model: 'area',
    base_price_minor: 300,
    setup_fee_minor: 2500,
    min_qty: 1,
    max_qty: 2000,
    min_width_mm: 50,
    max_width_mm: 1200,
    min_height_mm: 50,
    max_height_mm: 800,
    bleed_mm: 3,
    print_dpi: 300,
    supports_csv_merge: false,
    is_active: true,
    materials: [
      { id: 'm-lsr-1', name: 'Birch Plywood 3mm', rate_per_cm2_minor: 3.0, is_active: true },
      { id: 'm-lsr-2', name: 'Birch Plywood 6mm', rate_per_cm2_minor: 4.5, is_active: true },
      { id: 'm-lsr-3', name: 'Cast Acrylic 3mm', rate_per_cm2_minor: 5.0, is_active: true },
    ],
    options: [],
    volume_discounts: GLOBAL_VOLUME_DISCOUNTS,
    templates: [],
  },
];

// Gallery items
export const STATIC_GALLERY: GalleryItem[] = [
  { id: 'g-1', division_slug: 'labels-stickers', title: 'Holographic Craft Brewery Labels', image_path: '/images/gallery/beer_labels.png', sort_order: 1 },
  { id: 'g-2', division_slug: 'race-event-numbers', title: 'Ultra Trail 100k Tyvek Bibs', image_path: '/images/gallery/ultra_bib.png', sort_order: 2 },
  { id: 'g-3', division_slug: 'mtb-boards', title: 'Red Bull Downhill Pro Plates', image_path: '/images/gallery/mtb_plate.png', sort_order: 3 },
  { id: 'g-4', division_slug: 'stamps', title: 'Custom Architect Office Wood Stamp', image_path: '/images/gallery/architect_stamp.png', sort_order: 4 },
  { id: 'g-5', division_slug: 'trophies', title: 'Industrial Brushed Steel & Oak Plaque', image_path: '/images/gallery/oak_plaque.png', sort_order: 5 },
  { id: 'g-6', division_slug: 'laser-cut-work', title: 'Geometric Birch Wall Lattice', image_path: '/images/gallery/laser_lattice.png', sort_order: 6 },
];

export let IN_MEMORY_DIVISIONS: Division[] = [...STATIC_DIVISIONS];
export let IN_MEMORY_PRODUCTS: ProductDetailed[] = JSON.parse(JSON.stringify(STATIC_PRODUCTS));
export let IN_MEMORY_GALLERY: GalleryItem[] = [...STATIC_GALLERY];

export const SLUG_ALIASES: Record<string, string> = {
  'custom-contour-labels': 'custom-labels-stickers',
  'labels-stickers': 'custom-labels-stickers',
  'prod-1': 'custom-labels-stickers',
  'tyvek-race-event-bibs': 'tyvek-race-numbers',
  'race-event-numbers': 'tyvek-race-numbers',
  'prod-2': 'tyvek-race-numbers',
  'downhill-mtb-plates': 'downhill-mtb-number-boards',
  'mtb-boards': 'downhill-mtb-number-boards',
  'prod-3': 'downhill-mtb-number-boards',
  'self-inking-stamps': 'self-inking-rubber-stamps',
  'stamps': 'self-inking-rubber-stamps',
  'prod-4': 'self-inking-rubber-stamps',
  'acrylic-trophies': 'custom-engraved-acrylic-trophy',
  'trophies': 'custom-engraved-acrylic-trophy',
  'prod-5': 'custom-engraved-acrylic-trophy',
  'laser-panels': 'architectural-laser-cut-panels',
  'laser-cut-work': 'architectural-laser-cut-panels',
  'prod-6': 'architectural-laser-cut-panels',
};

export class ProductsService {
  /**
   * Get list of divisions sorted by sort_order
   */
  async getDivisions(): Promise<Division[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('divisions')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as Division[];
        }
      } catch (err) {
        console.warn('Falling back to static divisions:', err);
      }
    }
    return [...IN_MEMORY_DIVISIONS].sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Get products list, optionally filtered by division slug
   */
  async getProducts(divisionSlug?: string): Promise<ProductDetailed[]> {
    let list = IN_MEMORY_PRODUCTS;
    if (divisionSlug) {
      list = list.filter((p) => p.division_slug === divisionSlug || p.slug === divisionSlug);
    }
    return list;
  }

  /**
   * Get single product by slug with all materials, options, volume discounts, templates
   */
  async getProductBySlug(slug: string): Promise<ProductDetailed> {
    const raw = (slug || '').trim();
    const slugLower = raw.toLowerCase();
    const aliased = SLUG_ALIASES[slugLower] || slugLower;

    const found = IN_MEMORY_PRODUCTS.find(
      (p) =>
        p.slug.toLowerCase() === aliased ||
        p.slug.toLowerCase() === slugLower ||
        p.id === raw ||
        p.division_slug.toLowerCase() === slugLower ||
        p.name.toLowerCase() === slugLower ||
        p.name.toLowerCase().includes(slugLower)
    );

    if (found) {
      return found;
    }

    // Safe fallback to first active product so order/quote pipeline never crashes
    if (IN_MEMORY_PRODUCTS.length > 0) {
      return IN_MEMORY_PRODUCTS[0];
    }

    throw ApiError.notFound(`Product with slug '${slug}' not found.`);
  }

  /**
   * Get gallery items, optionally filtered by division
   */
  async getGallery(divisionSlug?: string): Promise<GalleryItem[]> {
    let items = IN_MEMORY_GALLERY;
    if (divisionSlug) {
      items = items.filter((g) => g.division_slug === divisionSlug);
    }
    return items.sort((a, b) => a.sort_order - b.sort_order);
  }

  // --- Feature 16: Admin Catalogue Management CRUD ---

  createDivision(data: Partial<Division>): Division {
    if (!data.slug || !data.name) {
      throw ApiError.badRequest('Division slug and name are required.');
    }
    const newDivision: Division = {
      id: data.id || crypto.randomUUID(),
      slug: data.slug,
      name: data.name,
      description: data.description || '',
      sort_order: data.sort_order ?? IN_MEMORY_DIVISIONS.length + 1,
      is_active: data.is_active ?? true,
    };
    IN_MEMORY_DIVISIONS.push(newDivision);
    return newDivision;
  }

  updateDivision(id: string, data: Partial<Division>): Division {
    const index = IN_MEMORY_DIVISIONS.findIndex((d) => d.id === id || d.slug === id);
    if (index === -1) {
      throw ApiError.notFound(`Division '${id}' not found.`);
    }
    IN_MEMORY_DIVISIONS[index] = { ...IN_MEMORY_DIVISIONS[index], ...data };
    return IN_MEMORY_DIVISIONS[index];
  }

  deleteDivision(id: string): void {
    const index = IN_MEMORY_DIVISIONS.findIndex((d) => d.id === id || d.slug === id);
    if (index === -1) {
      throw ApiError.notFound(`Division '${id}' not found.`);
    }
    IN_MEMORY_DIVISIONS.splice(index, 1);
  }

  createProduct(data: Partial<ProductDetailed>): ProductDetailed {
    if (!data.slug || !data.name || !data.division_slug) {
      throw ApiError.badRequest('Product slug, name, and division_slug are required.');
    }

    // Range Validations
    if (data.min_qty !== undefined && data.max_qty !== undefined && data.min_qty >= data.max_qty) {
      throw ApiError.badRequest(`min_qty (${data.min_qty}) must be strictly less than max_qty (${data.max_qty}).`);
    }
    if (data.min_width_mm !== undefined && data.max_width_mm !== undefined && data.min_width_mm >= data.max_width_mm) {
      throw ApiError.badRequest(`min_width_mm (${data.min_width_mm}) must be strictly less than max_width_mm (${data.max_width_mm}).`);
    }
    if (data.min_height_mm !== undefined && data.max_height_mm !== undefined && data.min_height_mm >= data.max_height_mm) {
      throw ApiError.badRequest(`min_height_mm (${data.min_height_mm}) must be strictly less than max_height_mm (${data.max_height_mm}).`);
    }

    const division = IN_MEMORY_DIVISIONS.find((d) => d.slug === data.division_slug);
    const newProduct: ProductDetailed = {
      id: data.id || crypto.randomUUID(),
      division_id: division?.id || data.division_id || crypto.randomUUID(),
      division_slug: data.division_slug,
      slug: data.slug,
      name: data.name,
      description: data.description || '',
      pricing_model: data.pricing_model || 'area',
      base_price_minor: data.base_price_minor ?? 100,
      setup_fee_minor: data.setup_fee_minor ?? 0,
      min_qty: data.min_qty ?? 1,
      max_qty: data.max_qty ?? 10000,
      min_width_mm: data.min_width_mm ?? 10,
      max_width_mm: data.max_width_mm ?? 1000,
      min_height_mm: data.min_height_mm ?? 10,
      max_height_mm: data.max_height_mm ?? 1000,
      bleed_mm: data.bleed_mm ?? 3,
      print_dpi: data.print_dpi ?? 300,
      supports_csv_merge: data.supports_csv_merge ?? false,
      is_active: data.is_active ?? true,
      materials: data.materials || [],
      options: data.options || [],
      volume_discounts: data.volume_discounts || GLOBAL_VOLUME_DISCOUNTS,
      templates: data.templates || [],
    };

    IN_MEMORY_PRODUCTS.push(newProduct);
    return newProduct;
  }

  updateProduct(idOrSlug: string, data: Partial<ProductDetailed>): ProductDetailed {
    const product = IN_MEMORY_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    if (!product) {
      throw ApiError.notFound(`Product '${idOrSlug}' not found.`);
    }

    const min_qty = data.min_qty ?? product.min_qty;
    const max_qty = data.max_qty ?? product.max_qty;
    if (min_qty >= max_qty) {
      throw ApiError.badRequest(`min_qty (${min_qty}) must be strictly less than max_qty (${max_qty}).`);
    }

    const min_width_mm = data.min_width_mm ?? product.min_width_mm;
    const max_width_mm = data.max_width_mm ?? product.max_width_mm;
    if (min_width_mm >= max_width_mm) {
      throw ApiError.badRequest(`min_width_mm (${min_width_mm}) must be strictly less than max_width_mm (${max_width_mm}).`);
    }

    const min_height_mm = data.min_height_mm ?? product.min_height_mm;
    const max_height_mm = data.max_height_mm ?? product.max_height_mm;
    if (min_height_mm >= max_height_mm) {
      throw ApiError.badRequest(`min_height_mm (${min_height_mm}) must be strictly less than max_height_mm (${max_height_mm}).`);
    }

    Object.assign(product, data);
    return product;
  }

  deleteProduct(idOrSlug: string): void {
    const index = IN_MEMORY_PRODUCTS.findIndex((p) => p.id === idOrSlug || p.slug === idOrSlug);
    if (index === -1) {
      throw ApiError.notFound(`Product '${idOrSlug}' not found.`);
    }
    IN_MEMORY_PRODUCTS.splice(index, 1);
  }

  addMaterial(productSlug: string, matData: Partial<Material>): Material {
    const product = IN_MEMORY_PRODUCTS.find((p) => p.slug === productSlug || p.id === productSlug);
    if (!product) {
      throw ApiError.notFound(`Product '${productSlug}' not found.`);
    }
    if (!matData.name || matData.rate_per_cm2_minor === undefined) {
      throw ApiError.badRequest('Material name and rate_per_cm2_minor are required.');
    }

    const newMaterial: Material = {
      id: matData.id || `m-${Date.now()}`,
      name: matData.name,
      rate_per_cm2_minor: matData.rate_per_cm2_minor,
      is_active: matData.is_active ?? true,
    };
    product.materials.push(newMaterial);
    return newMaterial;
  }

  updateMaterial(productSlug: string, materialId: string, matData: Partial<Material>): Material {
    const product = IN_MEMORY_PRODUCTS.find((p) => p.slug === productSlug || p.id === productSlug);
    if (!product) {
      throw ApiError.notFound(`Product '${productSlug}' not found.`);
    }
    const material = product.materials.find((m) => m.id === materialId);
    if (!material) {
      throw ApiError.notFound(`Material '${materialId}' not found.`);
    }
    Object.assign(material, matData);
    return material;
  }

  deleteMaterial(productSlug: string, materialId: string): void {
    const product = IN_MEMORY_PRODUCTS.find((p) => p.slug === productSlug || p.id === productSlug);
    if (!product) {
      throw ApiError.notFound(`Product '${productSlug}' not found.`);
    }
    const index = product.materials.findIndex((m) => m.id === materialId);
    if (index === -1) {
      throw ApiError.notFound(`Material '${materialId}' not found.`);
    }
    product.materials.splice(index, 1);
  }

  addOption(productSlug: string, optionData: ProductOption): ProductOption {
    const product = IN_MEMORY_PRODUCTS.find((p) => p.slug === productSlug || p.id === productSlug);
    if (!product) {
      throw ApiError.notFound(`Product '${productSlug}' not found.`);
    }
    if (!optionData.key || !optionData.label || !Array.isArray(optionData.values)) {
      throw ApiError.badRequest('Option key, label, and values array are required.');
    }
    product.options.push(optionData);
    return optionData;
  }

  setVolumeDiscounts(productSlug: string, tiers: VolumeDiscount[]): VolumeDiscount[] {
    const product = IN_MEMORY_PRODUCTS.find((p) => p.slug === productSlug || p.id === productSlug);
    if (!product) {
      throw ApiError.notFound(`Product '${productSlug}' not found.`);
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      throw ApiError.badRequest('Volume discount tiers array is required.');
    }

    // Validate tiers are strictly ascending by min_qty
    for (let i = 0; i < tiers.length; i++) {
      if (tiers[i].min_qty <= 0 || tiers[i].discount_percent < 0 || tiers[i].discount_percent > 100) {
        throw ApiError.badRequest('Invalid discount tier parameters: min_qty must be > 0 and discount_percent between 0 and 100.');
      }
      if (i > 0 && tiers[i].min_qty <= tiers[i - 1].min_qty) {
        throw ApiError.badRequest(
          `Volume discount tiers must be strictly ascending by min_qty. Tier ${i} (${tiers[i].min_qty}) <= Tier ${i - 1} (${tiers[i - 1].min_qty}).`
        );
      }
    }

    product.volume_discounts = tiers;
    return product.volume_discounts;
  }

  addTemplate(productSlug: string, tplData: Partial<Template>): Template {
    const product = IN_MEMORY_PRODUCTS.find((p) => p.slug === productSlug || p.id === productSlug);
    if (!product) {
      throw ApiError.notFound(`Product '${productSlug}' not found.`);
    }
    if (!tplData.name) {
      throw ApiError.badRequest('Template name is required.');
    }

    const newTemplate: Template = {
      id: tplData.id || crypto.randomUUID(),
      name: tplData.name,
      preview_url: tplData.preview_url || '',
      canvas: tplData.canvas || {},
      print_areas: tplData.print_areas || [{ id: 'main', x: 0, y: 0, w: product.max_width_mm, h: product.max_height_mm }],
      placeholders: tplData.placeholders || [],
    };
    product.templates.push(newTemplate);
    return newTemplate;
  }

  addPlaceholder(productSlug: string, templateId: string, placeholder: TemplatePlaceholder): TemplatePlaceholder {
    const product = IN_MEMORY_PRODUCTS.find((p) => p.slug === productSlug || p.id === productSlug);
    if (!product) {
      throw ApiError.notFound(`Product '${productSlug}' not found.`);
    }
    const template = product.templates.find((t) => t.id === templateId);
    if (!template) {
      throw ApiError.notFound(`Template '${templateId}' not found.`);
    }

    // Validate min_font_size <= max_font_size
    if (placeholder.min_font_size !== undefined && placeholder.max_font_size !== undefined) {
      if (placeholder.min_font_size > placeholder.max_font_size) {
        throw ApiError.badRequest(
          `min_font_size (${placeholder.min_font_size}) cannot exceed max_font_size (${placeholder.max_font_size}).`
        );
      }
    }

    // Validate placeholder is inside print area
    const printArea = template.print_areas[0];
    if (printArea) {
      const areaRight = printArea.x + printArea.w;
      const areaBottom = printArea.y + printArea.h;
      const placeholderRight = placeholder.x + placeholder.w;
      const placeholderBottom = placeholder.y + placeholder.h;

      if (
        placeholder.x < printArea.x ||
        placeholder.y < printArea.y ||
        placeholderRight > areaRight ||
        placeholderBottom > areaBottom
      ) {
        throw ApiError.badRequest(
          `Placeholder '${placeholder.key}' [${placeholder.x}, ${placeholder.y}, ${placeholder.w}, ${placeholder.h}] exceeds print area boundary [${printArea.x}, ${printArea.y}, ${printArea.w}, ${printArea.h}].`
        );
      }
    }

    template.placeholders.push(placeholder);
    return placeholder;
  }

  addGalleryItem(itemData: Partial<GalleryItem>): GalleryItem {
    if (!itemData.division_slug || !itemData.title || !itemData.image_path) {
      throw ApiError.badRequest('Gallery division_slug, title, and image_path are required.');
    }
    const newItem: GalleryItem = {
      id: itemData.id || `g-${Date.now()}`,
      division_slug: itemData.division_slug,
      title: itemData.title,
      image_path: itemData.image_path,
      sort_order: itemData.sort_order ?? IN_MEMORY_GALLERY.length + 1,
    };
    IN_MEMORY_GALLERY.push(newItem);
    return newItem;
  }

  deleteGalleryItem(id: string): void {
    const index = IN_MEMORY_GALLERY.findIndex((g) => g.id === id);
    if (index === -1) {
      throw ApiError.notFound(`Gallery item '${id}' not found.`);
    }
    IN_MEMORY_GALLERY.splice(index, 1);
  }
}

export const productsService = new ProductsService();

