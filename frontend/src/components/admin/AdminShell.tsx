import type { ReactNode } from "react";
import { AdminNav } from "./AdminNav";
import { RequireAdmin } from "./RequireAdmin";

/** Shared frame for admin routes: heading, access check and section nav. */
export function AdminShell({
  title,
  eyebrow = "Admin",
  description,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-[13px] font-medium text-text-subtle">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-text-muted">
            {description}
          </p>
        )}

        <RequireAdmin>
          <div className="mt-6 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
            <AdminNav />
            <div className="mt-4 min-w-0 lg:mt-0">{children}</div>
          </div>
        </RequireAdmin>
      </div>
    </main>
  );
}
