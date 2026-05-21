import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE } from "@/lib/auth/config";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { securityHeaders } from "@/lib/security/headers";
import { isAllowedOrigin } from "@/lib/security/cors";
import {
  checkProductionConfig,
  productionConfigErrorResponse,
} from "@/lib/security/production";

const PUBLIC_PATHS = new Set(["/login"]);
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/refresh"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

async function verifyAccessTokenEdge(
  token: string,
): Promise<boolean> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: "muretti-estimate",
      audience: "muretti-estimate",
    });
    return true;
  } catch {
    return false;
  }
}

function getAllowedIps(): Set<string> | null {
  const raw = process.env.ALLOWED_IPS?.trim();
  if (!raw) return null;
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const headerMap = securityHeaders();
  const applyHeaders = (res: NextResponse): NextResponse => {
    for (const [k, v] of Object.entries(headerMap)) {
      res.headers.set(k, v);
    }
    return res;
  };

  if (request.method === "OPTIONS") {
    return applyHeaders(NextResponse.next());
  }

  const allowedIps = getAllowedIps();
  if (allowedIps && pathname.startsWith("/api/")) {
    const ip = clientIp(request);
    if (!allowedIps.has(ip)) {
      return applyHeaders(
        NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      );
    }
  }

  if (pathname.startsWith("/api/") && origin && !isAllowedOrigin(origin)) {
    return applyHeaders(
      NextResponse.json({ error: "Forbidden origin" }, { status: 403 }),
    );
  }

  if (pathname.startsWith("/api/")) {
    const prodCheck = checkProductionConfig();
    if (!prodCheck.ok) {
      return applyHeaders(productionConfigErrorResponse());
    }
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const valid = access ? await verifyAccessTokenEdge(access) : false;

  if (pathname === "/login" && valid) {
    const from = request.nextUrl.searchParams.get("from");
    const dest = safeRedirectPath(from, "/");
    return applyHeaders(NextResponse.redirect(new URL(dest, request.url)));
  }

  if (isPublicPath(pathname)) {
    return applyHeaders(NextResponse.next());
  }

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return applyHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("from", safeRedirectPath(pathname, "/"));
    return applyHeaders(NextResponse.redirect(login));
  }

  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
