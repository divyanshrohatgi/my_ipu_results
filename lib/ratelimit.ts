import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type RateLimiter = Pick<Ratelimit, 'limit'>;

function makeRateLimiter(requests: number, windowSeconds: number): RateLimiter {
  const isDev = process.env.NODE_ENV === 'development';
  const hasCredentials = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  if (isDev && !hasCredentials) {
    // In development without Upstash: allow all requests
    return {
      limit: async () => ({ success: true, limit: requests, remaining: requests, reset: 0, pending: Promise.resolve() }),
    };
  }

  if (!hasCredentials) {
    // In production without credentials: fail closed — reject everything
    return {
      limit: async () => ({ success: false, limit: 0, remaining: 0, reset: Date.now() + windowSeconds * 1000, pending: Promise.resolve() }),
    };
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds}s`),
    analytics: false,
  });
}

// 5 login attempts per 10 minutes per IP
export const loginRateLimit = makeRateLimiter(5, 600);

// 30 requests per minute for captcha and results
export const generalRateLimit = makeRateLimiter(30, 60);

export function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
