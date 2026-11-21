import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { ordersService } from '../orders/orders.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const allOrders = await ordersService.getOrders(req.user.id, false);
      const activeOrders = allOrders.filter((o) => !['completed', 'cancelled'].includes(o.status));

      sendSuccess(res, {
        ...req.user,
        order_counts: {
          total: allOrders.length,
          active: activeOrders.length,
          completed: allOrders.length - activeOrders.length,
        },
      }, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const updated = await authService.updateProfile(req.user.id, req.body);
      sendSuccess(res, updated, 200);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resendVerification(req.body.email);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.body.token;

      if (!token) {
        sendError(res, 400, 'Reset token required in Authorization header or request body.', 'BAD_REQUEST');
        return;
      }

      const result = await authService.resetPassword(token, req.body.password, req.body.confirm_password);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async googleAuthUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const redirectTo = req.query.redirectTo as string | undefined;
      const result = await authService.getGoogleOAuthUrl(redirectTo);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
      const result = await authService.logout(token);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
