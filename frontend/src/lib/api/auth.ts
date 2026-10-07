import { apiFetch } from "../api-client";
import type {
  AccessTokenPayload,
  Envelope,
  JwtPayload,
  RegisterResponse,
} from "../types";

export const authApi = {
  /** Returns { id, email, role } — no tokens. User must verify email, then log in. */
  register(body: { email: string; password: string; role?: "CLIENT" | "FREELANCER" }) {
    return apiFetch<RegisterResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    });
  },
  login(body: { email: string; password: string }) {
    return apiFetch<AccessTokenPayload>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    });
  },
  verifyEmail(token: string, email: string) {
    const params = new URLSearchParams({ token, email });
    return apiFetch<{ message: string }>(
      `/auth/verify-email?${params.toString()}`,
      { method: "GET", auth: false },
    );
  },
  resendVerification(email: string) {
    return apiFetch<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email }),
    });
  },
  me() {
    return apiFetch<JwtPayload>("/auth/me", { method: "GET" });
  },
  logout(): Promise<Envelope<unknown>> {
    return apiFetch<unknown>("/auth/logout", { method: "POST" });
  },
  forgotPassword(email: string) {
    return apiFetch<unknown>("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(body: { email: string; token: string; newPassword: string }) {
    return apiFetch<unknown>("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    });
  },
};
