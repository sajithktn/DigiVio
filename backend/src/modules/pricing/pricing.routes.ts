import { Router } from 'express';
import { pricingController } from './pricing.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { quoteRequestSchema } from './pricing.validator.js';
import { quoteRateLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

// Public Pricing Calculator (No Auth required per PRD Feature 5, rate-limited against burst abuse)
router.post('/quote', quoteRateLimiter, validateRequest(quoteRequestSchema), (req, res, next) =>
  pricingController.getQuote(req, res, next)
);

router.post('/calculate', quoteRateLimiter, validateRequest(quoteRequestSchema), (req, res, next) =>
  pricingController.getQuote(req, res, next)
);

export const pricingRoutes = router;
