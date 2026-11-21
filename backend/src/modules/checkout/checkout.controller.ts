import { Request, Response, NextFunction } from 'express';
import { checkoutService } from './checkout.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class CheckoutController {
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const { order_id, success_url, cancel_url } = req.body;
      if (!order_id) {
        sendError(res, 400, 'order_id is required', 'BAD_REQUEST');
        return;
      }
      const session = await checkoutService.createSession(order_id, req.user.id, success_url, cancel_url);
      sendSuccess(res, session, 201);
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const { order_id } = req.body;
      if (!order_id) {
        sendError(res, 400, 'order_id is required', 'BAD_REQUEST');
        return;
      }
      const result = await checkoutService.confirmPayment(order_id, req.user.id);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string | undefined;
      const result = await checkoutService.handleWebhook(req.body, signature);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const checkoutController = new CheckoutController();
