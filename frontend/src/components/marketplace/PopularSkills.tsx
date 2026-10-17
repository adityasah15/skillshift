"use client";

import Link from "next/link";
import { useCatalogSkills } from "@/lib/use-catalog-skills";

/** Landing-page popular-skill pills, each backed by live listings. */
export function PopularSkills() {
  const skills = useCatalogSkills(6);
  if (skills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <Link
          key={s}
          href={`/services?skills=${encodeURIComponent(s)}`}
          className="inline-flex min-h-[44px] items-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
        >
          {s}
        </Link>
      ))}
    </div>
  );
}
