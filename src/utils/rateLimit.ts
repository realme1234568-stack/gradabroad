import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

// Configure the rate limiter: 100 requests per 15 minutes per IP
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 900, // Per 900 seconds (15 minutes)
});

export function withRateLimit(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const ip =
        req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '';
      await rateLimiter.consume(ip);
      return handler(req, res);
    } catch (err) {
      // Log rate limit hit
      const ip =
        req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '';
      console.warn(`[RateLimit] Too many requests from IP: ${ip}`);
      res.status(429).json({
        message: 'Too many requests. Please try again later.',
      });
    }
  };
}
