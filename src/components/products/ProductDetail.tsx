"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronUp, ShoppingBag, Truck } from "lucide-react";
import { estimatedDeliveryRange, leadTimeLabel } from "@/data/delivery";
import { m, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  discountPercent,
  formatPrice,
  WHATSAPP_NUMBER,
  type CollectionCategory,
  type CollectionProduct,
  type ProductImage,
} from "@/data/collections";
import { getRatingSummary, type ProductReview } from "@/data/reviews";
import { COD_ADVANCE_PERCENT, depositFor, gstOn } from "@/data/store";
import { useCart } from "@/components/cart/CartProvider";
import PriceTag from "./PriceTag";
import WishlistButton from "@/components/account/WishlistButton";
import ProductReviews, { StarRating } from "./ProductReviews";

const EASE = [0.22, 1, 0.36, 1] as const;

// Main photo with a thumbnail strip: left column on desktop, row underneath on phones
// TEMPORARY layout preview: repeats the real photos until there are 6, so the gallery can be judged.
// Set to 0 (or delete the padding below) once every product has its own photos.
const PREVIEW_MIN_IMAGES = 6;

function ProductGallery({
  product,
  colorImage,
}: {
  product: CollectionProduct;
  colorImage?: string;
}) {
  const real: ProductImage[] = [
    { src: product.image, label: "Overview" },
    ...(product.gallery ?? []),
  ];
  const images: ProductImage[] = [...real];
  while (images.length < PREVIEW_MIN_IMAGES) {
    images.push(real[images.length % real.length]);
  }
  const [active, setActive] = useState(0);

  // Choosing a colour jumps the main photo to that colour's image (adjusting state during render,
  // the pattern React recommends for state that follows a prop)
  const [shownColorImage, setShownColorImage] = useState(colorImage);
  if (colorImage !== shownColorImage) {
    setShownColorImage(colorImage);
    const index = images.findIndex((img) => img.src === colorImage);
    if (index >= 0) setActive(index);
  }
  const current = images[active];
  const hasThumbs = images.length > 1;

  const thumbsRef = useRef<HTMLDivElement>(null);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(false);

  const updateScrollState = () => {
    const el = thumbsRef.current;
    if (!el) return;
    setCanUp(el.scrollTop > 4);
    setCanDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  };

  // Re-measure whenever the column changes size (first paint, window resize)
  useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollThumbs = (direction: 1 | -1) => {
    // Four photos fit at once, so move by two
    const el = thumbsRef.current;
    el?.scrollBy({ top: (direction * el.clientHeight) / 2, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse lg:justify-end gap-3 sm:gap-4">
      <div className="relative flex-1 min-w-0 aspect-[4/5] lg:max-w-[26rem] lg:max-h-[calc(100vh-9rem)] overflow-hidden rounded-sm bg-[#ECE8E1]">
        <AnimatePresence initial={false}>
          <m.div
            key={`${active}-${current.src}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`absolute inset-0 ${current.src === product.image ? (product.zoomClass ?? "") : ""} ${
              current.fit === "contain" ? "bg-white" : ""
            }`}
          >
            <Image
              src={current.src}
              alt={`${product.name}: ${current.label}`}
              fill
              priority={active === 0}
              className={`${current.fit === "contain" ? "object-contain" : "object-cover"} object-center`}
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </m.div>
        </AnimatePresence>
      </div>

      {hasThumbs && (
        // Desktop: the column is exactly as tall as the main photo (it has no height of its own),
        // with up/down buttons; phones get a swipeable row under the photo
        <div className="relative lg:w-20 shrink-0">
          <div className="lg:absolute lg:inset-0 flex flex-col">
            {(canUp || canDown) && (
              <button
                type="button"
                onClick={() => scrollThumbs(-1)}
                disabled={!canUp}
                aria-label="Previous photos"
                className="hidden lg:flex shrink-0 h-8 mb-2 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-stone-900 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}

            <div
              ref={thumbsRef}
              onScroll={updateScrollState}
              className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:flex-1 lg:min-h-0 lg:snap-y lg:snap-mandatory [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {images.map((img, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={`${i}-${img.src}`}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Show ${img.label}`}
                    aria-current={isActive}
                    className={`relative shrink-0 w-20 h-24 lg:h-[calc((100%-2.25rem)/4)] lg:snap-start rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                      isActive ? "border-stone-900" : "border-transparent hover:border-stone-400"
                    } ${img.fit === "contain" ? "bg-white" : "bg-[#ECE8E1]"}`}
                  >
                    <Image
                      src={img.src}
                      alt=""
                      fill
                      className={`${img.fit === "contain" ? "object-contain" : "object-cover"} object-center`}
                      sizes="80px"
                    />
                  </button>
                );
              })}
            </div>

            {(canUp || canDown) && (
              <button
                type="button"
                onClick={() => scrollThumbs(1)}
                disabled={!canDown}
                aria-label="More photos"
                className="hidden lg:flex shrink-0 h-8 mt-2 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-stone-900 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetail({
  product,
  category,
  related,
  reviews,
}: {
  product: CollectionProduct;
  category?: CollectionCategory;
  related: CollectionProduct[];
  reviews: ProductReview[];
}) {
  const ratingSummary = getRatingSummary(reviews);
  const { add } = useCart();

  // Chosen colour drives the price shown and what goes into the enquiry
  const colors = product.colors ?? [];
  const [colorId, setColorId] = useState(colors[0]?.id);
  const color = colors.find((c) => c.id === colorId) ?? colors[0];
  const price = product.priceInr + (color?.priceDelta ?? 0);
  // the crossed-out price moves with the colour too, so the discount stays the same whichever colour is picked
  const originalPrice = product.originalPriceInr ? product.originalPriceInr + (color?.priceDelta ?? 0) : undefined;

  const enquiryText = `Hello Averto, I would like to enquire about ${/^the /i.test(product.name) ? "" : "the "}${product.name}${
    color ? ` in ${color.name}` : ""
  } (${formatPrice(price)}).`;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(enquiryText)}`;

  // Delivery time set in admin, as dates for an order placed today
  const leadDays =
    product.deliveryMinDays && product.deliveryMaxDays
      ? { min: product.deliveryMinDays, max: product.deliveryMaxDays }
      : null;

  // Facts come from the product data and the site's existing delivery and guarantee wording
  const specs = [
    { label: "Category", value: category?.name ?? "" },
    ...(color ? [{ label: "Colour", value: color.name }] : []),
    { label: "Materials", value: product.specs.split(" · ").join(", ") },
    {
      label: "Availability",
      value: leadDays ? `Made to order · delivered in ${leadTimeLabel(leadDays.min, leadDays.max)}` : "Made to order",
    },
    { label: "Delivery", value: "White-glove delivery and installation across India" },
    { label: "Guarantee", value: "10-year structural guarantee" },
  ];

  // Sticky enquiry bar on phones once the main buttons have scrolled away
  const { scrollY } = useScroll();
  const [showBar, setShowBar] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => setShowBar(latest > 620));

  return (
    <>
      <section className="w-full bg-white pt-6 pb-16 sm:pb-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="text-sm text-stone-500 flex flex-wrap items-center gap-x-2">
            <Link href="/" className="hover:text-stone-900 transition-colors">
              Home
            </Link>
            <span className="text-stone-300">/</span>
            <Link href="/collections" className="hover:text-stone-900 transition-colors">
              Collections
            </Link>
            {category && (
              <>
                <span className="text-stone-300">/</span>
                <Link
                  href={`/collections?category=${category.id}`}
                  className="hover:text-stone-900 transition-colors"
                >
                  {category.name}
                </Link>
              </>
            )}
            <span className="text-stone-300">/</span>
            <span className="text-stone-900">{product.name}</span>
          </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-6 lg:sticky lg:top-24">
              <ProductGallery product={product} colorImage={color?.image} />
            </div>

            <div className="lg:col-span-6 max-w-xl">
              <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#111110] leading-[1.1]">
                {product.name}
              </h1>
              {ratingSummary.total > 0 && (
                <a
                  href="#reviews"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <StarRating value={ratingSummary.average} />
                  <span className="font-medium text-stone-900">{ratingSummary.average.toFixed(1)}</span>
                  <span className="text-stone-500 underline underline-offset-4">
                    {ratingSummary.total} {ratingSummary.total === 1 ? "review" : "reviews"}
                  </span>
                </a>
              )}
              <p className="mt-4 text-2xl font-sans font-semibold text-stone-950">
                <m.span
                  key={price}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="inline-block"
                >
                  {formatPrice(price)}
                </m.span>
                {discountPercent(originalPrice, price) > 0 && originalPrice && (
                  <span className="ml-3 align-middle">
                    <span className="text-base font-normal text-stone-400 line-through">
                      <span className="sr-only">Original price </span>
                      {formatPrice(originalPrice)}
                    </span>
                    <span className="ml-2.5 text-sm font-semibold text-emerald-700">
                      {discountPercent(originalPrice, price)}% off
                    </span>
                  </span>
                )}
              </p>
              {originalPrice && originalPrice > price && (
                <p className="mt-1 text-sm text-emerald-700">You save {formatPrice(originalPrice - price)}</p>
              )}
              <p className="mt-1 text-sm text-stone-500">
                + GST, added in the cart. Made to order; tell us your size and finish for a final quote.
              </p>

              <p className="mt-6 text-base text-stone-700 leading-relaxed">{product.description}</p>

              {color && (
                <div className="mt-8">
                  <p className="text-sm text-stone-500">
                    Colour: <span className="text-stone-900 font-medium">{color.name}</span>
                    {color.priceDelta > 0 && (
                      <span className="text-stone-500"> &middot; +{formatPrice(color.priceDelta)}</span>
                    )}
                  </p>
                  <div role="radiogroup" aria-label="Colour" className="mt-3 flex flex-wrap gap-3">
                    {colors.map((c) => {
                      const isActive = c.id === color.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          aria-label={c.priceDelta > 0 ? `${c.name}, plus ${formatPrice(c.priceDelta)}` : c.name}
                          title={c.name}
                          onClick={() => setColorId(c.id)}
                          className={`w-10 h-10 rounded-full p-[3px] border-2 cursor-pointer transition-colors ${
                            isActive ? "border-stone-900" : "border-transparent hover:border-stone-300"
                          }`}
                        >
                          <span
                            className="block w-full h-full rounded-full border border-black/10"
                            style={{ backgroundColor: c.hex }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {leadDays && (
                <p className="mt-6 flex items-start gap-2.5 rounded-sm bg-[#F5F2EB] px-4 py-3 text-sm text-stone-700">
                  <Truck className="mt-0.5 w-4 h-4 shrink-0 text-stone-900" aria-hidden />
                  <span>
                    Estimated delivery{" "}
                    {/* Counted from today in the visitor's browser, so it can differ from the cached page by a day */}
                    <strong className="font-semibold text-stone-900" suppressHydrationWarning>
                      {estimatedDeliveryRange(leadDays.min, leadDays.max)}
                    </strong>
                    <span className="block text-xs text-stone-500">If you order today · usually {leadTimeLabel(leadDays.min, leadDays.max)} from order to delivery</span>
                  </span>
                </p>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => add(product.id, color?.id)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to cart</span>
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-sm border border-stone-300 hover:border-stone-900 text-stone-900 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  <span>Enquire on WhatsApp</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <WishlistButton productId={product.id} className="h-12 sm:w-12 shrink-0" />
              </div>
              <p className="mt-3 text-xs text-stone-500">
                Order from {formatPrice(depositFor(price + gstOn(price), "cod"))} online today. Cash on Delivery available with a{" "}
                {COD_ADVANCE_PERCENT}% advance.
              </p>

              <dl className="mt-10 border-t border-stone-200">
                {specs.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[7.5rem_1fr] gap-4 py-3.5 border-b border-stone-200 text-sm"
                  >
                    <dt className="text-stone-500">{row.label}</dt>
                    <dd className="text-stone-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <ProductReviews reviews={reviews} productId={product.id} productName={product.name} />

      {/* More pieces */}
      <section className="w-full bg-[#FAF8F5] border-t border-stone-200 py-16 sm:py-20 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-6 mb-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#111110]">You may also like</h2>
            <Link
              href="/collections"
              className="text-sm text-stone-700 underline underline-offset-4 hover:text-stone-950 transition-colors whitespace-nowrap"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {related.map((item) => (
              <div key={item.id} className="relative">
              <Link href={`/products/${item.id}`} className="group block">
                <div className="relative aspect-[4/3.4] w-full overflow-hidden rounded-sm bg-[#ECE8E1]">
                  <div className={`absolute inset-0 ${item.zoomClass ?? ""}`}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                </div>
                <div className="pt-3 flex items-baseline justify-between gap-4">
                  <h3 className="text-base text-stone-900 group-hover:underline underline-offset-4">
                    {item.name}
                  </h3>
                  <span className="shrink-0 text-right">
                    <PriceTag price={item.priceInr} original={item.originalPriceInr} size="sm" showBadge={false} />
                  </span>
                </div>
              </Link>
              <WishlistButton productId={item.id} variant="overlay" className="absolute top-3 right-3" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phone-only sticky enquiry bar */}
      <AnimatePresence>
        {showBar && (
          <m.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-stone-200 px-5 py-3 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm text-stone-900 truncate">{product.name}</p>
              <p className="text-xs text-stone-500">
                {color ? `${color.name} · ` : ""}
                {formatPrice(price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => add(product.id, color?.id)}
              className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-[#1A1A18] text-white text-sm font-medium cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to cart
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
