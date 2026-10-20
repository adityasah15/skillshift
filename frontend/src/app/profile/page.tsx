import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default function ProfileRoute() {
  return (
    <WorkspaceShell title="Profile">
      <ProfilePage />
    </WorkspaceShell>
  );
}
