import type { Metadata } from "next";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin services",
  robots: { index: false, follow: false },
};

export default function AdminServicesPage() {
  return (
    <AdminShell
      eyebrow="Admin · Moderation"
      title="Services"
      description="Review new listings first — approve to go live, reject to keep hidden."
    >
      <AdminServices />
    </AdminShell>
  );
}
