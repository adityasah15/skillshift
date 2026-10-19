import type { Metadata } from "next";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin orders",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return (
    <AdminShell
      eyebrow="Admin · Monitoring"
      title="Orders"
      description="Every order, its parties, price, and status."
    >
      <AdminOrders />
    </AdminShell>
  );
}
