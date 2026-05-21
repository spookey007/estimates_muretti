import { NextResponse } from "next/server";
import { requireAuthWithCsrf, requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { apiRateLimit } from "@/lib/security/rate-limit-config";
import { corsHeaders, isAllowedOrigin } from "@/lib/security/cors";

type Handler = (
  req: Request,
  ctx: { auth: { sub: string; email: string; sid: string; role: string } },
) => Promise<Response>;

function clientKey(req: Request, userId?: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return userId ? `api:${userId}` : `api:${ip}`;
}

export function withSecureApi(
  handler: Handler,
  options?: { requireCsrf?: boolean; rateLimit?: number; windowSec?: number },
) {
  const requireCsrf = options?.requireCsrf ?? true;
  const rateLimit = options?.rateLimit ?? apiRateLimit.limit;
  const windowSec = options?.windowSec ?? apiRateLimit.windowSec;

  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin");
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    const authResult = requireCsrf
      ? await requireAuthWithCsrf(req)
      : await requireAuth();
    if (!authResult.ok) return authResult.response;

    const limit = await checkRateLimit(
      clientKey(req, authResult.auth.sub),
      rateLimit,
      windowSec,
    );
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSec);
    }

    try {
      const response = await handler(req, { auth: authResult.auth });
      const headers = corsHeaders(origin);
      for (const [k, v] of Object.entries(headers)) {
        response.headers.set(k, v);
      }
      return response;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
