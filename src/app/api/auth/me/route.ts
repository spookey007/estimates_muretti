import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const runtime = "nodejs";

export async function GET() {
  const result = await requireAuth();
  if (!result.ok) return result.response;

  return NextResponse.json({
    id: result.auth.sub,
    email: result.auth.email,
    role: result.auth.role,
  });
}
