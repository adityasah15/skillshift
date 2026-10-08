import Link from "next/link";
import type { Metadata } from "next";
import { FullChat } from "@/components/chat/FullChat";

export const metadata: Metadata = { title: "Discussion", robots: { index: false, follow: false } };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/messages"
          className="mb-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline"
        >
          ← Back to messages
        </Link>
        <FullChat orderId={orderId} />
      </div>
    </main>
  );
}
