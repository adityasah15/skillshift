import type { ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center rounded-[18px] border border-border bg-surface px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-text-muted">
        {icon ?? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
      <p className="mt-1.5 max-w-md text-[15px] leading-6 text-text-muted">{body}</p>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body = "We could not load this. Check your connection and try again.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-[18px] border border-danger/30 bg-danger-soft/40 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M10 2.5L18.5 17h-17L10 2.5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M10 8v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="10" cy="14.2" r="1" fill="currentColor" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
      <p className="mt-1.5 max-w-md text-[15px] leading-6 text-text-muted">{body}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-5">
          Try again
        </Button>
      )}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-[16px] border border-border bg-surface">
      <div className="skeleton-shimmer aspect-[4/3] w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton-shimmer h-4 w-3/4 rounded-full" />
        <div className="skeleton-shimmer h-4 w-1/2 rounded-full" />
        <div className="flex items-center gap-2 pt-1">
          <div className="skeleton-shimmer h-8 w-8 rounded-full" />
          <div className="skeleton-shimmer h-3 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading services" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
