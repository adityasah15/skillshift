"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/ui/States";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { ApiRequestError } from "@/lib/api-client";
import { searchApi, servicesApi } from "@/lib/api/services";
import { MOCK_SERVICES } from "@/lib/mock-services";
import { useCatalog } from "@/lib/use-services-feed";
import type { Service } from "@/lib/types";

type Source = "live" | "preview";
type Sort = "newest" | "price-asc" | "price-desc";

const PAGE_SIZE = 12;

const AVATAR_COLORS = ["#3f4fe0", "#7357ff", "#16875d", "#b76a1f", "#2478d4"];

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function useDebounced(value: string, ms = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function sortServices(list: Service[], sort: Sort): Service[] {
  if (sort === "newest") return list;
  const copy = [...list];
  copy.sort((a, b) =>
    sort === "price-asc" ? a.price - b.price : b.price - a.price,
  );
  return copy;
}

export function ServicesBrowser() {
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  // Deep-linkable category filter (header strip, home tiles, footer links).
  const [skill, setSkill] = useState<string | null>(() => params.get("skills"));
  const [sort, setSort] = useState<Sort>("newest");
  const debouncedQ = useDebounced(query);

  const [services, setServices] = useState<Service[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [source, setSource] = useState<Source>("live");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const { categories } = useCatalog(12);

  // Keep the address bar shareable without triggering a navigation.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQ.trim()) next.set("q", debouncedQ.trim());
    if (skill) next.set("skills", skill);
    const queryString = next.toString();
    window.history.replaceState(
      null,
      "",
      queryString ? `/services?${queryString}` : "/services",
    );
  }, [debouncedQ, skill]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFailed(null);
      setMoreFailed(false);
      const q = debouncedQ.trim();
      try {
        const { data, meta } = q
          ? await searchApi.services({
              q,
              skills: skill ? [skill] : undefined,
              limit: PAGE_SIZE,
            })
          : await servicesApi.list({
              skills: skill ? [skill] : undefined,
              limit: PAGE_SIZE,
            });
        if (cancelled) return;
        setServices(data);
        setCursor(meta.cursor ?? null);
        setHasMore(Boolean(meta.hasMore));
        setSource("live");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.statusCode < 500) {
          setFailed(err.message);
          setServices([]);
          setCursor(null);
          setHasMore(false);
        } else {
          // Backend unreachable — fall back to local preview, never hard-fail
          // the visual benchmark. Server truth wins whenever reachable.
          setServices(null);
          setCursor(null);
          setHasMore(false);
          setSource("preview");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, skill, attempt]);

  const preview = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    return MOCK_SERVICES.filter((service) => {
      const matchesQ =
        !q ||
        service.title.toLowerCase().includes(q) ||
        service.freelancer.name.toLowerCase().includes(q) ||
        service.skills.some((entry) => entry.toLowerCase().includes(q));
      return matchesQ && (!skill || service.skills.includes(skill));
    });
  }, [debouncedQ, skill]);

  const shownPreview = useMemo(() => {
    const list = [...preview];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [preview, sort]);

  const liveServices =
    source === "live" && services !== null ? services : null;
  const shown = liveServices ? liveServices.length : preview.length;

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setMoreFailed(false);
    const q = debouncedQ.trim();
    try {
      const { data, meta } = q
        ? await searchApi.services({
            q,
            skills: skill ? [skill] : undefined,
            limit: PAGE_SIZE,
            cursor,
          })
        : await servicesApi.list({
            skills: skill ? [skill] : undefined,
            limit: PAGE_SIZE,
            cursor,
          });
      setServices((current) => (current ? [...current, ...data] : data));
      setCursor(meta.cursor ?? null);
      setHasMore(Boolean(meta.hasMore));
    } catch {
      setMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }

  function clearFilters() {
    setQuery("");
    setSkill(null);
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="service-search" className="sr-only">
            Search services
          </label>
          <input
            id="service-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by skill, title, or seller…"
            className="min-h-[48px] w-full rounded-[10px] border border-border bg-surface pr-4 pl-11 text-[15px] placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none"
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-subtle"
          >
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="service-sort" className="shrink-0 text-sm font-medium text-text-muted">
            Sort
          </label>
          <select
            id="service-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-describedby="services-sort-note"
            className="min-h-[44px] cursor-pointer rounded-[10px] border border-border bg-surface px-3 text-sm font-medium text-text focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>
      <p id="services-sort-note" className="mt-1.5 text-[12px] text-text-subtle">
        Sorting applies to the services loaded so far.
      </p>

      <div className="mt-4 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <div role="group" aria-label="Filter by category" className="flex items-center gap-2">
          <Chip
            selected={skill === null}
            onClick={() => setSkill(null)}
            className="shrink-0"
          >
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.skill}
              selected={skill === category.skill}
              onClick={() =>
                setSkill((current) =>
                  current === category.skill ? null : category.skill,
                )
              }
              className="shrink-0"
            >
              {category.skill}
            </Chip>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-text-muted">
        {loading
          ? "Searching…"
          : `${shown} ${shown === 1 ? "service" : "services"}`}
        {!loading && source === "preview" && " · preview"}
        {!loading && liveServices && hasMore && " · more available"}
      </p>

      <div className="mt-4">
        {loading ? (
          <SkeletonGrid count={6} />
        ) : failed ? (
          <ErrorState
            title="Search failed"
            body={failed}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : liveServices ? (
          liveServices.length === 0 ? (
            <EmptyState
              title="No services match your search"
              body="Try a different keyword or clear the category filter to see everything."
              action={{ label: "Clear filters", onClick: clearFilters }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortServices(liveServices, sort).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  avatarColor={colorFor(service.id)}
                />
              ))}
            </div>
          )
        ) : shownPreview.length === 0 ? (
          <EmptyState
            title="No services match your search"
            body="Try a different keyword or clear the category filter to see everything."
            action={{ label: "Clear filters", onClick: clearFilters }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shownPreview.map((service) => (
              <ServiceCard
                key={service.id}
                service={{
                  id: service.id,
                  title: service.title,
                  price: service.price,
                  deliveryDays: service.deliveryDays,
                  skills: [...service.skills],
                  status: service.status,
                  imageUrls: service.imageUrls,
                  hue: service.hue,
                }}
                freelancerName={service.freelancer.name}
                avatarColor={service.freelancer.avatarColor}
                rating={service.rating}
                totalReviews={service.totalReviews}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && liveServices && hasMore && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
            Load more services
          </Button>
          {moreFailed && (
            <p role="alert" className="text-sm text-danger">
              Couldn&apos;t load more right now. Try again.
            </p>
          )}
        </div>
      )}
    </>
  );
}
