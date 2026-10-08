"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ApiRequestError } from "@/lib/api-client";
import { ordersApi } from "@/lib/api/orders";
import { useSessionToken } from "@/lib/session";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { formatINR } from "@/lib/format";

export function BookingDialog({
  open,
  onClose,
  serviceId,
  serviceTitle,
  price,
}: {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  serviceTitle: string;
  price: number;
}) {
  const token = useSessionToken();
  const { role } = useCurrentUser();
  const [requirements, setRequirements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const trimmed = requirements.trim();
      const { data } = await ordersApi.create({
        serviceId,
        ...(trimmed ? { requirements: trimmed } : {}),
      });
      setOrderId(data.id);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not place the order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    if (submitting) return;
    setError(null);
    if (orderId) {
      setOrderId(null);
      setRequirements("");
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={orderId ? "Order placed" : "Book this service"}
      description={
        orderId
          ? "Your payment is now held safely until you approve the delivery."
          : serviceTitle
      }
    >
      {orderId ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-[14px] bg-success-soft px-4 py-3 text-sm leading-6 text-success">
            Order confirmed. Chat with the freelancer from your order to share
            details and track progress.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Go to your order
            </Link>
            <Button variant="secondary" onClick={close}>
              Keep browsing
            </Button>
          </div>
        </div>
      ) : !token ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-7 text-text-muted">
            Log in as a client to place an order for{" "}
            <strong className="text-text">{formatINR(price)}</strong>. Your
            payment stays protected in escrow until you approve the work.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/auth/login?next=${encodeURIComponent(`/services/${serviceId}`)}`}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Log in to continue
            </Link>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      ) : role === "FREELANCER" ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-[14px] bg-warning-soft px-4 py-3 text-sm leading-6 text-warning">
            You’re logged in as a freelancer. Ordering needs a separate client
            account — one account holds one role.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/auth/login?next=${encodeURIComponent(`/services/${serviceId}`)}`}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Log in as a client
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[12px] border border-border px-5 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
            >
              Join as a client
            </Link>
          </div>
          <Button variant="secondary" onClick={close}>
            Back
          </Button>
        </div>
      ) : role === "ADMIN" ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-[14px] bg-surface-soft px-4 py-3 text-sm leading-6 text-text-muted">
            Admin accounts can’t place orders. Review this listing from the
            moderation queue instead.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/services"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Go to moderation
            </Link>
            <Button variant="secondary" onClick={close}>
              Back
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-4"
        >
          <Textarea
            label="Requirements for the freelancer (optional)"
            name="requirements"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Timeline, references, must-haves…"
            maxLength={2000}
          />
          <p className="rounded-[14px] bg-warning-soft px-4 py-3 text-[13px] leading-6 text-warning">
            {formatINR(price)} will be held in escrow after you approve — the
            freelancer is paid only when you accept the delivery. Test mode — no
            real money moves.
          </p>
          {error && (
            <p role="alert" className="text-sm leading-6 text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Place order · {formatINR(price)}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
