"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createChatSocket, type Socket } from "@/lib/chat-socket";
import { chatApi, type ChatMessage } from "@/lib/api/chat";
import { useSessionToken } from "@/lib/session";

type ConnState = "connecting" | "live" | "offline";

/**
 * Live discussion for one order: REST history + socket join/send/presence.
 * Never dead-ends: the composer stays usable and every failure explains
 * itself with a retry. Drafts are never discarded on send failure.
 */
export function OrderChat({
  orderId,
  myId,
  peerId,
}: {
  orderId: string;
  myId: string;
  peerId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [attempt, setAttempt] = useState(0);
  // Render-phase reset keeps "connecting" honest across manual retries
  // without setState-in-effect violations.
  const [connState, setConnState] = useState<{ forAttempt: number; conn: ConnState }>({
    forAttempt: 0,
    conn: "connecting",
  });
  if (connState.forAttempt !== attempt) {
    setConnState({ forAttempt: attempt, conn: "connecting" });
  }
  const conn = connState.forAttempt === attempt ? connState.conn : "connecting";
  const setConn = (c: ConnState) =>
    setConnState((s) => (s.conn === c ? s : { ...s, conn: c }));
  const [peerOnline, setPeerOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useSessionToken();
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    chatApi
      .history(orderId)
      .then((r) => {
        if (!cancelled) setMessages(r.data.messages);
      })
      .catch(() => {
        if (!cancelled) setMessages(null);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // attempt doubles as the manual-retry trigger: recreating the socket.
  // No synchronous setState here — all updates happen in socket callbacks.
  useEffect(() => {
    if (!sessionToken) return;
    const socket = createChatSocket(sessionToken);
    socketRef.current = socket;

    const onNew = (m: ChatMessage) => {
      setMessages((cur) => {
        if (cur === null) return [m];
        if (cur.some((x) => x.id === m.id)) return cur;
        return [...cur, m];
      });
    };
    const onOnline = ({ userId }: { userId: string }) => {
      if (userId === peerId) setPeerOnline(true);
    };
    const onOffline = ({ userId }: { userId: string }) => {
      if (userId === peerId) setPeerOnline(false);
    };
    const onException = (e: { message?: string } | string) => {
      setError(typeof e === "string" ? e : (e.message ?? "Realtime update failed."));
    };

    socket.on("connect", () => {
      socket.emit("join_order", { orderId });
      // Presence heartbeat (server TTL 30s).
      socket.emit("ping");
      setConn("live");
      setError(null);
    });
    const markOffline = () => {
      // connect_error fires per failed attempt; only settle after retries end.
      if (!socket.active) setConn("offline");
    };
    socket.on("disconnect", () => setConn("offline"));
    socket.on("connect_error", markOffline);
    socket.on("new_message", onNew);
    socket.on("user_online", onOnline);
    socket.on("user_offline", onOffline);
    socket.on("exception", onException);

    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit("ping");
    }, 25000);

    return () => {
      clearInterval(heartbeat);
      socket.off("new_message", onNew);
      socket.off("user_online", onOnline);
      socket.off("user_offline", onOffline);
      socket.off("exception", onException);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [orderId, peerId, attempt, sessionToken]);

  const effectiveConn: ConnState = sessionToken === null ? "offline" : conn;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages?.length]);

  function retry() {
    setError(null);
    setAttempt((n) => n + 1);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    if (content.length > 2000) {
      setError("Messages must be 2000 characters or fewer.");
      return;
    }
    const socket = socketRef.current;
    if (!socket?.connected) {
      setError("Not connected to chat — your message is kept below. Reconnect and send again.");
      if (effectiveConn === "offline") retry();
      return;
    }
    setSending(true);
    setError(null);
    socket.emit(
      "send_message",
      { orderId, content },
      (res: ChatMessage | { message?: string; statusCode?: number } | null) => {
        setSending(false);
        if (res && "message" in (res as object) && !(res as ChatMessage).id) {
          // Draft preserved — nothing is silently eaten.
          setError((res as { message: string }).message);
        } else {
          setDraft("");
        }
      },
    );
    // Safety: never leave the composer stuck if no ack arrives.
    setTimeout(() => setSending(false), 8000);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${peerOnline ? "bg-success" : effectiveConn === "live" ? "bg-info" : effectiveConn === "connecting" ? "bg-warning" : "bg-danger"}`}
        />
        <span aria-live="polite">
          {peerOnline
            ? "Other party online"
            : effectiveConn === "live"
              ? "Connected"
              : effectiveConn === "connecting"
                ? "Connecting…"
                : "Offline — history still available"}
        </span>
        {effectiveConn === "offline" && (
          <button
            type="button"
            onClick={retry}
            className="cursor-pointer font-semibold text-primary hover:underline"
          >
            Retry connection
          </button>
        )}
      </div>

      {messages === null ? (
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          Message history is unavailable right now.{" "}
          <button type="button" onClick={retry} className="cursor-pointer font-semibold text-primary hover:underline">
            Retry
          </button>
        </p>
      ) : messages.length === 0 ? (
        <p className="mt-2 text-[15px] leading-7 text-text-muted">
          No messages yet. Say hello and align on scope and timelines.
        </p>
      ) : (
        <ul className="mt-3 max-h-72 space-y-2.5 overflow-y-auto" aria-live="polite">
          {messages.map((m) => {
            const mine = m.senderId === myId;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[80%] rounded-[14px] px-3.5 py-2.5 text-sm leading-6 ${
                    mine ? "bg-primary text-white" : "bg-surface-soft text-text"
                  }`}
                >
                  {m.content}
                </p>
              </li>
            );
          })}
          <div ref={bottomRef} />
        </ul>
      )}

      <form onSubmit={send} className="mt-3 flex gap-2">
        <label htmlFor={`chat-${orderId}`} className="sr-only">
          Message
        </label>
        <input
          id={`chat-${orderId}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
          className="min-h-[44px] flex-1 rounded-[12px] border border-border bg-surface px-4 text-[15px] placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none disabled:opacity-60"
        />
        <Button type="submit" loading={sending} disabled={draft.trim().length === 0}>
          Send
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-[13px] leading-6 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
