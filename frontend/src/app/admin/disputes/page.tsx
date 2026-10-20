import type { Metadata } from "next";
import { AdminDisputes } from "@/components/admin/AdminDisputes";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin disputes",
  robots: { index: false, follow: false },
};

export default function AdminDisputesPage() {
  return (
    <AdminShell
      eyebrow="Admin · Operations"
      title="Disputes"
      description="Full order context on every case. Resolving releases or refunds held funds."
    >
      <AdminDisputes />
    </AdminShell>
  );
}
