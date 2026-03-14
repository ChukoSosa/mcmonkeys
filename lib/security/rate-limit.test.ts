import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("rate-limit", () => {
  it("allows requests under the threshold", () => {
    const key = `allow-${Date.now()}-${Math.random()}`;

    const first = checkRateLimit(key, { windowMs: 60_000, maxRequests: 2 });
    const second = checkRateLimit(key, { windowMs: 60_000, maxRequests: 2 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });

  it("blocks requests over the threshold", () => {
    const key = `block-${Date.now()}-${Math.random()}`;

    checkRateLimit(key, { windowMs: 60_000, maxRequests: 1 });
    const blocked = checkRateLimit(key, { windowMs: 60_000, maxRequests: 1 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});