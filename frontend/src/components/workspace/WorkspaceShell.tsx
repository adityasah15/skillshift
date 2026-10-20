import Link from "next/link";
import type { ReactNode } from "react";
import { WorkspaceNav } from "./WorkspaceNav";

/** Shared authenticated frame: page heading, primary action and workspace nav. */
export function WorkspaceShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-text-subtle">Workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-text-muted">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>

        <div className="mt-6 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-8">
          <WorkspaceNav />
          <div className="mt-4 min-w-0 lg:mt-0">{children}</div>
        </div>
      </div>
    </main>
  );
}

/** Secondary action used in the shell's title row. */
export function WorkspaceActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text transition hover:border-border-strong hover:bg-surface-soft"
    >
      {children}
    </Link>
  );
}
