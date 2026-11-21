import { Request, Response, NextFunction } from 'express';
import { productsService } from '../products/products.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AdminCatalogueController {
  // Divisions CRUD
  async createDivision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const division = productsService.createDivision(req.body);
      sendSuccess(res, division, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateDivision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const division = productsService.updateDivision(id, req.body);
      sendSuccess(res, division);
    } catch (error) {
      next(error);
    }
  }

  async deleteDivision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      productsService.deleteDivision(id);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // Products CRUD
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const division = req.query.division as string | undefined;
      const products = await productsService.getProducts(division);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = productsService.createProduct(req.body);
      sendSuccess(res, product, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const product = productsService.updateProduct(id, req.body);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      productsService.deleteProduct(id);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // Materials CRUD
  async addMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productSlug = req.body.product_slug;
      const material = productsService.addMaterial(productSlug, req.body);
      sendSuccess(res, material, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const productSlug = req.body.product_slug || (req.query.product_slug as string);
      const material = productsService.updateMaterial(productSlug, id, req.body);
      sendSuccess(res, material);
    } catch (error) {
      next(error);
    }
  }

  async deleteMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const productSlug = (req.query.product_slug as string) || req.body.product_slug;
      productsService.deleteMaterial(productSlug, id);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  // Options CRUD
  async addOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productSlug = req.body.product_slug;
      const option = productsService.addOption(productSlug, req.body.option || req.body);
      sendSuccess(res, option, 201);
    } catch (error) {
      next(error);
    }
  }

  // Volume Discounts
  async setVolumeDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productSlug = req.body.product_slug;
      const tiers = productsService.setVolumeDiscounts(productSlug, req.body.tiers);
      sendSuccess(res, tiers);
    } catch (error) {
      next(error);
    }
  }

  // Templates
  async addTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productSlug = req.body.product_slug;
      const template = productsService.addTemplate(productSlug, req.body);
      sendSuccess(res, template, 201);
    } catch (error) {
      next(error);
    }
  }

  // Placeholders
  async addPlaceholder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { product_slug, template_id, placeholder } = req.body;
      const created = productsService.addPlaceholder(product_slug, template_id, placeholder);
      sendSuccess(res, created, 201);
    } catch (error) {
      next(error);
    }
  }

  // Gallery
  async addGalleryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = productsService.addGalleryItem(req.body);
      sendSuccess(res, item, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteGalleryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      productsService.deleteGalleryItem(id);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}

export const adminCatalogueController = new AdminCatalogueController();
