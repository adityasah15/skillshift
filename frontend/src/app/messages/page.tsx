import type { Metadata } from "next";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

export default function MessagesPage() {
  return (
    <WorkspaceShell title="Messages">
      <MessagesInbox />
    </WorkspaceShell>
  );
}
