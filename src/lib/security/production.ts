import { NextResponse } from "next/server";

export type ProductionCheckResult =
  | { ok: true }
  | { ok: false; message: string };

export function checkProductionConfig(): ProductionCheckResult {
  if (process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return {
      ok: false,
      message: "RATE_LIMIT_DISABLED must not be set in production",
    };
  }

  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) {
    return { ok: false, message: "APP_URL is required in production" };
  }

  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol !== "https:") {
      return {
        ok: false,
        message: "APP_URL must use https in production",
      };
    }
  } catch {
    return { ok: false, message: "APP_URL is not a valid URL" };
  }

  const access = process.env.JWT_ACCESS_SECRET;
  const refresh = process.env.JWT_REFRESH_SECRET;
  if (!access || access.length < 32 || !refresh || refresh.length < 32) {
    return {
      ok: false,
      message: "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set (32+ chars)",
    };
  }

  if (!process.env.POSTGRES_URL?.trim()) {
    return { ok: false, message: "POSTGRES_URL is required in production" };
  }

  return { ok: true };
}

export function productionConfigErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: "Server misconfigured for production" },
    { status: 503 },
  );
}
