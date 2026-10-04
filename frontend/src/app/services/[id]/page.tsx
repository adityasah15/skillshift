import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ServiceDetail } from "@/components/marketplace/ServiceDetail";
import { CardSkeleton } from "@/components/ui/States";

export const metadata: Metadata = { title: "Service details" };

export default async function ServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/services"
          className="mb-5 inline-block text-sm font-semibold text-primary hover:underline"
        >
          ← Back to services
        </Link>
        <Suspense
          fallback={
            <div aria-label="Loading service">
              <CardSkeleton />
            </div>
          }
        >
          <ServiceDetail id={id} />
        </Suspense>
      </div>
    </main>
  );
}
