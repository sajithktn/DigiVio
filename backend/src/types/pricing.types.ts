export interface PricingCalculationRequest {
  product_slug: string;
  width_mm: number;
  height_mm: number;
  quantity: number;
  material_id: string;
  finish_id?: string;
  shape_id?: string;
  custom_addons?: string[];
}

export interface PricingCalculationResult {
  product_slug: string;
  product_name: string;
  quantity: number;
  dimensions: {
    width_mm: number;
    height_mm: number;
    area_sq_cm: number;
  };
  breakdown: {
    base_setup_fee: number;
    area_cost: number;
    material_multiplier: number;
    finish_addon: number;
    raw_unit_price: number;
    discount_tier_percentage: number;
    discounted_unit_price: number;
    subtotal: number;
    discount_savings: number;
    tax_rate_percentage: number;
    tax_amount: number;
    final_total: number;
  };
  volume_tier_applied?: {
    min_quantity: number;
    discount_percentage: number;
  };
  currency: string;
}
