import { discountPercent, formatPrice } from "@/data/collections";

// Price as shown on cards and pages: what you pay, the crossed-out original, and the % saved
export default function PriceTag({
  price,
  original,
  size = "md",
  showBadge = true,
}: {
  price: number;
  original?: number;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}) {
  const percent = discountPercent(original, price);
  const priceClass =
    size === "lg"
      ? "text-2xl font-semibold"
      : size === "md"
        ? "text-base font-bold"
        : "text-sm font-bold";
  const originalClass = size === "lg" ? "text-base" : "text-sm";

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={`${priceClass} text-stone-950`}>{formatPrice(price)}</span>
      {percent > 0 && original && (
        <>
          <span className={`${originalClass} text-stone-400 line-through`}>
            <span className="sr-only">Original price </span>
            {formatPrice(original)}
          </span>
          {showBadge && <span className="text-xs font-semibold text-emerald-700">{percent}% off</span>}
        </>
      )}
    </span>
  );
}
