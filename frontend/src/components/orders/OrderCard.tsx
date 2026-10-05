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
      className="lift flex flex-col gap-3 rounded-[16px] border border-border bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[16px] leading-6 font-semibold">
            {order.serviceTitle}
          </h3>
          <p className="mt-1 text-[13px] text-text-subtle">
            {order.roleLabel} · {date}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <p className="font-mono text-[15px] font-bold">{formatINR(order.price)}</p>
        <span className="font-mono text-xs text-text-subtle">
          #{order.id.slice(0, 8)}
        </span>
      </div>
    </Link>
  );
}
