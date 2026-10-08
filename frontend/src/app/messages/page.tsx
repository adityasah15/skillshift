import type { Metadata } from "next";
import { MessagesInbox } from "@/components/messages/MessagesInbox";

export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

export default function MessagesPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Messages</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          One discussion per order — pick up right where you left off.
        </p>
        <div className="mt-6">
          <MessagesInbox />
        </div>
      </div>
    </main>
  );
}
