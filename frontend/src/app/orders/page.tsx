import type { Metadata } from "next";
import { OrdersList } from "@/components/orders/OrdersList";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Orders</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          Every order with its status and where the money sits.
        </p>
        <div className="mt-6">
          <OrdersList />
        </div>
      </div>
    </main>
  );
}
