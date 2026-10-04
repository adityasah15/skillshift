export default function ServiceDetailLoading() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-label="Loading service">
          <div className="space-y-4">
            <div className="skeleton-shimmer aspect-[16/9] rounded-[18px]" />
            <div className="skeleton-shimmer h-6 w-2/3 rounded-full" />
            <div className="skeleton-shimmer h-4 w-full rounded-full" />
            <div className="skeleton-shimmer h-4 w-5/6 rounded-full" />
          </div>
          <div className="skeleton-shimmer h-72 rounded-[18px]" />
        </div>
      </div>
    </main>
  );
}
