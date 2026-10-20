"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";

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
  orders: (
    <svg {...iconProps}>
      <path d="M3 6.2L10 2.8l7 3.4v7.6L10 17.2l-7-3.4V6.2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 6.2l7 3.4 7-3.4M10 9.6v7.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  messages: (
    <svg {...iconProps}>
      <path d="M3 4.5h14v9H8.5L4.5 16.5v-3H3v-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 8h7M6.5 10.8h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  wallet: (
    <svg {...iconProps}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 8h15" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  notifications: (
    <svg {...iconProps}>
      <path d="M5 8.2a5 5 0 0110 0v3l1.4 2.3H3.6L5 11.2v-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.2 16a2 2 0 003.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  services: (
    <svg {...iconProps}>
      <path d="M10 2.8l7 3.6-7 3.6-7-3.6 7-3.6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 10.2l7 3.6 7-3.6M3 13.8l7 3.6 7-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg {...iconProps}>
      <circle cx="10" cy="6.8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.8 17c.6-3 3-4.7 6.2-4.7s5.6 1.7 6.2 4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  admin: (
    <svg {...iconProps}>
      <path d="M10 2.5l6 2.3v4.4c0 3.7-2.5 6.4-6 7.8-3.5-1.4-6-4.1-6-7.8V4.8l6-2.3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.2 9.8l1.9 1.9 3.7-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
} as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceNav() {
  const pathname = usePathname();
  const { role } = useCurrentUser();

  const items: Item[] =
    role === "ADMIN"
      ? [
          { href: "/notifications", label: "Notifications", icon: ICONS.notifications },
          { href: "/profile", label: "Profile", icon: ICONS.profile },
          { href: "/admin", label: "Admin", icon: ICONS.admin },
        ]
      : [
          { href: "/dashboard", label: "Overview", icon: ICONS.overview },
          { href: "/orders", label: "Orders", icon: ICONS.orders },
          { href: "/messages", label: "Messages", icon: ICONS.messages },
          { href: "/wallet", label: "Wallet", icon: ICONS.wallet },
          { href: "/notifications", label: "Notifications", icon: ICONS.notifications },
          ...(role === "FREELANCER"
            ? [{ href: "/services/mine", label: "My services", icon: ICONS.services }]
            : []),
          { href: "/profile", label: "Profile", icon: ICONS.profile },
        ];

  return (
    <>
      <aside className="hidden lg:block">
        <nav
          aria-label="Workspace"
          className="sticky top-28 flex flex-col gap-0.5 rounded-[10px] border border-border bg-surface p-2"
        >
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[42px] items-center gap-2.5 rounded-[7px] px-3 text-sm font-medium transition ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-text-muted hover:bg-surface-soft hover:text-text"
                }`}
              >
                <span className={active ? "text-primary" : "text-text-subtle"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        aria-label="Workspace"
        className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:hidden"
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-text-muted"
              }`}
            >
              <span className={active ? "text-primary" : "text-text-subtle"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
