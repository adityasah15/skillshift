"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderCard } from "@/components/orders/OrderCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import { notificationsApi } from "@/lib/api/notifications";
import { ordersApi } from "@/lib/api/orders";
import { servicesApi } from "@/lib/api/services";
import { walletApi } from "@/lib/api/wallet";
import { formatINR } from "@/lib/format";
import { useSessionToken } from "@/lib/session";
import type { JwtPayload, OrderListItem, Service } from "@/lib/types";

function isAttention(order: OrderListItem, role: JwtPayload["role"] | null): boolean {
  if (role === "FREELANCER" && order.roleLabel !== "Freelancer order") return false;
  if (role === "CLIENT" && order.roleLabel !== "Client order") return false;
  if (order.roleLabel === "Client order") return order.status === "DELIVERED";
  if (order.roleLabel === "Freelancer order") return order.status === "IN_PROGRESS";
  return false;
}

/**
 * Thin role-aware overview composing existing endpoints only
 * (orders, wallet, notifications, own services). Deep-links everywhere;
 * no new data silo. Admins belong in /admin instead.
 */
export function DashboardPage() {
  const router = useRouter();
  const token = useSessionToken();
  const [me, setMe] = useState<JwtPayload | null>(null);
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [services, setServices] = useState<Service[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setFailed(null);
      try {
        const meRes = await authApi.me();
        if (cancelled) return;
        const user = meRes.data;
        if (user.role === "ADMIN") {
          router.replace("/admin");
          return;
        }
        setMe(user);
        const [ordersRes, balRes, unreadRes] = await Promise.all([
          ordersApi.list(),
          walletApi.balance().catch(() => null),
          notificationsApi.unreadCount().catch(() => null),
        ]);
        if (cancelled) return;
        setOrders(ordersRes.data);
        setBalance(balRes ? balRes.data : null);
        setUnread(unreadRes ? unreadRes.data : 0);
        if (user.role === "FREELANCER") {
          try {
            const { data } = await servicesApi.mine();
            if (!cancelled) setServices(data);
          } catch {
            if (!cancelled) setServices([]);
          }
        } else if (!cancelled) {
          setServices([]);
        }
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
  }, [token, attempt, router]);

  if (token === null) {
    return (
      <EmptyState
        title="Log in to view your dashboard"
        body="Orders, wallet, and messages at a glance once you're logged in."
        action={{ label: "Log in", onClick: () => router.push("/auth/login?next=%2Fdashboard") }}
      />
    );
  }

  if (failed || (me && orders === null)) {
    return (
      <ErrorState
        title="Could not load your dashboard"
        body={failed ?? "Please try again."}
        onRetry={() => {
          setOrders(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  if (!me || orders === null) {
    return (
      <div className="space-y-4" aria-label="Loading dashboard">
        <div className="skeleton-shimmer h-44 rounded-[10px]" />
        <div className="skeleton-shimmer h-32 rounded-[10px]" />
      </div>
    );
  }

  const attention = orders.filter((o) => isAttention(o, me.role));
  const recent = [...orders]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 3);
  const activeServices = (services ?? []).filter((s) => s.status === "ACTIVE").length;
  const pendingServices = (services ?? []).filter((s) => s.status === "PENDING_REVIEW").length;
  const held = orders
    .filter((order) => {
      const open =
        order.status === "IN_PROGRESS" ||
        order.status === "DELIVERED" ||
        order.status === "DISPUTED";
      const mine =
        me.role === "CLIENT"
          ? order.roleLabel === "Client order"
          : order.roleLabel === "Freelancer order";
      return open && mine;
    })
    .reduce((sum, order) => sum + order.price, 0);
  const activeOrders = orders.filter((order) => order.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-6">
      {unread > 0 && (
        <Link
          href="/notifications"
          className="flex items-center gap-3 rounded-[10px] border border-border bg-surface px-5 py-4 transition hover:border-border-strong"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M5 8.2a5 5 0 0110 0v3l1.4 2.3H3.6L5 11.2v-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M8.2 16a2 2 0 003.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium text-text">
            {unread} unread notification{unread === 1 ? "" : "s"}
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-primary">
            View
          </span>
        </Link>
      )}

      <section aria-label="Needs your attention">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Needs your attention</h2>
          {attention.length > 0 && (
            <Link href="/orders" className="text-sm font-semibold text-primary hover:underline">
              All orders
            </Link>
          )}
        </div>
        {attention.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attention.slice(0, 4).map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-3 rounded-[10px] border border-border bg-surface px-5 py-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-text">You&apos;re all caught up.</p>
              <p className="mt-0.5 text-[13px] leading-5 text-text-muted">
                New deliveries, approvals, and dispute updates will appear here.
              </p>
            </div>
          </div>
        )}
      </section>

      <section aria-label="At a glance" className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col rounded-[10px] border border-border bg-surface p-5">
          <p className="text-[13px] text-text-subtle">Available in wallet</p>
          <p className="tabular mt-1 text-2xl font-bold text-text">
            {balance === null ? "—" : formatINR(balance)}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-text-muted">
            Ready to spend or withdraw.
          </p>
          <Link
            href="/wallet"
            className="mt-auto pt-3 text-[13px] font-semibold text-primary hover:underline"
          >
            Open wallet
          </Link>
        </div>

        <div className="flex flex-col rounded-[10px] border border-border bg-surface p-5">
          <p className="text-[13px] text-text-subtle">
            {me.role === "FREELANCER" ? "In escrow for your orders" : "Held in escrow"}
          </p>
          <p className="tabular mt-1 text-2xl font-bold text-text">
            {formatINR(held)}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-text-muted">
            {me.role === "FREELANCER"
              ? "Releases as clients approve deliveries."
              : "Protected across your open orders."}
          </p>
          <Link
            href="/orders"
            className="mt-auto pt-3 text-[13px] font-semibold text-primary hover:underline"
          >
            View orders
          </Link>
        </div>

        <div className="flex flex-col rounded-[10px] border border-border bg-surface p-5">
          {me.role === "FREELANCER" ? (
            <>
              <p className="text-[13px] text-text-subtle">Your services</p>
              <p className="tabular mt-1 text-2xl font-bold text-text">
                {activeServices}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-text-muted">
                {pendingServices > 0
                  ? `${pendingServices} waiting for review.`
                  : "Live listings, ready for new orders."}
              </p>
              <Link
                href="/services/mine"
                className="mt-auto pt-3 text-[13px] font-semibold text-primary hover:underline"
              >
                Manage services
              </Link>
            </>
          ) : (
            <>
              <p className="text-[13px] text-text-subtle">Open orders</p>
              <p className="tabular mt-1 text-2xl font-bold text-text">
                {activeOrders}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-text-muted">
                {attention.length > 0
                  ? `${attention.length} waiting on you.`
                  : "Work in progress, deliveries, and approvals."}
              </p>
              <Link
                href="/orders"
                className="mt-auto pt-3 text-[13px] font-semibold text-primary hover:underline"
              >
                Open orders
              </Link>
            </>
          )}
        </div>
      </section>

      <section aria-label="Recent orders">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {recent.length > 0 ? "Recent orders" : "Get started"}
          </h2>
          {recent.length > 0 && (
            <Link href="/orders" className="text-sm font-semibold text-primary hover:underline">
              All orders
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title={me.role === "FREELANCER" ? "No orders yet" : "No orders yet"}
              body={
                me.role === "FREELANCER"
                  ? "Publish a service so clients can find and order your work."
                  : "Browse services and place your first order with escrow protection."
              }
              action={
                me.role === "FREELANCER"
                  ? { label: "Publish a service", onClick: () => router.push("/services/new") }
                  : { label: "Browse services", onClick: () => router.push("/services") }
              }
            />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recent.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
