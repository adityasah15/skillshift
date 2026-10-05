"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";

export function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token || !email) {
        setState("error");
        setMessage("This verification link is incomplete. Request a new one or register again.");
        return;
      }
      try {
        const { data } = await authApi.verifyEmail(token, email);
        if (cancelled) return;
        setState("done");
        setMessage(data.message);
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(
          err instanceof ApiRequestError
            ? err.message
            : "Verification failed. Please try again.",
        );
      }
    }
    run();
    return () => {
      cancelled = true;
    };
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
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Log in to continue
        </Link>
      ) : state === "error" ? (
        <Link
          href="/auth/register"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] border border-border px-5 text-sm font-semibold transition hover:border-border-strong hover:bg-surface-soft"
        >
          Back to registration
        </Link>
      ) : (
        <div className="skeleton-shimmer h-12 rounded-[12px]" aria-hidden />
      )}
    </AuthCard>
  );
}
