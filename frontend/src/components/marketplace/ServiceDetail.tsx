"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { BookingDialog } from "@/components/marketplace/BookingDialog";
import { ApiRequestError } from "@/lib/api-client";
import { servicesApi } from "@/lib/api/services";
import { reviewsApi } from "@/lib/api/reviews";
import { usersApi } from "@/lib/api/users";
import { formatINR } from "@/lib/format";
import { resolvePublicImage } from "@/lib/images";
import { MOCK_SERVICES } from "@/lib/mock-services";
import type { PublicProfile, Service, ServiceReview } from "@/lib/types";

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
          className={i < Math.round(value) ? "text-warning" : "text-border-strong"}
        >
          <path
            d="M7 1.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L7 10.1 3.5 11.9l.7-3.9L1.4 5.3l3.9-.6L7 1.2z"
            fill="currentColor"
          />
        </svg>
      ))}
    </span>
  );
}

export function ServiceDetail({ id }: { id: string }) {
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [seller, setSeller] = useState<PublicProfile | null>(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [booking, setBooking] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      setNotFound(false);
      try {
        const [{ data }, reviewsRes] = await Promise.all([
          servicesApi.get(id),
          reviewsApi.forService(id).catch(() => ({ data: [] as ServiceReview[] })),
        ]);
        if (cancelled) return;
        setService(data);
        setReviews(reviewsRes.data);
        setPreview(false);
        usersApi
          .publicProfile(data.freelancerId)
          .then((r) => {
            if (!cancelled) setSeller(r.data);
          })
          .catch(() => {
            if (!cancelled) setSeller(null);
          });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.statusCode === 404) {
          setNotFound(true);
        } else if (err instanceof ApiRequestError && err.statusCode < 500) {
          setFailed(err.message);
        } else {
          const mock = MOCK_SERVICES.find((m) => m.id === id);
          if (mock) {
            setService({
              id: mock.id,
              freelancerId: `mock-${mock.id}`,
              title: mock.title,
              description: `Example brief for “${mock.title}”. The freelancer confirms scope in chat before starting, then delivers through the order page. Live description appears here once the backend is reachable.`,
              price: mock.price,
              deliveryDays: mock.deliveryDays,
              skills: [...mock.skills],
              imageUrls: [],
              status: mock.status,
              createdAt: new Date().toISOString(),
            });
            setReviews([]);
            setSeller({
              id: `mock-${mock.id}`,
              displayName: mock.freelancer.name,
              bio: null,
              avatarUrl: null,
              skills: [...mock.skills],
              portfolioUrls: [],
              rating: mock.rating,
              totalReviews: mock.totalReviews,
            });
            setPreview(true);
          } else {
            setFailed(
              "We could not reach the server and have no preview for this service.",
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-label="Loading service">
        <div className="space-y-4">
          <div className="skeleton-shimmer aspect-[16/9] rounded-[18px]" />
          <div className="skeleton-shimmer h-6 w-2/3 rounded-full" />
          <div className="skeleton-shimmer h-4 w-full rounded-full" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded-full" />
        </div>
        <div className="skeleton-shimmer h-72 rounded-[18px]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        title="This service is not available"
        body="It may have been removed, paused, or is still in review. Browse similar services instead."
        action={{
          label: "Back to services",
          onClick: () => router.push("/services"),
        }}
      />
    );
  }

  if (failed || !service) {
    return (
      <ErrorState
        title="Could not load this service"
        body={failed ?? "Please try again."}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  const sellerName = seller?.displayName ?? "Freelancer";
  const gallery = (service.imageUrls ?? [])
    .map((src) => resolvePublicImage(src))
    .filter((src): src is string => Boolean(src));
  const current = gallery[Math.min(activeImage, Math.max(0, gallery.length - 1))];
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : (seller?.rating ?? null);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div
            className="relative aspect-[16/9] overflow-hidden rounded-[18px] border border-border"
            style={
              current
                ? undefined
                : { background: "linear-gradient(120deg, #e4e9ff 0%, #d3dcfb 100%)" }
            }
          >
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current}
                alt={service.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <div aria-hidden className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/30" />
                <div aria-hidden className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-text/10" />
                <div className="flex h-full items-center justify-between p-8 sm:p-12">
                  <span aria-hidden className="text-[96px] leading-none font-extrabold tracking-tight text-white/70 sm:text-[128px]">
                    {(service.title.trim().charAt(0).toUpperCase() || "S")}
                  </span>
                  {service.skills[0] && (
                    <span className="self-start rounded-full bg-text/70 px-4 py-1.5 text-sm font-semibold text-white">
                      {service.skills[0]}
                    </span>
                  )}
                </div>
              </>
            )}
            {service.status !== "ACTIVE" && (
              <div className="absolute top-4 left-4">
                <StatusBadge status={service.status} />
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-2" aria-label="Service images">
              {gallery.map((src, i) => (
                <li key={src + i}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-pressed={i === Math.min(activeImage, gallery.length - 1)}
                    aria-label={`View image ${i + 1}`}
                    className={`block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-[12px] border transition ${
                      i === Math.min(activeImage, gallery.length - 1)
                        ? "border-primary ring-2 ring-primary-soft"
                        : "border-border hover:border-border-strong"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            {service.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {avg !== null && (
              <span className="flex items-center gap-2 text-sm">
                <Stars value={avg} />
                <strong className="font-semibold">{avg.toFixed(1)}</strong>
                <span className="text-text-subtle">
                  ({seller?.totalReviews ?? reviews.length} reviews)
                </span>
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {service.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-surface-soft px-3 py-1.5 text-[13px] font-medium text-text-muted"
              >
                {s}
              </span>
            ))}
          </div>

          <section aria-label="About this service" className="mt-6 rounded-[18px] border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">About this service</h2>
            <p className="mt-2 max-w-[68ch] text-[15px] leading-7 text-text-muted">
              {service.description}
            </p>
          </section>

          <section aria-label="Reviews" className="mt-6 rounded-[18px] border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-[15px] leading-7 text-text-muted">
                No reviews yet. Completed orders from verified clients will appear
                here.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
                        {(r.reviewer?.profile?.displayName ?? "C").charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          {r.reviewer?.profile?.displayName ?? "Verified client"}
                        </p>
                        <Stars value={r.rating} />
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-[15px] leading-7 text-text-muted">{r.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[18px] border border-border bg-surface p-6">
            <p className="text-[13px] text-text-subtle">Fixed price</p>
            <p className="font-mono text-3xl font-bold">{formatINR(service.price)}</p>
            <p className="mt-1 text-sm text-text-muted">
              {service.deliveryDays}-day delivery · held in escrow until you approve
            </p>
            <Link
              href={`/freelancers/${service.freelancerId}`}
              className="mt-4 flex items-center gap-3 rounded-[14px] bg-surface-soft/70 p-3 transition hover:bg-surface-soft"
            >
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {sellerName.charAt(0).toUpperCase()}
              </span>
              <span>
                <span className="block text-sm font-semibold">{sellerName}</span>
                <span className="block text-[13px] text-text-muted">View profile →</span>
              </span>
            </Link>
            <Button size="lg" className="mt-4 w-full" onClick={() => setBooking(true)}>
              Continue · {formatINR(service.price)}
            </Button>
            <p className="mt-3 text-[13px] leading-6 text-text-muted">
              Test mode — no real money moves.
            </p>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-surface/95 p-4 backdrop-blur lg:hidden">
        <Button size="lg" className="w-full" onClick={() => setBooking(true)}>
          Continue · {formatINR(service.price)}
        </Button>
      </div>

      {preview && (
        <p className="mt-6 rounded-[14px] border border-border bg-surface px-4 py-3 text-[13px] leading-6 text-text-muted">
          Preview data — live details appear here once the backend is reachable.
        </p>
      )}

      <BookingDialog
        open={booking}
        onClose={() => setBooking(false)}
        serviceId={service.id}
        serviceTitle={service.title}
        price={service.price}
      />
    </div>
  );
}
