"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notificationsApi } from "@/lib/api/notifications";
import { useSessionToken } from "@/lib/session";

export function NotificationsBell() {
  const token = useSessionToken();
  const [entry, setEntry] = useState<{ forToken: string; count: number } | null>(null);

  useEffect(() => {
    if (!token || entry?.forToken === token) return;
    let cancelled = false;
    async function load() {
      try {
        const { data } = await notificationsApi.unreadCount();
        if (!cancelled) setEntry({ forToken: token as string, count: typeof data === "number" ? data : 0 });
      } catch {
        if (!cancelled) setEntry({ forToken: token as string, count: 0 });
      }
    }
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const timer = setInterval(load, 60000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, [token, entry?.forToken]);

  const count = entry?.forToken === token ? entry.count : 0;

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className="relative flex h-11 w-11 items-center justify-center rounded-[12px] text-text-muted transition hover:bg-surface-soft hover:text-text"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M10 2.5a5 5 0 0 0-5 5v3L3.5 13h13L15 10.5v-3a5 5 0 0 0-5-5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
