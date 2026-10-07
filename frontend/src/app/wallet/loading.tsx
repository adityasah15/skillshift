export default function WalletLoading() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="skeleton-shimmer h-4 w-28 rounded-full" />
        <div className="skeleton-shimmer mt-2 h-9 w-48 rounded-[10px]" />
        <div className="mt-6 space-y-4" aria-label="Loading wallet">
          <div className="skeleton-shimmer h-44 rounded-[18px]" />
          <div className="skeleton-shimmer h-14 rounded-[14px]" />
          <div className="skeleton-shimmer h-14 rounded-[14px]" />
        </div>
      </div>
    </main>
  );
}
