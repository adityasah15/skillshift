"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiRequestError } from "@/lib/api-client";
import { adminApi, type AdminUser } from "@/lib/api/admin";
import { useSessionToken } from "@/lib/session";

export function AdminUsers() {
  const token = useSessionToken();
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<{ user: AdminUser; action: "disable" | "enable" } | null>(null);
  const [acting, setActing] = useState(false);
  const [actError, setActError] = useState<string | null>(null);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFailed(null);
      try {
        const { data } = await adminApi.listUsers();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiRequestError) setFailed(err.message);
        else setFailed("We could not reach the server. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.profile?.displayName ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  async function confirm() {
    if (!target) return;
    setActing(true);
    setActError(null);
    try {
      await adminApi.manageUser(target.user.id, target.action);
      setTarget(null);
      // Note: backend listUsers filters deletedAt=null, so a disabled user
      // disappears on refetch. That is the server truth — not a missing row.
      const { data } = await adminApi.listUsers();
      setRows(data);
    } catch (err) {
      if (err instanceof ApiRequestError) setActError(err.message);
      else setActError("This change failed. Check your connection and try again.");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading users">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-[16px]" />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <ErrorState
        title="Could not load users"
        body={failed}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          {visible.length} account{visible.length === 1 ? "" : "s"} · disabled accounts leave this list.
        </p>
        <label className="block sm:w-72">
          <span className="sr-only">Search users</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email or name"
            className="min-h-[44px] w-full rounded-[12px] border border-border bg-surface px-4 text-[15px] text-text placeholder:text-text-subtle transition hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No users match"
          body="Try a different search, or check again after new signups."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[16px] border border-border bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[13px] text-text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Account</th>
                  <th scope="col" className="px-5 py-3 font-medium">Role</th>
                  <th scope="col" className="px-5 py-3 font-medium">Joined</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-text">{u.profile?.displayName ?? u.email}</p>
                      <p className="text-[13px] text-text-muted">{u.email}</p>
                    </td>
                    <td className="px-5 py-4 text-text-muted">{u.role}</td>
                    <td className="px-5 py-4 font-mono text-[13px] text-text-muted">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.role === "ADMIN" ? (
                        <span className="text-[13px] text-text-subtle">Protected</span>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setTarget({ user: u, action: "disable" })}>
                          Disable
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((u) => (
              <li key={u.id} className="rounded-[16px] border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-text">{u.profile?.displayName ?? u.email}</p>
                    <p className="truncate text-sm text-text-muted">{u.email}</p>
                    <p className="mt-1 text-[13px] text-text-subtle">{u.role}</p>
                  </div>
                  {u.role !== "ADMIN" && (
                    <Button variant="secondary" size="sm" onClick={() => setTarget({ user: u, action: "disable" })}>
                      Disable
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={target !== null}
        onClose={() => (acting ? null : setTarget(null))}
        title={target?.action === "disable" ? "Disable account?" : "Enable account?"}
        description={
          target?.action === "disable"
            ? "The user loses access immediately and leaves this list. Use for spam, fraud, or abuse."
            : "The account regains access immediately."
        }
      >
        {target && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">{target.user.email}</p>
            {actError && (
              <p role="alert" className="text-sm text-danger">{actError}</p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setTarget(null)} disabled={acting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirm} loading={acting}>
                Disable account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
