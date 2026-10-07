"use client";

import { useEffect, useState } from "react";

/** Calm global banner when the browser goes offline. */
export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[640px] rounded-[14px] border border-border bg-text px-5 py-3.5 text-center text-sm font-medium text-white shadow-lg"
    >
      You are offline — browsing works, but actions like ordering or messaging
      will fail until you reconnect.
    </div>
  );
}
