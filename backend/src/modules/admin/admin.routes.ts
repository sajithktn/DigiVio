import { Router } from 'express';
import { requireUser } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/rbac.middleware.js';
import { adminController } from './admin.controller.js';
import { adminCatalogueController } from './catalogue.controller.js';
import { ordersController } from '../orders/orders.controller.js';

const router = Router();

// Signed download endpoint: validates signed token + expiration
router.get('/orders/:id/download', (req, res, next) => adminController.downloadFile(req, res, next));

// All standard /api/admin/* endpoints strictly require authenticated admin
router.use(requireUser, requireAdmin);

// Orders & Pipeline
router.get('/orders', (req, res, next) => adminController.getOrders(req, res, next));
router.get('/orders/:id', (req, res, next) => adminController.getOrderById(req, res, next));
router.get('/orders/:id/files', (req, res, next) => adminController.getOrderFiles(req, res, next));
router.patch('/orders/:id/status', (req, res, next) => ordersController.updateOrderStatus(req, res, next));

// Users Management
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:id', (req, res, next) => adminController.updateUser(req, res, next));

// Feature 16: Catalogue & Template Management
router.post('/divisions', (req, res, next) => adminCatalogueController.createDivision(req, res, next));
router.patch('/divisions/:id', (req, res, next) => adminCatalogueController.updateDivision(req, res, next));
router.delete('/divisions/:id', (req, res, next) => adminCatalogueController.deleteDivision(req, res, next));

router.get('/products', (req, res, next) => adminCatalogueController.getProducts(req, res, next));
router.post('/products', (req, res, next) => adminCatalogueController.createProduct(req, res, next));
router.patch('/products/:id', (req, res, next) => adminCatalogueController.updateProduct(req, res, next));
router.delete('/products/:id', (req, res, next) => adminCatalogueController.deleteProduct(req, res, next));

router.post('/materials', (req, res, next) => adminCatalogueController.addMaterial(req, res, next));
router.patch('/materials/:id', (req, res, next) => adminCatalogueController.updateMaterial(req, res, next));
router.delete('/materials/:id', (req, res, next) => adminCatalogueController.deleteMaterial(req, res, next));

router.post('/options', (req, res, next) => adminCatalogueController.addOption(req, res, next));

router.post('/volume-discounts', (req, res, next) => adminCatalogueController.setVolumeDiscounts(req, res, next));

router.post('/templates', (req, res, next) => adminCatalogueController.addTemplate(req, res, next));

router.post('/placeholders', (req, res, next) => adminCatalogueController.addPlaceholder(req, res, next));

router.post('/gallery', (req, res, next) => adminCatalogueController.addGalleryItem(req, res, next));
router.delete('/gallery/:id', (req, res, next) => adminCatalogueController.deleteGalleryItem(req, res, next));

// Feature 17: Reports & Analytics + Archive
router.get('/reports', (req, res, next) => adminController.getReports(req, res, next));
router.get('/archive', (req, res, next) => adminController.getArchive(req, res, next));

// Feature 18: Accounting Export (Xero-ready)
router.get('/export/xero', (req, res, next) => adminController.exportXero(req, res, next));

export const adminRoutes = router;
