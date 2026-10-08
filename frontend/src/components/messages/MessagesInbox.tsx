"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { chatApi, type ChatMessage } from "@/lib/api/chat";
import { ordersApi } from "@/lib/api/orders";
import { useSessionToken } from "@/lib/session";
import type { OrderListItem } from "@/lib/types";

interface Thread {
  order: OrderListItem;
  preview: ChatMessage | null;
  lastActive: string;
}

function previewDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Conversation inbox: one row per order with the latest message preview.
 * Full discussion lives in the Order Cockpit — rows deep-link there.
 * No unread indicators: the backend exposes no per-order unread state,
 * so none is invented here.
 */
export function MessagesInbox() {
  const router = useRouter();
  const token = useSessionToken();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setFailed(null);
      try {
        const { data: orders } = await ordersApi.list();
        if (cancelled) return;
        if (orders.length === 0) {
          setThreads([]);
          return;
        }
        const previews = await Promise.all(
          orders.map(async (order) => {
            try {
              const { data } = await chatApi.history(order.id, null, 1);
              return data.messages[0] ?? null;
            } catch {
              return null;
            }
          }),
        );
        if (cancelled) return;
        const built: Thread[] = orders.map((order, i) => ({
          order,
          preview: previews[i],
          lastActive: previews[i]?.createdAt ?? order.createdAt,
        }));
        built.sort((a, b) => +new Date(b.lastActive) - +new Date(a.lastActive));
        setThreads(built);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError) setFailed(err.message);
        else setFailed("We could not reach the server. Check your connection and try again.");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  if (token === null) {
    return (
      <EmptyState
        title="Log in to view your messages"
        body="Order discussions live here once you're part of an order."
        action={{ label: "Log in", onClick: () => router.push("/auth/login?next=%2Fmessages") }}
      />
    );
  }

  if (threads === null && !failed) return <SkeletonGrid count={4} />;

  if (failed) {
    return (
      <ErrorState
        title="Could not load your messages"
        body={failed}
        onRetry={() => {
          setThreads(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  if (threads !== null && threads.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        body="When you book a service or receive an order, your discussion with the other party will appear here."
        action={{ label: "Browse services", onClick: () => router.push("/services") }}
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {(threads ?? []).map(({ order, preview, lastActive }) => (
        <li key={order.id}>
          <Link
            href={`/chat/${order.id}`}
            className="lift flex items-center gap-4 rounded-[16px] border border-border bg-surface p-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-[16px] font-semibold">{order.serviceTitle}</h3>
                <span className="shrink-0 text-[13px] text-text-subtle">{previewDate(lastActive)}</span>
              </div>
              <p className="mt-1 truncate text-sm text-text-muted">
                {preview ? preview.content : "No messages yet — say hello and align on scope."}
              </p>
              <p className="mt-1.5 text-[13px] text-text-subtle">
                {order.roleLabel} · #{order.id.slice(0, 8)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
