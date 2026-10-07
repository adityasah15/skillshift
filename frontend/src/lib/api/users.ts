import { apiFetch } from "../api-client";
import type { PublicProfile, Role } from "../types";

export interface AccountProfile {
  id: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string;
  profile: {
    id: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    skills: string[];
    portfolioUrls: string[];
    rating: number;
    totalReviews: number;
  } | null;
}

export interface UpdateProfileBody {
  displayName?: string;
  bio?: string;
  skills?: string[];
  portfolioUrls?: string[];
}

export const usersApi = {
  /** Public seller profile. */
  publicProfile(id: string) {
    return apiFetch<PublicProfile>(`/users/${encodeURIComponent(id)}`, {
      method: "GET",
      auth: false,
    });
  },
  /** Own account incl. profile. */
  me() {
    return apiFetch<AccountProfile>("/users/me", { method: "GET" });
  },
  /** Whitelist-exact partial update. Avatar goes through the S3 pipeline, not here. */
  updateProfile(body: UpdateProfileBody) {
    return apiFetch<unknown>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};
