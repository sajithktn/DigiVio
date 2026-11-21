import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

const allLimiters: Array<Map<string, { count: number; resetTime: number }>> = [];

export const resetRateLimits = (): void => {
  for (const limiter of allLimiters) {
    limiter.clear();
  }
};

export const createRateLimiter = (options: RateLimitOptions) => {
  const hits = new Map<string, { count: number; resetTime: number }>();
  allLimiters.push(hits);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const record = hits.get(ip);
    if (!record || now > record.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + options.windowMs });
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', options.max - 1);
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, options.max - record.count);
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.count > options.max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      sendError(
        res,
        429,
        options.message || 'Rate limit exceeded. Too many requests. Please slow down and try again later.',
        'TOO_MANY_REQUESTS'
      );
      return;
    }

    next();
  };
};

// 50 requests per 10 seconds for calculator / quote endpoints
export const quoteRateLimiter = createRateLimiter({
  windowMs: 10 * 1000,
  max: 50,
  message: 'Quote rate limit exceeded. Too many requests in rapid burst.',
});

// 20 requests per 10 seconds for auth endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 10 * 1000,
  max: 20,
  message: 'Auth rate limit exceeded. Too many login/signup attempts.',
});
