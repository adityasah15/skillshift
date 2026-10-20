import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { FooterCategories } from "@/components/layout/FooterCategories";
import { StatusPill } from "@/components/layout/StatusPill";

const marketplace = [
  { href: "/services", label: "Browse services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/auth/register", label: "Sell with us" },
];

const company = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

function LinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <nav aria-label={heading}>
      <p className="text-sm font-semibold text-white">{heading}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-[36px] items-center text-[#c9cde0] transition hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-text text-[#c9cde0]">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="SkillShift home"
              className="inline-flex items-center gap-2.5 text-white"
            >
              <BrandMark className="shrink-0" />
              <span className="font-display text-[17px] font-bold tracking-tight">
                SkillShift
              </span>
            </Link>
            <p className="mt-4 text-sm leading-6">
              Hire skilled freelancers. Payments are held in escrow until you
              approve the work.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://github.com/adityasah15/skillshift"
                target="_blank"
                rel="noreferrer"
                aria-label="SkillShift on GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[#c9cde0] transition hover:border-white/30 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.36 1.11 2.94.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.4 9.4 0 0 1 12 7.6c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          <LinkColumn heading="Marketplace" links={marketplace} />
          <FooterCategories />
          <LinkColumn heading="Company" links={company} />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-5 text-[13px] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} SkillShift. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <StatusPill />
          </div>
        </div>
      </div>
    </footer>
  );
}
