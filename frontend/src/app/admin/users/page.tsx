import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsers } from "@/components/admin/AdminUsers";

export const metadata: Metadata = {
  title: "Admin users",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <AdminShell
      eyebrow="Admin · Monitoring"
      title="Users"
      description="Search accounts and manage access."
    >
      <AdminUsers />
    </AdminShell>
  );
}
