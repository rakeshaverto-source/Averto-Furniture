import type { CollectionProduct, ProductColor } from "./collections";

// PLACEHOLDER: share of the order total collected online as an advance; the balance is settled later.
// Change this one number to change the advance everywhere (cart, checkout and the payment itself).
export const DEPOSIT_PERCENT = 50;

export const MAX_QTY_PER_LINE = 10;

export function depositFor(total: number) {
  return Math.round((total * DEPOSIT_PERCENT) / 100);
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
