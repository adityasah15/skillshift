"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiRequestError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";

export function ResendVerificationForm({ email: initialEmail }: { email?: string }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter the email you registered with.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await authApi.resendVerification(email.trim());
      setMessage(data.message);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not send a new link. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Input
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      {message && (
        <p role="status" className="text-sm leading-6 text-success">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm leading-6 text-danger">
          {error}
        </p>
      )}
      <Button type="submit" loading={submitting}>
        Send a new link
      </Button>
    </form>
  );
}
