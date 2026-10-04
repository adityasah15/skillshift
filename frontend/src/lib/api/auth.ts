import { apiFetch } from "../api-client";
import type {
  AccessTokenPayload,
  Envelope,
  JwtPayload,
} from "../types";

export const authApi = {
  register(body: { email: string; password: string; role?: "CLIENT" | "FREELANCER" }) {
    return apiFetch<AccessTokenPayload>("/auth/register", {
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
