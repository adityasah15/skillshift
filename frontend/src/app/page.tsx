import Link from "next/link";
import type { Metadata } from "next";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { HomeCategories } from "@/components/home/HomeCategories";
import { HomeSearch } from "@/components/home/HomeSearch";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "SkillShift — Find the right skills",
  description:
    "Hire freelancers with clear prices and delivery times. Your payment stays in escrow until you approve the work.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SkillShift — Find the right skills",
    description:
      "Hire freelancers with clear prices and delivery times. Your payment stays in escrow until you approve the work.",
  },
};

export default function Home() {
  return (
    <main className="bg-bg">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70 bg-[radial-gradient(ellipse_at_top_left,rgba(63,79,224,0.10),transparent_55%)]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:pt-20 lg:pb-20">
          <div>
            <h1 className="text-5xl leading-[1.04] font-extrabold tracking-tight text-text sm:text-6xl lg:text-[66px]">
              Find the right skills for your next project.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-text-muted">
              Hire freelancers with clear prices and delivery times. Your payment
              stays in escrow until you approve the work.
            </p>
            <div className="mt-7">
              <HomeSearch />
            </div>
            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-text-muted">
              <li className="inline-flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="text-success">
                  <path d="M8 1.8l5 2v3.7c0 3.2-2.1 5.6-5 6.7-2.9-1.1-5-3.5-5-6.7V3.8l5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M5.8 8l1.5 1.5 3-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Payments held in escrow
              </li>
              <li className="inline-flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="text-primary">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 4.5V8l2.4 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Tracked delivery on every order
              </li>
              <li className="inline-flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden className="text-star">
                  <path d="M7 1.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L7 10.1 3.5 11.9l.7-3.9L1.4 5.3l3.9-.6L7 1.2z" fill="currentColor" />
                </svg>
                Reviews from completed orders
              </li>
            </ul>
          </div>
          <HeroShowcase />
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1200px] px-4 pt-14 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Explore by category
              </h2>
              <p className="mt-2 text-text-muted">
                Start with a skill, or search for exactly what you need.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              All services
            </Link>
          </div>
          <HomeCategories />
        </Reveal>
      </section>

      {/* Featured services */}
      <section className="mx-auto max-w-[1200px] px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Featured services
              </h2>
              <p className="mt-2 text-text-muted">
                Clear prices, real delivery times, and work you can review before
                you commit.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              View all services
            </Link>
          </div>
          <FeaturedServices />
        </Reveal>
      </section>
    </main>
  );
}
