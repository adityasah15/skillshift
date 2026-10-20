"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Drawer, Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { GeneratedCover } from "@/components/marketplace/GeneratedCover";
import { RequireFreelancer } from "@/components/studio/RequireFreelancer";
import { ServiceForm, type ServiceFormValues } from "@/components/studio/ServiceForm";
import { ApiRequestError } from "@/lib/api-client";
import { servicesApi } from "@/lib/api/services";
import { usersApi } from "@/lib/api/users";
import { formatINR } from "@/lib/format";
import { uploadServiceImage } from "@/lib/upload";
import type { Service } from "@/lib/types";

type Filter = "ALL" | "ACTIVE" | "PENDING_REVIEW" | "ATTENTION";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Live" },
  { value: "PENDING_REVIEW", label: "In review" },
  { value: "ATTENTION", label: "Not approved" },
];

function matches(service: Service, filter: Filter): boolean {
  if (filter === "ALL") return true;
  if (filter === "ATTENTION") {
    return service.status === "REJECTED" || service.status === "PAUSED";
  }
  return service.status === filter;
}

function statusNote(status: string): string | null {
  if (status === "PENDING_REVIEW") {
    return "In review. Goes live once an admin approves it.";
  }
  if (status === "REJECTED") {
    return "Hidden from clients. Fixing it here doesn't resubmit; an admin restores visibility after review.";
  }
  if (status === "PAUSED") return "Paused. Not visible to clients.";
  return null;
}

function Thumb({ service }: { service: Service }) {
  return (
    <GeneratedCover
      title={service.title}
      imageUrls={service.imageUrls}
      chip={false}
      imageAlt={service.title}
      monogramClassName="text-lg"
      className="h-12 w-16 shrink-0 rounded-[8px] border border-border"
    />
  );
}

