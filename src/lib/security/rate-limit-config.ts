function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function isRateLimitDisabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.RATE_LIMIT_DISABLED === "true";
}

/** Login: attempts per window (default 10 per 15 min). */
export const loginRateLimit = {
  limit: envInt("RATE_LIMIT_LOGIN_MAX", 10),
  windowSec: envInt("RATE_LIMIT_LOGIN_WINDOW_SEC", 900),
};

/** Refresh token: requests per window (default 30 per 1 min). */
export const refreshRateLimit = {
  limit: envInt("RATE_LIMIT_REFRESH_MAX", 30),
  windowSec: envInt("RATE_LIMIT_REFRESH_WINDOW_SEC", 60),
};

/** General authenticated API (default 120 per 1 min). */
export const apiRateLimit = {
  limit: envInt("RATE_LIMIT_API_MAX", 120),
  windowSec: envInt("RATE_LIMIT_API_WINDOW_SEC", 60),
};

/** AI import config GET (default 60 per 1 min). */
export const importGetRateLimit = {
  limit: envInt("RATE_LIMIT_IMPORT_GET_MAX", 60),
  windowSec: envInt("RATE_LIMIT_IMPORT_GET_WINDOW_SEC", 60),
};

/** AI PDF import POST (default 20 per 1 hour). */
export const importPostRateLimit = {
  limit: envInt("RATE_LIMIT_IMPORT_POST_MAX", 20),
  windowSec: envInt("RATE_LIMIT_IMPORT_POST_WINDOW_SEC", 3600),
};
