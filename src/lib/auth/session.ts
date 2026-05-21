import { query } from "@/lib/db/client";
import { REFRESH_TTL_SEC } from "@/lib/auth/config";
import {
  generateRefreshToken,
  hashToken,
} from "@/lib/auth/tokens";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: string;
  failed_login_attempts: number;
  locked_until: Date | null;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>(
    `SELECT id, email, password_hash, name, role, failed_login_attempts, locked_until
     FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email.trim()],
  );
  return rows[0] ?? null;
}

export async function isAccountLocked(user: UserRow): Promise<boolean> {
  if (!user.locked_until) return false;
  return new Date(user.locked_until) > new Date();
}

export async function recordFailedLogin(userId: string): Promise<void> {
  await query(
    `UPDATE users SET
       failed_login_attempts = failed_login_attempts + 1,
       locked_until = CASE
         WHEN failed_login_attempts + 1 >= $2
         THEN NOW() + ($3 || ' minutes')::INTERVAL
         ELSE locked_until
       END,
       updated_at = NOW()
     WHERE id = $1`,
    [userId, MAX_FAILED_ATTEMPTS, String(LOCK_MINUTES)],
  );
}

export async function clearFailedLogins(userId: string): Promise<void> {
  await query(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}

export async function createSession(
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<{ sessionId: string; refreshToken: string }> {
  const refreshToken = generateRefreshToken();
  const refreshHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);

  const { rows } = await query<{ id: string }>(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, refreshHash, expiresAt.toISOString(), ip, userAgent],
  );

  return { sessionId: rows[0].id, refreshToken };
}

export async function validateSession(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const { rows } = await query<{ ok: number }>(
    `SELECT 1 AS ok FROM sessions
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [sessionId, userId],
  );
  return rows.length > 0;
}

export async function validateRefreshToken(
  refreshToken: string,
): Promise<{ userId: string; sessionId: string; email: string; role: string } | null> {
  const hash = hashToken(refreshToken);
  const { rows } = await query<{
    user_id: string;
    session_id: string;
    email: string;
    role: string;
  }>(
    `SELECT s.user_id, s.id AS session_id, u.email, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.refresh_token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > NOW()
     LIMIT 1`,
    [hash],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    sessionId: row.session_id,
    email: row.email,
    role: row.role,
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await query(
    `UPDATE sessions SET revoked_at = NOW() WHERE id = $1`,
    [sessionId],
  );
}

export async function rotateRefreshToken(
  sessionId: string,
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<{ refreshToken: string; newSessionId: string } | null> {
  await revokeSession(sessionId);
  const next = await createSession(userId, ip, userAgent);
  return {
    refreshToken: next.refreshToken,
    newSessionId: next.sessionId,
  };
}
