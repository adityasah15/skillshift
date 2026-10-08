"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderCard } from "@/components/orders/OrderCard";
import { Button } from "@/components/ui/Button";
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
        <div className="skeleton-shimmer h-44 rounded-[18px]" />
        <div className="skeleton-shimmer h-32 rounded-[18px]" />
      </div>
    );
  }

  const attention = orders.filter((o) => isAttention(o, me.role));
  const recent = [...orders]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 3);
  const activeServices = (services ?? []).filter((s) => s.status === "ACTIVE").length;
  const pendingServices = (services ?? []).filter((s) => s.status === "PENDING_REVIEW").length;

  return (
    <div className="space-y-6">
      {unread > 0 && (
        <Link
          href="/notifications"
          className="block rounded-[16px] border border-border bg-surface px-5 py-4 text-sm font-semibold transition hover:border-border-strong"
        >
          You have {unread} unread notification{unread === 1 ? "" : "s"} — catch up →
        </Link>
      )}

      {attention.length > 0 && (
        <section aria-label="Needs your attention">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Needs your attention</h2>
            <Link href="/orders" className="text-sm font-semibold text-primary hover:underline">
              All orders
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {attention.slice(0, 4).map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Wallet snapshot" className="rounded-[18px] border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] text-text-subtle">Available in wallet</p>
            <p className="font-mono text-2xl font-bold break-words">
              {balance === null ? "—" : formatINR(balance)}
            </p>
            <p className="mt-1 text-[13px] text-text-muted">Test mode — no real money moves.</p>
          </div>
          <Button variant="secondary" onClick={() => router.push("/wallet")}>
            Open wallet
          </Button>
        </div>
      </section>

      {me.role === "FREELANCER" && (
        <section aria-label="Your services" className="rounded-[18px] border border-border bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Your services</h2>
              <p className="mt-1 text-sm text-text-muted">
                {activeServices} live · {pendingServices} in review
              </p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/services/mine")}>
              Manage services
            </Button>
          </div>
        </section>
      )}

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
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {recent.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
