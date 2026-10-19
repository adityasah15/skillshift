"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { usersApi } from "@/lib/api/users";
import { walletApi } from "@/lib/api/wallet";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { BrandMark } from "@/components/layout/BrandMark";
import { clearAccessToken, useSessionToken } from "@/lib/session";
import { useCatalogSkills } from "@/lib/use-catalog-skills";
import { formatINR } from "@/lib/format";
import type { Role } from "@/lib/types";

const navLinks = [
  { href: "/services", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
];

function HeaderSearch({
  autoFocus = false,
  className = "",
}: {
  autoFocus?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <form action="/services" method="get" role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search services
      </label>
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-subtle"
      >
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <input
        id={id}
        name="q"
        type="search"
        autoFocus={autoFocus}
        placeholder="Try “logo design” or “landing page”"
        className="min-h-[40px] w-full rounded-[10px] border border-border bg-bg py-1 pr-4 pl-10 text-sm placeholder:text-text-subtle focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary-soft focus:outline-none"
      />
    </form>
  );
}

function CategoryStrip() {
  const skills = useCatalogSkills(10);
  if (skills.length === 0) return null;

  return (
    <div className="hidden border-t border-border bg-surface md:block">
      <nav
        aria-label="Categories"
        className="mx-auto flex max-w-[1200px] items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:px-8"
      >
        <span className="shrink-0 py-2 pr-1 text-xs font-medium text-text-subtle">
          Popular
        </span>
        {skills.map((skill) => (
          <Link
            key={skill}
            href={`/services?skills=${encodeURIComponent(skill)}`}
            className="shrink-0 rounded-full px-3 py-2 text-[13px] font-medium text-text-muted transition hover:bg-surface-soft hover:text-text"
          >
            {skill}
          </Link>
        ))}
      </nav>
    </div>
  );
}

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
  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-[44px] items-center rounded-[10px] px-3 text-[15px] font-medium transition ${
          active ? "bg-primary-soft text-primary" : "text-text hover:bg-surface-soft"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex min-h-[44px] items-center px-3 text-sm font-medium transition ${
        active ? "text-text" : "text-text-muted hover:text-text"
      }`}
    >
      {label}
      {active && (
        <span aria-hidden className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

function AccountMenu({
  name,
  email,
  showStudio,
  showSell,
  showAdmin,
  onLogout,
}: {
  name: string;
  email: string;
  showStudio: boolean;
  showSell: boolean;
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
    ...(showStudio ? [{ href: "/services/mine", label: "My services" }] : []),
    { href: "/orders", label: "Orders" },
    { href: "/messages", label: "Messages" },
    { href: "/wallet", label: "Wallet" },
    ...(showSell ? [{ href: "/auth/register", label: "Want to sell? Join as a freelancer" }] : []),
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
        className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[10px] border border-border py-1 pr-3 pl-1 transition hover:border-border-strong hover:bg-surface-soft"
      >
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white"
        >
          {initial}
        </span>
        <span className="max-w-32 truncate text-sm font-semibold">{name}</span>
      </button>
      {menuOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-[14px] border border-border bg-surface shadow-lift"
        >
          <p className="truncate border-b border-border px-4 py-3 text-[13px] text-text-muted">
            {email}
          </p>
          {items.map((l) => (
            <Link
              key={l.href + l.label}
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
  const [hideStrip, setHideStrip] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const token = useSessionToken();
  const isHome = pathname === "/";

  const [roleEntry, setRoleEntry] = useState<{ forToken: string; role: Role | null } | null>(null);
  const [acct, setAcct] = useState<{ forToken: string; displayName: string; email: string } | null>(null);
  const [wallet, setWallet] = useState<{ forToken: string; paise: number | null } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const lastY = useRef(0);

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

  // Best-effort balance for the wallet chip.
  useEffect(() => {
    if (!token || wallet?.forToken === token) return;
    let cancelled = false;
    walletApi
      .balance()
      .then((r) => {
        if (!cancelled) setWallet({ forToken: token, paise: typeof r.data === "number" ? r.data : null });
      })
      .catch(() => {
        if (!cancelled) setWallet({ forToken: token, paise: null });
      });
    return () => {
      cancelled = true;
    };
  }, [token, wallet?.forToken]);

  // Header behaviour: strip hides on scroll down and returns on scroll up;
  // the home page only reveals the header search after the hero.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 4) {
        if (y > 140 && delta > 0) setHideStrip(true);
        if (delta < 0 || y <= 140) setHideStrip(false);
        lastY.current = y;
      }
      setPastHero(y > 520);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile sheet: Escape closes; body scroll locks; focus moves into the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("input, a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
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
  const role = roleEntry?.forToken === token ? roleEntry.role : null;
  const isAdmin = role === "ADMIN";
  const isFreelancer = role === "FREELANCER";
  const showStudio = authed && isFreelancer;
  const showSell = authed && role === "CLIENT";
  const showAdmin = authed && isAdmin;
  const showSearch = !isHome || pastHero;
  const balance = wallet?.forToken === token ? wallet.paise : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="SkillShift home">
          <BrandMark className="shrink-0" />
          <span className="font-display text-[17px] font-bold tracking-tight text-text">
            SkillShift
          </span>
        </Link>

        <div className={`mx-auto hidden w-full max-w-lg justify-center lg:flex ${showSearch ? "" : "invisible"}`}>
          <HeaderSearch className="w-full" />
        </div>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 md:flex lg:ml-0">
          {navLinks.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} active={pathname === l.href} />
          ))}
          {showStudio && (
            <NavLink
              href="/services/mine"
              label="My services"
              active={pathname === "/services/mine"}
            />
          )}
          {!authed && (
            <NavLink href="/auth/register" label="Sell on SkillShift" active={false} />
          )}
          {showAdmin && (
            <NavLink
              href="/admin"
              label="Admin"
              active={pathname === "/admin" || pathname.startsWith("/admin/")}
            />
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 md:flex lg:ml-4">
          {authed ? (
            <>
              <NavLink href="/orders" label="Orders" active={pathname === "/orders"} />
              <NotificationsBell />
              {!isAdmin && balance !== null && (
                <Link
                  href="/wallet"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-border px-3 text-sm transition hover:border-border-strong hover:bg-surface-soft"
                >
                  <span className="text-text-muted">Wallet</span>
                  <span className="tabular font-semibold text-text">{formatINR(balance)}</span>
                </Link>
              )}
              <AccountMenu
                name={acct?.forToken === token && acct ? acct.displayName : "Account"}
                email={acct?.forToken === token && acct ? acct.email : ""}
                showStudio={showStudio}
                showSell={showSell}
                showAdmin={showAdmin}
                onLogout={logout}
              />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex min-h-[44px] items-center rounded-[10px] px-4 text-sm font-semibold text-text-muted transition hover:bg-surface-soft hover:text-text"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex min-h-[44px] items-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Join
              </Link>
            </>
          )}
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label="Open menu"
          className="ml-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] text-text transition hover:bg-surface-soft md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {!hideStrip && <CategoryStrip />}

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-text/40 backdrop-blur-sm"
          />
          <div
            ref={menuRef}
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-surface shadow-lift"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5"
                aria-label="SkillShift home"
              >
                <BrandMark className="shrink-0" />
                <span className="font-display text-[17px] font-bold tracking-tight text-text">
                  SkillShift
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                aria-label="Close menu"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] text-text transition hover:bg-surface-soft"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <HeaderSearch />
              <div className="mt-4 flex flex-col">
                {navLinks.map((l) => (
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
                {!authed && (
                  <NavLink
                    href="/auth/register"
                    label="Sell on SkillShift"
                    active={false}
                    mobile
                    onClick={() => setOpen(false)}
                  />
                )}
              </div>

              {authed && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="truncate px-3 pb-2 text-[13px] font-medium text-text-subtle">
                    {acct?.forToken === token && acct ? acct.email : "Your account"}
                  </p>
                  {[
                    { href: "/orders", label: "Orders" },
                    { href: "/wallet", label: "Wallet" },
                    { href: "/messages", label: "Messages" },
                    { href: "/profile", label: "Profile" },
                  ].map((l) => (
                    <NavLink
                      key={l.href}
                      href={l.href}
                      label={l.label}
                      active={pathname === l.href}
                      mobile
                      onClick={() => setOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border p-4">
              {authed ? (
                <button
                  type="button"
                  onClick={logout}
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-[10px] border border-border text-sm font-semibold transition hover:bg-surface-soft"
                >
                  Log out
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] border border-border text-sm font-semibold transition hover:bg-surface-soft"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
