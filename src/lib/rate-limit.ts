/**
 * In-memory rate limiter for API routes.
 * Uses a sliding-window token-bucket approach.
 *
 * For production, swap the Map store with Redis (Upstash / ioredis).
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimiterOptions {
  /** Maximum requests in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.lastRefill > 600_000) {
        store.delete(key);
      }
    }
  }, 300_000);
}

export function rateLimit(options: RateLimiterOptions) {
  const { limit, windowSeconds } = options;

  return {
    /**
     * Check if the request is allowed.
     * @param identifier — typically IP address or user ID
     * @returns { success, remaining, resetInSeconds }
     */
    check(identifier: string): {
      success: boolean;
      remaining: number;
      resetInSeconds: number;
    } {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry) {
        store.set(identifier, { tokens: limit - 1, lastRefill: now });
        return { success: true, remaining: limit - 1, resetInSeconds: windowSeconds };
      }

      const elapsed = (now - entry.lastRefill) / 1000;

      // Refill tokens based on elapsed time
      if (elapsed >= windowSeconds) {
        entry.tokens = limit - 1;
        entry.lastRefill = now;
        store.set(identifier, entry);
        return { success: true, remaining: limit - 1, resetInSeconds: windowSeconds };
      }

      if (entry.tokens > 0) {
        entry.tokens -= 1;
        store.set(identifier, entry);
        return {
          success: true,
          remaining: entry.tokens,
          resetInSeconds: Math.ceil(windowSeconds - elapsed),
        };
      }

      return {
        success: false,
        remaining: 0,
        resetInSeconds: Math.ceil(windowSeconds - elapsed),
      };
    },
  };
}

// Pre-configured limiters for different endpoints
export const apiLimiter = rateLimit({ limit: 60, windowSeconds: 60 });
export const authLimiter = rateLimit({ limit: 10, windowSeconds: 60 });
export const uploadLimiter = rateLimit({ limit: 10, windowSeconds: 300 });
export const contactLimiter = rateLimit({ limit: 5, windowSeconds: 300 });

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and generic proxies.
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
