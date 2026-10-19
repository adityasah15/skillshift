import { formatINR } from "@/lib/format";

const PRICE_SIZES = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-3xl",
} as const;

/** Inline money value with tabular figures. `amount` is in paise. */
export function Money({
  amount,
  tone = "default",
  signed = false,
  className = "",
}: {
  amount: number;
  tone?: "default" | "positive" | "negative" | "muted";
  signed?: boolean;
  className?: string;
}) {
  const tones = {
    default: "text-text",
    positive: "text-success",
    negative: "text-danger",
    muted: "text-text-muted",
  } as const;
  const prefix = signed && amount > 0 ? "+" : "";

  return (
    <span className={`tabular ${tones[tone]} ${className}`}>
      {prefix}
      {formatINR(amount)}
    </span>
  );
}

/** Price block used on service cards and order summaries. */
export function Price({
  amount,
  label = "Starting at",
  size = "md",
  className = "",
}: {
  amount: number;
  label?: string;
  size?: keyof typeof PRICE_SIZES;
  className?: string;
}) {
  return (
    <span className={`block ${className}`}>
      {label && (
        <span className="block text-xs font-medium text-text-subtle">{label}</span>
      )}
      <span className={`tabular block font-bold text-text ${PRICE_SIZES[size]}`}>
        {formatINR(amount)}
      </span>
    </span>
  );
}
