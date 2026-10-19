import type { Metadata } from "next";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };

export default function NotificationsPage() {
  return (
    <WorkspaceShell
      title="Notifications"
      description="Order updates, dispute decisions, and payment alerts — grouped by when they happened."
    >
      <NotificationsList />
    </WorkspaceShell>
  );
}
