import type { Metadata } from "next";
import { OrdersList } from "@/components/orders/OrdersList";
import { WorkspaceActionLink, WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

export default function OrdersPage() {
  return (
    <WorkspaceShell
      title="Orders"
      description="Track every order from booking to delivery, with payments protected throughout."
      action={<WorkspaceActionLink href="/services">Browse services</WorkspaceActionLink>}
    >
      <OrdersList />
    </WorkspaceShell>
  );
}
