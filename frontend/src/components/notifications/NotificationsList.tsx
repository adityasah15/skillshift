"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { notificationsApi } from "@/lib/api/notifications";
import { useSessionToken } from "@/lib/session";
import type { NotificationItem } from "@/lib/types";

export function NotificationsList() {
  const router = useRouter();
  const token = useSessionToken();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const { data } = await notificationsApi.list();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setFailed("We could not reach the server. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  async function markAll() {
    try {
      await notificationsApi.markAllRead();
      setItems((cur) => cur?.map((n) => ({ ...n, read: true })) ?? cur);
    } catch {
      // Non-critical — list stays as-is.
    }
  }

  async function open(n: NotificationItem) {
    if (!n.read) {
      try {
        await notificationsApi.markRead(n.id);
      } catch {
        // Non-critical.
      }
      setItems((cur) => cur?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? cur);
    }
    if (n.link) router.push(n.link);
  }

  if (token === null) {
    return (
      <EmptyState
        title="Log in to view notifications"
        body="Order updates, dispute decisions, and payment alerts land here."
        action={{ label: "Log in", onClick: () => router.push("/auth/login?next=%2Fnotifications") }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-2.5" aria-label="Loading notifications">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-[14px]" />
        ))}
      </div>
    );
  }

  if (failed || items === null) {
    return (
      <ErrorState
        title="Could not load notifications"
        body={failed ?? "Please try again."}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="All caught up"
        body="Order updates, dispute decisions, and payment alerts will appear here."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={markAll}>
          Mark all read
        </Button>
      </div>
      <ul className="space-y-2.5">
        {items.map((n) => (
          <li key={n.id}>
            {n.link ? (
              <button
                type="button"
                onClick={() => open(n)}
                className={`flex w-full cursor-pointer items-start gap-3 rounded-[14px] border px-4 py-3.5 text-left transition hover:border-border-strong ${
                  n.read ? "border-border bg-surface" : "border-primary/40 bg-primary-soft/40"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-surface-strong" : "bg-primary"}`}
                />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-text-subtle">{n.type.replaceAll("_", " ").toLowerCase()}</span>
                  <span className="mt-0.5 block text-[15px] leading-6">{n.message}</span>
                </span>
              </button>
            ) : (
              <div
                className={`flex items-start gap-3 rounded-[14px] border px-4 py-3.5 ${
                  n.read ? "border-border bg-surface" : "border-primary/40 bg-primary-soft/40"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-surface-strong" : "bg-primary"}`}
                />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-text-subtle">{n.type.replaceAll("_", " ").toLowerCase()}</span>
                  <span className="mt-0.5 block text-[15px] leading-6">{n.message}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-text-muted">
        Tapping a notification marks it read. <Link href="/orders" className="font-semibold text-primary hover:underline">View orders</Link>
      </p>
    </div>
  );
}
