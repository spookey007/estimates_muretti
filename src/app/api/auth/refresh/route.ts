import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { attachAuthCookies } from "@/lib/auth/cookies";
import { REFRESH_COOKIE } from "@/lib/auth/config";
import {
  rotateRefreshToken,
  validateRefreshToken,
} from "@/lib/auth/session";
import { signAccessToken } from "@/lib/auth/tokens";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { refreshRateLimit } from "@/lib/security/rate-limit-config";

export const runtime = "nodejs";

function clientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req) ?? "unknown";
  const limit = await checkRateLimit(
    `refresh:${ip}`,
    refreshRateLimit.limit,
    refreshRateLimit.windowSec,
  );
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfterSec);
  }

  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await validateRefreshToken(refresh);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ua = req.headers.get("user-agent");
  const rotated = await rotateRefreshToken(
    session.sessionId,
    session.userId,
    ip,
    ua,
  );
  if (!rotated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await signAccessToken({
    sub: session.userId,
    email: session.email,
    sid: rotated.newSessionId,
    role: session.role,
  });

  const res = NextResponse.json({ ok: true });
  return attachAuthCookies(res, accessToken, rotated.refreshToken);
}
