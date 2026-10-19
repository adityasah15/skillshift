"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface Item {
  href: string;
  label: string;
  icon: ReactNode;
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 20 20",
  fill: "none",
  "aria-hidden": true,
} as const;

const ICONS = {
  overview: (
    <svg {...iconProps}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  services: (
    <svg {...iconProps}>
      <path d="M10 2.8l7 3.6-7 3.6-7-3.6 7-3.6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 10.2l7 3.6 7-3.6M3 13.8l7 3.6 7-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  disputes: (
    <svg {...iconProps}>
      <path d="M10 3v13.5M5 16.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 6h12M4 6l-2 4.2a2.4 2.4 0 004 0L4 6zm12 0l-2 4.2a2.4 2.4 0 004 0L16 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  orders: (
    <svg {...iconProps}>
      <path d="M3 6.2L10 2.8l7 3.4v7.6L10 17.2l-7-3.4V6.2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 6.2l7 3.4 7-3.4M10 9.6v7.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg {...iconProps}>
      <circle cx="7.5" cy="6.8" r="2.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 16.5c.5-2.6 2.6-4.1 5-4.1s4.5 1.5 5 4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.2 4.6a2.6 2.6 0 010 4.9M15 12.7c1.4.5 2.3 1.7 2.6 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
} as const;

const LINKS: Item[] = [
  { href: "/admin", label: "Overview", icon: ICONS.overview },
  { href: "/admin/services", label: "Services", icon: ICONS.services },
  { href: "/admin/disputes", label: "Disputes", icon: ICONS.disputes },
  { href: "/admin/orders", label: "Orders", icon: ICONS.orders },
  { href: "/admin/users", label: "Users", icon: ICONS.users },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden lg:block">
        <nav
          aria-label="Admin sections"
          className="sticky top-28 flex flex-col gap-0.5 rounded-[10px] border border-border bg-surface p-2"
        >
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[42px] items-center gap-2.5 rounded-[7px] px-3 text-sm font-medium transition ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-text-muted hover:bg-surface-soft hover:text-text"
                }`}
              >
                <span className={active ? "text-primary" : "text-text-subtle"}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        aria-label="Admin sections"
        className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:hidden"
      >
        {LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-text-muted"
              }`}
            >
              <span className={active ? "text-primary" : "text-text-subtle"}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
