"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/services", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/wallet", label: "Wallet" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SkillShift home">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-lg font-bold text-white">
            S
          </span>
          <span className="text-[17px] font-bold tracking-tight text-text">SkillShift</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-primary-soft text-primary"
                  : "text-text-muted hover:bg-surface-soft hover:text-text"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {/* Freelancer studio — correct target is /services/mine (not /services/new) */}
          <Link
            href="/services/mine"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              pathname === "/services/mine"
                ? "bg-primary-soft text-primary"
                : "text-text-muted hover:bg-surface-soft hover:text-text"
            }`}
          >
            My services
          </Link>
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/auth/login"
            className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-text-muted transition hover:bg-surface-soft hover:text-text"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-[12px] bg-text px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
          >
            Join
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[12px] text-text transition hover:bg-surface-soft md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            ) : (
              <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-border bg-surface px-4 py-3 md:hidden">
          {[...links, { href: "/services/mine", label: "My services" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block min-h-[44px] rounded-[12px] px-3 py-3 text-[15px] font-medium text-text transition hover:bg-surface-soft"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 border-t border-border pt-3">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-[12px] border border-border text-sm font-semibold"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-[12px] bg-text text-sm font-semibold text-white"
            >
              Join
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
