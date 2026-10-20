import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { WorkspaceActionLink, WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default function Dashboard() {
  return (
    <WorkspaceShell
      title="Dashboard"
      action={<WorkspaceActionLink href="/services">Browse services</WorkspaceActionLink>}
    >
      <DashboardPage />
    </WorkspaceShell>
  );
}
