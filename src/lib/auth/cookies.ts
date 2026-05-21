import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SEC,
  REFRESH_COOKIE,
  REFRESH_TTL_SEC,
  CSRF_COOKIE,
  cookieOptions,
  csrfCookieOptions,
} from "@/lib/auth/config";
import { generateCsrfToken } from "@/lib/auth/tokens";

export function attachAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
  csrfToken?: string,
): NextResponse {
  const csrf = csrfToken ?? generateCsrfToken();
  res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_TTL_SEC));
  res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_TTL_SEC));
  res.cookies.set(CSRF_COOKIE, csrf, csrfCookieOptions(REFRESH_TTL_SEC));
  return res;
}

export async function clearAuthCookies(res: NextResponse): Promise<NextResponse> {
  const opts = { path: "/", maxAge: 0 };
  res.cookies.set(ACCESS_COOKIE, "", { ...opts, httpOnly: true });
  res.cookies.set(REFRESH_COOKIE, "", { ...opts, httpOnly: true });
  res.cookies.set(CSRF_COOKIE, "", { ...opts, httpOnly: false });
  return res;
}

export async function readRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}
