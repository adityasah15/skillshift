import { Suspense } from "react";
import type { Metadata } from "next";
import { FreelancerProfile } from "@/components/marketplace/FreelancerProfile";

export const metadata: Metadata = { title: "Freelancer profile" };

export default async function FreelancerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
          <FreelancerProfile id={id} />
        </Suspense>
      </div>
    </main>
  );
}
