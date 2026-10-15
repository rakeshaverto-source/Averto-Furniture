// The cart lives in the visitor's browser (localStorage), which is how most stores keep a guest cart.
// useSyncExternalStore reads it, so server and browser agree on first render and tabs stay in sync.
import { MAX_QTY_PER_LINE } from "@/data/store";

const KEY = "averto-cart-v1";
const EVENT = "averto-cart-change";

export interface CartLine {
  productId: string;
  colorId?: string;
  qty: number;
}

export function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function parseCart(raw: string): CartLine[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.flatMap((item): CartLine[] => {
      if (!item || typeof item !== "object") return [];
      const { productId, colorId, qty } = item as Record<string, unknown>;
      if (typeof productId !== "string") return [];
      const count = Math.min(Math.max(Math.floor(Number(qty)) || 1, 1), MAX_QTY_PER_LINE);
      return [{ productId, colorId: typeof colorId === "string" ? colorId : undefined, qty: count }];
    });
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // storage blocked (private window): the cart just won't persist
  }
  window.dispatchEvent(new Event(EVENT));
}

// The applied coupon code is kept next to the cart. subscribe() above already listens for its changes.
const COUPON_KEY = "averto-coupon-v1";

export function readCoupon(): string {
  try {
    return localStorage.getItem(COUPON_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeCoupon(code: string) {
  try {
    if (code) localStorage.setItem(COUPON_KEY, code);
    else localStorage.removeItem(COUPON_KEY);
  } catch {
    // storage blocked: the coupon just won't persist
  }
  window.dispatchEvent(new Event(EVENT));
}

export const sameLine =(a: CartLine, productId: string, colorId?: string) =>
  a.productId === productId && (a.colorId ?? "") === (colorId ?? "");
