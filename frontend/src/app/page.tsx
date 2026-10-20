import Link from "next/link";
import type { Metadata } from "next";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { HomeCategories } from "@/components/home/HomeCategories";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeSellers } from "@/components/home/HomeSellers";
import { Accordion } from "@/components/ui/Accordion";
import { RatingStars } from "@/components/ui/RatingStars";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "SkillShift · Find the right skills",
  description:
    "Hire freelancers with clear prices and delivery times. Your payment stays in escrow until you approve the work.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SkillShift · Find the right skills",
    description:
      "Hire freelancers with clear prices and delivery times. Your payment stays in escrow until you approve the work.",
  },
};

const steps = [
  {
    title: "Discover",
    body: "Compare services with clear prices, skills, and delivery times.",
  },
  {
    title: "Order and fund escrow",
    body: "Place the order and your payment is held safely while the freelancer works.",
  },
  {
    title: "Collaborate",
    body: "Share requirements, chat, and keep the deadline visible on the order.",
  },
  {
    title: "Approve and release",
    body: "Accept the delivery to release payment. Ask for changes first if needed.",
  },
];

const escrowSteps = [
  { label: "Funded", body: "Payment held" },
  { label: "In progress", body: "Work begins" },
  { label: "Delivered", body: "Work submitted" },
  { label: "Released", body: "Client approves" },
];

const testimonials = [
  {
    quote:
      "The escrow timeline made the whole thing feel less risky. I could see exactly when the work was funded, delivered, and released.",
    name: "Meera K.",
    detail: "Brand identity project",
  },
  {
    quote:
      "I ordered a landing page on a Friday and had it live the next week. The delivery note and files were all in one place.",
    name: "Arjun S.",
    detail: "SaaS landing page",
  },
  {
    quote:
      "As a freelancer, getting paid on approval removed the follow-up emails. The brief, chat, and delivery lived on the order.",
    name: "Nisha P.",
    detail: "SEO content, 6 articles",
  },
];

