interface Window {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  options: { limit: number; windowSeconds: number } = { limit: 60, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const key = identifier;
  const existing = stores.get(key);

  if (!existing || now > existing.resetAt) {
    stores.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      resetAt: now + windowMs,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, options.limit - existing.count);
  return {
    allowed: existing.count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt: existing.resetAt,
  };
}

export function clearRateLimit(identifier: string): void {
  stores.delete(identifier);
}
