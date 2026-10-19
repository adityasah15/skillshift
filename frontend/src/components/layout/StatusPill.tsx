"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "checking" | "operational" | "degraded" | "unreachable";

const COPY: Record<Status, { label: string; dot: string; text: string }> = {
  checking: {
    label: "Checking status…",
    dot: "bg-[#9aa1b8]",
    text: "text-white/60",
  },
  operational: {
    label: "All systems operational",
    dot: "bg-[#5fd0a3]",
    text: "text-[#c9cde0]",
  },
  degraded: {
    label: "Some features may be slower",
    dot: "bg-[#f0c674]",
    text: "text-[#f0c674]",
  },
  unreachable: {
    label: "Status unavailable",
    dot: "bg-[#9aa1b8]",
    text: "text-white/60",
  },
};

/**
 * Liveness probe for the footer. The API has no health route, so this uses
 * the public services list with limit=1 as a lightweight check. Polls once
 * on mount and every 60s while the tab is visible; never blocks rendering.
 */
export function StatusPill({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const mounted = useRef(true);

  const probe = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch("/api/backend/services?limit=1", {
        signal: controller.signal,
        cache: "no-store",
      });
      if (mounted.current) setStatus(res.ok ? "operational" : "degraded");
    } catch {
      if (mounted.current) setStatus("unreachable");
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const first = setTimeout(() => {
      void probe();
    }, 0);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void probe();
    }, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void probe();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted.current = false;
      clearTimeout(first);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [probe]);

  const entry = COPY[status];

  return (
    <p
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 text-[13px] ${entry.text} ${className}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        {status === "operational" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5fd0a3] opacity-60" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${entry.dot}`} />
      </span>
      {entry.label}
    </p>
  );
}
