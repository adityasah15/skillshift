import Link from "next/link";

const columns: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: "Marketplace",
    links: [
      { href: "/services", label: "Browse services" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/services/mine", label: "Sell on SkillShift" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/profile", label: "Profile" },
      { href: "/orders", label: "Orders" },
      { href: "/wallet", label: "Wallet" },
      { href: "/notifications", label: "Notifications" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/auth/login", label: "Log in" },
      { href: "/auth/register", label: "Join" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-lg font-bold text-white">
              S
            </span>
            <span className="text-[17px] font-bold tracking-tight">SkillShift</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-text-muted">
            Hire skilled freelancers with payments protected on every order.
          </p>
          <p className="mt-3 inline-block rounded-full bg-surface-soft px-3 py-1 text-xs font-medium text-text-muted">
            Test mode — no real money moves
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="text-sm font-semibold">{col.heading}</p>
            <ul className="mt-3 space-y-1 text-sm text-text-muted">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-[44px] items-center transition hover:text-text"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-1 px-4 py-5 text-[13px] text-text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 SkillShift. All rights reserved.</p>
          <p>Project-based work, delivered and protected.</p>
        </div>
      </div>
    </footer>
  );
}
