import { SkeletonGrid } from "@/components/ui/States";

export default function ServicesLoading() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="skeleton-shimmer h-8 w-56 rounded-full" />
        <div className="skeleton-shimmer mt-3 h-4 w-96 max-w-full rounded-full" />
        <div className="mt-6">
          <SkeletonGrid count={6} />
        </div>
      </div>
    </main>
  );
}
