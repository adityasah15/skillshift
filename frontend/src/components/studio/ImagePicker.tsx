"use client";

import { useState } from "react";
import { assertUploadable } from "@/lib/upload";

/**
 * Local image picker: validates type/size on select, shows object-URL
 * previews. Actual S3 upload happens on submit (needs the service id).
 */
export function ImagePicker({
  files,
  onChange,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [localError, setLocalError] = useState<string | null>(null);

  function add(incoming: FileList | null) {
    if (!incoming) return;
    setLocalError(null);
    const next = [...files];
    for (const f of Array.from(incoming)) {
      try {
        assertUploadable(f);
        if (!next.some((x) => x.name === f.name && x.size === f.size)) {
          next.push(f);
        }
      } catch (err) {
        setLocalError(err instanceof Error ? `${f.name}: ${err.message}` : `${f.name} rejected.`);
      }
    }
    onChange(next.slice(0, 5));
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-text">
        Images {files.length > 0 && <span className="text-text-subtle">({files.length}/5)</span>}
      </p>
      <label
        className={`flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border border-dashed px-4 py-6 text-center transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft ${
          disabled ? "cursor-not-allowed opacity-60" : "border-border-strong hover:border-primary hover:bg-primary-soft/40"
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden className="text-text-subtle">
          <path d="M10 13.5v-9m0 0L6.5 8M10 4.5L13.5 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.5 13.5v2a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium">Drop images or click to browse</span>
        <span className="text-[13px] text-text-subtle">JPG or PNG, up to 5MB each</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          disabled={disabled}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
        />
      </label>
      {localError && (
        <p role="alert" className="mt-1.5 text-[13px] text-danger">
          {localError}
        </p>
      )}
      {files.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {files.map((f) => (
            <li key={`${f.name}-${f.size}`} className="relative overflow-hidden rounded-[12px] border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(files.filter((x) => x !== f))}
                aria-label={`Remove ${f.name}`}
                className="absolute top-1 right-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-text/70 text-sm font-bold text-white transition hover:bg-text disabled:opacity-60"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
