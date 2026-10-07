import { Suspense } from "react";
import type { Metadata } from "next";
import { FreelancerProfile } from "@/components/marketplace/FreelancerProfile";

export const dynamic = "force-dynamic";

const BACKEND = process.env.SKILLSHIFT_API_URL ?? "http://localhost:3000";

interface ProfilePayload {
  displayName?: string;
  bio?: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/users/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`backend ${res.status}`);
    const json = (await res.json()) as { data?: ProfilePayload };
    const name = json.data?.displayName ?? "Freelancer profile";
    const description =
      json.data?.bio?.slice(0, 160) ??
      "Freelancer profile with skills, ratings, and reviews on SkillShift.";
    return {
      title: name,
      description,
      alternates: { canonical: `/freelancers/${id}` },
      openGraph: { title: `${name} · SkillShift`, description },
    };
  } catch {
    return {
      title: "Freelancer profile",
      description:
        "Freelancer profile with skills, ratings, and reviews on SkillShift.",
    };
  }
}

export default async function FreelancerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="flex items-center gap-4" aria-label="Loading profile">
              <div className="skeleton-shimmer h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="skeleton-shimmer h-5 w-48 rounded-full" />
                <div className="skeleton-shimmer h-4 w-72 max-w-full rounded-full" />
              </div>
            </div>
          }
        >
          <FreelancerProfile id={id} />
        </Suspense>
      </div>
    </main>
  );
}
