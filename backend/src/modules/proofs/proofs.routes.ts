import { Router } from 'express';
import { proofsController } from './proofs.controller.js';
import { requireUser } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireUser);

router.get('/', (req, res, next) => proofsController.getMyProofs(req, res, next));
router.post('/', (req, res, next) => proofsController.createProof(req, res, next));
router.get('/item/:orderItemId', (req, res, next) => proofsController.getProofsByOrderItem(req, res, next));
router.post('/:id/approve', (req, res, next) => proofsController.approveProof(req, res, next));
router.post('/:id/changes', (req, res, next) => proofsController.requestChanges(req, res, next));
router.post('/:id/request-change', (req, res, next) => proofsController.requestChanges(req, res, next));
router.get('/:id/events', (req, res, next) => proofsController.getProofEvents(req, res, next));

export const proofRoutes = router;
