"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireFreelancer } from "@/components/studio/RequireFreelancer";
import { ServiceForm, type ServiceFormValues } from "@/components/studio/ServiceForm";
import { ApiRequestError } from "@/lib/api-client";
import { servicesApi } from "@/lib/api/services";
import { formatINR } from "@/lib/format";
import { uploadServiceImage } from "@/lib/upload";
import type { Service } from "@/lib/types";

function MineList() {
  const router = useRouter();
  const [services, setServices] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
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
        const { data } = await servicesApi.mine();
        if (!cancelled) setServices(data);
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

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2" aria-label="Loading your services">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton-shimmer h-56 rounded-[16px]" />
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
        body="Publish your first service — clear scope and honest pricing get ordered."
        action={{ label: "Publish a service", onClick: () => router.push("/services/new") }}
      />
    );
  }

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2">
        {services.map((s) => (
          <li
            key={s.id}
            className="flex flex-col rounded-[16px] border border-border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-[17px] leading-6 font-semibold">{s.title}</h3>
              <StatusBadge status={s.status} />
            </div>
            <p className="mt-2 font-mono text-[15px] font-bold">{formatINR(s.price)}</p>
            {s.status === "REJECTED" && (
              <p className="mt-2 rounded-[12px] bg-danger-soft px-3 py-2 text-[13px] leading-6 text-danger">
                Not approved and hidden from clients. Edit the listing to fix flagged
                issues — visibility needs a fresh review.
              </p>
            )}
            {s.status === "PENDING_REVIEW" && (
              <p className="mt-2 text-[13px] leading-6 text-text-muted">
                In review — visible to clients once approved. Status changes are
                handled by review, not from here.
              </p>
            )}
            <div className="mt-4 flex gap-2 border-t border-border pt-4">
              <Button variant="secondary" size="sm" onClick={() => { setFormError(null); setEditing(s); }}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(s)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit service"
        description="Changes apply immediately to the live listing."
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
      <div className="mb-5 flex justify-end">
        <Link
          href="/services/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          + New service
        </Link>
      </div>
      <MineList />
    </RequireFreelancer>
  );
}
