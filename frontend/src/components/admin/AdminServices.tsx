"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { adminApi, type AdminServiceRow } from "@/lib/api/admin";
import { useSessionToken } from "@/lib/session";
import { formatINR } from "@/lib/format";

type Filter = "PENDING_REVIEW" | "ALL" | "ACTIVE" | "REJECTED" | "PAUSED";

const filters: Array<{ value: Filter; label: string }> = [
  { value: "PENDING_REVIEW", label: "Needs review" },
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PAUSED", label: "Paused" },
];

function ServiceDetail({ row }: { row: AdminServiceRow }) {
  return (
    <div className="grid grid-cols-1 gap-4 text-sm leading-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="text-[13px] font-semibold text-text-muted">Full description</p>
        <p className="mt-1 whitespace-pre-wrap text-text">{row.description}</p>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-text-muted">Skills</p>
        {row.skills.length === 0 ? (
          <p className="mt-1 text-text-subtle">No skills listed.</p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Service skills">
            {row.skills.map((s) => (
              <li
                key={s}
                className="rounded-full bg-surface-soft px-3 py-1 text-[13px] font-medium text-text-muted"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="text-[13px] font-semibold text-text-muted">Delivery</p>
        <p className="mt-1 text-text">
          {row.deliveryDays} day{row.deliveryDays === 1 ? "" : "s"} ·{" "}
          <span className="font-mono">{formatINR(row.price)}</span>
        </p>
        <p className="mt-3 text-[13px] font-semibold text-text-muted">Seller</p>
        <p className="mt-1 break-all text-text-muted">{row.freelancer.email}</p>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-text-muted">Submitted</p>
        <p className="mt-1 font-mono text-[13px] text-text-muted">
          {new Date(row.createdAt).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-text-muted">Images</p>
        <p className="mt-1 text-text-muted">
          {row.imageUrls.length === 0
            ? "No images attached."
            : `${row.imageUrls.length} attached — previews unavailable (image keys have no public resolver yet).`}
        </p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-[13px] font-semibold text-text-muted">Service ID</p>
        <p className="mt-1 break-all font-mono text-xs text-text-subtle">{row.id}</p>
      </div>
    </div>
  );
}

export function AdminServices() {
  const token = useSessionToken();
  const [rows, setRows] = useState<AdminServiceRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>("PENDING_REVIEW");
  const [target, setTarget] = useState<{ row: AdminServiceRow; action: "ACTIVE" | "REJECTED" } | null>(null);
  const [acting, setActing] = useState(false);
  const [actError, setActError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  /**
   * Valid moderation moves per status. Backend `moderateService` has no state
   * guard, so the UI hides no-op moves (e.g. rejecting an already-rejected
   * listing) instead of offering them.
   */
  function moderationsFor(status: string): Array<{ label: string; action: "ACTIVE" | "REJECTED" }> {
    if (status === "PENDING_REVIEW") {
      return [
        { label: "Approve", action: "ACTIVE" },
        { label: "Reject", action: "REJECTED" },
      ];
    }
    if (status === "REJECTED") return [{ label: "Restore", action: "ACTIVE" }];
    if (status === "ACTIVE") return [{ label: "Take down", action: "REJECTED" }];
    return []; // PAUSED is the seller's own state — no moderation offered.
  }

  function modalCopy(row: AdminServiceRow, action: "ACTIVE" | "REJECTED"): { title: string; description: string; confirm: string } {
    if (action === "ACTIVE" && row.status === "REJECTED") {
      return {
        title: "Restore service?",
        description: "The listing goes live for all clients immediately.",
        confirm: "Restore listing",
      };
    }
    if (action === "ACTIVE") {
      return {
        title: "Approve service?",
        description: "The listing goes live for all clients immediately.",
        confirm: "Approve listing",
      };
    }
    if (row.status === "ACTIVE") {
      return {
        title: "Take down service?",
        description: "The listing is hidden from clients immediately. The seller keeps it as not approved.",
        confirm: "Take down listing",
      };
    }
    return {
      title: "Reject service?",
      description: "The listing stays hidden from clients. The seller sees it as not approved.",
      confirm: "Reject listing",
    };
  }

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const { data } = await adminApi.listServices();
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
    const list = filter === "ALL" ? rows : rows.filter((r) => r.status === filter);
    return [...list].sort((a, b) => {
      const rank = (s: string) => (s === "PENDING_REVIEW" ? 0 : 1);
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [rows, filter]);

  const pendingCount = useMemo(
    () => rows?.filter((r) => r.status === "PENDING_REVIEW").length ?? 0,
    [rows],
  );

  async function confirm() {
    if (!target) return;
    setActing(true);
    setActError(null);
    try {
      await adminApi.moderateService(target.row.id, target.action);
      setTarget(null);
      const { data } = await adminApi.listServices();
      setRows(data);
    } catch (err) {
      if (err instanceof ApiRequestError) setActError(err.message);
      else setActError("Moderation failed. Check your connection and try again.");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading services">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-24 rounded-[16px]" />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="Could not load services"
        body={failed}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter services">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition ${
              filter === f.value
                ? "bg-text text-white"
                : "border border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
            }`}
          >
            {f.label}
            {f.value === "PENDING_REVIEW" && pendingCount > 0 ? ` · ${pendingCount}` : ""}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={filter === "PENDING_REVIEW" ? "Queue is clear" : "No services here"}
          body={
            filter === "PENDING_REVIEW"
              ? "Every submitted service has been reviewed. New submissions appear here."
              : "No services match this filter yet."
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[16px] border border-border bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[13px] text-text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Service</th>
                  <th scope="col" className="px-5 py-3 font-medium">Seller</th>
                  <th scope="col" className="px-5 py-3 font-medium">Price</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((r) => (
                  <Fragment key={r.id}>
                    <tr className="align-top">
                      <td className="max-w-[320px] px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggle(r.id)}
                          aria-expanded={expanded[r.id] ?? false}
                          className="min-h-[44px] py-1 text-left font-semibold text-primary hover:underline"
                        >
                          {r.title}
                        </button>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-text-muted">{r.description}</p>
                        <p className="mt-1 font-mono text-xs text-text-subtle">{r.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-5 py-4 text-text-muted">{r.freelancer.email}</td>
                      <td className="px-5 py-4 font-mono text-text">{formatINR(r.price)}</td>
                      <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toggle(r.id)}>
                            {expanded[r.id] ? "Hide" : "Details"}
                          </Button>
                          {moderationsFor(r.status).map((m) => (
                            <Button
                              key={m.label}
                              variant={m.action === "REJECTED" ? "danger" : "secondary"}
                              size="sm"
                              onClick={() => setTarget({ row: r, action: m.action })}
                            >
                              {m.label}
                            </Button>
                          ))}
                          {moderationsFor(r.status).length === 0 && (
                            <span className="self-center text-[13px] text-text-subtle">
                              Paused by seller
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded[r.id] && (
                      <tr className="bg-surface-soft/40">
                        <td colSpan={5} className="px-5 py-4">
                          <ServiceDetail row={r} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <ul className="space-y-3 md:hidden">
            {visible.map((r) => (
              <li key={r.id} className="rounded-[16px] border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold text-text">{r.title}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-text-muted">{r.description}</p>
                <p className="mt-2 text-[13px] text-text-muted">{r.freelancer.email}</p>
                <p className="mt-1 font-mono text-sm text-text">{formatINR(r.price)}</p>
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  aria-expanded={expanded[r.id] ?? false}
                  className="mt-2 min-h-[44px] text-sm font-semibold text-primary"
                >
                  {expanded[r.id] ? "Hide details" : "View details"}
                </button>
                {expanded[r.id] && (
                  <div className="mt-2 border-t border-border pt-3">
                    <ServiceDetail row={r} />
                  </div>
                )}
                <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  {moderationsFor(r.status).map((m) => (
                    <Button
                      key={m.label}
                      variant={m.action === "REJECTED" ? "danger" : "secondary"}
                      size="sm"
                      onClick={() => setTarget({ row: r, action: m.action })}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
                {moderationsFor(r.status).length === 0 && (
                  <p className="mt-3 text-[13px] text-text-subtle">
                    Paused by the seller — no moderation needed.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={target !== null}
        onClose={() => (acting ? null : setTarget(null))}
        title={target ? modalCopy(target.row, target.action).title : "Moderate service"}
        description={target ? modalCopy(target.row, target.action).description : undefined}
      >
        {target && (
          <div className="space-y-4">
            <div className="rounded-[12px] border border-border bg-surface-soft/60 p-4">
              <p className="text-sm font-semibold text-text">{target.row.title}</p>
              <p className="mt-1 font-mono text-[13px] text-text-muted">
                {formatINR(target.row.price)} · {target.row.freelancer.email}
              </p>
            </div>
            {actError && (
              <p role="alert" className="text-sm text-danger">{actError}</p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setTarget(null)} disabled={acting}>
                Cancel
              </Button>
              <Button
                variant={target.action === "ACTIVE" ? "primary" : "danger"}
                onClick={confirm}
                loading={acting}
              >
                {modalCopy(target.row, target.action).confirm}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
