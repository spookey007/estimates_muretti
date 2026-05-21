export const ACCESS_COOKIE = "muretti_access";
export const REFRESH_COOKIE = "muretti_refresh";
export const CSRF_COOKIE = "muretti_csrf";
export const CSRF_HEADER = "x-csrf-token";

export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

export function getJwtSecrets(): { access: Uint8Array; refresh: Uint8Array } {
  const access = process.env.JWT_ACCESS_SECRET;
  const refresh = process.env.JWT_REFRESH_SECRET;
  if (!access || access.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be set (min 32 characters)");
  }
  if (!refresh || refresh.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be set (min 32 characters)");
  }
  return {
    access: new TextEncoder().encode(access),
    refresh: new TextEncoder().encode(refresh),
  };
}

export function cookieOptions(maxAgeSec: number) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

export function csrfCookieOptions(maxAgeSec: number) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: false,
    secure,
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
