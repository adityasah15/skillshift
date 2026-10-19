import { formatINR } from "@/lib/format";

type Viewer = "client" | "freelancer";

const STEPS = [
  { key: "funded", label: "Funded", hint: "Payment held" },
  { key: "in_progress", label: "In progress", hint: "Work begins" },
  { key: "delivered", label: "Delivered", hint: "Work submitted" },
  { key: "released", label: "Released", hint: "Client approves" },
] as const;

type Tone = "held" | "released" | "refunded" | "dispute";

const TONE_TEXT: Record<Tone, string> = {
  held: "text-warning",
  released: "text-success",
  refunded: "text-success",
  dispute: "text-warning",
};

/** Short money label shared with order summaries. */
export function escrowLabel(status: string): "Held in escrow" | "Released" | "Refunded" {
  if (status === "COMPLETED") return "Released";
  if (status === "CANCELLED" || status === "REFUNDED") return "Refunded";
  return "Held in escrow";
}

function resolveState(status: string, viewer: Viewer): {
  reached: number;
  tone: Tone;
  note: string;
} {
  switch (status) {
    case "COMPLETED":
      return {
        reached: 3,
        tone: "released",
        note:
          viewer === "freelancer"
            ? "Paid into your wallet."
            : "The freelancer has been paid.",
      };
    case "DELIVERED":
      return {
        reached: 2,
        tone: "held",
        note:
          viewer === "client"
            ? "Review the delivery — payment releases when you approve."
            : "Waiting for the client to approve and release payment.",
      };
    case "DISPUTED":
      return {
        reached: 2,
        tone: "dispute",
        note: "Under review — funds stay held until an admin resolves it.",
      };
    case "CANCELLED":
    case "REFUNDED":
      return {
        reached: 0,
        tone: "refunded",
        note:
          viewer === "freelancer"
            ? "The order was cancelled and the client was refunded."
            : "Refunded to your wallet.",
      };
    case "IN_PROGRESS":
      return {
        reached: 1,
        tone: "held",
        note:
          viewer === "freelancer"
            ? "The client's payment is held while you work."
            : "Payment is held while the freelancer works.",
      };
    default:
      return {
        reached: 0,
        tone: "held",
        note: "Payment is held while the order starts.",
      };
  }
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefundIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 4.5h5.5a3 3 0 1 1 0 6H4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 2.5L2.8 4.6 5 6.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Signature escrow tracker: Funded → In progress → Delivered → Released.
 * Status is always icon + label; colour is support, never the only signal.
 * Terminal orders explain what happened to the money instead of pretending
 * the happy path continued.
 */
export function EscrowTracker({
  status,
  price,
  viewer,
  className = "",
}: {
  status: string;
  price: number;
  viewer: Viewer;
  className?: string;
}) {
  const state = resolveState(status, viewer);
  const refunded = state.tone === "refunded";
  const stepIndex = state.reached;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 rounded-[10px] border border-border bg-bg px-4 py-3">
        <div>
          <p className="text-[12px] text-text-subtle">{escrowLabel(status)}</p>
          <p className="tabular text-lg font-bold text-text">
            {formatINR(price)}
          </p>
        </div>
        <p
          className={`max-w-sm text-[13px] leading-5 font-medium ${TONE_TEXT[state.tone]}`}
        >
          {state.note}
        </p>
      </div>

      <ol aria-label="Escrow progress" className="mt-4 grid grid-cols-4">
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          const refundMarker = refunded && i === 3;
          const leftDone = i > 0 && i <= stepIndex;
          const rightDone = i < STEPS.length - 1 && i < stepIndex;
          const label = refundMarker ? "Refunded" : step.label;
          const hint = refundMarker ? "Funds returned" : step.hint;

          return (
            <li
              key={step.key}
              className="flex flex-col items-center text-center"
            >
              <div className="flex w-full items-center">
                <span
                  aria-hidden
                  className={`h-0.5 flex-1 rounded ${
                    i === 0 ? "bg-transparent" : leftDone ? "bg-success" : "bg-border"
                  }`}
                />
                <span
                  aria-current={current ? "step" : undefined}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    refundMarker
                      ? "bg-success text-white"
                      : done
                        ? "bg-success text-white"
                        : current
                          ? "bg-primary text-white ring-4 ring-primary-soft"
                          : "border border-border bg-surface text-text-subtle"
                  }`}
                >
                  {refundMarker ? (
                    <RefundIcon />
                  ) : done ? (
                    <CheckIcon />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  aria-hidden
                  className={`h-0.5 flex-1 rounded ${
                    i === STEPS.length - 1
                      ? "bg-transparent"
                      : rightDone
                        ? "bg-success"
                        : "bg-border"
                  }`}
                />
              </div>
              <p
                className={`mt-2 text-[12px] font-semibold sm:text-[13px] ${
                  done || current || refundMarker
                    ? "text-text"
                    : "text-text-subtle"
                }`}
              >
                {label}
              </p>
              <p className="hidden text-[11px] text-text-muted sm:block">
                {hint}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
