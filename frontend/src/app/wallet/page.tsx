import type { Metadata } from "next";
import { WalletDashboard } from "@/components/wallet/WalletDashboard";

export const metadata: Metadata = { title: "Wallet", robots: { index: false, follow: false } };

export default function WalletPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Money</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Wallet</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          Your money, always labeled by where it sits.
        </p>
        <div className="mt-6">
          <WalletDashboard />
        </div>
      </div>
    </main>
  );
}
