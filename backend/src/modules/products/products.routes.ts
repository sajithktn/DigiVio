import { Router } from 'express';
import { productsController } from './products.controller.js';

const router = Router();

// Public Product Catalog Endpoints
router.get('/', (req, res, next) => productsController.getProducts(req, res, next));
router.get('/:slug', (req, res, next) => productsController.getProductBySlug(req, res, next));

export const productRoutes = router;
