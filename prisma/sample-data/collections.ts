// SAMPLE catalogue that the site was built with. prisma/seed.ts copies it into the database;
// the site itself now reads products from the database, not from this file.
import type { CollectionCategory, CollectionProduct } from "../../src/data/collections";

export const collectionCategories: CollectionCategory[] = [
  { id: "sofas", name: "Sofas", blurb: "Curved, modular and deep-seated lounges." },
  { id: "seating", name: "Seating", blurb: "Sculptural chairs for living and dining." },
  { id: "dining", name: "Dining", blurb: "Monolithic slate tables on solid timber." },
  { id: "beds", name: "Beds", blurb: "Low-profile sanctuaries with backlit slate." },
  { id: "storage", name: "Storage", blurb: "Fluted credenzas and stone-topped cabinets." },
  { id: "lighting", name: "Lighting", blurb: "Brass and alabaster architectural pendants." },
  { id: "tables", name: "Tables", blurb: "Coffee tables and desks in raw stone and oak." },
  { id: "consoles", name: "Consoles", blurb: "Slim statement pieces for foyers and galleries." },
  { id: "leather", name: "Leather", blurb: "Full-grain hides over seasoned hardwood." },
];

export const collectionProducts: CollectionProduct[] = [
  {
    id: "monolith-slate-table",
    name: "The Monolith Slate Table",
    category: "dining",
    badge: "Bespoke",
    description:
      "Cut from a single 20mm slab of flame-honed Rajasthan slate and carried on fluted oak pedestals. Naturally heat-proof and stain-resistant, and made to your length, from 160 to 340 cm.",
    specs: "20mm Flame Slate · Fluted Oak",
    priceInr: 245000,
    originalPriceInr: 280000,
    colors: [
      { id: "natural-oak", name: "Natural Oak", hex: "#C9A36A", priceDelta: 0, image: "/hero/dining-table.jpg" },
      { id: "smoked-oak", name: "Smoked Oak", hex: "#6B4A32", priceDelta: 12000, image: "/hero/table-whitebg.jpg" },
      { id: "ebonised-oak", name: "Ebonised Oak", hex: "#2B2622", priceDelta: 18000, image: "/hero/slate-texture.jpg" },
    ],
    image: "/hero/dining-table.jpg",
    gallery: [
      { src: "/hero/table-whitebg.jpg", label: "Studio view", fit: "contain" },
      { src: "/hero/slate-texture.jpg", label: "Slate detail" },
    ],
  },
  {
    id: "serpentine-modular-sofa",
    name: "Serpentine Modular Sofa",
    category: "sofas",
    badge: "New Arrival",
    description:
      "A curved modular sofa upholstered in textured cream bouclé and set on a hidden slate plinth. Sections can be arranged and sized to suit your room.",
    specs: "Textured Cream Bouclé · Slate Plinth",
    priceInr: 340000,
    originalPriceInr: 390000,
    colors: [
      { id: "cream", name: "Cream", hex: "#EDE6D6", priceDelta: 0, image: "/hero/modular-sofa.jpg" },
      { id: "sage", name: "Sage", hex: "#A8B49B", priceDelta: 10000, image: "/hero/curated-living-space.jpg" },
      { id: "charcoal", name: "Charcoal", hex: "#4A4A48", priceDelta: 10000, image: "/hero/modular-sofa.jpg" },
      { id: "caramel", name: "Caramel", hex: "#B98655", priceDelta: 15000, image: "/hero/curated-living-space.jpg" },
    ],
    image: "/hero/modular-sofa.jpg",
    gallery: [
      { src: "/hero/curated-living-space.jpg", label: "In the room" },
    ],
  },
  {
    id: "aura-low-profile-bed",
    name: "Aura Low-Profile Bed",
    category: "beds",
    badge: "Architectural",
    description:
      "A grounding low-profile bedstead anchored by a slate slab headboard, with concealed halo backlighting that washes the stone in warm light.",
    specs: "Backlit Slate Slab · Smoked Ash",
    priceInr: 275000,
    originalPriceInr: 315000,
    colors: [
      { id: "smoked-ash", name: "Smoked Ash", hex: "#6E5F52", priceDelta: 0, image: "/hero/bed.jpg" },
      { id: "natural-ash", name: "Natural Ash", hex: "#C8B79B", priceDelta: 0, image: "/hero/bed-whitebg.jpg" },
      { id: "black-ash", name: "Black Ash", hex: "#2B2B2A", priceDelta: 10000, image: "/hero/slate-texture.jpg" },
    ],
    image: "/hero/bed.jpg",
    gallery: [
      { src: "/hero/bed-whitebg.jpg", label: "Studio view", fit: "contain" },
      { src: "/hero/slate-texture.jpg", label: "Slate detail" },
    ],
  },
  {
    id: "sculptural-boucle-chair",
    name: "Sculptural Bouclé Chair",
    category: "seating",
    badge: "Signature",
    description:
      "A sculptural bouclé armchair on an American oak frame, finished with hand-honed Ligurian slate inlays on the arms.",
    specs: "Ligurian Slate Inlays · American Oak",
    priceInr: 85000,
    originalPriceInr: 98000,
    colors: [
      { id: "ivory", name: "Ivory", hex: "#F1EBDD", priceDelta: 0, image: "/hero/chair.jpg" },
      { id: "sage", name: "Sage", hex: "#9FAE95", priceDelta: 5000, image: "/hero/chair-whitebg.jpg" },
      { id: "mocha", name: "Mocha", hex: "#7A6552", priceDelta: 5000, image: "/hero/chair.jpg" },
    ],
    image: "/hero/chair.jpg",
    gallery: [
      { src: "/hero/chair-whitebg.jpg", label: "Studio view", fit: "contain" },
    ],
  },
  {
    id: "nero-marquina-credenza",
    name: "Nero Marquina Credenza",
    category: "storage",
    badge: "Crafted",
    description:
      "Fluted smoked-oak fronts beneath a honed Nero Marquina marble slab. Storage with the presence of a sculpture.",
    specs: "Smoked Oak · Honed Black Marble Slab",
    priceInr: 195000,
    originalPriceInr: 225000,
    colors: [
      { id: "smoked-oak", name: "Smoked Oak", hex: "#5B4636", priceDelta: 0 },
      { id: "natural-oak", name: "Natural Oak", hex: "#C7A574", priceDelta: 0 },
      { id: "walnut", name: "Walnut", hex: "#4B3524", priceDelta: 15000 },
    ],
    image: "/hero/fluted-credenza.jpg",
  },
  {
    id: "solstice-chandelier",
    name: "Solstice Geometric Chandelier",
    category: "lighting",
    badge: "Illumination",
    description:
      "A geometric brushed-brass frame holding panels of frosted alabaster glass, giving a soft, even glow over dining tables and stairwells.",
    specs: "Brushed Brass · Frosted Alabaster Glass",
    priceInr: 145000,
    originalPriceInr: 170000,
    colors: [
      { id: "brushed-brass", name: "Brushed Brass", hex: "#B89B5E", priceDelta: 0 },
      { id: "matte-black", name: "Matte Black", hex: "#2A2A2A", priceDelta: 5000 },
      { id: "antique-bronze", name: "Antique Bronze", hex: "#6F5538", priceDelta: 8000 },
    ],
    image: "/hero/pendant-chandelier.jpg",
  },
  {
    id: "solstice-wall-console",
    name: "Solstice Wall Console",
    category: "consoles",
    badge: "Bespoke",
    description:
      "A slim wall console in raw-cut slate with brushed champagne brass detailing. Made for foyers, galleries and narrow walls.",
    specs: "Raw Slate Cut · Brushed Champagne Brass",
    priceInr: 115000,
    originalPriceInr: 135000,
    colors: [
      { id: "champagne-brass", name: "Champagne Brass", hex: "#C8B27A", priceDelta: 0 },
      { id: "matte-black", name: "Matte Black", hex: "#2B2B2B", priceDelta: 0 },
      { id: "antique-bronze", name: "Antique Bronze", hex: "#6F5538", priceDelta: 7000 },
    ],
    image: "/hero/card-console.jpg",
  },
  {
    id: "saddle-leather-lounge-chair",
    name: "Saddle Leather Lounge Chair",
    category: "leather",
    badge: "Handcrafted",
    description:
      "Full-grain caramel leather over a solid walnut frame. The hide is left natural so it deepens into a rich patina with use.",
    specs: "Full-Grain Caramel Leather · Solid Walnut",
    priceInr: 125000,
    originalPriceInr: 145000,
    colors: [
      { id: "caramel", name: "Caramel", hex: "#A9652D", priceDelta: 0, image: "/hero/saddle-chair.jpg" },
      { id: "tan", name: "Tan", hex: "#C79A63", priceDelta: 0, image: "/hero/yarwood-leather-rolls.jpg" },
      { id: "espresso", name: "Espresso", hex: "#4A2E1E", priceDelta: 6000, image: "/hero/saddle-chair.jpg" },
      { id: "cobalt", name: "Cobalt", hex: "#2F4C7A", priceDelta: 9000, image: "/hero/yarwood-leather-rolls.jpg" },
    ],
    image: "/hero/saddle-chair.jpg",
    gallery: [
      { src: "/hero/yarwood-leather-rolls.jpg", label: "Leather options", fit: "contain" },
    ],
  },
  {
    id: "round-slate-coffee-table",
    name: "Round Slate Coffee Table",
    category: "tables",
    badge: "Limited",
    description:
      "A round coffee table with a chiseled natural slate rim on a solid white oak base. Limited availability.",
    specs: "Chiseled Natural Rim · Solid White Oak",
    priceInr: 89000,
    originalPriceInr: 105000,
    colors: [
      { id: "natural-oak", name: "Natural Oak", hex: "#C9A36A", priceDelta: 0, image: "/hero/card-coffee.jpg" },
      { id: "smoked-oak", name: "Smoked Oak", hex: "#6B4A32", priceDelta: 4000, image: "/hero/slate-texture.jpg" },
      { id: "ebonised-oak", name: "Ebonised Oak", hex: "#2B2622", priceDelta: 6000, image: "/hero/card-coffee.jpg" },
    ],
    image: "/hero/card-coffee.jpg",
    gallery: [
      { src: "/hero/slate-texture.jpg", label: "Slate detail" },
    ],
    zoomClass: "scale-[1.18]",
  },
  {
    id: "cantilevered-travertine-desk",
    name: "Cantilevered Travertine Desk",
    category: "tables",
    badge: "Architectural",
    description:
      "A cantilevered desk in honed Roman travertine on matte slate legs. A quiet, architectural work surface.",
    specs: "Honed Roman Travertine · Matte Slate Legs",
    priceInr: 225000,
    originalPriceInr: 260000,
    colors: [
      { id: "ivory", name: "Ivory Travertine", hex: "#E3D9C6", priceDelta: 0 },
      { id: "noce", name: "Noce Travertine", hex: "#B7936B", priceDelta: 15000 },
    ],
    image: "/hero/table.jpg",
  },
];
