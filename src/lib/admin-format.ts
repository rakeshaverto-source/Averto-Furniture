// Labels and formatting shared by the admin pages. Dates are shown in Indian time.
import type { FulfillmentStatus, OrderStatus } from "@/generated/prisma/client";

export const FULFILLMENT: { value: FulfillmentStatus; label: string; tone: string }[] = [
  { value: "new", label: "New", tone: "bg-amber-50 text-amber-900 ring-amber-200" },
  { value: "confirmed", label: "Confirmed", tone: "bg-sky-50 text-sky-900 ring-sky-200" },
  { value: "in_production", label: "Making", tone: "bg-violet-50 text-violet-900 ring-violet-200" },
  { value: "shipped", label: "Shipped", tone: "bg-indigo-50 text-indigo-900 ring-indigo-200" },
  { value: "delivered", label: "Delivered", tone: "bg-emerald-50 text-emerald-900 ring-emerald-200" },
  { value: "cancelled", label: "Cancelled", tone: "bg-stone-100 text-stone-600 ring-stone-200" },
];

export const fulfillmentInfo = (value: FulfillmentStatus) => FULFILLMENT.find((f) => f.value === value)!;

export const PAYMENT_LABEL: Record<OrderStatus, string> = {
  received: "Advance not taken online",
  awaiting_payment: "Advance not paid yet",
  deposit_paid: "Advance paid online",
};

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dateOnly = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatDateTime = (date: Date) => dateTime.format(date);
export const formatDate = (date: Date) => dateOnly.format(date);
