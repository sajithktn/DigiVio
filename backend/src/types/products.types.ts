export type ProductDivision =
  | 'labels_stickers'
  | 'race_event_numbers'
  | 'mtb_boards'
  | 'stamps'
  | 'trophies'
  | 'laser_cut';

export interface ProductOption {
  id: string;
  label: string;
  multiplier?: number;
  addon_price?: number;
  description?: string;
  hex_color?: string;
}

export interface ProductParameter {
  id: string;
  product_id: string;
  parameter_type: 'dimension' | 'material' | 'finish' | 'shape' | 'feature';
  name: string;
  label: string;
  options: ProductOption[];
  is_required: boolean;
}

export interface PricingRule {
  id: string;
  product_id: string;
  base_setup_fee: number;
  cost_per_sq_cm: number;
  min_width_mm: number;
  max_width_mm: number;
  min_height_mm: number;
  max_height_mm: number;
  min_quantity: number;
  min_total_price: number;
  material_multipliers: Record<string, number>;
  finish_addons: Record<string, number>;
}

export interface VolumeDiscount {
  id: string;
  product_id?: string | null;
  min_quantity: number;
  discount_percentage: number;
}

export interface ProductSummary {
  id: string;
  division: ProductDivision;
  name: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  base_price: number;
  is_active: boolean;
  pricing_rule?: PricingRule;
}

export interface ProductDetail extends ProductSummary {
  parameters: ProductParameter[];
  volume_discounts: VolumeDiscount[];
}
