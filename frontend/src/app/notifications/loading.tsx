export default function NotificationsLoading() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="skeleton-shimmer h-4 w-28 rounded-full" />
        <div className="skeleton-shimmer mt-2 h-9 w-56 rounded-[10px]" />
        <div className="mt-6 space-y-2.5" aria-label="Loading notifications">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer h-20 rounded-[14px]" />
          ))}
        </div>
      </div>
    </main>
  );
}
