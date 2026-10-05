"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";

type AccountRole = "CLIENT" | "FREELANCER";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("CLIENT");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await authApi.register({
        email: email.trim(),
        password,
        role,
      });
      router.push(`/auth/check-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not create your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Join SkillShift"
      subtitle="One account for ordering and selling — pick how you'll start."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div role="group" aria-label="Choose your account type" className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "CLIENT", label: "Hire", hint: "Post orders" },
              { value: "FREELANCER", label: "Sell", hint: "Offer services" },
            ] as const
          ).map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setRole(o.value)}
              aria-pressed={role === o.value}
              className={`min-h-[56px] cursor-pointer rounded-[14px] border px-4 py-2.5 text-left transition ${
                role === o.value
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="block text-[13px] text-text-muted">{o.hint}</span>
            </button>
          ))}
        </div>
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
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          hint="You'll verify this email before logging in."
        />
        {error && (
          <p role="alert" className="text-sm leading-6 text-danger">
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting} size="lg" className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
