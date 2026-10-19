"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { RatingStars } from "@/components/ui/RatingStars";
import { Price } from "@/components/ui/Money";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { BookingDialog } from "@/components/marketplace/BookingDialog";
import { GeneratedCover } from "@/components/marketplace/GeneratedCover";
import { ApiRequestError } from "@/lib/api-client";
import { servicesApi } from "@/lib/api/services";
import { reviewsApi } from "@/lib/api/reviews";
import { usersApi } from "@/lib/api/users";
import { useSessionToken } from "@/lib/session";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { formatINR } from "@/lib/format";
import { resolvePublicImage } from "@/lib/images";
import { MOCK_SERVICES } from "@/lib/mock-services";
import type { PublicProfile, Service, ServiceReview } from "@/lib/types";

function dateLabel(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReviewSummary({
  reviews,
  fallbackRating,
  fallbackCount,
}: {
  reviews: ServiceReview[];
  fallbackRating: number | null;
  fallbackCount: number;
}) {
  const count = reviews.length > 0 ? reviews.length : fallbackCount;
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : (fallbackRating ?? 0);

  if (count === 0) {
    return (
      <p className="text-[15px] leading-7 text-text-muted">
        No reviews yet. Completed orders from verified clients will appear here.
      </p>
    );
  }

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    n: reviews.filter((review) => Math.round(review.rating) === stars).length,
  }));

  return (
    <div className="rounded-[10px] border border-border bg-bg p-4 sm:flex sm:items-center sm:gap-6">
      <div className="text-center sm:w-36">
        <p className="tabular text-4xl font-bold text-text">
          {average.toFixed(1)}
        </p>
        <div className="mt-1 flex justify-center">
          <RatingStars value={average} showValue={false} size="sm" />
        </div>
        <p className="mt-1 text-[12px] text-text-muted">
          {count} {count === 1 ? "review" : "reviews"}
        </p>
      </div>
      <ul className="mt-4 flex-1 space-y-1.5 sm:mt-0">
        {distribution.map((entry) => (
          <li
            key={entry.stars}
            className="flex items-center gap-2 text-[12px] text-text-muted"
          >
            <span className="tabular w-3 text-right">{entry.stars}</span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 text-star">
              <path
                d="M7 1.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L7 10.1 3.5 11.9l.7-3.9L1.4 5.3l3.9-.6L7 1.2z"
                fill="currentColor"
              />
            </svg>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-star"
                style={{
                  width: `${count > 0 ? (entry.n / count) * 100 : 0}%`,
                }}
              />
            </span>
            <span className="tabular w-6 text-right">{entry.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceDetail({ id }: { id: string }) {
  const router = useRouter();
  const token = useSessionToken();
  const { role, userId } = useCurrentUser();
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
  const [tab, setTab] = useState("about");

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
              imageUrls: mock.imageUrls,
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
          <div className="skeleton-shimmer aspect-[16/9] rounded-[10px]" />
          <div className="skeleton-shimmer h-6 w-2/3 rounded-full" />
          <div className="skeleton-shimmer h-4 w-full rounded-full" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded-full" />
        </div>
        <div className="skeleton-shimmer h-72 rounded-[10px]" />
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
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : (seller?.rating ?? null);
  const reviewCount = seller?.totalReviews ?? reviews.length;
  const isOwn = userId !== null && service.freelancerId === userId;
  const isFreelancer = token !== null && role === "FREELANCER";
  const isAdmin = token !== null && role === "ADMIN";
  // Optimistic while the role resolves: assume the visitor can order so the
  // primary CTA never flickers for clients. Freelancers/admins get the
  // explainer as soon as their role is known (dialog guards too).
  const canOrder = token === null || role === null || (role === "CLIENT" && !isOwn);

  const tabItems = [
    { id: "about", label: "About" },
    { id: "reviews", label: `Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}` },
  ];

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[10px] border border-border">
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current}
                alt={service.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <GeneratedCover
                title={service.title}
                skill={service.skills[0]}
                imageUrls={[]}
                className="h-full w-full"
                monogramClassName="text-[96px] sm:text-[128px]"
              />
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
                    className={`block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-[10px] border transition ${
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
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {avg !== null && (
              <RatingStars value={avg} count={reviewCount || undefined} />
            )}
            <span className="text-[13px] text-text-muted">
              {service.deliveryDays}-day delivery
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {service.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-surface-soft px-3 py-1.5 text-[13px] font-medium text-text-muted"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <Tabs
              items={tabItems}
              value={tab}
              onChange={setTab}
              ariaLabel="Service details"
              panelIdPrefix="service"
            />
            <TabPanel id="about" value={tab} panelIdPrefix="service">
              <div className="pt-5">
                <p className="max-w-[68ch] text-[15px] leading-7 text-text-muted">
                  {service.description}
                </p>
                <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[10px] border border-border bg-bg p-4">
                    <dt className="text-[12px] text-text-subtle">Delivery</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {service.deliveryDays} days
                    </dd>
                  </div>
                  <div className="rounded-[10px] border border-border bg-bg p-4">
                    <dt className="text-[12px] text-text-subtle">Payment</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      Held in escrow until you approve
                    </dd>
                  </div>
                  <div className="rounded-[10px] border border-border bg-bg p-4">
                    <dt className="text-[12px] text-text-subtle">Changes</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      Request them in the order chat
                    </dd>
                  </div>
                </dl>
              </div>
            </TabPanel>
            <TabPanel id="reviews" value={tab} panelIdPrefix="service">
              <div className="pt-5">
                <ReviewSummary
                  reviews={reviews}
                  fallbackRating={seller?.rating ?? null}
                  fallbackCount={reviewCount}
                />
                <p className="mt-3 text-[12px] text-text-muted">
                  Only clients with completed orders can leave a review.
                </p>
                {reviews.length > 0 && (
                  <ul className="mt-6 space-y-5">
                    {reviews.map((review) => {
                      const reviewerName =
                        review.reviewer?.profile?.displayName ?? "Verified client";
                      return (
                        <li
                          key={review.id}
                          className="border-t border-border pt-5 first:border-0 first:pt-0"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar
                              name={reviewerName}
                              src={review.reviewer?.profile?.avatarUrl}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-text">
                                {reviewerName}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <RatingStars
                                  value={review.rating}
                                  showValue={false}
                                />
                                <span className="text-[12px] text-text-subtle">
                                  {dateLabel(review.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-[15px] leading-7 text-text-muted">
                              {review.comment}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </TabPanel>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[10px] border border-border bg-surface p-6">
            <Price amount={service.price} label="Fixed price" size="lg" />
            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-text-muted">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-1 shrink-0 text-success">
                <path d="M8 1.8l5 2v3.7c0 3.2-2.1 5.6-5 6.7-2.9-1.1-5-3.5-5-6.7V3.8l5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M5.8 8l1.5 1.5 3-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                {service.deliveryDays}-day delivery · payment held in escrow
                until you approve
              </span>
            </p>
            <Link
              href={`/freelancers/${service.freelancerId}`}
              className="mt-4 flex items-center gap-3 rounded-[10px] bg-surface-soft/70 p-3 transition hover:bg-surface-soft"
            >
              <Avatar name={sellerName} src={seller?.avatarUrl} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {sellerName}
                </span>
                {seller && seller.totalReviews > 0 ? (
                  <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-text-muted">
                    <RatingStars
                      value={seller.rating}
                      showValue={false}
                      size="sm"
                    />
                    <span className="tabular">
                      {seller.rating.toFixed(1)} ({seller.totalReviews})
                    </span>
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[12px] text-text-muted">
                    View freelancer profile
                  </span>
                )}
              </span>
            </Link>
            {canOrder ? (
              <Button size="lg" className="mt-4 w-full" onClick={() => setBooking(true)}>
                Continue · {formatINR(service.price)}
              </Button>
            ) : isOwn ? (
              <div className="mt-4 flex flex-col gap-2">
                <p className="rounded-[10px] bg-surface-soft px-4 py-3 text-[13px] leading-6 text-text-muted">
                  This is your service — clients see this exact page before ordering.
                </p>
                <Link
                  href="/services/mine"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                >
                  Manage this service
                </Link>
              </div>
            ) : isFreelancer ? (
              <div className="mt-4 flex flex-col gap-2">
                <p className="rounded-[10px] bg-warning-soft px-4 py-3 text-[13px] leading-6 text-warning">
                  You’re logged in as a freelancer. Want to buy services? Log in
                  or join with a separate client account.
                </p>
                <Link
                  href={`/auth/login?next=${encodeURIComponent(`/services/${service.id}`)}`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                >
                  Log in as a client
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-border px-5 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
                >
                  Join as a client
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <p className="rounded-[10px] bg-surface-soft px-4 py-3 text-[13px] leading-6 text-text-muted">
                  Admin accounts can’t place orders.
                </p>
                <Link
                  href="/admin/services"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-border px-5 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
                >
                  Review in moderation queue
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {canOrder ? (
        <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-surface/95 p-4 backdrop-blur lg:hidden">
          <Button size="lg" className="w-full" onClick={() => setBooking(true)}>
            Continue · {formatINR(service.price)}
          </Button>
        </div>
      ) : isOwn ? (
        <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-surface/95 p-4 backdrop-blur lg:hidden">
          <Link
            href="/services/mine"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Manage this service
          </Link>
        </div>
      ) : (
        !isAdmin && (
          <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-surface/95 p-4 backdrop-blur lg:hidden">
            <Button size="lg" variant="secondary" className="w-full" onClick={() => setBooking(true)}>
              How to order
            </Button>
          </div>
        )
      )}

      {preview && (
        <p className="mt-6 rounded-[10px] border border-border bg-surface px-4 py-3 text-[13px] leading-6 text-text-muted">
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
