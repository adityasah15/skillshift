"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { useSessionToken } from "@/lib/session";
import type { JwtPayload, Role } from "@/lib/types";

interface CurrentUser {
  user: JwtPayload | null;
  role: Role | null;
  userId: string | null;
  loading: boolean;
}

/**
 * Single shared role source. Best-effort: returns null role while logged out
 * or while the identity request is in flight, so callers can render
 * optimistic (non-admin) UI and then narrow once the role resolves.
 */
export function useCurrentUser(): CurrentUser {
  const token = useSessionToken();
  const [entry, setEntry] = useState<{ forToken: string; user: JwtPayload } | null>(null);

  useEffect(() => {
    if (!token || entry?.forToken === token) return;
    const activeToken = token;
    let cancelled = false;
    authApi
      .me()
      .then((r) => {
        if (!cancelled) setEntry({ forToken: activeToken, user: r.data });
      })
      .catch(() => {
        // Best-effort: callers treat unknown role optimistically.
      });
    return () => {
      cancelled = true;
    };
  }, [token, entry?.forToken]);

  if (!token || entry?.forToken !== token) {
    return { user: null, role: null, userId: null, loading: token !== null };
  }
  return { user: entry.user, role: entry.user.role, userId: entry.user.sub, loading: false };
}
