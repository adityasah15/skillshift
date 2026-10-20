"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unexpected error", error);
  }, [error]);

  return (
    <main className="bg-bg">
      <div className="mx-auto flex max-w-[640px] flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="rounded-full bg-danger-soft px-3 py-1 text-[13px] font-semibold text-danger">
          Something broke
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          This page hit an unexpected error.
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-7 text-text-muted">
          Nothing was charged and your data is safe. Try again. If this keeps
          happening, contact support with the reference below.
        </p>
        {error.digest && (
          <p className="tabular mt-3 text-[12px] text-text-subtle">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-border bg-surface px-6 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
