import type { Metadata } from "next";
import { MyServicesPage } from "@/components/studio/MyServices";

export const metadata: Metadata = { title: "My services" };

export default function MyServicesRoute() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Studio</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">My services</h1>
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          Everything you sell — status, pricing, and listing controls in one place.
        </p>
        <div className="mt-6">
          <MyServicesPage />
        </div>
      </div>
    </main>
  );
}
