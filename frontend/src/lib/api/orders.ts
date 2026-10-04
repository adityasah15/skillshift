import { apiFetch } from "../api-client";
import type { Order } from "../types";

export const ordersApi = {
  /** CLIENT. Body whitelist is exact: only serviceId + optional requirements. */
  create(body: { serviceId: string; requirements?: string }) {
    return apiFetch<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  list() {
    return apiFetch<Order[]>("/orders", { method: "GET" });
  },
  get(id: string) {
    return apiFetch<Order>(`/orders/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  },
};
