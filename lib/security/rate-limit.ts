interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const globalScope = globalThis as unknown as {
  __mclucyRateLimitStore?: Map<string, RateLimitState>;
};

const store = globalScope.__mclucyRateLimitStore ?? new Map<string, RateLimitState>();

if (!globalScope.__mclucyRateLimitStore) {
  globalScope.__mclucyRateLimitStore = store;
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  current.count += 1;
  store.set(key, current);

  if (current.count <= options.maxRequests) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}