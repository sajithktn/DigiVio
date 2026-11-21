import { Router } from 'express';
import { checkoutController } from './checkout.controller.js';
import { requireUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Customer creates checkout session
router.post('/', requireUser, (req, res, next) => checkoutController.createSession(req, res, next));
// Customer/system confirms payment settlement
router.post('/confirm', requireUser, (req, res, next) => checkoutController.confirmPayment(req, res, next));

export const checkoutRoutes = router;
