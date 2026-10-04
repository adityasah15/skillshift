import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-lg font-bold text-white">
              S
            </span>
            <span className="text-[17px] font-bold tracking-tight">SkillShift</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-text-muted">
            Project-based work with clear pricing, tracked delivery, and protected
            payments.
          </p>
        </div>
        <nav aria-label="Marketplace">
          <p className="text-sm font-semibold">Marketplace</p>
          <ul className="mt-3 space-y-2.5 text-sm text-text-muted">
            <li><Link href="/services" className="transition hover:text-text">Browse services</Link></li>
            <li><Link href="/how-it-works" className="transition hover:text-text">How it works</Link></li>
            <li><Link href="/services/mine" className="transition hover:text-text">Sell on SkillShift</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="text-sm font-semibold">Account</p>
          <ul className="mt-3 space-y-2.5 text-sm text-text-muted">
            <li><Link href="/dashboard" className="transition hover:text-text">Dashboard</Link></li>
            <li><Link href="/orders" className="transition hover:text-text">Orders</Link></li>
            <li><Link href="/wallet" className="transition hover:text-text">Wallet</Link></li>
          </ul>
        </nav>
        <nav aria-label="Support">
          <p className="text-sm font-semibold">Support</p>
          <ul className="mt-3 space-y-2.5 text-sm text-text-muted">
            <li><Link href="/auth/login" className="transition hover:text-text">Log in</Link></li>
            <li><Link href="/auth/register" className="transition hover:text-text">Join</Link></li>
            <li><Link href="/notifications" className="transition hover:text-text">Notifications</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-1 px-4 py-5 text-[13px] text-text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 SkillShift. All rights reserved.</p>
          <p>Calm, trustworthy freelance marketplace.</p>
        </div>
      </div>
    </footer>
  );
}
