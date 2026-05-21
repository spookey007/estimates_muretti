/** Allow only same-app relative paths (blocks open redirects). */
export function safeRedirectPath(
  path: string | null | undefined,
  fallback = "/",
): string {
  if (!path || typeof path !== "string") return fallback;

  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.startsWith("/login")) {
    return fallback;
  }

  try {
    const url = new URL(trimmed, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return fallback;
    if (url.pathname.startsWith("/api/auth/login")) return fallback;
  } catch {
    return fallback;
  }

  return trimmed;
}
