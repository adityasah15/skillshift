"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { usersApi } from "@/lib/api/users";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { clearAccessToken, useSessionToken } from "@/lib/session";
import type { Role } from "@/lib/types";

const publicLinks = [
  { href: "/services", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

const authedLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/messages", label: "Messages" },
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
          : `inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium transition ${
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

function AccountMenu({
  name,
  email,
  showStudio,
  showAdmin,
  onLogout,
}: {
  name: string;
  email: string;
  showStudio: boolean;
  showAdmin: boolean;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [menuOpen]);

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const items = [
    { href: "/profile", label: "Profile" },
    { href: "/orders", label: "Orders" },
    { href: "/wallet", label: "Wallet" },
    ...(showStudio ? [{ href: "/services/mine", label: "My services" }] : []),
    ...(showAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Account: ${name}`}
        className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[12px] border border-border py-1 pr-3 pl-1 transition hover:border-border-strong hover:bg-surface-soft"
      >
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
          {initial}
        </span>
        <span className="max-w-32 truncate text-sm font-semibold">{name}</span>
      </button>
      {menuOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-[14px] border border-border bg-surface shadow-lg"
        >
          <p className="truncate border-b border-border px-4 py-3 text-[13px] text-text-muted">{email}</p>
          {items.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block min-h-[44px] px-4 py-3 text-sm font-medium transition hover:bg-surface-soft"
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
            className="block min-h-[44px] w-full cursor-pointer px-4 py-3 text-left text-sm font-medium text-danger transition hover:bg-danger-soft/50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
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
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [acct, setAcct] = useState<{ forToken: string; displayName: string; email: string } | null>(null);

  // Best-effort account lookup for the account chip.
  useEffect(() => {
    if (!token || acct?.forToken === token) return;
    let cancelled = false;
    usersApi
      .me()
      .then((r) => {
        if (!cancelled) {
          setAcct({
            forToken: token,
            displayName: r.data.profile?.displayName ?? r.data.email,
            email: r.data.email,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setAcct(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, acct?.forToken]);

  // Mobile menu: Escape closes and returns focus; opening moves focus in.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    menuRef.current?.querySelector("a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
  // Role-aware workspace: clients order, freelancers also sell, admins only moderate.
  // While the role is still loading we assume non-admin to avoid hiding items.
  const isAdmin = role === "ADMIN";
  const browse = publicLinks[0];
  const about = publicLinks[2];
  const primary = !authed
    ? [...publicLinks]
    : isAdmin
      ? [browse, about]
      : [browse, about, ...authedLinks];
  const showStudio = authed && role === "FREELANCER";
  const showAdmin = authed && isAdmin;

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
          {showAdmin && (
            <NavLink
              href="/admin"
              label="Admin"
              active={pathname === "/admin" || pathname.startsWith("/admin/")}
            />
          )}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          {authed ? (
            <>
              <NotificationsBell />
              <AccountMenu
                name={acct?.forToken === token && acct ? acct.displayName : "Account"}
                email={acct?.forToken === token && acct ? acct.email : ""}
                showStudio={showStudio}
                showAdmin={showAdmin}
                onLogout={logout}
              />
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
          ref={toggleRef}
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
        <nav ref={menuRef} aria-label="Mobile" className="border-t border-border bg-surface px-4 py-3 md:hidden">
          {authed && (
            <p className="truncate px-3 pt-1 pb-2 text-[13px] font-medium text-text-subtle">
              {acct?.forToken === token && acct ? acct.email : "Your account"}
            </p>
          )}
          {authed && (
            <NavLink
              href="/profile"
              label="Profile"
              active={pathname === "/profile"}
              mobile
              onClick={() => setOpen(false)}
            />
          )}
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
          {showAdmin && (
            <NavLink
              href="/admin"
              label="Admin"
              active={pathname === "/admin" || pathname.startsWith("/admin/")}
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
