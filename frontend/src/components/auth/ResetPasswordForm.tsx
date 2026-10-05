"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword: password,
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not reset your password. The link may have expired.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Paste the reset details from your email if they didn't fill in."
    >
      {done ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-[14px] bg-success-soft px-4 py-3 text-sm leading-6 text-success">
            Password updated. Log in with your new password.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Log in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Reset token"
            name="token"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="From your reset email"
          />
          <Input
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          {error && (
            <p role="alert" className="text-sm leading-6 text-danger">
              {error}
            </p>
          )}
          <Button type="submit" loading={submitting} size="lg" className="w-full">
            Update password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
