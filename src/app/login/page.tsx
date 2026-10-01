"use client";

import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { MurettiLogo } from "@/components/MurettiLogo";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = safeRedirectPath(searchParams.get("from"), "/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function tryExistingSession() {
      const refreshed = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (cancelled) return;
      if (refreshed.ok) {
        router.replace(from);
        return;
      }
      setCheckingSession(false);
    }

    tryExistingSession();
    return () => {
      cancelled = true;
    };
  }, [from, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.replace(from);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
        <main className="flex min-h-full items-center justify-center bg-[var(--brand-ink)]">
        <p className="text-sm text-white/60">Checking session…</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-[var(--brand-ink)] px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,145,122,0.28), transparent 55%)",
        }}
      />

      <div className="relative mb-8 flex flex-col items-center text-center">
        <MurettiLogo size="lg" tone="dark" priority />
      </div>

      <div className="relative panel w-full max-w-md border-white/10 bg-white p-8 sm:p-9">
        <div className="space-y-2 border-b border-[var(--border)] pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Sign in
          </h1>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Access pricing and AI import tools for your account only.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-control"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-control"
            />
          </div>

          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full items-center justify-center bg-[var(--brand-ink)]">
          <p className="text-sm text-white/60">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
