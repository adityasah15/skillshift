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
          className="mb-5 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to messages
        </Link>
        <FullChat orderId={orderId} />
      </div>
    </main>
  );
}
