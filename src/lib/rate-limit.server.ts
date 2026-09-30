type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const userRateLimits = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

/**
 * Checks in-memory rate limit per logged-in userId (not IP).
 * On serverless platforms like Vercel, in-memory state is maintained
 * per warm function instance (isolate). For strict cross-region shared limits,
 * an external Redis (e.g. Upstash) or database-backed rate limit would be used.
 */
export function checkUserRateLimit(
  userId: string,
  options: RateLimitOptions = {},
): { success: boolean; remaining: number; resetAt: number } {
  const maxRequests = options.maxRequests ?? 30;
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();

  const record = userRateLimits.get(userId);

  if (!record || now >= record.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { success: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Throws an error if the user exceeded their rate limit.
 */
export function assertUserRateLimit(userId: string, options: RateLimitOptions = {}): void {
  const result = checkUserRateLimit(userId, options);
  if (!result.success) {
    const waitSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
    throw new Error(
      `Rate limit exceeded for user. Please wait ${Math.max(1, waitSeconds)} second(s) before trying again.`,
    );
  }
}

export function resetRateLimits(): void {
  userRateLimits.clear();
}
