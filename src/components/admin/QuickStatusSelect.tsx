"use client";

import { useTransition } from "react";
import { setOrderStatus } from "@/app/admin/store-actions";
import { FULFILLMENT, fulfillmentInfo } from "@/lib/admin-format";
import type { FulfillmentStatus } from "@/generated/prisma/client";

// Changes an order's status straight from the orders list; saves as soon as a status is picked
export default function QuickStatusSelect({ id, fulfillment, label }: { id: string; fulfillment: FulfillmentStatus; label: string }) {
  const [pending, startTransition] = useTransition();
  const info = fulfillmentInfo(fulfillment);

  return (
    <select
      aria-label={`Status of order ${label}`}
      value={fulfillment}
      disabled={pending}
      onChange={(e) => {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("fulfillment", e.target.value);
        startTransition(() => setOrderStatus(formData));
      }}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset border-0 cursor-pointer disabled:opacity-60 ${info.tone}`}
    >
      {FULFILLMENT.map((f) => (
        <option key={f.value} value={f.value}>
          {f.label}
        </option>
      ))}
    </select>
  );
}
