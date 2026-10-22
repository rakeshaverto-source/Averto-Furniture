// Shapes of the catalogue as the site uses them, plus small display helpers. The catalogue itself
// lives in the database (see src/lib/catalog.ts); prisma/sample-data/ holds the sample it started from.

// PLACEHOLDER: swap for the real WhatsApp number (country code + number, digits only)
export const WHATSAPP_NUMBER = "919999999999";

export interface CollectionCategory {
  id: string;
  name: string;
  blurb: string;
}

export interface ProductImage {
  src: string;
  label: string;
  // "contain" keeps white-background studio shots uncropped
  fit?: "cover" | "contain";
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  // Added to the product's base price when this colour is chosen
  priceDelta: number;
  // Photo to show when this colour is chosen (currently a TEMPORARY stand-in, not a photo of this colour)
  image?: string;
}

export interface CollectionProduct {
  id: string;
  name: string;
  category: string; // CollectionCategory["id"]
  badge: string;
  description: string;
  specs: string;
  priceInr: number; // price the customer pays (the discounted price), for the first (default) colour
  // SAMPLE "original" price shown crossed out above priceInr; a colour's priceDelta applies to both
  originalPriceInr?: number;
  // SAMPLE options for previewing the selector; replace with the real finishes and prices
  colors?: ProductColor[];
  image: string;
  // Extra photos shown as thumbnails on the product page (the main photo is always first)
  gallery?: ProductImage[];
  // Optional zoom to crop away a white frame baked into the photo
  zoomClass?: string;
  // Search-engine title and description from the admin SEO panel
  seoTitle?: string;
  seoDescription?: string;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(priceInr: number) {
  return inr.format(priceInr);
}

// Whole-number percentage saved, or 0 when there is no real discount
export function discountPercent(original: number | undefined, price: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}
