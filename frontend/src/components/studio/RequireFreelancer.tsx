"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { authApi } from "@/lib/api/auth";
import { useSessionToken } from "@/lib/session";
import type { Role } from "@/lib/types";

/** Renders children only for freelancer sessions; everyone else gets guidance. */
export function RequireFreelancer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useSessionToken();
  const [entry, setEntry] = useState<{ forToken: string; role: Role } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token || entry?.forToken === token) return;
    const activeToken: string = token;
    let cancelled = false;
    async function check() {
      setFailed(false);
      try {
        const r = await authApi.me();
        if (!cancelled) setEntry({ forToken: activeToken, role: r.data.role });
      } catch {
        if (!cancelled) {
          setEntry(null);
          setFailed(true);
        }
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [token, entry?.forToken, attempt]);

  if (token === null) {
    return (
      <EmptyState
        title="Log in to sell"
        body="Publishing services needs a freelancer account."
        action={{ label: "Log in", onClick: () => router.push("/auth/login?next=%2Fservices%2Fmine") }}
      />
    );
  }

  const role = entry?.forToken === token ? entry.role : null;
  if (role === null && failed) {
    return (
      <ErrorState
        title="Could not verify access"
        body="We could not reach the server. Check your connection and try again."
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }
  if (role === null) {
    return (
      <div className="space-y-3" aria-label="Checking account">
        <div className="skeleton-shimmer h-8 w-56 rounded-full" />
        <div className="skeleton-shimmer h-40 rounded-[18px]" />
      </div>
    );
  }

  if (role !== "FREELANCER") {
    return (
      <EmptyState
        title="Selling needs a freelancer account"
        body="Your current account is set up for ordering. Register a freelancer account to publish services."
        action={{ label: "Browse services", onClick: () => router.push("/services") }}
      />
    );
  }

  return <>{children}</>;
}
