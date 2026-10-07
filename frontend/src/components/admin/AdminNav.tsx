"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1.5 overflow-x-auto rounded-[14px] border border-border bg-surface p-1.5"
    >
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`min-h-[44px] flex shrink-0 items-center rounded-[10px] px-4 text-sm font-semibold transition ${
              active
                ? "bg-primary-soft text-primary"
                : "text-text-muted hover:bg-surface-soft hover:text-text"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
