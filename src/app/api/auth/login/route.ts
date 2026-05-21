import { NextResponse } from "next/server";
import { z } from "zod";
import { attachAuthCookies } from "@/lib/auth/cookies";
import { getAuthFromCookies } from "@/lib/auth/require-auth";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearFailedLogins,
  createSession,
  findUserByEmail,
  isAccountLocked,
  recordFailedLogin,
} from "@/lib/auth/session";
import { signAccessToken } from "@/lib/auth/tokens";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { loginRateLimit } from "@/lib/security/rate-limit-config";
import { corsHeaders, isAllowedOrigin } from "@/lib/security/cors";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(256),
});

function clientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const existing = await getAuthFromCookies();
  if (existing) {
    return NextResponse.json({ ok: true, alreadyAuthenticated: true });
  }

  const ip = clientIp(req) ?? "unknown";
  const loginLimit = await checkRateLimit(
    `login:${ip}`,
    loginRateLimit.limit,
    loginRateLimit.windowSec,
  );
  if (!loginLimit.allowed) {
    return rateLimitResponse(loginLimit.retryAfterSec);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (await isAccountLocked(user)) {
      return NextResponse.json(
        { error: "Account temporarily locked. Try again later." },
        { status: 423 },
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      await recordFailedLogin(user.id);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await clearFailedLogins(user.id);

    const ua = req.headers.get("user-agent");
    const { sessionId, refreshToken } = await createSession(user.id, ip, ua);
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      sid: sessionId,
      role: user.role,
    });

    const res = NextResponse.json({ ok: true, email: user.email, role: user.role });
    res.headers.set("Cache-Control", "no-store");
    attachAuthCookies(res, accessToken, refreshToken);
    const headers = corsHeaders(origin);
    for (const [k, v] of Object.entries(headers)) {
      res.headers.set(k, v);
    }
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
