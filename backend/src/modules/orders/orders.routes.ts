import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { requireUser } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireUser);

router.post('/', (req, res, next) => ordersController.createOrder(req, res, next));
router.get('/', (req, res, next) => ordersController.getOrders(req, res, next));
router.get('/:id', (req, res, next) => ordersController.getOrderById(req, res, next));
router.post('/:id/reorder', (req, res, next) => ordersController.reorder(req, res, next));

export const orderRoutes = router;
