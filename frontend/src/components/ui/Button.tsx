import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover border border-transparent",
  secondary:
    "bg-surface text-text border border-border hover:border-border-strong hover:bg-surface-soft",
  accent: "bg-accent text-white hover:brightness-95 border border-transparent",
  danger: "bg-danger text-white hover:brightness-95 border border-transparent",
  ghost: "bg-transparent text-text-muted hover:text-text hover:bg-surface-soft border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "min-h-[44px] px-4 py-1.5 text-[13px]",
  md: "min-h-[44px] px-5 py-2.5 text-sm",
  lg: "min-h-[48px] px-6 py-3 text-[15px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
