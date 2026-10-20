"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { notificationsApi } from "@/lib/api/notifications";
import { useSessionToken } from "@/lib/session";
import type { NotificationItem } from "@/lib/types";

type Group = "Today" | "Yesterday" | "Earlier";

function groupFor(iso: string): Group {
  const now = new Date();
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const time = new Date(iso).getTime();
  if (time >= startToday) return "Today";
  if (time >= startToday - 86400000) return "Yesterday";
  return "Earlier";
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function typeLabel(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="mt-1 shrink-0 self-center text-text-subtle"
    >
      <path
        d="M6 3.5L10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RowBody({ notification }: { notification: NotificationItem }) {
  const unread = !notification.read;
  return (
    <>
      <span
        aria-hidden
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          unread ? "bg-primary" : "bg-border-strong"
        }`}
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-text-subtle">
            {typeLabel(notification.type)}
          </span>
          {unread && (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
              Unread
            </span>
          )}
        </span>
        <span className="mt-1 block text-[15px] leading-6 text-text">
          {notification.message}
        </span>
        <span className="mt-1 block text-[12px] text-text-subtle">
          {timeLabel(notification.createdAt)}
        </span>
      </span>
    </>
  );
}

function rowClass(unread: boolean): string {
  return `flex w-full items-start gap-3 rounded-[10px] border px-4 py-3.5 text-left transition hover:border-border-strong ${
    unread ? "border-primary/40 bg-primary-soft/30" : "border-border bg-surface"
  }`;
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: NotificationItem;
  onRead: (item: NotificationItem) => void;
}) {
  const unread = !notification.read;
  const body: ReactNode = <RowBody notification={notification} />;

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={() => {
          if (unread) onRead(notification);
        }}
        className={rowClass(unread)}
      >
        {body}
        <Chevron />
      </Link>
    );
  }

  if (unread) {
    return (
      <button
        type="button"
        onClick={() => onRead(notification)}
        className={`${rowClass(true)} cursor-pointer`}
      >
        {body}
        <span className="self-center text-[12px] font-semibold text-primary">
          Mark read
        </span>
      </button>
    );
  }

  return <div className={rowClass(false)}>{body}</div>;
}

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
        if (!cancelled) {
          setFailed("We could not reach the server. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  async function markRead(notification: NotificationItem) {
    setItems(
      (current) =>
        current?.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ) ?? current,
    );
    try {
      await notificationsApi.markRead(notification.id);
    } catch {
      // Non-critical — the list stays optimistic.
    }
  }

  async function markAll() {
    setItems(
      (current) => current?.map((item) => ({ ...item, read: true })) ?? current,
    );
    try {
      await notificationsApi.markAllRead();
    } catch {
      // Non-critical — the list stays optimistic.
    }
  }

  if (token === null) {
    return (
      <EmptyState
        title="Log in to view notifications"
        body="Order updates, dispute decisions, and payment alerts land here."
        action={{
          label: "Log in",
          onClick: () => router.push("/auth/login?next=%2Fnotifications"),
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-2.5" aria-label="Loading notifications">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-[10px]" />
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

  const unreadCount = items.filter((item) => !item.read).length;
  const sorted = [...items].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  const sections = (["Today", "Yesterday", "Earlier"] as const)
    .map((label) => ({
      label,
      items: sorted.filter((item) => groupFor(item.createdAt) === label),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-medium text-text-muted">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={markAll}
          disabled={unreadCount === 0}
        >
          Mark all read
        </Button>
      </div>

      {sections.map((section) => (
        <section key={section.label} aria-label={section.label} className="mt-5">
          <h2 className="text-[12px] font-semibold text-text-subtle">
            {section.label}
          </h2>
          <ul className="mt-2 space-y-2">
            {section.items.map((notification) => (
              <li key={notification.id}>
                <NotificationRow
                  notification={notification}
                  onRead={markRead}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-4 text-[13px] text-text-muted">
        Unread items are marked.{" "}
        <Link href="/orders" className="font-semibold text-primary hover:underline">
          View orders
        </Link>
      </p>
    </div>
  );
}
