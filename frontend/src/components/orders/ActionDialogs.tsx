"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ApiRequestError } from "@/lib/api-client";
import { disputesApi, ordersApi } from "@/lib/api/orders";
import { reviewsApi } from "@/lib/api/reviews";
import { assertUploadable, uploadDeliveryFile } from "@/lib/upload";
import { formatINR } from "@/lib/format";

function useAction() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<unknown>, onDone: () => void) {
    setSubmitting(true);
    setError(null);
    try {
      await fn();
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return { submitting, error, run };
}

function Actions({ onClose, submitting }: { onClose: () => void; submitting: boolean }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" onClick={onClose}>
        Back
      </Button>
      <Button type="submit" loading={submitting}>
        Confirm
      </Button>
    </div>
  );
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm leading-6 text-danger">
      {error}
    </p>
  );
}

export function DeliverDialog({
  open,
  onClose,
  orderId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  // done counts confirm-completed uploads: retry resumes after it, so a
  // retry never duplicates DeliveryFile rows server-side.
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);
  const [busyNote, setBusyNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const busyLabel =
    busyNote ?? (busy ? "Sending delivery…" : null);

  function addFiles(incoming: FileList | null) {
    if (!incoming || busy) return;
    setFileError(null);
    setFiles((cur) => {
      const next = [...cur];
      for (const f of Array.from(incoming)) {
        try {
          assertUploadable(f);
          if (!next.some((x) => x.name === f.name && x.size === f.size)) {
            next.push(f);
          }
        } catch (err) {
          setFileError(err instanceof Error ? `${f.name}: ${err.message}` : `${f.name} rejected.`);
        }
      }
      return next.slice(0, 5);
    });
  }

  function removeFile(target: File) {
    if (busy) return;
    setFiles((cur) => {
      const idx = cur.indexOf(target);
      // Only pending files are removable: confirmed uploads already exist
      // server-side and will show in the cockpit after delivery.
      if (idx !== -1 && idx >= done) return cur.filter((x) => x !== target);
      return cur;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      for (let i = done; i < files.length; i++) {
        setBusyNote(
          files.length > 1
            ? `Uploading file ${i + 1} of ${files.length}…`
            : "Uploading file…",
        );
        await uploadDeliveryFile(orderId, files[i], i, files.length);
        setDone(i + 1);
      }
      setBusyNote("Sending delivery…");
      await ordersApi.deliver(orderId, note.trim());
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
      setBusyNote(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deliver this order"
      description="The client reviews your delivery and releases payment — or auto-completes in 7 days."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Textarea
          label="Delivery note"
          name="deliveryNote"
          required
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was delivered, links, how to use it…"
          maxLength={2000}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium">
            Files{" "}
            <span className="font-normal text-text-subtle">
              (optional{files.length > 0 ? `, ${files.length}/5` : ""})
            </span>
          </p>
          <label
            className={`flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed px-4 py-5 text-center transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft ${
              busy ? "cursor-not-allowed opacity-60" : "border-border-strong hover:border-primary hover:bg-primary-soft/40"
            }`}
          >
            <span className="text-sm font-medium">Attach files or click to browse</span>
            <span className="text-[13px] text-text-subtle">JPG, PNG, PDF, or ZIP — up to 5MB each, max 5</span>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf,application/zip"
              multiple
              disabled={busy}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
              className="sr-only"
            />
          </label>
          {fileError && (
            <p role="alert" className="mt-1.5 text-[13px] text-danger">
              {fileError}
            </p>
          )}
          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${f.size}`}
                  className="flex items-center justify-between gap-3 rounded-[12px] bg-surface-soft/70 px-3.5 py-2.5"
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {f.name}
                    {i < done && <span className="ml-2 font-normal text-success">✓ uploaded</span>}
                  </span>
                  {i >= done ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeFile(f)}
                      aria-label={`Remove ${f.name}`}
                      className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center px-2 text-sm font-semibold text-text-muted hover:text-danger disabled:opacity-60"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="shrink-0 px-2 text-[13px] text-text-subtle">attached</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[13px] leading-6 text-text-muted">
            Files attach to the order and the client can download them from the delivery section.
          </p>
        </div>
        {busyLabel && (
          <p role="status" className="text-sm font-medium text-primary">
            {busyLabel}
          </p>
        )}
        <ErrorNote error={error} />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Back
          </Button>
          <Button type="submit" loading={busy}>
            {done > 0 && done < files.length ? "Retry remaining & deliver" : "Confirm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CompleteDialog({
  open,
  onClose,
  orderId,
  price,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  price: number;
  onDone: () => void;
}) {
  const { submitting, error, run } = useAction();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Accept delivery"
      description="Confirm the work meets your requirements."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => ordersApi.complete(orderId), onDone);
        }}
        className="flex flex-col gap-4"
      >
        <p className="rounded-[14px] bg-success-soft px-4 py-3 text-sm leading-6 text-success">
          {formatINR(price)} releases to the freelancer after you approve. This
          cannot be undone — open a dispute instead if something is wrong.
        </p>
        <ErrorNote error={error} />
        <Actions onClose={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

export function CancelDialog({
  open,
  onClose,
  orderId,
  price,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  price: number;
  onDone: () => void;
}) {
  const { submitting, error, run } = useAction();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel this order"
      description="Only possible before delivery."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => ordersApi.cancel(orderId), onDone);
        }}
        className="flex flex-col gap-4"
      >
        <p className="rounded-[14px] bg-surface-soft px-4 py-3 text-sm leading-6 text-text-muted">
          {formatINR(price)} returns to the client&apos;s available balance. The
          freelancer is notified immediately.
        </p>
        <ErrorNote error={error} />
        <Actions onClose={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

export function DisputeDialog({
  open,
  onClose,
  orderId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  onDone: () => void;
}) {
  const { submitting, error, run } = useAction();
  const [reason, setReason] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Open a dispute"
      description="An admin reviews the full order context and decides."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => disputesApi.create({ orderId, reason: reason.trim() }), onDone);
        }}
        className="flex flex-col gap-4"
      >
        <Textarea
          label="What went wrong?"
          name="reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Be specific — delivery quality, missing items, timeline…"
          maxLength={2000}
        />
        <p className="rounded-[14px] bg-warning-soft px-4 py-3 text-[13px] leading-6 text-warning">
          Funds stay held while the dispute is open. Accepting delivery remains
          possible if you resolve it directly.
        </p>
        <ErrorNote error={error} />
        <Actions onClose={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

export function ReviewDialog({
  open,
  onClose,
  orderId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  onDone: () => void;
}) {
  const { submitting, error, run } = useAction();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rate this order"
      description="Your review appears on the service for future clients."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = comment.trim();
          run(
            () =>
              reviewsApi.create({
                orderId,
                rating,
                ...(trimmed ? { comment: trimmed } : {}),
              }),
            onDone,
          );
        }}
        className="flex flex-col gap-4"
      >
        <div role="radiogroup" aria-label="Rating">
          <p className="mb-1.5 text-sm font-medium">Rating</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-[12px] transition ${
                  n <= rating ? "text-warning" : "text-border-strong hover:text-text-muted"
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M7 1.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L7 10.1 3.5 11.9l.7-3.9L1.4 5.3l3.9-.6L7 1.2z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <Textarea
          label="Comment (optional)"
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What went well?"
          maxLength={2000}
        />
        <ErrorNote error={error} />
        <Actions onClose={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}
