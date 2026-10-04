import { apiFetch } from "../api-client";
import type { PublicProfile } from "../types";

export const usersApi = {
  /** Public seller profile. */
  publicProfile(id: string) {
    return apiFetch<PublicProfile>(`/users/${encodeURIComponent(id)}`, {
      method: "GET",
      auth: false,
    });
  },
  me() {
    return apiFetch<unknown>("/users/me", { method: "GET" });
  },
};
