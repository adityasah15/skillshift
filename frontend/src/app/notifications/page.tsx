import type { Metadata } from "next";
import { NotificationsList } from "@/components/notifications/NotificationsList";

export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };

export default function NotificationsPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Updates</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Notifications</h1>
        <div className="mt-6">
          <NotificationsList />
        </div>
      </div>
    </main>
  );
}
