import type { Metadata } from "next";
import { NewServicePage } from "@/components/studio/NewService";

export const metadata: Metadata = { title: "Publish a service" };

export default function NewServiceRoute() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-text-muted">Studio</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Publish a service</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-7 text-text-muted">
          Clear scope and honest pricing get ordered. Images upload straight from
          this form — no links to paste.
        </p>
        <div className="mt-6">
          <NewServicePage />
        </div>
      </div>
    </main>
  );
}
