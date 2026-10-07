"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/States";
import { authApi } from "@/lib/api/auth";
import { useSessionToken } from "@/lib/session";
import type { Role } from "@/lib/types";

/** Renders children only for admin sessions; everyone else gets guidance. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useSessionToken();
  const [entry, setEntry] = useState<{ forToken: string; role: Role } | null>(null);

  useEffect(() => {
    if (!token || entry?.forToken === token) return;
    let cancelled = false;
    authApi
      .me()
      .then((r) => {
        if (!cancelled) setEntry({ forToken: token, role: r.data.role });
      })
      .catch(() => {
        if (!cancelled) setEntry(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, entry?.forToken]);

  if (token === null) {
    return (
      <EmptyState
        title="Admin access needs a login"
        body="Sign in with an admin account to open moderation and analytics."
        action={{ label: "Log in", onClick: () => router.push("/auth/login?next=%2Fadmin") }}
      />
    );
  }

  const role = entry?.forToken === token ? entry.role : null;
  if (role === null) {
    return (
      <div className="space-y-3" aria-label="Checking account">
        <div className="skeleton-shimmer h-8 w-56 rounded-full" />
        <div className="skeleton-shimmer h-40 rounded-[18px]" />
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <EmptyState
        title="Restricted to admins"
        body="Your account does not have moderation access. Continue browsing or check your orders."
        action={{ label: "Browse services", onClick: () => router.push("/services") }}
      />
    );
  }

  return <>{children}</>;
}
