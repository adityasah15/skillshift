"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { adminApi, type AdminOrderRow } from "@/lib/api/admin";
import { useSessionToken } from "@/lib/session";
import { formatINR } from "@/lib/format";

const filters = ["ALL", "IN_PROGRESS", "DELIVERED", "DISPUTED", "COMPLETED", "CANCELLED", "REFUNDED", "PENDING"] as const;
type Filter = (typeof filters)[number];

export function AdminOrders() {
  const token = useSessionToken();
  const [rows, setRows] = useState<AdminOrderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const { data } = await adminApi.listOrders();
        if (!cancelled) setRows(data);
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
  }, [token, attempt]);

  const visible = useMemo(() => {
    if (!rows) return [];
    return filter === "ALL" ? rows : rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading orders">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-[16px]" />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="Could not load orders"
        body={failed}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Filter orders">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-semibold transition ${
              filter === f ? "bg-text text-white" : "border border-border bg-surface text-text-muted hover:text-text"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase().replace("_", " ")}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No orders here"
          body="Orders appear here as clients book. Try a different status filter."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[16px] border border-border bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[13px] text-text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Order</th>
                  <th scope="col" className="px-5 py-3 font-medium">Parties</th>
                  <th scope="col" className="px-5 py-3 font-medium">Price</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td className="max-w-[300px] px-5 py-4">
                      <Link href={`/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                        {o.service.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-text-subtle">{o.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-text-muted">
                      <p className="truncate">Client: {o.client.email}</p>
                      <p className="truncate">Seller: {o.freelancer.email}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-text">{formatINR(o.price)}</td>
                    <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((o) => (
              <li key={o.id} className="rounded-[16px] border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/orders/${o.id}`} className="text-[15px] font-semibold text-primary hover:underline">
                    {o.service.title}
                  </Link>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-1 font-mono text-sm text-text">{formatINR(o.price)}</p>
                <p className="mt-1 truncate text-[13px] text-text-muted">{o.client.email} → {o.freelancer.email}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
