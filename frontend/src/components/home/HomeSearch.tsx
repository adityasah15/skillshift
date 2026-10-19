"use client";

import Link from "next/link";
import { useId } from "react";
import { useCatalog } from "@/lib/use-services-feed";

const POPULAR = [
  { label: "Logo design", query: "logo design" },
  { label: "Landing page", query: "landing page" },
  { label: "SEO articles", query: "seo articles" },
  { label: "Video editing", query: "video editing" },
];

export function HomeSearch() {
  const categoryId = useId();
  const { categories } = useCatalog(8);

  return (
    <div>
      <form
        action="/services"
        method="get"
        role="search"
        className="rounded-[14px] border border-border bg-surface p-2 shadow-lift"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor={categoryId} className="sr-only">
            Category
          </label>
          <select
            id={categoryId}
            name="skills"
            className="min-h-[48px] cursor-pointer rounded-[10px] border-0 bg-transparent px-3 text-sm font-medium text-text-muted focus:ring-2 focus:ring-primary-soft focus:outline-none sm:max-w-[170px]"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.skill} value={category.skill}>
                {category.skill}
              </option>
            ))}
          </select>
          <span aria-hidden className="hidden h-8 w-px shrink-0 bg-border sm:block" />
          <label htmlFor="home-search" className="sr-only">
            Search services
          </label>
          <input
            id="home-search"
            name="q"
            type="search"
            placeholder="Try “logo design” or “landing page”"
            className="min-h-[48px] flex-1 rounded-[10px] border-0 bg-transparent px-3 text-base placeholder:text-text-subtle focus:ring-2 focus:ring-primary-soft focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-[48px] shrink-0 cursor-pointer rounded-[10px] bg-primary px-7 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Search
          </button>
        </div>
      </form>

      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
        <span className="text-text-subtle">Popular:</span>
        {POPULAR.map((item, index) => (
          <span key={item.query} className="inline-flex items-center gap-2">
            {index > 0 && <span aria-hidden className="text-border-strong">·</span>}
            <Link
              href={`/services?q=${encodeURIComponent(item.query)}`}
              className="underline decoration-border-strong underline-offset-4 transition hover:text-text hover:decoration-primary"
            >
              {item.label}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
