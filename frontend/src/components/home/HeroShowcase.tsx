"use client";

import Link from "next/link";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { Price } from "@/components/ui/Money";
import { Reveal } from "@/components/ui/Reveal";
import { resolvePublicImage } from "@/lib/images";
import { useServicesFeed, type FeedService } from "@/lib/use-services-feed";

function CompactCard({ service }: { service: FeedService }) {
  const image = resolvePublicImage(service.imageUrls?.[0]);
  const hue = service.preview?.hue ?? 232;

  return (
    <Link
      href={`/services/${service.id}`}
      className="group flex items-center gap-3 rounded-[10px] border border-border bg-surface p-3 transition hover:border-border-strong hover:shadow-lift"
    >
      <span
        aria-hidden
        className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[6px]"
        style={
          image
            ? undefined
            : {
                background: `linear-gradient(120deg, hsl(${hue} 62% 90%) 0%, hsl(${(hue + 36) % 360} 64% 80%) 100%)`,
              }
        }
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white/80">
            {service.title.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold leading-5 text-text group-hover:underline">
          {service.title}
        </span>
        <span className="mt-1 block text-[12px] text-text-muted">
          {service.deliveryDays}-day delivery
        </span>
      </span>
      <Price amount={service.price} label="" size="sm" className="shrink-0" />
    </Link>
  );
}

function HeroSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      <div className="skeleton-shimmer h-8 rounded-[10px]" />
      <div className="skeleton-shimmer h-[320px] rounded-[10px]" />
      <div className="skeleton-shimmer h-[72px] rounded-[10px]" />
      <div className="skeleton-shimmer h-[72px] rounded-[10px]" />
    </div>
  );
}

export function HeroShowcase() {
  const { services, loading } = useServicesFeed(3);

  if (loading) return <HeroSkeleton />;
  if (!services || services.length === 0) return null;

  const [first, ...rest] = services;

  return (
    <Reveal delay={80}>
      <div className="relative">
        <div
          aria-hidden
          className="absolute -top-6 -right-4 hidden h-40 w-40 rounded-full bg-primary-soft blur-2xl sm:block"
        />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-success">
              <path d="M8 1.8l5 2v3.7c0 3.2-2.1 5.6-5 6.7-2.9-1.1-5-3.5-5-6.7V3.8l5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M5.8 8l1.5 1.5 3-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[12px] font-medium text-text-muted">
              <span className="font-semibold text-text">Funded</span> → In progress → Delivered →{" "}
              <span className="font-semibold text-success">Released</span>
            </p>
          </div>

          <ServiceCard
            service={{ ...first, hue: first.preview?.hue }}
            freelancerName={first.preview?.freelancerName}
            avatarColor={first.preview?.avatarColor}
            rating={first.preview?.rating}
            totalReviews={first.preview?.totalReviews}
          />

          {rest.length > 0 && (
            <div className="mt-3 space-y-3 sm:pl-6">
              {rest.map((service) => (
                <CompactCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
