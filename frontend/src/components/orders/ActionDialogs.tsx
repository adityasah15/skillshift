"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ApiRequestError } from "@/lib/api-client";
import { disputesApi, ordersApi } from "@/lib/api/orders";
import { reviewsApi } from "@/lib/api/reviews";
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
  const { submitting, error, run } = useAction();
  const [note, setNote] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deliver this order"
      description="The client reviews your delivery and releases payment — or auto-completes in 7 days."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => ordersApi.deliver(orderId, note.trim()), onDone);
        }}
        className="flex flex-col gap-4"
      >
        <Textarea
          label="Delivery note"
          name="deliveryNote"
          required
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was delivered, links, how to use it…"
          maxLength={2000}
        />
        <ErrorNote error={error} />
        <Actions onClose={onClose} submitting={submitting} />
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
        <div role="group" aria-label="Rating">
          <p className="mb-1.5 text-sm font-medium">Rating</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-pressed={rating === n}
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
