// Returns: the window, the reasons a customer can pick and how each status reads.
// Shared by "My account", the admin panel and the driver pages.
import type { ReturnReason, ReturnStatus } from "@/generated/prisma/enums";

// A return can be asked for until this many days after delivery
export const RETURN_WINDOW_DAYS = 7;
export const MAX_RETURN_PHOTOS = 4;

export const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: "damaged", label: "Arrived damaged" },
  { value: "defective", label: "Fault in the piece" },
  { value: "wrong_item", label: "Wrong piece or finish" },
  { value: "not_as_described", label: "Not as shown on the website" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Something else" },
];

export const returnReasonLabel = (value: ReturnReason) => RETURN_REASONS.find((r) => r.value === value)?.label ?? value;

export const RETURN_STATUSES: { value: ReturnStatus; label: string; tone: string; hint: string }[] = [
  {
    value: "requested",
    label: "Return requested",
    tone: "bg-amber-50 text-amber-900 ring-amber-200",
    hint: "Our team will look at your request and get back to you within a day or two.",
  },
  {
    value: "approved",
    label: "Return approved",
    tone: "bg-sky-50 text-sky-900 ring-sky-200",
    hint: "We'll call you to fix a day to collect the piece.",
  },
  {
    value: "pickup_scheduled",
    label: "Pickup scheduled",
    tone: "bg-indigo-50 text-indigo-900 ring-indigo-200",
    hint: "Please keep the piece ready, in its packing if you still have it.",
  },
  {
    value: "picked_up",
    label: "Picked up",
    tone: "bg-teal-50 text-teal-900 ring-teal-200",
    hint: "We have the piece. Your refund is processed once it reaches our workshop.",
  },
  {
    value: "refunded",
    label: "Refunded",
    tone: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    hint: "The refund has been sent. Banks can take 5–7 working days to show it.",
  },
  {
    value: "rejected",
    label: "Return declined",
    tone: "bg-stone-100 text-stone-700 ring-stone-200",
    hint: "Please contact us if you have any questions.",
  },
];

export const returnStatusInfo = (value: ReturnStatus) => RETURN_STATUSES.find((s) => s.value === value)!;

// The steps a return goes through, for the customer's progress line
export const RETURN_STEPS: ReturnStatus[] = ["requested", "approved", "pickup_scheduled", "picked_up", "refunded"];

// Still waiting on the team or on the pickup, for the admin sidebar count
export const OPEN_RETURN_STATUSES: ReturnStatus[] = ["requested", "approved", "pickup_scheduled", "picked_up"];

// When the order was delivered: the latest "delivered" step in its history
export function deliveredAt(order: { fulfillment: string; updatedAt: Date; events: { fulfillment: string; createdAt: Date }[] }) {
  if (order.fulfillment !== "delivered") return null;
  const steps = order.events.filter((e) => e.fulfillment === "delivered");
  return steps.length ? steps[steps.length - 1].createdAt : order.updatedAt;
}

// The last moment a return can be asked for, or null when the order isn't delivered
export function returnDeadline(order: Parameters<typeof deliveredAt>[0]) {
  const at = deliveredAt(order);
  return at ? new Date(at.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000) : null;
}

// Whether there's still time to ask for a return
export const withinReturnWindow = (deadline: Date | null) => !!deadline && Date.now() <= deadline.getTime();
