import Link from "next/link";
import { formatINR } from "@/lib/format";
import type { Service } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CardService extends Pick<
  Service,
  "id" | "title" | "price" | "deliveryDays" | "skills" | "status" | "imageUrls"
> {
  hue?: number;
}

export function ServiceCard({
  service,
  freelancerName,
  avatarColor = "#3f4fe0",
  rating,
  totalReviews,
}: {
  service: CardService;
  freelancerName?: string;
  avatarColor?: string;
  rating?: number;
  totalReviews?: number;
}) {
  // List endpoints return no seller profile — fall back to a neutral label.
  const seller = freelancerName ?? "Freelancer";
  const initial = seller.charAt(0).toUpperCase();
  const hue = service.hue ?? 232;
  const image = service.imageUrls?.[0];

  return (
    <Link
      href={`/services/${service.id}`}
      className="lift group flex flex-col overflow-hidden rounded-[16px] border border-border bg-surface"
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={
          image
            ? undefined
            : {
                background: `linear-gradient(135deg, hsl(${hue} 55% 92%), hsl(${hue} 60% 82%))`,
              }
        }
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            loading="lazy"
            className="zoom h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <p className="zoom line-clamp-3 text-center text-[17px] leading-7 font-semibold text-text/80">
              {service.title}
            </p>
          </div>
        )}
        {service.status !== "ACTIVE" && (
          <div className="absolute top-3 left-3">
            <StatusBadge status={service.status} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">
          {service.skills.slice(0, 2).map((s) => (
            <span
              key={s}
              className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-medium text-text-muted"
            >
              {s}
            </span>
          ))}
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-[17px] leading-6 font-semibold text-text">
          {service.title}
        </h3>

        <div className="mt-3 flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-white"
            style={{ background: avatarColor }}
          >
            {initial}
          </span>
          <span className="text-sm text-text-muted">{seller}</span>
          {typeof rating === "number" && (
            <>
              <span aria-hidden className="text-text-subtle">·</span>
              <span className="flex items-center gap-1 text-sm">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="text-warning">
                  <path
                    d="M7 1.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L7 10.1 3.5 11.9l.7-3.9L1.4 5.3l3.9-.6L7 1.2z"
                    fill="currentColor"
                  />
                </svg>
                <strong className="font-semibold text-text">{rating.toFixed(1)}</strong>
                {typeof totalReviews === "number" && (
                  <span className="text-text-subtle">({totalReviews})</span>
                )}
              </span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs text-text-subtle">Starting at</p>
            <p className="font-mono text-[17px] font-bold text-text">
              {formatINR(service.price)}
            </p>
          </div>
          <p className="text-[13px] text-text-muted">
            {service.deliveryDays}-day delivery
          </p>
        </div>
      </div>
    </Link>
  );
}
