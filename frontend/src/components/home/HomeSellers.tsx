"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { RatingStars } from "@/components/ui/RatingStars";
import { usersApi } from "@/lib/api/users";
import { useServicesFeed } from "@/lib/use-services-feed";
import type { PublicProfile } from "@/lib/types";

interface Seller {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  totalReviews: number;
  skills: string[];
  live: boolean;
}

function SellerCard({ seller }: { seller: Seller }) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <Avatar name={seller.name} src={seller.avatarUrl} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-text">{seller.name}</p>
          {seller.totalReviews > 0 ? (
            <RatingStars value={seller.rating} count={seller.totalReviews} />
          ) : (
            <p className="text-[13px] text-text-muted">New seller</p>
          )}
        </div>
      </div>
      <p className="mt-4 line-clamp-1 text-[13px] text-text-muted">
        {seller.skills.slice(0, 3).join(" · ")}
      </p>
    </>
  );

  if (!seller.live) {
    return (
      <div className="rounded-[10px] border border-border bg-surface p-5">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/freelancers/${seller.id}`}
      className="lift rounded-[10px] border border-border bg-surface p-5"
    >
      {body}
    </Link>
  );
}

export function HomeSellers() {
  const { services, source, loading } = useServicesFeed(50);
  const [profiles, setProfiles] = useState<PublicProfile[] | null>(null);

  const liveIds = useMemo(() => {
    if (!services || source !== "live") return [];
    return [...new Set(services.map((service) => service.freelancerId))].slice(0, 4);
  }, [services, source]);

  useEffect(() => {
    if (liveIds.length === 0) return;
    let cancelled = false;
    Promise.all(
      liveIds.map((id) =>
        usersApi
          .publicProfile(id)
          .then((response) => response.data)
          .catch(() => null),
      ),
    ).then((list) => {
      if (!cancelled) {
        setProfiles(
          list.filter((profile): profile is PublicProfile => Boolean(profile)),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [liveIds]);

  const previewSellers = useMemo<Seller[]>(() => {
    if (!services || source !== "preview") return [];
    const seen = new Set<string>();
    const sellers: Seller[] = [];
    for (const service of services) {
      if (!service.preview || seen.has(service.freelancerId)) continue;
      seen.add(service.freelancerId);
      sellers.push({
        id: service.freelancerId,
        name: service.preview.freelancerName,
        avatarUrl: null,
        rating: service.preview.rating,
        totalReviews: service.preview.totalReviews,
        skills: service.skills,
        live: false,
      });
      if (sellers.length === 4) break;
    }
    return sellers;
  }, [services, source]);

  const sellers: Seller[] | null =
    source === "preview"
      ? previewSellers
      : profiles?.map((profile) => ({
          id: profile.id,
          name: profile.displayName,
          avatarUrl: profile.avatarUrl,
          rating: profile.rating,
          totalReviews: profile.totalReviews,
          skills: profile.skills,
          live: true,
        })) ?? null;

  const waiting =
    loading || (source === "live" && profiles === null && liveIds.length > 0);

  if (!waiting && (!sellers || sellers.length === 0)) return null;

  return (
    <section aria-label="Top freelancers" className="mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top freelancers
          </h2>
          <p className="mt-2 text-text-muted">
            The people behind the work, rated by clients after completed orders.
          </p>
        </div>
        <Link
          href="/services"
          className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Browse all services
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {waiting
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                aria-hidden
                className="skeleton-shimmer h-[132px] rounded-[10px]"
              />
            ))
          : sellers?.map((seller) => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
      </div>
    </section>
  );
}
