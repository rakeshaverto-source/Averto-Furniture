import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatPrice } from "@/data/collections";
import { formatDate } from "@/lib/admin-format";
import OrderTimeline from "./OrderTimeline";
import type { FulfillmentStatus } from "@/generated/prisma/client";

export interface OrderCardData {
  ref: string;
  createdAt: Date;
  total: number;
  fulfillment: FulfillmentStatus;
  items: { id: string; name: string; qty: number; image?: string }[];
}

// One order in a list: thumbnails, total and a compact progress line; the whole card opens the order
export default function OrderCard({ order }: { order: OrderCardData }) {
  const pieces = order.items.reduce((sum, i) => sum + i.qty, 0);
  return (
    <Link
      href={`/account/orders/${order.ref}`}
      className="group block rounded-sm border border-stone-200 bg-white p-4 sm:p-6 transition-colors hover:border-stone-400"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex -space-x-3">
          {order.items.slice(0, 3).map((item) => (
            <span key={item.id} className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-sm bg-stone-100 ring-2 ring-white">
              {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-sm bg-stone-100 text-xs font-medium text-stone-600 ring-2 ring-white">
              +{order.items.length - 3}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold text-stone-900 tabular-nums">{formatPrice(order.total)}</p>
          <p className="text-xs text-stone-500">
            {pieces} piece{pieces === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-stone-900 truncate">{order.items.map((i) => i.name).join(", ")}</p>
          <p className="text-xs text-stone-500">
            {order.ref} · {formatDate(order.createdAt)}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-4 pt-4 sm:mt-5 sm:pt-5 border-t border-stone-100">
        <OrderTimeline status={order.fulfillment} compact />
      </div>
    </Link>
  );
}
