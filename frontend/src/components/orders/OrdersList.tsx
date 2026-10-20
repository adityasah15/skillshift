"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderCard } from "@/components/orders/OrderCard";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { ordersApi } from "@/lib/api/orders";
import { useSessionToken } from "@/lib/session";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { OrderListItem } from "@/lib/types";

export function OrdersList() {
  const router = useRouter();
  const token = useSessionToken();
  const { role, loading: roleLoading } = useCurrentUser();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Orders are only for clients and freelancers; admins belong in /admin.
  useEffect(() => {
    if (role === "ADMIN") router.replace("/admin");
  }, [role, router]);

  useEffect(() => {
    if (token === null || roleLoading || role === "ADMIN") return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const { data } = await ordersApi.list();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError) setFailed(err.message);
        else setFailed("We could not reach the server. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, role, roleLoading, attempt]);

  if (token === null) {
    return (
      <EmptyState
        title="Log in to view your orders"
        body="Orders live here once you're part of one, as client or freelancer."
        action={{ label: "Log in", onClick: () => router.push("/auth/login?next=%2Forders") }}
      />
    );
  }

  // Redirecting an admin — don't flash the "no orders" empty state.
  if (role === "ADMIN") return <SkeletonGrid count={2} />;

  if (loading || roleLoading) return <SkeletonGrid count={6} />;

  if (failed) {
    return (
      <ErrorState
        title="Could not load your orders"
        body={failed}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (!orders || orders.length === 0) {
    const isFreelancer = role === "FREELANCER";
    return (
      <EmptyState
        title="No orders yet"
        body={
          isFreelancer
            ? "When a client orders your work, it will appear here with status and payment state."
            : "When you book a service, it will appear here with status and payment state."
        }
        action={
          isFreelancer
            ? { label: "Publish a service", onClick: () => router.push("/services/new") }
            : { label: "Browse services", onClick: () => router.push("/services") }
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </div>
  );
}
