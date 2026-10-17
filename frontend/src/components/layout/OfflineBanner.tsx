"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

/** Assume online on the server; the banner only shows on a confirmed disconnect. */
function getServerSnapshot() {
  return true;
}

/** Calm global banner when the browser goes offline. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
