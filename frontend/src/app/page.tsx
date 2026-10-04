import Link from "next/link";
import { MOCK_SERVICES } from "@/lib/mock-services";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

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

export default function Home() {
  return (
    <main className="bg-bg">
      <section className="mx-auto max-w-[1280px] px-4 pt-14 pb-10 sm:px-6 lg:px-8 lg:pt-20">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="ACTIVE" />
            <span className="text-[13px] text-text-muted">
              Protected payments on every order
            </span>
          </div>
          <h1 className="mt-4 text-4xl leading-[1.08] font-bold tracking-tight text-text sm:text-6xl">
            Find the right skills for your next project.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-text-muted">
            SkillShift connects clients with skilled freelancers for quality,
            project-based work — with delivery tracking built in.
          </p>
          <form
            action="/services"
            method="get"
            role="search"
            className="mt-8 flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="home-search" className="sr-only">
              Search services
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Try “landing page” or “logo design”…"
              className="min-h-[48px] flex-1 rounded-[12px] border border-border bg-surface px-4 text-[15px] placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[48px] cursor-pointer rounded-[12px] bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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

      <section className="mx-auto max-w-[1280px] px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Featured services
            </h2>
            <p className="mt-1.5 text-[15px] text-text-muted">
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
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_SERVICES.slice(0, 3).map((s) => (
            <ServiceCard
              key={s.id}
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
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[22px] border border-border bg-surface p-6 sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            How SkillShift works
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-[16px] bg-surface-soft/60 p-5">
                <p className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                  {i + 1}
                </p>
                <h3 className="mt-3 text-[17px] font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[15px] leading-6 text-text-muted">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-text-muted">
            Test mode — no real money moves. Balances and payments here are for
            demonstration.
          </p>
        </div>
      </section>
    </main>
  );
}
