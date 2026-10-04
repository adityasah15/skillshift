type Tone = "success" | "warning" | "danger" | "info" | "neutral";

/** Human labels — never render raw enums. Single source of truth. */
const LABELS: Record<string, { label: string; tone: Tone }> = {
  // Services
  PENDING_REVIEW: { label: "In review", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
  REJECTED: { label: "Not approved", tone: "danger" },
  PAUSED: { label: "Paused", tone: "neutral" },
  // Orders
  PENDING: { label: "Waiting to start", tone: "info" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  DISPUTED: { label: "Under dispute", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  // Escrow / disputes
  HOLDING: { label: "Held in escrow", tone: "warning" },
  RELEASED: { label: "Released", tone: "success" },
  OPEN: { label: "Open", tone: "warning" },
  UNDER_REVIEW: { label: "Under review", tone: "info" },
  RESOLVED_FREELANCER: { label: "Resolved for freelancer", tone: "success" },
  RESOLVED_CLIENT: { label: "Resolved for client", tone: "success" },
};

const tones: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-soft text-text-muted",
};

function Icon({ tone }: { tone: Tone }) {
  const common = "shrink-0";
  if (tone === "success")
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={common}>
        <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (tone === "warning")
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={common}>
        <path d="M8 2L15 13.5H1L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.9" fill="currentColor" />
      </svg>
    );
  if (tone === "danger")
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={common}>
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (tone === "info")
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={common}>
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7.2v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="5" r="0.9" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={common}>
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const entry = LABELS[status] ?? { label: status, tone: "neutral" as Tone };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${tones[entry.tone]}`}
    >
      <Icon tone={entry.tone} />
      {entry.label}
    </span>
  );
}
