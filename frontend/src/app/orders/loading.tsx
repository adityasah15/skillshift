import { SkeletonGrid } from "@/components/ui/States";

export default function OrdersLoading() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="skeleton-shimmer h-4 w-28 rounded-full" />
        <div className="skeleton-shimmer mt-2 h-9 w-64 rounded-[10px]" />
        <div className="mt-6">
          <SkeletonGrid count={4} />
        </div>
      </div>
    </main>
  );
}
