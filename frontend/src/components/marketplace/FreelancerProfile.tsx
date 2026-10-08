"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { usersApi } from "@/lib/api/users";
import { resolvePublicImage } from "@/lib/images";
import type { PublicProfile } from "@/lib/types";

export function FreelancerProfile({ id }: { id: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFailed(null);
      setNotFound(false);
      try {
        const { data } = await usersApi.publicProfile(id);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.statusCode === 404) {
          setNotFound(true);
        } else if (err instanceof ApiRequestError && err.statusCode < 500) {
          setFailed(err.message);
        } else {
          setFailed("We could not reach the server. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (loading) {
    return (
      <div className="flex items-center gap-4" aria-label="Loading profile">
        <div className="skeleton-shimmer h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="skeleton-shimmer h-5 w-48 rounded-full" />
          <div className="skeleton-shimmer h-4 w-72 max-w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        title="Freelancer not found"
        body="This profile may have been removed. Discover other sellers instead."
        action={{
          label: "Browse services",
          onClick: () => router.push("/services"),
        }}
      />
    );
  }

  if (failed || !profile) {
    return (
      <ErrorState
        title="Could not load this profile"
        body={failed ?? "Please try again."}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-[18px] border border-border bg-surface p-6 sm:flex-row sm:items-center">
        {resolvePublicImage(profile.avatarUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvePublicImage(profile.avatarUrl) as string}
            alt={profile.displayName}
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{profile.displayName}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="text-warning">
              <path d="M7 1.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L7 10.1 3.5 11.9l.7-3.9L1.4 5.3l3.9-.6L7 1.2z" fill="currentColor" />
            </svg>
            <strong className="font-semibold text-text">{profile.rating.toFixed(1)}</strong>
            <span>· {profile.totalReviews} reviews</span>
          </p>
          {profile.bio && (
            <p className="mt-2 max-w-[68ch] text-[15px] leading-7 text-text-muted">{profile.bio}</p>
          )}
        </div>
      </div>

      {profile.skills.length > 0 && (
        <section aria-label="Skills" className="mt-6 rounded-[18px] border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s} className="rounded-full bg-surface-soft px-3 py-1.5 text-[13px] font-medium text-text-muted">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {profile.portfolioUrls.length > 0 && (
        <section aria-label="Portfolio" className="mt-6 rounded-[18px] border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Portfolio</h2>
          <ul className="mt-3 space-y-2">
            {profile.portfolioUrls.map((u) => {
              // Uploaded file keys are not URLs: link them only when they
              // resolve to a public location, otherwise show the filename as
              // plain text rather than a broken link.
              const resolved = resolvePublicImage(u);
              const label = /^https?:\/\//i.test(u) ? u : u.substring(u.lastIndexOf("/") + 1);
              return (
                <li key={u}>
                  {resolved ? (
                    <a href={resolved} target="_blank" rel="noreferrer" className="text-sm font-medium break-all text-primary hover:underline">
                      {label}
                    </a>
                  ) : (
                    <span className="text-sm break-all text-text-muted">{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-6">
        <Link
          href="/services"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-text px-6 text-sm font-semibold text-white transition hover:opacity-85"
        >
          Browse services
        </Link>
      </div>
    </div>
  );
}
