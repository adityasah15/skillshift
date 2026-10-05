import { apiFetch } from "../api-client";
import type { NotificationItem } from "../types";

/** Backend links sometimes point at `/orders/:id/chat`; we have no such route — normalize to the cockpit. */
function normalizeLink(link: string | null): string | null {
  if (!link) return null;
  return link.replace(/\/chat$/, "");
}

export const notificationsApi = {
  async list(): Promise<{ data: NotificationItem[] }> {
    const { data } = await apiFetch<NotificationItem[]>("/notifications", {
      method: "GET",
    });
    return { data: data.map((n) => ({ ...n, link: normalizeLink(n.link) })) };
  },
  unreadCount() {
    return apiFetch<number>("/notifications/unread-count", { method: "GET" });
  },
  markRead(id: string) {
    return apiFetch<unknown>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
    });
  },
  markAllRead() {
    return apiFetch<unknown>("/notifications/read-all", { method: "POST" });
  },
};
