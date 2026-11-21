/**
 * Pure Pricing Engine for Digital Heroes Web-to-Print Platform
 * All currency values are calculated in integer paise.
 * No DB calls or side-effects inside this pure function.
 */

export interface PricingEngineInput {
  width_mm: number;
  height_mm: number;
  qty: number;
  base_price_minor: number;
  setup_fee_minor: number;
  rate_per_cm2_minor: number;
  option_delta_minor?: number;
  option_multiplier?: number;
  volume_discounts?: Array<{ min_qty: number; discount_percent: number }>;
  tax_rate?: number; // default 0.18 (18% GST)
}

export interface PricingBreakdown {
  area_cm2: number;
  unit_base: number;
  option_adjust: number;
  unit_before_disc: number;
  discount_pct: number;
  unit_price: number;
  subtotal_incl: number;
  tax_included: number;
}

export interface PricingEngineOutput {
  unit_price: number;       // In integer paise
  qty: number;
  discount_percent: number;
  savings: number;          // In integer paise
  subtotal: number;         // In integer paise
  tax_included: number;     // In integer paise
  total: number;            // In integer paise
  currency: string;
  breakdown: PricingBreakdown;
}

export const calculatePrice = (input: PricingEngineInput): PricingEngineOutput => {
  const {
    width_mm,
    height_mm,
    qty,
    base_price_minor,
    setup_fee_minor,
    rate_per_cm2_minor,
    option_delta_minor = 0,
    option_multiplier = 1.0,
    volume_discounts = [],
    tax_rate = 0.18,
  } = input;

  // 1. Surface area in cm² = (width_mm / 10) * (height_mm / 10)
  const area_cm2 = (width_mm / 10.0) * (height_mm / 10.0);

  // 2. Base unit price before options
  const unit_base = base_price_minor + area_cm2 * rate_per_cm2_minor;

  // 3. Option adjustments (delta + multiplier)
  const option_adjust = option_delta_minor;
  const unit_before_disc = (unit_base + option_adjust) * option_multiplier;

  // 4. Highest qualifying volume discount percentage
  let discount_pct = 0;
  if (volume_discounts && volume_discounts.length > 0) {
    const sortedTiers = [...volume_discounts].sort((a, b) => b.min_qty - a.min_qty);
    const qualifying = sortedTiers.find((tier) => qty >= tier.min_qty);
    if (qualifying) {
      discount_pct = qualifying.discount_percent;
    }
  }

  // 5. Discounted unit price rounded to integer paise
  const unit_price = Math.round(unit_before_disc * (1.0 - discount_pct / 100.0));

  // 6. Subtotal inclusive of GST
  const subtotal_incl = unit_price * qty + setup_fee_minor;

  // Undiscounted subtotal for savings calculation
  const undiscounted_unit_price = Math.round(unit_before_disc);
  const undiscounted_subtotal = undiscounted_unit_price * qty + setup_fee_minor;
  const savings = Math.max(0, undiscounted_subtotal - subtotal_incl);

  // 7. Tax included (18% GST tax-inclusive formula)
  // tax_included = round(subtotal_incl * TAX_RATE / (1 + TAX_RATE))
  const tax_included = Math.round((subtotal_incl * tax_rate) / (1.0 + tax_rate));

  // 8. Total is equal to subtotal_incl (tax-inclusive pricing model)
  const total = subtotal_incl;

  return {
    unit_price,
    qty,
    discount_percent: discount_pct,
    savings,
    subtotal: subtotal_incl,
    tax_included,
    total,
    currency: 'INR',
    breakdown: {
      area_cm2: Number(area_cm2.toFixed(2)),
      unit_base: Math.round(unit_base),
      option_adjust: Math.round(option_adjust),
      unit_before_disc: Math.round(unit_before_disc),
      discount_pct,
      unit_price,
      subtotal_incl,
      tax_included,
    },
  };
};
