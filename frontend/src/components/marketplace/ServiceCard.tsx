import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Price } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GeneratedCover } from "@/components/marketplace/GeneratedCover";
import type { Service } from "@/lib/types";

interface CardService extends Pick<
  Service,
  "id" | "title" | "price" | "deliveryDays" | "skills" | "status" | "imageUrls"
> {
  hue?: number;
}

export function ServiceCard({
  service,
  freelancerName,
  avatarColor,
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

  return (
    <Link
      href={`/services/${service.id}`}
      className="lift group flex flex-col overflow-hidden rounded-[10px] border border-border bg-surface"
    >
      <div className="relative">
        <GeneratedCover
          title={service.title}
          skill={service.skills[0]}
          hue={service.hue}
          imageUrls={service.imageUrls}
          imageAlt={service.title}
          className="aspect-[16/10] w-full"
        />
        {service.status !== "ACTIVE" && (
          <div className="absolute top-3 left-3">
            <StatusBadge status={service.status} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">
          {service.skills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-medium text-text-muted"
            >
              {skill}
            </span>
          ))}
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-[17px] leading-6 font-semibold text-text">
          {service.title}
        </h3>

        <div className="mt-3 flex items-center gap-2.5">
          <Avatar name={seller} color={avatarColor} size="sm" />
          <span className="truncate text-sm text-text-muted">{seller}</span>
          {typeof rating === "number" && (
            <>
              <span aria-hidden className="text-text-subtle">
                ·
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="text-star">
                  <path
                    d="M7 1.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L7 10.1 3.5 11.9l.7-3.9L1.4 5.3l3.9-.6L7 1.2z"
                    fill="currentColor"
                  />
                </svg>
                <strong className="tabular font-semibold text-text">
                  {rating.toFixed(1)}
                </strong>
                {typeof totalReviews === "number" && (
                  <span className="tabular text-text-subtle">({totalReviews})</span>
                )}
              </span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
          <Price amount={service.price} size="md" />
          <p className="pb-0.5 text-[13px] text-text-muted">
            {service.deliveryDays}-day delivery
          </p>
        </div>
      </div>
    </Link>
  );
}
