import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminServices } from "@/components/admin/AdminServices";
import { RequireAdmin } from "@/components/admin/RequireAdmin";

export const metadata: Metadata = {
  title: "Admin services",
  robots: { index: false, follow: false },
};

export default function AdminServicesPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Admin · Moderation</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Services</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          Review new listings first — approve to go live, reject to keep hidden.
        </p>
        <RequireAdmin>
          <div className="mt-6 space-y-6">
            <AdminNav />
            <AdminServices />
          </div>
        </RequireAdmin>
      </div>
    </main>
  );
}
