import { Suspense } from "react";
import type { Metadata } from "next";
import { ServicesBrowser } from "@/components/marketplace/ServicesBrowser";
import { SkeletonGrid } from "@/components/ui/States";

export const metadata: Metadata = {
  title: "Browse services",
  description:
    "Search freelance services by skill and price. Clear delivery times, reviews, and protected payments on every order.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Browse services · SkillShift",
    description:
      "Search freelance services by skill and price. Clear delivery times, reviews, and protected payments on every order.",
  },
};

export default function ServicesPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-text-muted">Marketplace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Browse services
          </h1>
          <p className="mt-2 text-[15px] leading-7 text-text-muted">
            Clear pricing, delivery times, and reviews — pick with confidence.
          </p>
        </div>

        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ServicesBrowser />
        </Suspense>
      </div>
    </main>
  );
}
