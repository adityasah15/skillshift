import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { RequireAdmin } from "@/components/admin/RequireAdmin";

export const metadata: Metadata = {
  title: "Admin users",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Admin · Monitoring</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Users</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          Accounts at a glance — disable only for spam, fraud, or abuse.
        </p>
        <RequireAdmin>
          <div className="mt-6 space-y-6">
            <AdminNav />
            <AdminUsers />
          </div>
        </RequireAdmin>
      </div>
    </main>
  );
}