const faqs = [
  {
    title: "How does escrow work?",
    content:
      "When you place an order, the amount is held in escrow. The freelancer can start knowing the funds are there. The money is released to them only when you approve the delivery.",
  },
  {
    title: "What if the delivery isn't right?",
    content:
      "Ask for changes in the order chat. If you still can't agree, open a dispute and keep the funds held while it is reviewed.",
  },
  {
    title: "How do freelancers get paid?",
    content:
      "On approval, the order value is released to the freelancer's SkillShift wallet. They can withdraw the available balance at any time.",
  },
  {
    title: "What does it cost?",
    content:
      "Clients pay the price shown on the service, with no hidden platform fee. Freelancers list services for free.",
  },
  {
    title: "Who can leave a review?",
    content:
      "Reviews open after an order is completed, and only the client on that order can leave one. Ratings reflect delivered work.",
  },
  {
    title: "Can I hire and sell?",
    content:
      "SkillShift accounts are set up as either a client or a freelancer. Choose the role that fits how you will use the marketplace.",
  },
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-success">
      <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
      <section className="mx-auto max-w-[1200px] px-4 pt-16 sm:px-6 lg:px-8">
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

      {/* How it works */}
      <section className="mx-auto max-w-[1200px] px-4 pt-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-[14px] border border-border bg-surface p-6 sm:p-10">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How SkillShift works
              </h2>
              <p className="mt-2 text-text-muted">
                Four steps from finding the right person to releasing payment.
              </p>
            </div>

            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <p className="tabular text-[13px] font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-text-muted">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-[10px] border border-border bg-bg p-4 sm:p-5">
              <p className="text-xs font-medium text-text-subtle">
                Escrow timeline
              </p>
              <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {escrowSteps.map((step, index) => (
                  <li
                    key={step.label}
                    className="rounded-[6px] border border-border bg-surface px-3 py-2.5"
                  >
                    <span
                      aria-hidden
                      className={`block h-1.5 w-1.5 rounded-full ${
                        index === escrowSteps.length - 1 ? "bg-success" : "bg-primary"
                      }`}
                    />
                    <p className="mt-2 text-[13px] font-semibold text-text">
                      {step.label}
                    </p>
                    <p className="text-[12px] text-text-muted">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Trust */}
      <section
        aria-label="Why clients trust SkillShift"
        className="mx-auto max-w-[1200px] px-4 pt-20 sm:px-6 lg:px-8"
      >
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the awkward parts of hiring.
            </h2>
            <p className="mt-2 text-text-muted">
              Not just a profile and a message thread. The money, the deadline,
              and the handover all have a place.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[10px] border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold">Money stays protected</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Your payment is held in escrow from the moment you order until you
                approve the delivery.
              </p>
              <div className="mt-4 rounded-[6px] border border-border bg-bg p-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-muted">Held in escrow</span>
                  <span className="tabular font-semibold">₹14,999</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                  <div className="h-full w-3/4 rounded-full bg-success" />
                </div>
                <p className="mt-2 text-[11px] text-text-subtle">
                  Released only when you approve
                </p>
              </div>
            </article>

            <article className="rounded-[10px] border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold">Delivery you can track</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Requirements, delivery notes, and deadlines live on the order, not
                in scattered messages.
              </p>
              <ol className="mt-4 space-y-2 rounded-[6px] border border-border bg-bg p-3">
                {[
                  ["Order funded", true],
                  ["Delivery submitted · day 4", true],
                  ["Client approved", false],
                ].map(([label, done]) => (
                  <li
                    key={label as string}
                    className="flex items-center gap-2 text-[12px] text-text-muted"
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full ${
                        done ? "bg-success" : "bg-border-strong"
                      }`}
                    />
                    {label}
                  </li>
                ))}
              </ol>
            </article>

            <article className="rounded-[10px] border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold">Reviews that mean something</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Only clients with a completed order can review, so ratings reflect
                work that actually happened.
              </p>
              <div className="mt-4 rounded-[6px] border border-border bg-bg p-3">
                <RatingStars value={5} showValue={false} size="sm" />
                <p className="mt-1.5 text-[13px] leading-5 text-text">
                  “Delivered early and exactly on brief.”
                </p>
                <p className="mt-1 text-[11px] text-text-subtle">
                  Meera K. · completed order
                </p>
              </div>
            </article>
          </div>
        </Reveal>
      </section>

      <HomeSellers />

      {/* Testimonials */}
      <section className="mx-auto max-w-[1200px] px-4 pt-20 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What clients say after delivery.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="rounded-[10px] border border-border bg-surface p-5"
              >
                <RatingStars value={5} showValue={false} />
                <blockquote className="mt-3 text-[15px] leading-7 text-text">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-4 text-[13px] text-text-muted">
                  <span className="font-semibold text-text">
                    {testimonial.name}
                  </span>{" "}
                  · {testimonial.detail}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Seller CTA */}
      <section className="mx-auto max-w-[1200px] px-4 pt-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="overflow-hidden rounded-[14px] bg-text p-8 sm:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Sell your skills. Get paid when the work is approved.
                </h2>
                <p className="mt-3 text-base leading-7 text-white/70">
                  Publish a service with your price and timeline. We hold the
                  client&apos;s payment in escrow while you work.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-white/80">
                  {[
                    "Set your own price and delivery time",
                    "Payment released when the client approves",
                    "Free to list, no subscription",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0">
                <Link
                  href="/auth/register"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[10px] bg-white px-8 text-[15px] font-bold text-text transition hover:opacity-90"
                >
                  Start selling
                </Link>
                <p className="mt-2 text-center text-[12px] text-white/60">
                  Takes a few minutes to set up
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1000px] px-4 pt-20 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Questions, answered.
              </h2>
              <p className="mt-3 text-text-muted">
                Still stuck?{" "}
                <Link
                  href="/contact"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Talk to us
                </Link>
                .
              </p>
            </div>
            <Accordion items={faqs} />
          </div>
        </Reveal>
      </section>
    </main>
  );
}
