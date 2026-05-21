import { query } from "@/lib/db/client";
import { isRateLimitDisabled } from "@/lib/security/rate-limit-config";

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSec: number };

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  if (isRateLimitDisabled()) {
    return { allowed: true, remaining: limit };
  }

  const windowStart = new Date(
    Math.floor(Date.now() / (windowSec * 1000)) * windowSec * 1000,
  );

  const { rows } = await query<{ request_count: number }>(
    `INSERT INTO rate_limit_buckets (bucket_key, window_start, request_count)
     VALUES ($1, $2, 1)
     ON CONFLICT (bucket_key, window_start)
     DO UPDATE SET request_count = rate_limit_buckets.request_count + 1
     RETURNING request_count`,
    [key, windowStart.toISOString()],
  );

  const count = rows[0]?.request_count ?? 1;
  if (count > limit) {
    const elapsed = Date.now() - windowStart.getTime();
    const retryAfterSec = Math.max(1, Math.ceil((windowSec * 1000 - elapsed) / 1000));
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true, remaining: Math.max(0, limit - count) };
}

export function rateLimitResponse(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
