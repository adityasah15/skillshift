"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ServiceForm, type ServiceFormValues } from "@/components/studio/ServiceForm";
import { RequireFreelancer } from "@/components/studio/RequireFreelancer";
import { ApiRequestError } from "@/lib/api-client";
import { servicesApi } from "@/lib/api/services";
import { uploadServiceImage } from "@/lib/upload";

type Phase =
  | { name: "editing" }
  | { name: "publishing" }
  | { name: "uploading"; id: string; done: number; total: number }
  | { name: "upload-failed"; id: string; done: number; total: number; detail: string }
  | { name: "done"; id: string };

function CreateService() {
  const [phase, setPhase] = useState<Phase>({ name: "editing" });
  const [pending, setPending] = useState<ServiceFormValues | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const busy = phase.name === "publishing" || phase.name === "uploading";

  async function createOnce(v: ServiceFormValues) {
    setPhase({ name: "publishing" });
    setServerError(null);
    setPending(v);
    try {
      const { data } = await servicesApi.create({
        title: v.title,
        description: v.description,
        price: v.pricePaise,
        deliveryDays: v.deliveryDays,
        skills: v.skills,
        imageUrls: [],
      });
      await uploadAll(data.id, v, 0);
    } catch (err) {
      console.error("[studio] create failed", err);
      setServerError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not reach the server. Check your connection and try again — nothing was published.",
      );
      setPhase({ name: "editing" });
    }
  }

  async function uploadAll(id: string, v: ServiceFormValues, from: number) {
    let done = from;
    setPhase({ name: "uploading", id, done: from, total: v.newFiles.length });
    try {
      for (let i = from; i < v.newFiles.length; i++) {
        setPhase({ name: "uploading", id, done: i, total: v.newFiles.length });
        await uploadServiceImage(id, v.newFiles[i], i, v.newFiles.length);
        done = i + 1;
      }
      setPhase({ name: "done", id });
      setPending(null);
    } catch (err) {
      console.error("[studio] upload failed", err);
      setPhase({
        name: "upload-failed",
        id,
        done,
        total: v.newFiles.length,
        detail: err instanceof Error ? err.message : "Upload failed. Please try again.",
      });
    }
  }

  function retryUpload() {
    if (phase.name !== "upload-failed" || !pending) return;
    uploadAll(phase.id, pending, phase.done);
  }

  function publishAnother() {
    setPending(null);
    setServerError(null);
    setFormKey((k) => k + 1);
    setPhase({ name: "editing" });
  }

  if (phase.name === "done") {
    return (
      <div className="rounded-[18px] border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-bold">Sent for review</h2>
        <p className="mt-2 max-w-[68ch] text-[15px] leading-7 text-text-muted">
          Your service is now <strong className="text-text">in review</strong>. It
          becomes visible to clients once approved — usually within a day. You can
          edit details anytime from My services.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/services/mine"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Go to My services
          </Link>
          <Button variant="secondary" onClick={publishAnother}>
            Publish another
          </Button>
        </div>
      </div>
    );
  }

  if (phase.name === "upload-failed") {
    return (
      <div className="rounded-[18px] border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-bold">Published — images need attention</h2>
        <p className="mt-2 max-w-[68ch] text-[15px] leading-7 text-text-muted">
          Good news: your service was created and is{" "}
          <strong className="text-text">in review</strong> — nothing was lost and
          retrying will <strong className="text-text">not</strong> create a
          duplicate. {phase.done} of {phase.total} images uploaded.
        </p>
        <p role="alert" className="mt-3 rounded-[14px] bg-warning-soft px-4 py-3 text-sm leading-6 text-warning">
          {phase.detail}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={retryUpload}>Retry remaining images</Button>
          <Link
            href="/services/mine"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-border px-6 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
          >
            Finish later from My services
          </Link>
        </div>
      </div>
    );
  }

  const busyNote =
    phase.name === "publishing"
      ? "Creating your listing…"
      : phase.name === "uploading"
        ? `Listing created ✓ — uploading image ${Math.min(phase.done + 1, phase.total)} of ${phase.total}…`
        : null;

  return (
    <div className="rounded-[18px] border border-border bg-surface p-6 sm:p-8">
      <ServiceForm
        key={formKey}
        submitLabel="Publish service"
        submitting={busy}
        busyNote={busyNote}
        serverError={serverError}
        onSubmit={createOnce}
      />
    </div>
  );
}

export function NewServicePage() {
  return (
    <RequireFreelancer>
      <CreateService />
    </RequireFreelancer>
  );
}
