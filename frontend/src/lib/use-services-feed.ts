"use client";

import { useEffect, useMemo, useState } from "react";
import { servicesApi } from "@/lib/api/services";
import { MOCK_SERVICES } from "@/lib/mock-services";
import type { Service } from "@/lib/types";

export interface FeedPreview {
  freelancerName: string;
  avatarColor: string;
  rating: number;
  totalReviews: number;
  hue: number;
}

export interface FeedService extends Service {
  preview?: FeedPreview;
}

export interface CatalogCategory {
  skill: string;
  count: number;
  minPrice: number;
}

interface Feed {
  services: FeedService[];
  source: "live" | "preview";
}

function previewFeed(): Feed {
  const services: FeedService[] = MOCK_SERVICES.filter(
    (service) => service.status === "ACTIVE",
  ).map((service) => ({
    id: service.id,
    freelancerId: `mock-${service.id}`,
    title: service.title,
    description: `Example brief for “${service.title}”.`,
    price: service.price,
    deliveryDays: service.deliveryDays,
    skills: [...service.skills],
    imageUrls: service.imageUrls,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    preview: {
      freelancerName: service.freelancer.name,
      avatarColor: service.freelancer.avatarColor,
      rating: service.rating,
      totalReviews: service.totalReviews,
      hue: service.hue,
    },
  }));
  return { services, source: "preview" };
}

// One fetch per page load, shared by every consumer (hero, catalog, featured).
let cache: Feed | null = null;
let inflight: Promise<Feed> | null = null;

function loadFeed(): Promise<Feed> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = servicesApi
      .list({ limit: 50 })
      .then(({ data }) => {
        cache = { services: data, source: "live" };
        return cache;
      })
      .catch(() => {
        cache = previewFeed();
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Live listing feed with the bundled preview as a reachable fallback. */
export function useServicesFeed(limit = 50) {
  const [feed, setFeed] = useState<Feed | null>(cache);

  useEffect(() => {
    let cancelled = false;
    loadFeed().then((next) => {
      if (!cancelled) setFeed(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const services = useMemo(
    () => (feed ? feed.services.slice(0, limit) : null),
    [feed, limit],
  );

  return {
    services,
    source: feed?.source ?? null,
    loading: feed === null,
  };
}

/** Category tiles derived from the same feed (skill, listing count, from-price). */
export function useCatalog(max = 8) {
  const { services, loading } = useServicesFeed(50);

  const categories = useMemo<CatalogCategory[]>(() => {
    if (!services) return [];
    const counts = new Map<string, { count: number; minPrice: number }>();
    for (const service of services) {
      for (const skill of service.skills ?? []) {
        const entry = counts.get(skill);
        if (entry) {
          entry.count += 1;
          entry.minPrice = Math.min(entry.minPrice, service.price);
        } else {
          counts.set(skill, { count: 1, minPrice: service.price });
        }
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .slice(0, max)
      .map(([skill, entry]) => ({ skill, ...entry }));
  }, [services, max]);

  return { categories, loading };
}
