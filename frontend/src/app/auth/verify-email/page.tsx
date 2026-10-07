import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmail } from "@/components/auth/VerifyEmail";

export const metadata: Metadata = { title: "Verify email", robots: { index: false, follow: false } };

export default function VerifyEmailPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-center text-sm text-text-muted">Verifying…</p>}>
          <VerifyEmail />
        </Suspense>
      </div>
    </main>
  );
}
