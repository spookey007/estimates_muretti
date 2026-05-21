import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  ACCESS_TTL_SEC,
  getJwtSecrets,
} from "@/lib/auth/config";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  sid: string;
  role: string;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCsrfToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  const { access } = getJwtSecrets();
  return new SignJWT({
    email: payload.email,
    sid: payload.sid,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .setIssuer("muretti-estimate")
    .setAudience("muretti-estimate")
    .sign(access);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { access } = getJwtSecrets();
    const { payload } = await jwtVerify(token, access, {
      issuer: "muretti-estimate",
      audience: "muretti-estimate",
    });
    const sub = payload.sub;
    const email = payload.email;
    const sid = payload.sid;
    const role = payload.role;
    if (
      typeof sub !== "string" ||
      typeof email !== "string" ||
      typeof sid !== "string" ||
      typeof role !== "string"
    ) {
      return null;
    }
    return { sub, email, sid, role };
  } catch {
    return null;
  }
}
