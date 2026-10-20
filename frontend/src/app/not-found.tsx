import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="bg-bg">
      <div className="mx-auto flex max-w-[640px] flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="tabular rounded-full bg-surface-soft px-3 py-1 text-[13px] font-semibold text-text-muted">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          This page slipped out of escrow.
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-7 text-text-muted">
          The link may be broken or the page may have moved. Nothing was
          charged. Head back to safety.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Back home
          </Link>
          <Link
            href="/services"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-border bg-surface px-6 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
          >
            Browse services
          </Link>
        </div>
      </div>
    </main>
  );
}
