import { resolvePublicImage } from "@/lib/images";

const HUES = [232, 262, 158, 32, 210];

/** Stable hue per listing so the same service always gets the same cover. */
export function hueFor(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 997;
  }
  return HUES[hash % HUES.length];
}

export function coverGradient(hue: number): string {
  return `linear-gradient(120deg, hsl(${hue} 62% 90%) 0%, hsl(${(hue + 36) % 360} 64% 80%) 100%)`;
}

/**
 * Designed cover used whenever a listing has no resolvable public image.
 * Parent sets the aspect/size via `className`; the image version zooms with
 * a `group` hover on the card link.
 */
export function GeneratedCover({
  title,
  skill,
  hue,
  imageUrls,
  className = "",
  monogramClassName = "text-[64px]",
  chip = true,
  imageAlt = "",
}: {
  title: string;
  skill?: string;
  hue?: number;
  imageUrls?: string[];
  className?: string;
  monogramClassName?: string;
  chip?: boolean;
  imageAlt?: string;
}) {
  const image = resolvePublicImage(imageUrls?.[0]);

  if (image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
    );
  }

  const resolvedHue = hue ?? hueFor(title);
  const monogram = title.trim().charAt(0).toUpperCase() || "S";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: coverGradient(resolvedHue) }}
    >
      <div aria-hidden className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/25" />
      <div aria-hidden className="absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-text/10" />
      <div className="absolute inset-0 flex items-center justify-between p-6">
        <span
          aria-hidden
          className={`leading-none font-extrabold tracking-tight text-white/70 ${monogramClassName}`}
        >
          {monogram}
        </span>
        {chip && skill && (
          <span className="self-start rounded-full bg-text/70 px-3 py-1 text-xs font-semibold text-white">
            {skill}
          </span>
        )}
      </div>
    </div>
  );
}
