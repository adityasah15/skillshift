import type { Metadata } from "next";
import { WalletDashboard } from "@/components/wallet/WalletDashboard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata: Metadata = { title: "Wallet", robots: { index: false, follow: false } };

export default function WalletPage() {
  return (
    <WorkspaceShell
      title="Wallet"
      description="Your money, always labeled by where it sits."
    >
      <WalletDashboard />
    </WorkspaceShell>
  );
}
