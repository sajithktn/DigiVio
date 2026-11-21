import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class ProductsController {
  async getDivisions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const divisions = await productsService.getDivisions();
      sendSuccess(res, divisions);
    } catch (error) {
      next(error);
    }
  }

  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const division = req.query.division as string | undefined;
      const products = await productsService.getProducts(division);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slugParam = req.params.slug;
      const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
      if (!slug) {
        sendError(res, 400, 'Product slug is required', 'BAD_REQUEST');
        return;
      }
      const product = await productsService.getProductBySlug(slug);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async getGallery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const division = req.query.division as string | undefined;
      const gallery = await productsService.getGallery(division);
      sendSuccess(res, gallery);
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
