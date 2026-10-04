"use client";

import { useSyncExternalStore } from "react";

const KEY = "skillshift_access_token";
const EVENT = "skillshift:token";

function read(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function notify() {
  window.dispatchEvent(new Event(EVENT));
}

export function getAccessToken(): string | null {
  return read();
}

export function setAccessToken(token: string) {
  try {
    window.sessionStorage.setItem(KEY, token);
  } catch {
    // storage unavailable (private mode) — keep in-memory only
  }
  notify();
}

export function clearAccessToken() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  notify();
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onChange);
  };
}

/** Reactive access-token reader. Null on server. */
export function useSessionToken(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
