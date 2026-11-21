import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/auth.types.js';
import { sendError } from '../utils/response.js';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required prior to role verification.', 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`,
        'FORBIDDEN'
      );
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireCustomer = requireRole('customer', 'admin');
