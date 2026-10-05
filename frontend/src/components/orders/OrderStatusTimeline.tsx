const STEPS = ["IN_PROGRESS", "DELIVERED", "COMPLETED"] as const;
const LABELS: Record<string, string> = {
  IN_PROGRESS: "In progress",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

const TERMINAL_NOTE: Record<string, string> = {
  DISPUTED: "This order is under dispute. An admin reviews it with full context.",
  CANCELLED: "This order was cancelled and the held amount was refunded.",
  REFUNDED: "The held amount was refunded to the client.",
  PENDING: "This order is waiting to start.",
};

/** Lifecycle strip. Terminal states render as an explanatory note, not steps. */
export function OrderStatusTimeline({ status }: { status: string }) {
  const terminal = TERMINAL_NOTE[status];
  if (terminal) {
    return (
      <p className="rounded-[14px] bg-surface-soft px-4 py-3 text-sm leading-6 text-text-muted">
        {terminal}
      </p>
    );
  }
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol aria-label="Order progress" className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done = current === -1 ? false : i <= current;
        const isCurrent = i === current;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-start gap-1.5">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done ? "bg-success text-white" : "bg-surface-strong text-text-muted"
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-xs font-medium ${done ? "text-text" : "text-text-subtle"}`}>
                {LABELS[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span aria-hidden className={`mx-2 mb-6 h-0.5 flex-1 rounded ${i < current ? "bg-success" : "bg-surface-strong"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
