import { Router } from 'express';
import { designsController } from './designs.controller.js';
import { requireUser } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireUser);

router.post('/', (req, res, next) => designsController.saveDesign(req, res, next));
router.get('/', (req, res, next) => designsController.getMyDesigns(req, res, next));
router.get('/:id', (req, res, next) => designsController.getDesignById(req, res, next));
router.patch('/:id', (req, res, next) => designsController.updateDesign(req, res, next));
router.delete('/:id', (req, res, next) => designsController.deleteDesign(req, res, next));

export const designRoutes = router;
