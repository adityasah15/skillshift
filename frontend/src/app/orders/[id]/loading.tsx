export default function OrderLoading() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-label="Loading order">
          <div className="space-y-4">
            <div className="skeleton-shimmer h-8 w-2/3 rounded-full" />
            <div className="skeleton-shimmer h-40 rounded-[18px]" />
            <div className="skeleton-shimmer h-32 rounded-[18px]" />
          </div>
          <div className="skeleton-shimmer h-80 rounded-[18px]" />
        </div>
      </div>
    </main>
  );
}
