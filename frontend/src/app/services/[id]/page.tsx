import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ServiceDetail } from "@/components/marketplace/ServiceDetail";
import { CardSkeleton } from "@/components/ui/States";

export const dynamic = "force-dynamic";

const BACKEND = process.env.SKILLSHIFT_API_URL ?? "http://localhost:3000";

interface ServicePayload {
  title?: string;
  description?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/services/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`backend ${res.status}`);
    const json = (await res.json()) as { data?: ServicePayload };
    const title = json.data?.title ?? "Service details";
    const description =
      json.data?.description?.slice(0, 160) ??
      "View pricing, delivery time, reviews, and the freelancer behind this offer.";
    return {
      title,
      description,
      alternates: { canonical: `/services/${id}` },
      openGraph: { title: `${title} · SkillShift`, description },
    };
  } catch {
    return {
      title: "Service details",
      description:
        "View pricing, delivery time, reviews, and the freelancer behind this offer.",
    };
  }
}

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
          className="mb-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline"
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
