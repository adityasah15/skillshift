"use client";

import { useCatalog } from "@/lib/use-services-feed";

/**
 * Skill pills derived from live listings, so every pill matches the real
 * taxonomy and a click always yields at least one result. Shares the feed
 * cache with the home catalog; falls back to the bundled preview when the
 * API is unreachable.
 */
export function useCatalogSkills(max = 8): readonly string[] {
  const { categories } = useCatalog(max);
  return categories.map((category) => category.skill);
}
