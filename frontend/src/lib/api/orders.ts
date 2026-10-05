import { apiFetch } from "../api-client";
import type { Order, OrderDetail, OrderListItem } from "../types";

export const ordersApi = {
  /** CLIENT. Body whitelist is exact: only serviceId + optional requirements. */
  create(body: { serviceId: string; requirements?: string }) {
    return apiFetch<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  list() {
    return apiFetch<OrderListItem[]>("/orders", { method: "GET" });
  },
  get(id: string) {
    return apiFetch<OrderDetail>(`/orders/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  },
  /** FREELANCER, only from IN_PROGRESS. Whitelist: only deliveryNote. */
  deliver(id: string, deliveryNote: string) {
    return apiFetch<OrderDetail>(`/orders/${encodeURIComponent(id)}/deliver`, {
      method: "PATCH",
      body: JSON.stringify({ deliveryNote }),
    });
  },
  /** Either participant, only from IN_PROGRESS. Refunds escrow to client. */
  cancel(id: string) {
    return apiFetch<OrderDetail>(`/orders/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
    });
  },
  /** CLIENT, only from DELIVERED. Releases escrow to freelancer. */
  complete(id: string) {
    return apiFetch<OrderDetail>(`/orders/${encodeURIComponent(id)}/complete`, {
      method: "POST",
    });
  },
};

export const disputesApi = {
  /** Client opens from DELIVERED. Whitelist: only orderId + reason. */
  create(body: { orderId: string; reason: string }) {
    return apiFetch<unknown>("/disputes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
