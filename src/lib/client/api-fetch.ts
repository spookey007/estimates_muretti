"use client";

import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/auth/config";

function readCsrfFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${CSRF_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(CSRF_COOKIE.length + 1));
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const csrf = readCsrfFromDocument();
  const headers = new Headers(init?.headers);

  if (csrf && init?.method && init.method !== "GET" && init.method !== "HEAD") {
    headers.set(CSRF_HEADER, csrf);
  }

  let res = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      res = await fetch(input, {
        ...init,
        headers,
        credentials: "include",
      });
    }
  }

  return res;
}
