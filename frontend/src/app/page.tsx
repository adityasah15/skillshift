import Link from "next/link";
import type { Metadata } from "next";
import { MOCK_SERVICES, MOCK_SKILLS } from "@/lib/mock-services";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "SkillShift — Find the right skills",
  description:
    "Browse freelance services with clear pricing and delivery times. Order confidently with protected payments.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SkillShift — Find the right skills",
    description:
      "Browse freelance services with clear pricing and delivery times. Order confidently with protected payments.",
  },
};

const steps = [
  {
    title: "Discover",
    body: "Browse real offers with clear pricing and delivery times.",
  },
  {
    title: "Order confidently",
    body: "Your payment is held safely until you approve the work.",
  },
  {
    title: "Get the work",
    body: "Chat, track progress, and review when it is done.",
  },
];

const assurances = [
  {
    title: "Money stays protected",
    body: "Every payment is held in escrow and releases only when you accept the delivery.",
  },
  {
    title: "Delivery you can track",
    body: "Requirements, delivery notes, and deadlines live on every order — nothing in DMs.",
  },
  {
    title: "Reviews that mean something",
    body: "Only clients with completed orders can leave a review. No inflated scores.",
  },
];

export default function Home() {
  return (
    <main className="bg-bg">
      <section className="mx-auto max-w-[1280px] px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8 lg:pt-24 lg:pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <StatusBadge status="ACTIVE" />
            <span className="text-[13px] text-text-muted">
              Protected payments on every order
            </span>
          </div>
          <h1 className="mt-5 text-5xl leading-[1.04] font-extrabold tracking-tight text-text sm:text-6xl lg:text-7xl">
            Find the right skills for your next project.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-text-muted sm:text-xl sm:leading-9">
            SkillShift connects clients with skilled freelancers for quality,
            project-based work — with delivery tracking built in.
          </p>
          <form
            action="/services"
            method="get"
            role="search"
            className="mx-auto mt-9 flex max-w-2xl flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="home-search" className="sr-only">
              Search services
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Try “landing page” or “logo design”…"
              className="min-h-[52px] flex-1 rounded-[14px] border border-border bg-surface px-5 text-left text-base shadow-sm placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[52px] cursor-pointer rounded-[14px] bg-primary px-8 text-[15px] font-semibold text-white transition hover:bg-primary-hover"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-text px-6 text-sm font-semibold text-white transition hover:opacity-85"
            >
              Browse services
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-border bg-surface px-6 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 pb-4 sm:px-6 lg:px-8" aria-label="Popular skills">
        <Reveal>
          <div className="flex flex-wrap gap-2">
            {MOCK_SKILLS.map((s) => (
              <Link
                key={s}
                href={`/services?skills=${encodeURIComponent(s)}`}
                className="inline-flex min-h-[44px] items-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
              >
                {s}
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Featured services
              </h2>
              <p className="mt-2 text-base text-text-muted">
                A preview of what clients are ordering this week.
              </p>
            </div>
            <Link
              href="/services"
              className="hidden shrink-0 text-sm font-semibold text-primary hover:underline sm:block"
            >
              View all →
            </Link>
          </div>
        </Reveal>
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_SERVICES.slice(0, 3).map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i, 2) * 90}>
              <ServiceCard
                service={{
                  id: s.id,
                  title: s.title,
                  price: s.price,
                  deliveryDays: s.deliveryDays,
                  skills: [...s.skills],
                  status: s.status,
                  imageUrls: [],
                  hue: s.hue,
                }}
                freelancerName={s.freelancer.name}
                avatarColor={s.freelancer.avatarColor}
                rating={s.rating}
                totalReviews={s.totalReviews}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8" aria-label="Why SkillShift">
        <Reveal>
          <div className="rounded-[22px] border border-border bg-surface p-6 sm:p-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How SkillShift works
            </h2>
            <div className="mt-7 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.title} className="rounded-[16px] bg-surface-soft/60 p-5">
                  <p className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {i + 1}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-text-muted">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 grid gap-6 border-t border-border pt-7 md:grid-cols-3">
              {assurances.map((a) => (
                <div key={a.title}>
                  <h3 className="text-base font-bold">{a.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-text-muted">{a.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-text-muted">
              Test mode — no real money moves. Balances and payments here are for
              demonstration.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 rounded-[22px] bg-text p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Sell your skills to clients who pay on delivery.
              </h2>
              <p className="mt-3 text-base leading-7 text-white/70">
                Publish a service in minutes. Money is held safely while you work
                and released when the client approves.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-[14px] bg-white px-8 text-[15px] font-bold text-text transition hover:opacity-90"
            >
              Start selling
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
