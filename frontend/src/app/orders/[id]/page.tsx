import Link from "next/link";
import type { Metadata } from "next";
import { OrderCockpit } from "@/components/orders/OrderCockpit";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/orders"
          className="mb-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline"
        >
          ← Back to orders
        </Link>
        <OrderCockpit id={id} />
      </div>
    </main>
  );
}
