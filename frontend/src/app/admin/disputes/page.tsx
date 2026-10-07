import type { Metadata } from "next";
import { AdminDisputes } from "@/components/admin/AdminDisputes";
import { AdminNav } from "@/components/admin/AdminNav";
import { RequireAdmin } from "@/components/admin/RequireAdmin";

export const metadata: Metadata = {
  title: "Admin disputes",
  robots: { index: false, follow: false },
};

export default function AdminDisputesPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Admin · Operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Disputes</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          Full order context on every case — resolving releases or refunds held funds.
        </p>
        <RequireAdmin>
          <div className="mt-6 space-y-6">
            <AdminNav />
            <AdminDisputes />
          </div>
        </RequireAdmin>
      </div>
    </main>
  );
}
