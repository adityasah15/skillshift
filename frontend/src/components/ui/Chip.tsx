"use client";

import Link from "next/link";
import type { ReactNode } from "react";

function classes(selected: boolean, className: string): string {
  return `inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${
    selected
      ? "border-primary bg-primary-soft text-primary"
      : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
  } ${className}`;
}

function Count({ children }: { children: ReactNode }) {
  return (
    <span className="tabular rounded-full bg-surface/70 px-1.5 py-0.5 text-[11px] font-semibold text-text-muted">
      {children}
    </span>
  );
}

export function Chip({
  children,
  selected = false,
  count,
  onClick,
  className = "",
}: {
  children: ReactNode;
  selected?: boolean;
  count?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={classes(selected, className)}
    >
      {children}
      {typeof count === "number" && <Count>{count}</Count>}
    </button>
  );
}

export function ChipLink({
  href,
  children,
  selected = false,
  count,
  className = "",
}: {
  href: string;
  children: ReactNode;
  selected?: boolean;
  count?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className={classes(selected, className)}
    >
      {children}
      {typeof count === "number" && <Count>{count}</Count>}
    </Link>
  );
}
