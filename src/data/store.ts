import type { CollectionProduct, ProductColor } from "./collections";

// PLACEHOLDER: share of the order total collected online as an advance; the balance is settled later.
// Change this one number to change the advance everywhere (cart, checkout and the payment itself).
export const DEPOSIT_PERCENT = 50;

// PLACEHOLDER: the small advance collected online for Cash on Delivery orders; the rest is paid in cash.
export const COD_ADVANCE_PERCENT = 10;

export const MAX_QTY_PER_LINE = 10;

// The payment choices offered at checkout (same names as the PaymentMethod enum in the database)
export type PaymentMethod = "full" | "advance" | "cod";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; percent: number; note: string }[] = [
  { id: "full", label: "Pay in full online", percent: 100, note: "Nothing left to pay later." },
  {
    id: "advance",
    label: `Pay ${DEPOSIT_PERCENT}% advance online`,
    percent: DEPOSIT_PERCENT,
    note: "Pay the balance later online from your account, or on delivery.",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    percent: COD_ADVANCE_PERCENT,
    note: `Pay a ${COD_ADVANCE_PERCENT}% advance online to confirm, and the rest in cash on delivery.`,
  },
];

// Short names for order pages, the invoice and the admin panel
export const PAYMENT_METHOD_NAME: Record<PaymentMethod, string> = {
  full: "Paid in full online",
  advance: "Advance online, balance later",
  cod: "Cash on Delivery",
};

export const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  PAYMENT_METHODS.some((m) => m.id === value);

export const percentFor = (method: PaymentMethod) =>
  PAYMENT_METHODS.find((m) => m.id === method)?.percent ?? DEPOSIT_PERCENT;

export function depositFor(total: number, method: PaymentMethod = "advance") {
  return Math.round((total * percentFor(method)) / 100);
}

// The single source of truth for what a cart line costs. Only the server calls it with products from
// the database, so a tampered browser can never change the amount that gets charged.
// An unknown or missing colour means the product's default (first) colour.
export function priceLine(
  product: CollectionProduct,
  colorId?: string,
): { product: CollectionProduct; color?: ProductColor; unit: number; originalUnit?: number } {
  const color = product.colors?.find((c) => c.id === colorId) ?? product.colors?.[0];
  const delta = color?.priceDelta ?? 0;
  return {
    product,
    color,
    unit: product.priceInr + delta,
    // the crossed-out price moves with the colour too, so the discount is the same whichever colour is chosen
    originalUnit: product.originalPriceInr ? product.originalPriceInr + delta : undefined,
  };
}
