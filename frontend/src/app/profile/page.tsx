import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default function ProfileRoute() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Profile</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          How you appear to the marketplace, and where to find your work.
        </p>
        <div className="mt-6">
          <ProfilePage />
        </div>
      </div>
    </main>
  );
}
