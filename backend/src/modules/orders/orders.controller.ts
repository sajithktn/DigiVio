import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class OrdersController {
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const order = await ordersService.createOrder(req.user.id, req.body);
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const isAdmin = req.user.role === 'admin';
      const orders = await ordersService.getOrders(req.user.id, isAdmin);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const idParam = req.params.id;
      const orderId = Array.isArray(idParam) ? idParam[0] : idParam;
      const isAdmin = req.user.role === 'admin';
      const order = await ordersService.getOrderById(orderId, req.user.id, isAdmin);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const idParam = req.params.id;
      const orderId = Array.isArray(idParam) ? idParam[0] : idParam;
      const { status, note } = req.body;
      const updated = await ordersService.updateStatus(orderId, status, req.user.id, note);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const idParam = req.params.id;
      const orderId = Array.isArray(idParam) ? idParam[0] : idParam;
      const newOrder = await ordersService.reorder(orderId, req.user.id);
      sendSuccess(res, newOrder, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const ordersController = new OrdersController();
