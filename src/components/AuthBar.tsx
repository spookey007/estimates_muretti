"use client";

import { apiFetch } from "@/lib/client/api-fetch";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function AuthBar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={signOut}
        disabled={loading}
        className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
