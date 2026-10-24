// Delivery time set per product in admin (days from order to delivery), shown on the product page as dates

export const MAX_DELIVERY_DAYS = 365;

// Quick choices in the admin form
export const DELIVERY_PRESETS: { label: string; min: number; max: number }[] = [
  { label: "3–5 days", min: 3, max: 5 },
  { label: "1–2 weeks", min: 7, max: 14 },
  { label: "2–3 weeks", min: 14, max: 21 },
  { label: "3–4 weeks", min: 21, max: 28 },
  { label: "4–6 weeks", min: 28, max: 42 },
  { label: "6–8 weeks", min: 42, max: 56 },
];

// "3–4 weeks" when both ends are whole weeks, otherwise "10–12 days"
export function leadTimeLabel(min: number, max: number) {
  if (min % 7 === 0 && max % 7 === 0 && min >= 7) {
    return min === max ? `${min / 7} week${min === 7 ? "" : "s"}` : `${min / 7}–${max / 7} weeks`;
  }
  return min === max ? `${min} day${min === 1 ? "" : "s"}` : `${min}–${max} days`;
}

const dayMonth = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

// The estimated delivery dates for an order placed today, e.g. "12 Nov – 20 Nov"
export function estimatedDeliveryRange(min: number, max: number) {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const from = dayMonth.format(new Date(now + min * day));
  const to = dayMonth.format(new Date(now + max * day));
  return from === to ? from : `${from} – ${to}`;
}
