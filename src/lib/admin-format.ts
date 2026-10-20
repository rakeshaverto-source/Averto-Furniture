// Labels and formatting shared by the admin pages. Dates are shown in Indian time.
import type { FulfillmentStatus, OrderStatus } from "@/generated/prisma/client";

export const FULFILLMENT: { value: FulfillmentStatus; label: string; tone: string }[] = [
  { value: "new", label: "New", tone: "bg-amber-50 text-amber-900 ring-amber-200" },
  { value: "confirmed", label: "Confirmed", tone: "bg-sky-50 text-sky-900 ring-sky-200" },
  { value: "in_production", label: "Making", tone: "bg-violet-50 text-violet-900 ring-violet-200" },
  { value: "shipped", label: "Dispatched", tone: "bg-indigo-50 text-indigo-900 ring-indigo-200" },
  { value: "out_for_delivery", label: "Out for delivery", tone: "bg-teal-50 text-teal-900 ring-teal-200" },
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
// For <input type="date">; delivery dates are stored as plain dates (midnight UTC)
export const toDateInput = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

// wa.me needs the number with country code; Indian numbers are often typed without it
export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

// A ready-to-send WhatsApp message for where the order stands now
export function orderUpdateMessage(o: {
  ref: string;
  customerName: string;
  fulfillment: FulfillmentStatus;
  paymentMethod: string;
  balanceDue: number;
  expectedDelivery: Date | null;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  deliverySlot: string;
}) {
  const hello = `Hello ${o.customerName.split(" ")[0]}, this is Averto.`;
  const date = o.expectedDelivery ? formatDate(o.expectedDelivery) : "";
  const when = [date, o.deliverySlot].filter(Boolean).join(", ");
  const driver = [o.driverName, o.driverPhone, o.vehicleNumber && `vehicle ${o.vehicleNumber}`].filter(Boolean).join(", ");
  const lines: string[] = [];
  switch (o.fulfillment) {
    case "new":
      lines.push(`Thank you for your order ${o.ref}. We will call you shortly to confirm the size and finish.`);
      break;
    case "confirmed":
      lines.push(`Your order ${o.ref} is confirmed.`);
      if (date) lines.push(`Expected delivery: ${date}.`);
      break;
    case "in_production":
      lines.push(`Our craftsmen have started making your order ${o.ref}.`);
      if (date) lines.push(`Expected delivery: ${date}.`);
      break;
    case "shipped":
      lines.push(`Your order ${o.ref} is on the way.`);
      if (o.courierName || o.trackingNumber) {
        lines.push(`Courier: ${[o.courierName, o.trackingNumber && `tracking no. ${o.trackingNumber}`].filter(Boolean).join(", ")}.`);
      }
      if (o.trackingUrl) lines.push(`Track it here: ${o.trackingUrl}`);
      if (driver) lines.push(`Delivered by: ${driver}.`);
      if (when) lines.push(`Expected delivery: ${when}.`);
      break;
    case "out_for_delivery":
      lines.push(`Your order ${o.ref} is out for delivery${o.deliverySlot ? ` and will reach you between ${o.deliverySlot}` : " today"}.`);
      if (driver) lines.push(`Delivered by: ${driver}.`);
      lines.push("Please make sure someone is at home to receive it.");
      break;
    case "delivered":
      lines.push(`Your order ${o.ref} has been delivered. We hope you love it! A short review on our website would mean a lot to us.`);
      break;
    case "cancelled":
      lines.push(`Your order ${o.ref} has been cancelled. Please reply here if you have any questions.`);
      break;
  }
  if (o.balanceDue > 0 && o.fulfillment !== "cancelled" && o.fulfillment !== "delivered") {
    lines.push(
      o.paymentMethod === "cod"
        ? `Please keep ${rupees(o.balanceDue)} ready in cash for delivery.`
        : `Balance to pay before delivery: ${rupees(o.balanceDue)}.`,
    );
  }
  return [hello, ...lines].join("\n");
}
