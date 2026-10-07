import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "What SkillShift is: a calm marketplace for project-based work with protected payments.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[800px] px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-sm font-medium text-text-muted">Company</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
            Work, without the awkward money part.
          </h1>
          <p className="mt-4 text-lg leading-8 text-text-muted">
            SkillShift is a marketplace for project-based freelance work. Clients
            book services with clear prices and delivery times; freelancers do
            the work knowing payment is already secured.
          </p>
        </Reveal>
        <Reveal delay={90}>
          <section aria-label="How money moves" className="mt-10 rounded-[18px] border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-bold">How money moves</h2>
            <ul className="mt-3 space-y-3 text-[15px] leading-7 text-text-muted">
              <li><strong className="text-text">Held in escrow.</strong> When an order starts, the payment is set aside — visible to both sides.</li>
              <li><strong className="text-text">Released on approval.</strong> Accept the delivery and funds go to the freelancer.</li>
              <li><strong className="text-text">Refunded on dispute.</strong> If a dispute resolves your way, money returns to your wallet.</li>
            </ul>
            <p className="mt-4 text-sm text-text-muted">Test mode — no real money moves.</p>
          </section>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/services"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[12px] bg-text px-6 text-sm font-semibold text-white transition hover:opacity-85"
            >
              Browse services
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[12px] border border-border bg-surface px-6 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
            >
              Contact us
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
