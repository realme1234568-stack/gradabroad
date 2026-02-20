import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextResponse } from 'next/server';

// Configure the rate limiter: 100 requests per 15 minutes per IP
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 900, // Per 900 seconds (15 minutes)
});

export async function rateLimit(request: Request): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '';
  try {
    await rateLimiter.consume(ip);
    return null;
  } catch (err) {
    // Log rate limit hit
    console.warn(`[RateLimit] Too many requests from IP: ${ip}`);
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
}