function MineList() {
  const router = useRouter();
  const [services, setServices] = useState<Service[] | null>(null);
  const [sellerName, setSellerName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyNote, setBusyNote] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const [mine, me] = await Promise.all([
          servicesApi.mine(),
          usersApi.me().catch(() => null),
        ]);
        if (cancelled) return;
        setServices(mine.data);
        if (me) {
          setSellerName(me.data.profile?.displayName ?? me.data.email);
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
  }, [attempt]);

  async function saveEdit(svc: Service, v: ServiceFormValues) {
    setSaving(true);
    setFormError(null);
    try {
      const newKeys: string[] = [];
      for (let i = 0; i < v.newFiles.length; i++) {
        const f = v.newFiles[i];
        setBusyNote(`Uploading image ${i + 1} of ${v.newFiles.length}…`);
        newKeys.push(await uploadServiceImage(svc.id, f, i, v.newFiles.length));
      }
      // Confirm auto-appends keys server-side; PATCH the merged set to also
      // honor removals.
      await servicesApi.update(svc.id, {
        title: v.title,
        description: v.description,
        price: v.pricePaise,
        deliveryDays: v.deliveryDays,
        skills: v.skills,
        imageUrls: [...v.keptImageUrls, ...newKeys],
      });
      setEditing(null);
      setAttempt((n) => n + 1);
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Could not save changes. Please try again.",
      );
    } finally {
      setSaving(false);
      setBusyNote(null);
    }
  }

  async function confirmDelete(svc: Service) {
    try {
      await servicesApi.remove(svc.id);
      setDeleting(null);
      setAttempt((n) => n + 1);
    } catch {
      setDeleting(null);
      setFailed("Could not delete the service. Please try again.");
    }
  }

  const counts = useMemo(() => {
    const list = services ?? [];
    const count = (f: Filter) => list.filter((s) => matches(s, f)).length;
    return {
      ALL: count("ALL"),
      ACTIVE: count("ACTIVE"),
      PENDING_REVIEW: count("PENDING_REVIEW"),
      ATTENTION: count("ATTENTION"),
    } as Record<Filter, number>;
  }, [services]);

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading your services">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-[10px]" />
        ))}
      </div>
    );
  }

  if (failed || services === null) {
    return (
      <ErrorState
        title="Could not load your services"
        body={failed ?? "Please try again."}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (services.length === 0) {
    return (
      <EmptyState
        title="No services yet"
        body="Publish your first service. Clear scope and honest pricing get ordered."
        action={{ label: "Publish a service", onClick: () => router.push("/services/new") }}
      />
    );
  }

  const visible = services.filter((s) => matches(s, filter));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter services">
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            count={counts[f.value]}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="Nothing in this filter"
            body="Try another filter. Your other listings are still here."
          />
        </div>
      ) : (
        <>
          <div className="mt-3 hidden overflow-hidden rounded-[10px] border border-border bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[13px] text-text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Service</th>
                  <th scope="col" className="px-5 py-3 font-medium">Price</th>
                  <th scope="col" className="px-5 py-3 font-medium">Delivery</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((s) => {
                  const note = statusNote(s.status);
                  return (
                    <tr key={s.id} className="align-middle">
                      <td className="max-w-[380px] px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Thumb service={s} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-text">{s.title}</p>
                            <p className="mt-0.5 truncate text-[12px] text-text-subtle">
                              {s.skills.slice(0, 3).join(" · ") || "No skills listed"}
                            </p>
                            {note && (
                              <p
                                className={`mt-0.5 line-clamp-2 text-[12px] leading-4 ${
                                  s.status === "REJECTED" ? "text-danger" : "text-text-subtle"
                                }`}
                              >
                                {note}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="tabular px-5 py-4 font-semibold text-text">
                        {formatINR(s.price)}
                      </td>
                      <td className="px-5 py-4 text-text-muted">
                        {s.deliveryDays} day{s.deliveryDays === 1 ? "" : "s"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setFormError(null);
                              setEditing(s);
                            }}
                          >
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(s)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-3 space-y-3 md:hidden">
            {visible.map((s) => {
              const note = statusNote(s.status);
              return (
                <li key={s.id} className="rounded-[10px] border border-border bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <Thumb service={s} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-[15px] font-semibold text-text">
                          {s.title}
                        </p>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="tabular mt-1 text-sm font-semibold text-text">
                        {formatINR(s.price)}
                      </p>
                      <p className="mt-0.5 text-[12px] text-text-subtle">
                        {s.deliveryDays}-day delivery
                      </p>
                    </div>
                  </div>
                  {note && (
                    <p
                      className={`mt-3 rounded-[8px] px-3 py-2 text-[13px] leading-5 ${
                        s.status === "REJECTED"
                          ? "bg-danger-soft text-danger"
                          : "bg-surface-soft text-text-muted"
                      }`}
                    >
                      {note}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFormError(null);
                        setEditing(s);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(s)}>
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit service"
        description={
          editing?.status === "ACTIVE"
            ? "Changes apply immediately to the live listing."
            : "Changes are saved; visibility is handled by the admin review queue."
        }
        size="lg"
      >
        {editing && (
          <ServiceForm
            key={editing.id}
            initial={{
              title: editing.title,
              description: editing.description,
              pricePaise: editing.price,
              deliveryDays: editing.deliveryDays,
              skills: editing.skills,
              imageUrls: editing.imageUrls,
            }}
            submitLabel="Save changes"
            submitting={saving}
            busyNote={busyNote}
            serverError={formError}
            showPreview
            previewName={sellerName}
            onSubmit={(v) => saveEdit(editing, v)}
          />
        )}
      </Drawer>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this service?"
        description="Clients can no longer find or order it. Existing orders are unaffected."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => deleting && confirmDelete(deleting)}
          >
            Delete service
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function MyServicesPage() {
  return (
    <RequireFreelancer>
      <MineList />
    </RequireFreelancer>
  );
}
