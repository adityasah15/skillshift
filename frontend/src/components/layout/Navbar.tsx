"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { clearAccessToken, useSessionToken } from "@/lib/session";
import type { Role } from "@/lib/types";

const publicLinks = [
  { href: "/services", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
];

const authedLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/wallet", label: "Wallet" },
];

function NavLink({
  href,
  label,
  active,
  onClick,
  mobile = false,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        mobile
          ? "block min-h-[44px] rounded-[12px] px-3 py-3 text-[15px] font-medium text-text transition hover:bg-surface-soft"
          : `rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary-soft text-primary"
                : "text-text-muted hover:bg-surface-soft hover:text-text"
            }`
      }
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const token = useSessionToken();
  const [roleEntry, setRoleEntry] = useState<{ forToken: string; role: Role | null } | null>(null);

  // Best-effort role lookup — nav renders for any valid token regardless.
  useEffect(() => {
    if (!token || roleEntry?.forToken === token) return;
    let cancelled = false;
    authApi
      .me()
      .then((r) => {
        if (!cancelled) setRoleEntry({ forToken: token, role: r.data.role });
      })
      .catch(() => {
        if (!cancelled) setRoleEntry({ forToken: token, role: null });
      });
    return () => {
      cancelled = true;
    };
  }, [token, roleEntry?.forToken]);

  const role = roleEntry?.forToken === token ? roleEntry.role : null;

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Session ends locally regardless of server acknowledgement.
    }
    clearAccessToken();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const authed = token !== null;
  const primary = authed ? [...publicLinks.slice(0, 1), ...authedLinks] : [...publicLinks];
  const showStudio = authed && role !== "CLIENT";

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
          {primary.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} active={pathname === l.href} />
          ))}
          {/* Freelancer studio — correct target is /services/mine (not /services/new) */}
          {showStudio && (
            <NavLink
              href="/services/mine"
              label="My services"
              active={pathname === "/services/mine"}
            />
          )}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          {authed ? (
            <>
              <NotificationsBell />
              <button
                type="button"
                onClick={logout}
                className="min-h-[44px] cursor-pointer rounded-[12px] border border-border px-4 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
              >
                Log out
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
          {primary.map((l) => (
            <NavLink
              key={l.href}
              href={l.href}
              label={l.label}
              active={pathname === l.href}
              mobile
              onClick={() => setOpen(false)}
            />
          ))}
          {showStudio && (
            <NavLink
              href="/services/mine"
              label="My services"
              active={pathname === "/services/mine"}
              mobile
              onClick={() => setOpen(false)}
            />
          )}
          <div className="mt-2 flex gap-2 border-t border-border pt-3">
            {authed ? (
              <button
                type="button"
                onClick={logout}
                className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-[12px] border border-border text-sm font-semibold"
              >
                Log out
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
