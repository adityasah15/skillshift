import type { Metadata } from "next";
import { MyServicesPage } from "@/components/studio/MyServices";
import { WorkspaceActionLink, WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata: Metadata = { title: "My services", robots: { index: false, follow: false } };

export default function MyServicesRoute() {
  return (
    <WorkspaceShell
      title="My services"
      description="Status, pricing, and listing controls for everything you sell."
      action={<WorkspaceActionLink href="/services/new">New service</WorkspaceActionLink>}
    >
      <MyServicesPage />
    </WorkspaceShell>
  );
}
