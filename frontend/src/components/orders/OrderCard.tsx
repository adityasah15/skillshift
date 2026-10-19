import Link from "next/link";
import { formatINR } from "@/lib/format";
import type { OrderListItem } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function OrderCard({ order }: { order: OrderListItem }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <Link
      href={`/orders/${order.id}`}
      className="lift flex flex-col rounded-[10px] border border-border bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-text-subtle">
            {order.roleLabel} · {date}
          </p>
          <h3 className="mt-1 line-clamp-2 text-[16px] leading-6 font-semibold">
            {order.serviceTitle}
          </h3>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <p className="tabular text-[15px] font-bold text-text">
          {formatINR(order.price)}
        </p>
        <span className="tabular text-[11px] text-text-subtle">
          #{order.id.slice(0, 8)}
        </span>
      </div>
    </Link>
  );
}
