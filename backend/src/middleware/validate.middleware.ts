import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        const message = issues.map((i) => `${i.field || 'input'}: ${i.message}`).join('; ');
        res.status(400).json({
          ok: false,
          success: false, // backwards compatibility
          error: {
            code: 'VALIDATION_ERROR',
            message: message || 'Validation failed',
            details: issues,
          },
          details: issues,
        });
        return;
      }
      next(error);
    }
  };
};
