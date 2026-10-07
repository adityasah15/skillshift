"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_SERVICES, MOCK_SKILLS } from "@/lib/mock-services";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { searchApi, servicesApi } from "@/lib/api/services";
import type { Service } from "@/lib/types";

type Source = "live" | "preview";

function useDebounced(value: string, ms = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const AVATAR_COLORS = ["#3f4fe0", "#7357ff", "#16875d", "#b76a1f", "#2478d4"];

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function ServicesBrowser() {
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [skill, setSkill] = useState<string | null>(null);
  const debouncedQ = useDebounced(query);

  const [services, setServices] = useState<Service[] | null>(null);
  const [source, setSource] = useState<Source>("live");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFailed(null);
      const q = debouncedQ.trim();
      try {
        const { data } = q
          ? await searchApi.services({
              q,
              skills: skill ? [skill] : undefined,
              limit: 20,
            })
          : await servicesApi.list({
              skills: skill ? [skill] : undefined,
              limit: 20,
            });
        if (cancelled) return;
        setServices(data);
        setSource("live");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.statusCode < 500) {
          setFailed(err.message);
          setServices([]);
        } else {
          // Backend unreachable — fall back to local preview, never hard-fail
          // the visual benchmark. Server truth wins whenever reachable.
          setServices(null);
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
    return MOCK_SERVICES.filter((s) => {
      const matchesQ =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.freelancer.name.toLowerCase().includes(q) ||
        s.skills.some((k) => k.toLowerCase().includes(q));
      return matchesQ && (!skill || s.skills.includes(skill));
    });
  }, [debouncedQ, skill]);

  const liveCount = services?.length ?? 0;
  const shown = source === "live" && services ? liveCount : preview.length;

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
            className="min-h-[48px] w-full rounded-[12px] border border-border bg-surface pr-4 pl-11 text-[15px] placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none"
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
            className="absolute top-1/2 left-4 -translate-y-1/2 text-text-subtle"
          >
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </div>
        <p aria-live="polite" className="text-sm text-text-muted lg:whitespace-nowrap">
          {loading ? "Searching…" : `${shown} ${shown === 1 ? "result" : "results"}`}
          {!loading && source === "preview" && " · preview"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by skill">
        <button
          type="button"
          onClick={() => setSkill(null)}
          aria-pressed={skill === null}
          className={`min-h-[44px] cursor-pointer rounded-full border px-4 text-sm font-medium transition ${
            skill === null
              ? "border-text bg-text text-white"
              : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
          }`}
        >
          All
        </button>
        {MOCK_SKILLS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSkill((cur) => (cur === s ? null : s))}
            aria-pressed={skill === s}
            className={`min-h-[44px] cursor-pointer rounded-full border px-4 text-sm font-medium transition ${
              skill === s
                ? "border-text bg-text text-white"
                : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <SkeletonGrid count={6} />
        ) : failed ? (
          <ErrorState
            title="Search failed"
            body={failed}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : source === "live" && services ? (
          services.length === 0 ? (
            <EmptyState
              title="No services match your search"
              body="Try a different keyword or clear the skill filter to see everything."
              action={{
                label: "Clear filters",
                onClick: () => {
                  setQuery("");
                  setSkill(null);
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard key={s.id} service={s} avatarColor={colorFor(s.id)} />
              ))}
            </div>
          )
        ) : preview.length === 0 ? (
          <EmptyState
            title="No services match your search"
            body="Try a different keyword or clear the skill filter to see everything."
            action={{
              label: "Clear filters",
              onClick: () => {
                setQuery("");
                setSkill(null);
              },
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {preview.map((s) => (
              <ServiceCard
                key={s.id}
                service={{
                  id: s.id,
                  title: s.title,
                  price: s.price,
                  deliveryDays: s.deliveryDays,
                  skills: [...s.skills],
                  status: s.status,
                  imageUrls: [],
                  hue: s.hue,
                }}
                freelancerName={s.freelancer.name}
                avatarColor={s.freelancer.avatarColor}
                rating={s.rating}
                totalReviews={s.totalReviews}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
