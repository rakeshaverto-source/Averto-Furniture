// Server side of Razorpay: creating a payment and checking the signature that proves it was paid.
import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export const razorpayKeys = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
};

// Returns Razorpay's order id, or null if Razorpay refused or isn't set up
export async function createRazorpayOrder(amountRupees: number, receipt: string): Promise<string | null> {
  const keys = razorpayKeys();
  if (!keys) return null;
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount: amountRupees * 100, currency: "INR", receipt, notes: { ref: receipt } }),
  });
  if (!response.ok) return null;
  const order = (await response.json()) as { id?: string };
  return order.id ?? null;
}

// Razorpay signs "order_id|payment_id" with our secret; anything else is not a real payment
export function isGenuinePayment(razorpayOrderId: string, paymentId: string, signature: string) {
  const keys = razorpayKeys();
  if (!keys) return false;
  const expected = createHmac("sha256", keys.keySecret).update(`${razorpayOrderId}|${paymentId}`).digest("hex");
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
