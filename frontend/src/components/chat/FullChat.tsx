"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import { ordersApi } from "@/lib/api/orders";
import { useSessionToken } from "@/lib/session";
import type { JwtPayload, OrderDetail } from "@/lib/types";

// Socket code ships only with this discussion surface.
const OrderChat = dynamic(
  () => import("@/components/chat/OrderChat").then((m) => ({ default: m.OrderChat })),
  {
    ssr: false,
    loading: () => (
      <div className="mt-2 space-y-2" aria-label="Loading chat">
        <div className="skeleton-shimmer h-10 w-3/4 rounded-[14px]" />
        <div className="skeleton-shimmer ml-auto h-10 w-2/3 rounded-[14px]" />
      </div>
    ),
  },
);

/**
 * Full-screen discussion for one order. Same OrderChat as the cockpit —
 * this route is a focused reading/writing surface, not a second system.
 * Order actions stay in the cockpit.
 */
export function FullChat({ orderId }: { orderId: string }) {
  const router = useRouter();
  const token = useSessionToken();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [me, setMe] = useState<JwtPayload | null>(null);
  const [denied, setDenied] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setFailed(null);
      setDenied(false);
      try {
        const [orderRes, meRes] = await Promise.all([
          ordersApi.get(orderId),
          authApi.me(),
        ]);
        if (cancelled) return;
        const o = orderRes.data;
        const user = meRes.data;
        if (o.clientId !== user.sub && o.freelancerId !== user.sub) {
          setDenied(true);
          return;
        }
        setOrder(o);
        setMe(user);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && (err.statusCode === 403 || err.statusCode === 404)) {
          setDenied(true);
        } else if (err instanceof ApiRequestError) {
          setFailed(err.message);
        } else {
          setFailed("We could not reach the server. Check your connection and try again.");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId, attempt, token]);

  if (token === null) {
    return (
      <EmptyState
        title="Log in to view this discussion"
        body="Order discussions are private to the client and freelancer involved."
        action={{ label: "Log in", onClick: () => router.push(`/auth/login?next=${encodeURIComponent(`/chat/${orderId}`)}`) }}
      />
    );
  }

  if (denied) {
    return (
      <EmptyState
        title="You don't have access to this discussion"
        body="Only the client and freelancer involved can view it."
        action={{ label: "Back to messages", onClick: () => router.push("/messages") }}
      />
    );
  }

  if (failed || (order && !me)) {
    return (
      <ErrorState
        title="Could not load this discussion"
        body={failed ?? "Please try again."}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (!order || !me) {
    return (
      <div className="space-y-3" aria-label="Loading discussion">
        <div className="skeleton-shimmer h-7 w-1/2 rounded-full" />
        <div className="skeleton-shimmer h-64 rounded-[18px]" />
      </div>
    );
  }

  const isClient = me.sub === order.clientId;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={order.status} />
        <span className="font-mono text-xs text-text-subtle">#{order.id.slice(0, 8)}</span>
      </div>
      <section aria-label="Discussion" className="mt-4 rounded-[18px] border border-border bg-surface p-6">
        <OrderChat
          orderId={order.id}
          myId={me.sub}
          peerId={isClient ? order.freelancerId : order.clientId}
        />
      </section>
      <Link
        href={`/orders/${order.id}`}
        className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline"
      >
        Open in Order Cockpit →
      </Link>
    </div>
  );
}
