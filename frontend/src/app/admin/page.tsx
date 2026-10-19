import type { Metadata } from "next";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin overview",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminShell title="Overview" description="Marketplace health at a glance.">
      <AdminOverview />
    </AdminShell>
  );
}
