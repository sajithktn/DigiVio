import { Request, Response, NextFunction } from 'express';
import { designsService } from './designs.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class DesignsController {
  async saveDesign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const design = await designsService.saveDesign(req.user.id, req.body);
      sendSuccess(res, design, 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyDesigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const designs = await designsService.getMyDesigns(req.user.id);
      sendSuccess(res, designs);
    } catch (error) {
      next(error);
    }
  }

  async getDesignById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const idParam = req.params.id;
      const designId = Array.isArray(idParam) ? idParam[0] : idParam;
      const isAdmin = req.user.role === 'admin';
      const design = await designsService.getDesignById(req.user.id, designId, isAdmin);
      sendSuccess(res, design);
    } catch (error) {
      next(error);
    }
  }

  async updateDesign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const idParam = req.params.id;
      const designId = Array.isArray(idParam) ? idParam[0] : idParam;
      const isAdmin = req.user.role === 'admin';
      const updated = await designsService.updateDesign(req.user.id, designId, req.body, isAdmin);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteDesign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'Authentication required', 'UNAUTHORIZED');
        return;
      }
      const idParam = req.params.id;
      const designId = Array.isArray(idParam) ? idParam[0] : idParam;
      const isAdmin = req.user.role === 'admin';
      await designsService.deleteDesign(req.user.id, designId, isAdmin);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}

export const designsController = new DesignsController();
