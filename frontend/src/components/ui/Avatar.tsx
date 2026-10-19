import { resolvePublicImage } from "@/lib/images";

const PALETTE = ["#3f4fe0", "#7357ff", "#137a55", "#8a5a13", "#1c6bbf"];

const SIZES = {
  sm: "h-8 w-8 text-[12px]",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
} as const;

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Initials on a tinted circle when there is no usable public image.
 * Colour is derived from the name, so the same person keeps the same tint.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className = "",
  color: colorOverride,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  /** Optional tint override (used by listing surfaces that carry an avatar colour). */
  color?: string;
}) {
  const image = resolvePublicImage(src);
  const color = colorOverride ?? colorFor(name);

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        loading="lazy"
        className={`shrink-0 rounded-full object-cover ${SIZES[size]} ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${className}`}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      {initialsFor(name)}
    </span>
  );
}
