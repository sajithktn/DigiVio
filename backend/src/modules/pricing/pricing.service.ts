import { productsService } from '../products/products.service.js';
import { ApiError } from '../../utils/api-error.js';
import { calculatePrice, PricingEngineOutput } from './engine.js';
import { env } from '../../config/env.js';

export interface QuoteRequestDTO {
  product_slug: string;
  width_mm: number;
  height_mm: number;
  qty: number;
  material_id?: string;
  options?: Record<string, string>; // e.g., { finish: 'gloss_lam', cut_type: 'die_cut' }
}

export class PricingService {
  /**
   * Recalculates quote from product specifications and validates dimensions
   */
  async computeQuote(request: QuoteRequestDTO): Promise<PricingEngineOutput> {
    const { product_slug, width_mm, height_mm, qty, material_id, options = {} } = request;
    const effectiveQty = qty ?? (request as any).quantity;

    if (
      typeof effectiveQty !== 'number' ||
      isNaN(effectiveQty) ||
      !Number.isInteger(effectiveQty) ||
      effectiveQty <= 0
    ) {
      throw ApiError.badRequest(`Invalid quantity: must be an integer greater than zero.`);
    }

    if (effectiveQty > 1000000) {
      throw ApiError.badRequest(`Quantity ${effectiveQty} exceeds maximum allowed calculation limit.`);
    }

    // 1. Fetch product
    const product = await productsService.getProductBySlug(product_slug);

    // 2. Validate dimension bounds
    if (width_mm < product.min_width_mm || width_mm > product.max_width_mm) {
      throw ApiError.badRequest(
        `Width ${width_mm}mm is out of allowed range [${product.min_width_mm}mm - ${product.max_width_mm}mm] for ${product.name}.`
      );
    }

    if (height_mm < product.min_height_mm || height_mm > product.max_height_mm) {
      throw ApiError.badRequest(
        `Height ${height_mm}mm is out of allowed range [${product.min_height_mm}mm - ${product.max_height_mm}mm] for ${product.name}.`
      );
    }

    if (effectiveQty < product.min_qty || effectiveQty > product.max_qty) {
      throw ApiError.badRequest(
        `Quantity ${effectiveQty} is out of allowed range [${product.min_qty} - ${product.max_qty}] for ${product.name}.`
      );
    }

    // 3. Resolve Material
    let resolvedMaterial = product.materials[0];
    if (material_id) {
      const match = product.materials.find((m) => m.id === material_id || m.name === material_id);
      if (match) {
        resolvedMaterial = match;
      }
    }

    const rate_per_cm2_minor = resolvedMaterial ? resolvedMaterial.rate_per_cm2_minor : 1.5;

    // 4. Resolve Options (price delta & multiplier)
    let option_delta_minor = 0;
    let option_multiplier = 1.0;

    if (options && typeof options === 'object') {
      for (const [key, selectedVal] of Object.entries(options)) {
        const optionGroup = product.options.find((opt) => opt.key === key);
        if (optionGroup) {
          const valueObj = optionGroup.values.find((v) => v.value === selectedVal);
          if (valueObj) {
            option_delta_minor += valueObj.price_delta_minor;
            option_multiplier *= valueObj.multiplier;
          }
        }
      }
    }

    // 5. Execute Pure Pricing Calculation
    return calculatePrice({
      width_mm,
      height_mm,
      qty,
      base_price_minor: product.base_price_minor,
      setup_fee_minor: product.setup_fee_minor,
      rate_per_cm2_minor,
      option_delta_minor,
      option_multiplier,
      volume_discounts: product.volume_discounts,
      tax_rate: env.TAX_RATE || 0.18,
    });
  }
}

export const pricingService = new PricingService();
