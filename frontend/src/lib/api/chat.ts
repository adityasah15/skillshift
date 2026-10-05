import { apiFetch } from "../api-client";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export const chatApi = {
  /** Participant only. Returns `{ messages, nextCursor }` — not a bare array. Live socket arrives in Phase 6. */
  history(orderId: string, limit = 20) {
    const params = new URLSearchParams({ limit: String(limit) });
    return apiFetch<{ messages: ChatMessage[]; nextCursor: string | null }>(
      `/chat/${encodeURIComponent(orderId)}/messages?${params.toString()}`,
      { method: "GET" },
    );
  },
};
