import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface LimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
}

interface RateLimiter {
  limit(identifier: string): Promise<LimitResult>;
}

function makeRateLimiter(requests: number, windowSeconds: number): RateLimiter {
  const isDev = process.env.NODE_ENV === 'development';
  // RATE_LIMIT_BYPASS=1 lets you disable rate limiting on Vercel without Upstash.
  // Set this env var in your Vercel project settings (does not affect CSP or build mode).
  const bypass = process.env.RATE_LIMIT_BYPASS === '1';
  const hasCredentials = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  const allowAll: LimitResult = { success: true,  limit: requests, remaining: requests, reset: 0,                                    pending: Promise.resolve() };
  const denyAll:  LimitResult = { success: false, limit: 0,        remaining: 0,        reset: Date.now() + windowSeconds * 1000, pending: Promise.resolve() };

  if (!hasCredentials) {
    if (isDev || bypass) {
      return { limit: async () => allowAll };
    }
    // Production without credentials and no bypass: fail closed.
    // Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, or set RATE_LIMIT_BYPASS=1.
    return { limit: async () => denyAll };
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds}s`),
    analytics: false,
  });

  return {
    limit: async (identifier: string): Promise<LimitResult> => {
      try {
        return await rl.limit(identifier) as LimitResult;
      } catch {
        // Upstash unreachable / wrong credentials: fail closed in prod, open in dev
        return isDev ? allowAll : denyAll;
      }
    },
  };
}

// 5 login attempts per 10 minutes per IP
export const loginRateLimit = makeRateLimiter(5, 600);

// 30 requests per minute for captcha and results
export const generalRateLimit = makeRateLimiter(30, 60);

export function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
