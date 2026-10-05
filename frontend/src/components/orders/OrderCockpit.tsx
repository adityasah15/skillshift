"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import {
  CancelDialog,
  CompleteDialog,
  DeliverDialog,
  DisputeDialog,
  ReviewDialog,
} from "@/components/orders/ActionDialogs";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import { ordersApi } from "@/lib/api/orders";
import { servicesApi } from "@/lib/api/services";
import { useSessionToken } from "@/lib/session";
import { formatINR } from "@/lib/format";
import { deliveryDownloadUrl } from "@/lib/upload";
import type { JwtPayload, OrderDetail } from "@/lib/types";

// Socket code ships only when the discussion panel renders.
const OrderChat = dynamic(
  () => import("@/components/chat/OrderChat").then((m) => ({ default: m.OrderChat })),
  {
    ssr: false,
    loading: () => <p className="mt-2 text-sm text-text-muted">Loading chat…</p>,
  },
);

type Dialog = "deliver" | "complete" | "cancel" | "dispute" | "review" | null;

function escrowLine(status: string, price: number): { text: string; tone: string } {
  if (status === "COMPLETED")
    return { text: `${formatINR(price)} released to the freelancer`, tone: "bg-success-soft text-success" };
  if (status === "CANCELLED" || status === "REFUNDED")
    return { text: `${formatINR(price)} refunded to the client`, tone: "bg-surface-soft text-text-muted" };
  return { text: `${formatINR(price)} protected in escrow`, tone: "bg-warning-soft text-warning" };
}

function countdown(to: string): string {
  const ms = new Date(to).getTime() - Date.now();
  if (ms <= 0) return "Auto-completing soon";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `Auto-completes in ${days}d ${hours}h`;
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `Auto-completes in ${hours}h ${mins}m`;
  return `Auto-completes in ${mins}m`;
}

