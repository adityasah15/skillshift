import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default function Dashboard() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          What needs you, your money, and your latest work — at a glance.
        </p>
        <div className="mt-6">
          <DashboardPage />
        </div>
      </div>
    </main>
  );
}
