/**
 * In-Memory Rate Limiter for Printing Hub.
 *
 * NOTE: This in-memory store tracks rate limits in process memory.
 * It is effective for single-instance Node.js deployments (such as the local dev server
 * or a single container). In multi-instance or serverless environments (e.g. Vercel),
 * memory is not shared between serverless functions.
 *
 * REPLACEMENT FOR PRODUCTION:
 * For multi-instance production environments, replace this implementation with Upstash Redis
 * (@upstash/ratelimit and @upstash/redis), which coordinates limits centrally in cloud Redis.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale keys periodically to avoid memory growth
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((record, key) => {
      if (now > record.resetAt) {
        memoryStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);

  if (timer.unref) {
    timer.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if the given key is currently rate-limited.
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 10 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    return {
      allowed: true,
      remaining: limit,
      resetAt: now + windowMs,
    };
  }

  const remaining = Math.max(0, limit - record.count);
  return {
    allowed: record.count < limit,
    remaining,
    resetAt: record.resetAt,
  };
}

/**
 * Check and immediately consume one request attempt for rate limiting.
 * Returns whether the request is allowed and remaining quota.
 */
export function consumeRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
    resetAt: record.resetAt,
  };
}

/**
 * Record a failed attempt for the given key.
 */
export function recordRateLimitFailure(
  key: string,
  windowMs: number = 10 * 60 * 1000
): void {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
  } else {
    record.count += 1;
  }
}

/**
 * Reset failed attempts for a key (called on successful authentication).
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}

/**
 * Extract client IP from incoming Next.js Request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
