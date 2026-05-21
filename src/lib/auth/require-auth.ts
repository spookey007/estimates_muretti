import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  REFRESH_COOKIE,
} from "@/lib/auth/config";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/auth/tokens";
import { validateSession } from "@/lib/auth/session";

export type AuthContext = AccessTokenPayload;

export async function getAuthFromCookies(): Promise<AuthContext | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (!access) return null;

  const payload = await verifyAccessToken(access);
  if (!payload) return null;

  const valid = await validateSession(payload.sid, payload.sub);
  if (!valid) return null;

  return payload;
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requireAuth(): Promise<
  { ok: true; auth: AuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await getAuthFromCookies();
  if (!auth) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, auth };
}

export async function requireAuthWithCsrf(
  req: Request,
): Promise<
  { ok: true; auth: AuthContext } | { ok: false; response: NextResponse }
> {
  const base = await requireAuth();
  if (!base.ok) return base;

  if (!verifyCsrf(req)) {
    return { ok: false, response: forbidden("Invalid CSRF token") };
  }
  return base;
}

export function verifyCsrf(req: Request): boolean {
  const header = req.headers.get(CSRF_HEADER);
  if (!header || header.length < 16) return false;

  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${CSRF_COOKIE}=`));
  if (!match) return false;

  const cookieValue = decodeURIComponent(match.slice(CSRF_COOKIE.length + 1));
  if (cookieValue.length !== header.length) return false;

  let diff = 0;
  for (let i = 0; i < cookieValue.length; i++) {
    diff |= cookieValue.charCodeAt(i) ^ header.charCodeAt(i);
  }
  return diff === 0;
}
