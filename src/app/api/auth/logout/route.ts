import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { revokeSession } from "@/lib/auth/session";
import { requireAuthWithCsrf } from "@/lib/auth/require-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authResult = await requireAuthWithCsrf(req);
  if (!authResult.ok) {
    const res = await clearAuthCookies(NextResponse.json({ ok: true }));
    return res;
  }

  await revokeSession(authResult.auth.sid);
  const res = NextResponse.json({ ok: true });
  return clearAuthCookies(res);
}
