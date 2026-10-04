/**
 * Hardened API client.
 * - Base: same-origin `/api/backend` proxy (never call :3000 directly).
 * - Attaches `Authorization: Bearer <token>` when a session exists.
 * - Public requests work without a token and never trigger refresh.
 * - 401 → single-flight `POST /auth/refresh` (HttpOnly cookie) then replay once.
 * - Errors normalised to ApiRequestError (never raw stacks).
 */
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./session";
import type { ApiErrorBody, Envelope } from "./types";

export class ApiRequestError extends Error {
  statusCode: number;
  path?: string;

  constructor(statusCode: number, message: string, path?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.path = path;
  }
}

function normaliseMessage(message: string | string[] | undefined): string {
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string" && message.length > 0) return message;
  return "Something went wrong. Please try again.";
}

let refreshPromise: Promise<string | null> | null = null;

function doRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch("/api/backend/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
        });
        if (!res.ok) {
          clearAccessToken();
          return null;
        }
        const json = (await res.json().catch(() => null)) as {
          data?: { accessToken?: string };
          accessToken?: string;
        } | null;
        const token =
          json?.data?.accessToken ?? json?.accessToken ?? null;
        if (typeof token === "string" && token.length > 0) {
          setAccessToken(token);
          return token;
        }
        clearAccessToken();
        return null;
      } catch {
        clearAccessToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

interface ApiOptions extends RequestInit {
  /** Attach bearer when present. Default true. */
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<Envelope<T>> {
  const { auth = true, ...init } = options;
  const token = auth ? getAccessToken() : null;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (res.status === 401 && auth && token) {
    const fresh = await doRefresh();
    if (fresh) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${fresh}`);
      if (init.body !== undefined && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      const retry = await fetch(`/api/backend${path}`, {
        ...init,
        headers: retryHeaders,
        credentials: "same-origin",
      });
      return parseEnvelope<T>(retry, path);
    }
  }

  return parseEnvelope<T>(res, path);
}

async function parseEnvelope<T>(
  res: Response,
  path: string,
): Promise<Envelope<T>> {
  if (res.status === 204) {
    return { data: undefined as T, meta: {} };
  }
  const json = (await res.json().catch(() => null)) as
    | ({ data?: T; meta?: Envelope<T>["meta"] } & Partial<ApiErrorBody>)
    | null;

  if (!res.ok) {
    const body = (json ?? {}) as Partial<ApiErrorBody>;
    throw new ApiRequestError(
      typeof body.statusCode === "number" ? body.statusCode : res.status,
      normaliseMessage(body.message as ApiErrorBody["message"]),
      typeof body.path === "string" ? body.path : path,
    );
  }

  if (json && typeof json === "object" && "data" in json) {
    return {
      data: json.data as T,
      meta: (json.meta ?? {}) as Envelope<T>["meta"],
    };
  }
  return { data: json as T, meta: {} };
}
