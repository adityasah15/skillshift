import { apiFetch } from "../api-client";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export const chatApi = {
  /**
   * Participant only. Newest-first pages of `{ messages, nextCursor }` —
   * pass `nextCursor` back as `cursor` for the next (older) page.
   * Callers display chronological order (reverse each page).
   */
  history(orderId: string, cursor?: string | null, limit = 20) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return apiFetch<{ messages: ChatMessage[]; nextCursor: string | null }>(
      `/chat/${encodeURIComponent(orderId)}/messages?${params.toString()}`,
      { method: "GET" },
    );
  },
};
