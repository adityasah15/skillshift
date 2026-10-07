"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ImagePicker } from "@/components/studio/ImagePicker";
import { resolvePublicImage } from "@/lib/images";

export interface ServiceFormValues {
  title: string;
  description: string;
  pricePaise: number;
  deliveryDays: number;
  skills: string[];
  newFiles: File[];
  keptImageUrls: string[];
}

export function ServiceForm({
  initial,
  submitLabel,
  submitting,
  busyNote,
  serverError,
  onSubmit,
}: {
  initial?: {
    title: string;
    description: string;
    pricePaise: number;
    deliveryDays: number;
    skills: string[];
    imageUrls: string[];
  };
  submitLabel: string;
  submitting: boolean;
  busyNote?: string | null;
  serverError: string | null;
  onSubmit: (values: ServiceFormValues) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [rupees, setRupees] = useState(initial ? String(initial.pricePaise / 100) : "");
  const [days, setDays] = useState(initial ? String(initial.deliveryDays) : "");
  const [skillsText, setSkillsText] = useState(initial?.skills.join(", ") ?? "");
  const [kept, setKept] = useState<string[]>(initial?.imageUrls ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(rupees);
    const pricePaise = Math.round(price * 100);
    const deliveryDays = Number(days);
    const skills = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
    if (!title.trim() || !description.trim()) {
      setLocalError("Give your service a title and a description.");
      return;
    }
    if (!Number.isFinite(price) || pricePaise <= 0 || !Number.isInteger(pricePaise)) {
      setLocalError("Enter a whole-rupee price greater than ₹0.");
      return;
    }
    if (!Number.isInteger(deliveryDays) || deliveryDays <= 0) {
      setLocalError("Delivery time must be at least 1 day.");
      return;
    }
    if (skills.length === 0) {
      setLocalError("Add at least one skill so clients can find you.");
      return;
    }
    if (kept.length + files.length === 0) {
      setLocalError("Add at least one image — listings with photos get ordered more.");
      return;
    }
    setLocalError(null);
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      pricePaise,
      deliveryDays,
      skills,
      newFiles: files,
      keptImageUrls: kept,
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Title"
        name="title"
        required
        disabled={submitting}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Brand identity kit with logo and guidelines"
        maxLength={200}
      />
      <Textarea
        label="Description"
        name="description"
        required
        disabled={submitting}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Scope, process, revisions, what the client receives…"
        maxLength={5000}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Price (₹)"
          name="price"
          type="number"
          min="1"
          step="1"
          required
          disabled={submitting}
          value={rupees}
          onChange={(e) => setRupees(e.target.value)}
          placeholder="4999"
        />
        <Input
          label="Delivery (days)"
          name="deliveryDays"
          type="number"
          min="1"
          step="1"
          required
          disabled={submitting}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder="5"
        />
      </div>
      <Input
        label="Skills (comma separated)"
        name="skills"
        required
        disabled={submitting}
        value={skillsText}
        onChange={(e) => setSkillsText(e.target.value)}
        placeholder="Logo design, Brand guidelines"
      />
      {kept.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-text">Current images</p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {kept.map((u) => {
              const src = resolvePublicImage(u);
              const name = u.split("/").pop() ?? u;
              return (
                <li
                  key={u}
                  className="relative overflow-hidden rounded-[12px] border border-border"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={name}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex aspect-square w-full items-center justify-center bg-surface-soft text-xl font-bold text-text-subtle"
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setKept(kept.filter((x) => x !== u))}
                    aria-label={`Remove ${name}`}
                    className="absolute top-1 right-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-text/70 text-sm font-bold text-white transition hover:bg-text disabled:opacity-60"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-[13px] text-text-subtle">
            Stored on S3 — previews appear once public image hosting is configured.
          </p>
        </div>
      )}
      <ImagePicker files={files} onChange={setFiles} disabled={submitting} />
      {(localError || serverError) && (
        <p role="alert" className="text-sm leading-6 text-danger">
          {localError ?? serverError}
        </p>
      )}
      {busyNote && <p aria-live="polite" className="text-sm text-text-muted">{busyNote}</p>}
      <Button type="submit" loading={submitting} size="lg" className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
