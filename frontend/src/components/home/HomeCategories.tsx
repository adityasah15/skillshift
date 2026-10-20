"use client";

import Link from "next/link";
import { formatINR } from "@/lib/format";
import { useCatalog } from "@/lib/use-services-feed";

const TINTS = ["#3f4fe0", "#7357ff", "#137a55", "#8a5a13", "#1c6bbf"];

function tintFor(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 997;
  return TINTS[hash % TINTS.length];
}

export function HomeCategories() {
  const { categories, loading } = useCatalog(8);

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-hidden>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton-shimmer h-[104px] rounded-[10px]" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {categories.map((category) => {
        const tint = tintFor(category.skill);
        return (
          <Link
            key={category.skill}
            href={`/services?skills=${encodeURIComponent(category.skill)}`}
            className="lift group flex items-start gap-3 rounded-[10px] border border-border bg-surface p-4"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold"
              style={{ backgroundColor: `${tint}1f`, color: tint }}
            >
              {category.skill.trim().charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text group-hover:underline">
                {category.skill}
              </span>
              <span className="mt-1 block text-[12px] text-text-muted">
                {category.count} {category.count === 1 ? "service" : "services"} · from{" "}
                <span className="tabular">{formatINR(category.minPrice)}</span>
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
