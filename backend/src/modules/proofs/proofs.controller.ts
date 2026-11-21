import { Request, Response, NextFunction } from 'express';
import { proofsService } from './proofs.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class ProofsController {
  async getMyProofs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const isAdmin = req.user.role === 'admin';
      const proofs = await proofsService.getMyProofs(req.user.id, isAdmin);
      sendSuccess(res, proofs);
    } catch (error) {
      next(error);
    }
  }

  async createProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const { order_item_id, order_id = 'order-default', canvas_snapshot } = req.body;
      if (!order_item_id) {
        sendError(res, 400, 'order_item_id is required', 'BAD_REQUEST');
        return;
      }
      const proof = await proofsService.createProof(order_item_id, order_id, req.user.id, canvas_snapshot);
      sendSuccess(res, proof, 201);
    } catch (error) {
      next(error);
    }
  }

  async getProofsByOrderItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const { orderItemId } = req.params;
      const orderItemIdStr = Array.isArray(orderItemId) ? orderItemId[0] : orderItemId;
      const isAdmin = req.user.role === 'admin';
      const proofs = await proofsService.getProofsByOrderItem(orderItemIdStr, req.user.id, isAdmin);
      sendSuccess(res, proofs);
    } catch (error) {
      next(error);
    }
  }

  async approveProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const idParam = req.params.id;
      const proofId = Array.isArray(idParam) ? idParam[0] : idParam;
      const isAdmin = req.user.role === 'admin';
      const approved = await proofsService.approveProof(proofId, req.user.id, isAdmin);
      sendSuccess(res, {
        proof: approved,
        files_unlocked: true,
        order_status: 'production',
        message: 'Proof approved successfully. Production files unlocked.',
      });
    } catch (error) {
      next(error);
    }
  }

  async requestChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const idParam = req.params.id;
      const proofId = Array.isArray(idParam) ? idParam[0] : idParam;
      const message = req.body.message || req.body.feedback_notes || 'Revision requested';
      const isAdmin = req.user.role === 'admin';
      const proof = await proofsService.requestChanges(proofId, req.user.id, message, isAdmin);
      sendSuccess(res, {
        proof,
        order_status: 'artwork',
        message: 'Change request logged. Order status moved back to artwork.',
      });
    } catch (error) {
      next(error);
    }
  }

  async getProofEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const proofId = Array.isArray(idParam) ? idParam[0] : idParam;
      const events = proofsService.getEventsByProofId(proofId);
      sendSuccess(res, events);
    } catch (error) {
      next(error);
    }
  }
}

export const proofsController = new ProofsController();
