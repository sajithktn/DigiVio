import { Request, Response, NextFunction } from 'express';
import { pricingService } from './pricing.service.js';
import { sendSuccess } from '../../utils/response.js';

export class PricingController {
  async getQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const qty = body.qty || body.quantity || 1;
      const quote = await pricingService.computeQuote({
        product_slug: body.product_slug,
        width_mm: body.width_mm,
        height_mm: body.height_mm,
        qty,
        material_id: body.material_id,
        options: body.options || {},
      });
      sendSuccess(res, quote);
    } catch (error) {
      next(error);
    }
  }
}

export const pricingController = new PricingController();
