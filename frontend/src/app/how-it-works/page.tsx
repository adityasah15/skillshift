import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  {
    title: "Discover the right offer",
    body: "Browse services with upfront pricing, delivery times, and seller reviews. No hidden fees, no vague promises.",
  },
  {
    title: "Order with protection",
    body: "When you place an order, your payment is held in escrow. The freelancer only gets paid when you approve the delivery.",
  },
  {
    title: "Chat and track",
    body: "Message the freelancer in the order, follow status changes, and get files delivered in one place.",
  },
  {
    title: "Approve or raise a concern",
    body: "Accept the delivery to release payment, or open a dispute. An admin reviews disputes with full context.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">How it works</p>
        <h1 className="mt-1 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Discover, order, and get the work — without the anxiety.
        </h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {steps.map((s, i) => (
            <article
              key={s.title}
              className="rounded-[18px] border border-border bg-surface p-6"
            >
              <p className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {i + 1}
              </p>
              <h2 className="mt-3 text-lg font-semibold">{s.title}</h2>
              <p className="mt-1.5 text-[15px] leading-7 text-text-muted">{s.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/services"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Browse services
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-border bg-surface px-6 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
          >
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
