const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

/**
 * Star row plus optional numeric value and review count.
 * Numbers stay in Inter with tabular figures; stars always use --star.
 */
export function RatingStars({
  value,
  count,
  size = "sm",
  showValue = true,
  className = "",
}: {
  value: number;
  count?: number;
  size?: keyof typeof SIZES;
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Rated ${value.toFixed(1)} out of 5`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            className={`${SIZES[size]} ${i < rounded ? "text-star" : "text-border-strong"}`}
          >
            <path
              d="M7 1.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L7 10.1 3.5 11.9l.7-3.9L1.4 5.3l3.9-.6L7 1.2z"
              fill="currentColor"
            />
          </svg>
        ))}
      </span>
      {showValue && (
        <span className="tabular text-sm font-semibold text-text">
          {value.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="tabular text-[13px] text-text-muted">({count})</span>
      )}
    </span>
  );
}
