import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';

export { ApiError, ApiError as AppError };

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const code = err instanceof ApiError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal error occurred';

  // Never leak stack traces outside development
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('🔥 Server Error [500]:', err);
  }

  res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message,
    },
  });
};
