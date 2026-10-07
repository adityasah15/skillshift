import { apiFetch } from "../api-client";

/** Admin contract shapes (backend/src/admin/admin.service.ts + dispute.service.ts). */

export interface AdminAnalytics {
  ordersByStatus: Array<{ status: string; count: number }>;
  /** Released revenue, integer minor units (paise). */
  revenue: number;
  topFreelancers: Array<{
    id: string;
    email: string;
    profile: {
      displayName: string;
      rating: number;
      totalReviews: number;
    } | null;
  }>;
  disputeRate: number;
  newUsersPerDay: Array<{ date: string; count: number }>;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  profile: { displayName: string } | null;
}

export interface AdminServiceRow {
  id: string;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  skills: string[];
  imageUrls: string[];
  status: string;
  createdAt: string;
  freelancer: { email: string };
}

export interface AdminOrderRow {
  id: string;
  status: string;
  price: number;
  createdAt: string;
  service: { title: string };
  client: { email: string };
  freelancer: { email: string };
}

export interface AdminDispute {
  id: string;
  orderId: string;
  clientId: string;
  reason: string;
  status: string;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    status: string;
    price: number;
    deliveryNote: string | null;
    requirements: string | null;
    clientId: string;
    freelancerId: string;
    serviceId: string;
  };
  client: { id: string; email: string };
}

export type DisputeResolution = "RESOLVED_FREELANCER" | "RESOLVED_CLIENT";

export const adminApi = {
  analytics() {
    return apiFetch<AdminAnalytics>("/admin/analytics", { method: "GET" });
  },
  listUsers() {
    return apiFetch<AdminUser[]>("/admin/users", { method: "GET" });
  },
  listServices() {
    return apiFetch<AdminServiceRow[]>("/admin/services", { method: "GET" });
  },
  listOrders() {
    return apiFetch<AdminOrderRow[]>("/admin/orders", { method: "GET" });
  },
  /** No body — action is encoded in the path. */
  manageUser(id: string, action: "disable" | "enable") {
    return apiFetch<unknown>(`/admin/users/${encodeURIComponent(id)}/${action}`, {
      method: "PATCH",
    });
  },
  /**
   * Whitelist is exact: only `{ status }`.
   * Quirk: backend accepts no moderation note — UI explains the decision
   * inline via consequence text instead of a persisted note field.
   */
  moderateService(id: string, status: "ACTIVE" | "REJECTED") {
    return apiFetch<unknown>(`/admin/services/${encodeURIComponent(id)}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  listDisputes() {
    return apiFetch<AdminDispute[]>("/admin/disputes", { method: "GET" });
  },
  /** Whitelist: only resolution + optional adminNote. Omit empty notes. */
  resolveDispute(id: string, body: { resolution: DisputeResolution; adminNote?: string }) {
    const payload: { resolution: DisputeResolution; adminNote?: string } =
      body.adminNote && body.adminNote.trim().length > 0
        ? { resolution: body.resolution, adminNote: body.adminNote.trim() }
        : { resolution: body.resolution };
    return apiFetch<unknown>(`/admin/disputes/${encodeURIComponent(id)}/resolve`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
