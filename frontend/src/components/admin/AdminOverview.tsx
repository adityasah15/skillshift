"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { adminApi, type AdminAnalytics } from "@/lib/api/admin";
import { useSessionToken } from "@/lib/session";
import { formatCount, formatINR } from "@/lib/format";

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-5">
      <p className="text-[13px] font-medium text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-text">{value}</p>
      {hint && <p className="mt-1 text-[13px] leading-5 text-text-subtle">{hint}</p>}
    </div>
  );
}

function Bar({ label, count, max }: { label: React.ReactNode; count: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0">{label}</div>
      <div
        className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-soft"
        role="img"
        aria-label={`${count} orders`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-[13px] text-text-muted">
        {formatCount(count)}
      </span>
    </div>
  );
}

export function AdminOverview() {
  const token = useSessionToken();
  const [data, setData] = useState<AdminAnalytics | null>(null);
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
        const { data } = await adminApi.analytics();
        if (!cancelled) setData(data);
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

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading analytics">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-28 rounded-[16px]" />
          ))}
        </div>
        <div className="skeleton-shimmer h-56 rounded-[16px]" />
      </div>
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="Could not load analytics"
        body={failed}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No analytics yet"
        body="Metrics appear once orders and users exist."
      />
    );
  }

  const totalOrders = data.ordersByStatus.reduce((n, r) => n + r.count, 0);
  const maxStatus = Math.max(0, ...data.ordersByStatus.map((r) => r.count));
  const maxDay = Math.max(0, ...data.newUsersPerDay.map((d) => d.count));
  const newUsersTotal = data.newUsersPerDay.reduce((n, d) => n + d.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total orders" value={formatCount(totalOrders)} hint="All time" />
        <Kpi label="Released revenue" value={formatINR(data.revenue)} hint="Escrow released to freelancers" />
        <Kpi label="Dispute rate" value={`${data.disputeRate.toFixed(2)}%`} hint="Disputes ÷ orders" />
        <Kpi label="New users · 30d" value={formatCount(newUsersTotal)} hint="Signups in the last 30 days" />
      </div>

      <section
        aria-label="Orders by status"
        className="rounded-[16px] border border-border bg-surface p-5 sm:p-6"
      >
        <h2 className="text-lg font-semibold">Orders by status</h2>
        <p className="mt-1 text-sm text-text-muted">Where every order currently sits.</p>
        {data.ordersByStatus.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {[...data.ordersByStatus]
              .sort((a, b) => b.count - a.count)
              .map((r) => (
                <Bar key={r.status} label={<StatusBadge status={r.status} />} count={r.count} max={maxStatus} />
              ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          aria-label="New users per day"
          className="rounded-[16px] border border-border bg-surface p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold">New users · last 30 days</h2>
          <p className="mt-1 text-sm text-text-muted">Daily signups, oldest to newest.</p>
          {data.newUsersPerDay.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">No signups in this window.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.newUsersPerDay.slice(-14).map((d) => (
                <li key={String(d.date)} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-mono text-[13px] text-text-muted">
                    {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft"
                    role="img"
                    aria-label={`${d.count} signups`}
                  >
                    <div
                      className="h-full rounded-full bg-info"
                      style={{ width: `${maxDay > 0 ? Math.max(4, Math.round((d.count / maxDay) * 100)) : 0}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[13px] text-text-muted">
                    {d.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-label="Top freelancers"
          className="rounded-[16px] border border-border bg-surface p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold">Top freelancers</h2>
          <p className="mt-1 text-sm text-text-muted">Highest rated with completed profiles.</p>
          {data.topFreelancers.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">No rated freelancers yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.topFreelancers.map((f) => (
                <li key={f.id} className="flex min-h-[44px] items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">
                      {f.profile?.displayName ?? f.email}
                    </p>
                    <p className="truncate text-[13px] text-text-muted">{f.email}</p>
                  </div>
                  <p className="shrink-0 font-mono text-[13px] text-text-muted">
                    ★ {f.profile ? f.profile.rating.toFixed(1) : "—"} ·{" "}
                    {f.profile ? formatCount(f.profile.totalReviews) : 0} reviews
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
