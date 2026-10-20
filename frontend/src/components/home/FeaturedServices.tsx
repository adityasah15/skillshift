"use client";

import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { useServicesFeed } from "@/lib/use-services-feed";

export function FeaturedServices() {
  const { services, loading } = useServicesFeed(8);

  if (loading) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-shimmer h-[360px] rounded-[10px]" />
        ))}
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <p className="mt-6 rounded-[10px] border border-border bg-surface px-5 py-8 text-center text-sm text-text-muted">
        New services are on the way. Browse everything available today.
      </p>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={{ ...service, hue: service.preview?.hue }}
          freelancerName={service.preview?.freelancerName}
          avatarColor={service.preview?.avatarColor}
          rating={service.preview?.rating}
          totalReviews={service.preview?.totalReviews}
        />
      ))}
    </div>
  );
}
