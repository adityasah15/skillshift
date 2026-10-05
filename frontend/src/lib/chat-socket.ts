import { io, type Socket } from "socket.io-client";

/**
 * Chat namespace socket. WS upgrade cannot go through the
 * `/api/backend` route-handler proxy, so this connects directly to the
 * backend origin (CORS allows `FRONTEND_URL`). Proven-need exception to the
 * no-new-deps rule: the socket.io protocol requires its client.
 */
export function createChatSocket(token: string): Socket {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  return io(`${base}/chat`, {
    auth: { token: `Bearer ${token}` },
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    timeout: 10000,
  });
}

export type { Socket };
