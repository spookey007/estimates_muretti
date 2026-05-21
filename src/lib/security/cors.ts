const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS =
  "Content-Type, Authorization, X-CSRF-Token, x-csrf-token";

export function getAppOrigin(): string | null {
  const origin = process.env.APP_URL?.trim();
  if (!origin) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

/** Reject cross-origin API access; only same-origin or configured APP_URL. */
export function isAllowedOrigin(requestOrigin: string | null): boolean {
  if (!requestOrigin) return true;

  const appOrigin = getAppOrigin();
  if (appOrigin && requestOrigin === appOrigin) return true;

  if (process.env.NODE_ENV !== "production") {
    if (
      requestOrigin.startsWith("http://localhost:") ||
      requestOrigin.startsWith("http://127.0.0.1:")
    ) {
      return true;
    }
  }

  // Production: no APP_URL means reject all cross-origin browser calls
  if (process.env.NODE_ENV === "production" && !appOrigin) {
    return false;
  }

  return false;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const appOrigin = getAppOrigin();
  const allowOrigin = origin && isAllowedOrigin(origin) ? origin : appOrigin ?? "";

  if (!allowOrigin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    Vary: "Origin",
  };
}