export function OrderCockpit({ id }: { id: string }) {
  const router = useRouter();
  const token = useSessionToken();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [me, setMe] = useState<JwtPayload | null>(null);
  const [serviceTitle, setServiceTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      setDenied(false);
      try {
        const [orderRes, meRes] = await Promise.all([
          ordersApi.get(id),
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
        servicesApi
          .get(o.serviceId)
          .then((r) => {
            if (!cancelled) setServiceTitle(r.data.title);
          })
          .catch(() => {
            if (!cancelled) setServiceTitle(null);
          });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && (err.statusCode === 403 || err.statusCode === 404)) {
          setDenied(true);
        } else if (err instanceof ApiRequestError) {
          setFailed(err.message);
        } else {
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
  }, [id, attempt, token]);

  if (token === null) {
    return (
      <EmptyState
        title="Log in to view this order"
        body="Orders are private to the client and freelancer involved."
        action={{ label: "Log in", onClick: () => router.push(`/auth/login?next=${encodeURIComponent(`/orders/${id}`)}`) }}
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-label="Loading order">
        <div className="space-y-4">
          <div className="skeleton-shimmer h-8 w-2/3 rounded-full" />
          <div className="skeleton-shimmer h-40 rounded-[18px]" />
          <div className="skeleton-shimmer h-32 rounded-[18px]" />
        </div>
        <div className="skeleton-shimmer h-80 rounded-[18px]" />
      </div>
    );
  }

  if (denied) {
    return (
      <EmptyState
        title="You don't have access to this order"
        body="Only the client and freelancer involved can view it."
        action={{ label: "Back to orders", onClick: () => router.push("/orders") }}
      />
    );
  }

  if (failed || !order || !me) {
    return (
      <ErrorState
        title="Could not load this order"
        body={failed ?? "Please try again."}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  const isClient = me.sub === order.clientId;
  const escrow = escrowLine(order.status, order.price);
  const refetch = () => {
    setDialog(null);
    setAttempt((n) => n + 1);
  };

  async function download(key: string, name: string) {
    setDownloading(key);
    try {
      const url = await deliveryDownloadUrl(key);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setFailed("Could not generate the download link. Please retry.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={order.status} />
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {serviceTitle ?? "Order"}
        </h1>
        <span className="font-mono text-xs text-text-subtle">#{order.id.slice(0, 8)}</span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section aria-label="Progress" className="rounded-[18px] border border-border bg-surface p-6">
            <OrderStatusTimeline status={order.status} />
            {order.status === "DELIVERED" && order.autoCompleteAt && (
              <p className="mt-3 text-sm font-medium text-warning">{countdown(order.autoCompleteAt)}</p>
            )}
          </section>

          {order.requirements && (
            <section aria-label="Requirements" className="rounded-[18px] border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold">Requirements</h2>
              <p className="mt-2 text-[15px] leading-7 text-text-muted">{order.requirements}</p>
            </section>
          )}

          {(order.deliveryNote || order.deliveryFiles.length > 0) && (
            <section aria-label="Delivery" className="rounded-[18px] border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold">Delivery</h2>
              {order.deliveryNote && (
                <p className="mt-2 text-[15px] leading-7 text-text-muted">{order.deliveryNote}</p>
              )}
              {order.deliveryFiles.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {order.deliveryFiles.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 rounded-[12px] bg-surface-soft/70 px-4 py-3"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">{f.originalName}</span>
                      <button
                        type="button"
                        disabled={downloading === f.key}
                        onClick={() => download(f.key, f.originalName)}
                        className="shrink-0 cursor-pointer text-sm font-semibold text-primary hover:underline disabled:opacity-60"
                      >
                        {downloading === f.key ? "Preparing…" : "Download"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section aria-label="Discussion" className="rounded-[18px] border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Discussion</h2>
            <div className="mt-2">
              <OrderChat
                orderId={order.id}
                myId={me.sub}
                peerId={isClient ? order.freelancerId : order.clientId}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section aria-label="Payment" className="rounded-[18px] border border-border bg-surface p-6">
            <p className="text-[13px] text-text-subtle">Order value</p>
            <p className="font-mono text-2xl font-bold">{formatINR(order.price)}</p>
            <p className={`mt-2 rounded-[12px] px-3 py-2 text-[13px] font-medium ${escrow.tone}`}>
              {order.status === "COMPLETED" ? "Released" : order.status === "CANCELLED" || order.status === "REFUNDED" ? "Refunded" : "Held in escrow"} · {escrow.text}
            </p>
            <p className="mt-2 text-[13px] leading-6 text-text-muted">
              Test mode — no real money moves.
            </p>
          </section>

          <section aria-label="Actions" className="rounded-[18px] border border-border bg-surface p-6">
            <h2 className="text-[15px] font-semibold">
              {isClient ? "You are the client" : "You are the freelancer"}
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {order.status === "IN_PROGRESS" && !isClient && (
                <Button onClick={() => setDialog("deliver")}>Deliver order</Button>
              )}
              {order.status === "IN_PROGRESS" && (
                <Button variant="secondary" onClick={() => setDialog("cancel")}>
                  Cancel order
                </Button>
              )}
              {order.status === "DELIVERED" && isClient && (
                <>
                  <Button onClick={() => setDialog("complete")}>Accept delivery</Button>
                  <Button variant="secondary" onClick={() => setDialog("dispute")}>
                    Open dispute
                  </Button>
                </>
              )}
              {order.status === "DELIVERED" && !isClient && (
                <p className="text-sm leading-6 text-text-muted">
                  Waiting on client review{order.autoCompleteAt ? ` — ${countdown(order.autoCompleteAt).toLowerCase()}` : ""}.
                </p>
              )}
              {order.status === "COMPLETED" && (
                <Button variant="secondary" onClick={() => setDialog("review")}>
                  Leave a review
                </Button>
              )}
              {(order.status === "DISPUTED" || order.status === "CANCELLED" || order.status === "REFUNDED") && (
                <p className="text-sm leading-6 text-text-muted">No actions available.</p>
              )}
              {order.status === "PENDING" && (
                <p className="text-sm leading-6 text-text-muted">Waiting for the order to start.</p>
              )}
            </div>
          </section>

          <Link
            href={`/services/${order.serviceId}`}
            className="block rounded-[18px] border border-border bg-surface p-6 transition hover:border-border-strong"
          >
            <p className="text-[13px] text-text-subtle">Ordered service</p>
            <p className="mt-1 text-[15px] font-semibold">{serviceTitle ?? "View service →"}</p>
          </Link>
        </aside>
      </div>

      <DeliverDialog open={dialog === "deliver"} onClose={() => setDialog(null)} orderId={order.id} onDone={refetch} />
      <CompleteDialog open={dialog === "complete"} onClose={() => setDialog(null)} orderId={order.id} price={order.price} onDone={refetch} />
      <CancelDialog open={dialog === "cancel"} onClose={() => setDialog(null)} orderId={order.id} price={order.price} onDone={refetch} />
      <DisputeDialog open={dialog === "dispute"} onClose={() => setDialog(null)} orderId={order.id} onDone={refetch} />
      <ReviewDialog open={dialog === "review"} onClose={() => setDialog(null)} orderId={order.id} onDone={refetch} />
    </div>
  );
}
