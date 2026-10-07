export default function FreelancerLoading() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4" aria-label="Loading profile">
          <div className="skeleton-shimmer h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton-shimmer h-5 w-48 rounded-full" />
            <div className="skeleton-shimmer h-4 w-72 max-w-full rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
