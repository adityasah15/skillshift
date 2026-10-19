"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";

/** One verification call per link per page load (dev StrictMode double-fires effects). */
const attemptedLinks = new Set<string>();

export function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function run() {
      if (!token || !email) {
        setState("error");
        setMessage("This verification link is incomplete. Request a new one or register again.");
        return;
      }
      const linkKey = `${email}:${token}`;
      if (attemptedLinks.has(linkKey)) return;
      attemptedLinks.add(linkKey);
      try {
        const { data } = await authApi.verifyEmail(token, email);
        setState("done");
        setMessage(data.message);
      } catch (err) {
        // Re-opening an already-verified link is a success, not an error.
        if (err instanceof ApiRequestError && /already verified/i.test(err.message)) {
          setState("done");
          setMessage(err.message);
          return;
        }
        setState("error");
        setMessage(
          err instanceof ApiRequestError
            ? err.message
            : "Verification failed. Please try again.",
        );
      }
    }
    run();
  }, [token, email]);

  return (
    <AuthCard
      title={
        state === "done"
          ? "Email verified"
          : state === "error"
            ? "Verification failed"
            : "Verifying…"
      }
      subtitle={
        state === "loading"
          ? "Hang tight while we confirm your email."
          : message
      }
    >
      {state === "done" ? (
        <Link
          href="/auth/login"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Log in to continue
        </Link>
      ) : state === "error" ? (
        <div className="flex flex-col gap-3">
          {email && (
            <div className="border-b border-border pb-4">
              <ResendVerificationForm email={email} />
            </div>
          )}
          <Link
            href="/auth/register"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] border border-border px-5 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
          >
            Back to registration
          </Link>
        </div>
      ) : (
        <div className="skeleton-shimmer h-12 rounded-[10px]" aria-hidden />
      )}
    </AuthCard>
  );
}
