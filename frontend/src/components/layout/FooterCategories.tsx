"use client";

import Link from "next/link";
import { useCatalogSkills } from "@/lib/use-catalog-skills";

/**
 * Footer category links come from the live skill taxonomy, so every link
 * lands on at least one listing. Falls back to bundled skills when the API
 * is unreachable, mirroring the browse surfaces.
 */
export function FooterCategories() {
  const skills = useCatalogSkills(8);
  if (skills.length === 0) return null;

  return (
    <nav aria-label="Categories">
      <p className="text-sm font-semibold text-white">Categories</p>
      <ul className="mt-3 space-y-1 text-sm">
        {skills.map((skill) => (
          <li key={skill}>
            <Link
              href={`/services?skills=${encodeURIComponent(skill)}`}
              className="inline-flex min-h-[36px] items-center text-[#c9cde0] transition hover:text-white"
            >
              {skill}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
