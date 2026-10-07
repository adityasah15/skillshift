import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";

export const metadata: Metadata = { title: "Check your email", robots: { index: false, follow: false } };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <AuthCard
          title="Check your email"
          subtitle={
            email
              ? `We sent a verification link to ${email}. Open it to activate your account, then log in.`
              : "We sent you a verification link. Open it to activate your account, then log in."
          }
          footer={
            <>
              Verified already?{" "}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </>
          }
        >
          <p className="rounded-[14px] bg-info-soft px-4 py-3 text-sm leading-6 text-info">
            Log in stays locked until your email is verified — this keeps the
            marketplace free of throwaway accounts.
          </p>
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-text">
              Link expired or never arrived?
            </p>
            <ResendVerificationForm email={email} />
          </div>
        </AuthCard>
      </div>
    </main>
  );
}
