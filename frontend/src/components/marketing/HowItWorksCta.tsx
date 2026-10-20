"use client";

import Link from "next/link";
import { useSessionToken } from "@/lib/session";

/**
 * Page footer CTA that adapts to the session: visitors get the account
 * invite, signed-in users get a path back into their workspace.
 */
export function HowItWorksCta() {
  const token = useSessionToken();

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link
        href="/services"
        className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        Browse services
      </Link>
      {token === null ? (
        <Link
          href="/auth/register"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-border bg-surface px-6 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
        >
          Create an account
        </Link>
      ) : (
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-border bg-surface px-6 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
        >
          Go to dashboard
        </Link>
      )}
    </div>
  );
}
