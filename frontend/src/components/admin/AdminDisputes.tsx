"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { adminApi, type AdminDispute, type DisputeResolution } from "@/lib/api/admin";
import { useSessionToken } from "@/lib/session";
import { formatINR } from "@/lib/format";

export function AdminDisputes() {
  const token = useSessionToken();
  const [rows, setRows] = useState<AdminDispute[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [showResolved, setShowResolved] = useState(false);
  const [target, setTarget] = useState<{ dispute: AdminDispute; resolution: DisputeResolution } | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [actError, setActError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [orderMeta, setOrderMeta] = useState<
    Record<string, { serviceTitle: string; freelancerEmail: string }>
  >({});

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const [{ data }, ordersRes] = await Promise.all([
          adminApi.listDisputes(),
          adminApi.listOrders().catch(() => null),
        ]);
        if (cancelled) return;
        setRows(data);
        if (ordersRes) {
          const meta: Record<string, { serviceTitle: string; freelancerEmail: string }> = {};
          for (const o of ordersRes.data) {
            meta[o.id] = { serviceTitle: o.service.title, freelancerEmail: o.freelancer.email };
          }
          setOrderMeta(meta);
        }
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

  const open = useMemo(() => rows?.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW") ?? [], [rows]);
  const resolved = useMemo(
    () => rows?.filter((d) => d.status !== "OPEN" && d.status !== "UNDER_REVIEW") ?? [],
    [rows],
  );
  const visible = showResolved ? resolved : open;

  function openResolve(dispute: AdminDispute, resolution: DisputeResolution) {
    setTarget({ dispute, resolution });
    setNote(dispute.adminNote ?? "");
    setActError(null);
  }

  async function confirm() {
    if (!target) return;
    setActing(true);
    setActError(null);
    try {
      await adminApi.resolveDispute(target.dispute.id, {
        resolution: target.resolution,
        adminNote: note,
      });
      setTarget(null);
      const { data } = await adminApi.listDisputes();
      setRows(data);
    } catch (err) {
      if (err instanceof ApiRequestError) setActError(err.message);
      else setActError("Resolution failed. Check your connection and try again.");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading disputes">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-44 rounded-[16px]" />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="Could not load disputes"
        body={failed}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter disputes">
        <button
          type="button"
          onClick={() => setShowResolved(false)}
          aria-pressed={!showResolved}
          className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition ${
            !showResolved ? "bg-text text-white" : "border border-border bg-surface text-text-muted hover:text-text"
          }`}
        >
          Open · {open.length}
        </button>
        <button
          type="button"
          onClick={() => setShowResolved(true)}
          aria-pressed={showResolved}
          className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition ${
            showResolved ? "bg-text text-white" : "border border-border bg-surface text-text-muted hover:text-text"
          }`}
        >
          Resolved · {resolved.length}
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={showResolved ? "No resolved disputes" : "No open disputes"}
          body={
            showResolved
              ? "Resolved disputes with the decision and note appear here."
              : "New client disputes land here with full order context for a decision."
          }
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((d) => (
            <li key={d.id} className="rounded-[16px] border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-text">
                    Order <span className="font-mono text-[13px] text-text-muted">{d.orderId.slice(0, 8)}</span>
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {d.client.email} · <span className="font-mono">{formatINR(d.order.price)}</span>
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 rounded-[12px] border border-border bg-surface-soft/50 p-4 text-sm leading-6 md:grid-cols-2">
                <div>
                  <p className="text-[13px] font-semibold text-text-muted">Client reason</p>
                  <p className="mt-1 text-text">{d.reason}</p>
                  {d.order.requirements && (
                    <>
                      <p className="mt-3 text-[13px] font-semibold text-text-muted">Original requirements</p>
                      <p className="mt-1 text-text-muted">{d.order.requirements}</p>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-text-muted">Delivery</p>
                  <p className="mt-1 text-text">{d.order.deliveryNote ?? "No delivery note yet."}</p>
                  <p className="mt-3 text-[13px] font-semibold text-text-muted">Order status</p>
                  <p className="mt-1"><StatusBadge status={d.order.status} /></p>
                  {d.adminNote && (
                    <>
                      <p className="mt-3 text-[13px] font-semibold text-text-muted">Admin note</p>
                      <p className="mt-1 text-text-muted">{d.adminNote}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpanded((e) => ({ ...e, [d.id]: !e[d.id] }))}
                  aria-expanded={expanded[d.id] ?? false}
                >
                  {expanded[d.id] ? "Hide order context" : "Full order context"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(d.orderId);
                      setCopied(d.id);
                      setTimeout(() => setCopied((c) => (c === d.id ? null : c)), 1600);
                    } catch {
                      setCopied(null);
                    }
                  }}
                >
                  {copied === d.id ? "Copied" : "Copy order ID"}
                </Button>
                {!showResolved && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => openResolve(d, "RESOLVED_FREELANCER")}>
                      Resolve for freelancer
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openResolve(d, "RESOLVED_CLIENT")}>
                      Resolve for client
                    </Button>
                  </>
                )}
              </div>

              {expanded[d.id] && (
                <div className="mt-3 rounded-[12px] border border-border bg-surface-soft/50 p-4 text-sm leading-6">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-[13px] font-semibold text-text-muted">Service</dt>
                      <dd className="text-text">{orderMeta[d.orderId]?.serviceTitle ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-semibold text-text-muted">Amount held</dt>
                      <dd className="font-mono text-text">{formatINR(d.order.price)}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-semibold text-text-muted">Client</dt>
                      <dd className="break-all text-text-muted">{d.client.email}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-semibold text-text-muted">Freelancer</dt>
                      <dd className="break-all text-text-muted">
                        {orderMeta[d.orderId]?.freelancerEmail ?? d.order.freelancerId}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-semibold text-text-muted">Order ID</dt>
                      <dd className="break-all font-mono text-[13px] text-text-muted">{d.orderId}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-semibold text-text-muted">Dispute filed</dt>
                      <dd className="font-mono text-[13px] text-text-muted">
                        {new Date(d.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[13px] text-text-subtle">
                    Admin view — participant chat and delivery files are not exposed to admins
                    by the current API, so decisions use the reason, requirements, and delivery note above.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={target !== null}
        onClose={() => (acting ? null : setTarget(null))}
        title={target?.resolution === "RESOLVED_FREELANCER" ? "Resolve for freelancer?" : "Resolve for client?"}
        description={
          target?.resolution === "RESOLVED_FREELANCER"
            ? "Order completes and held funds release to the freelancer. This cannot be undone."
            : "Order refunds and held funds return to the client wallet. This cannot be undone."
        }
      >
        {target && (
          <div className="space-y-4">
            <div className="rounded-[12px] border border-border bg-surface-soft/60 p-4 text-sm">
              <p className="font-semibold text-text">Order <span className="font-mono text-[13px]">{target.dispute.orderId.slice(0, 8)}</span></p>
              <p className="mt-1 font-mono text-text-muted">{formatINR(target.dispute.order.price)}</p>
            </div>
            <Textarea
              label="Decision note (optional)"
              name="adminNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this side wins — visible in the record."
              maxLength={2000}
            />
            {actError && (
              <p role="alert" className="text-sm text-danger">{actError}</p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setTarget(null)} disabled={acting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirm} loading={acting}>
                Confirm resolution
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
