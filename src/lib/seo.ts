// Search-engine settings from the admin SEO panel, and the helpers every public page uses to build
// its <head>: title, description, canonical address, share preview and robots rules. Cached like the
// catalogue; the SEO panel calls updateTag("seo") after a save so changes show at once.
import "server-only";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/catalog";

// The live address of the shop, used for canonical links, the sitemap and share previews
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://furnitureaverto.com").replace(/\/+$/, "");

export const absoluteUrl = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

const DEFAULT_OG_IMAGE = "/hero/curated-living-space.jpg";

// Used until something is saved in the SEO panel
export const SEO_DEFAULTS = {
  siteName: "Averto",
  defaultTitle: "Averto | Bespoke Slate & Luxury Custom Furniture Studio",
  defaultDescription:
    "Handcrafted bespoke luxury furniture made with natural slate, architectural stone and seasoned hardwoods, built to fit your home.",
};

// The fixed shop pages whose title and description can be set in the SEO panel
export const STATIC_PAGES: { path: string; label: string; title: string; description: string }[] = [
  { path: "/", label: "Home page", title: SEO_DEFAULTS.defaultTitle, description: SEO_DEFAULTS.defaultDescription },
  {
    path: "/collections",
    label: "Collections",
    title: "Collections | Averto Bespoke Slate & Luxury Furniture",
    description:
      "Browse Averto's made-to-order sofas, dining tables, beds, storage, lighting and leather seating, handcrafted from Rajasthan slate and seasoned teak.",
  },
  {
    path: "/blog",
    label: "Blog",
    title: "Journal | Averto",
    description: "Ideas, care guides and stories from the Averto workshop: slate, timber, and furniture made to fit.",
  },
];

// Search-friendly lengths; longer text is cut off in Google results
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

export const getSeoSettings = unstable_cache(
  async () => {
    const row = await prisma.seoSettings.findUnique({ where: { id: "site" } });
    return {
      siteName: row?.siteName || SEO_DEFAULTS.siteName,
      defaultTitle: row?.defaultTitle || SEO_DEFAULTS.defaultTitle,
      defaultDescription: row?.defaultDescription || SEO_DEFAULTS.defaultDescription,
      ogImage: row?.ogImage ? imageUrl(row.ogImage) : DEFAULT_OG_IMAGE,
      googleVerification: row?.googleVerification ?? "",
      bingVerification: row?.bingVerification ?? "",
    };
  },
  ["seo-settings"],
  { revalidate: 300, tags: ["seo"] },
);

const getAllPageSeo = unstable_cache(async () => prisma.pageSeo.findMany(), ["page-seo"], {
  revalidate: 300,
  tags: ["seo"],
});

// Site-wide tags for the root layout: defaults, share preview and Search Console verification
export async function rootMetadata(): Promise<Metadata> {
  const s = await getSeoSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: s.defaultTitle,
    description: s.defaultDescription,
    applicationName: s.siteName,
    openGraph: {
      title: s.defaultTitle,
      description: s.defaultDescription,
      siteName: s.siteName,
      locale: "en_IN",
      type: "website",
      images: [{ url: s.ogImage }],
    },
    twitter: { card: "summary_large_image", title: s.defaultTitle, description: s.defaultDescription, images: [s.ogImage] },
    robots: { index: true, follow: true },
    verification: {
      google: s.googleVerification || undefined,
      other: s.bingVerification ? { "msvalidate.01": s.bingVerification } : undefined,
    },
  };
}

// Full <head> details for one public page. Values saved in the SEO panel win over the page's own.
export async function pageMetadata(
  path: string,
  page: { title: string; description: string; image?: string; type?: "website" | "article"; noindex?: boolean },
): Promise<Metadata> {
  const [s, saved] = await Promise.all([getSeoSettings(), getAllPageSeo()]);
  const override = saved.find((p) => p.path === path);
  const title = override?.title || page.title;
  const description = override?.description || page.description;
  const image = override?.ogImage ? imageUrl(override.ogImage) : (page.image ?? s.ogImage);
  const noindex = override?.noindex || page.noindex;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: s.siteName,
      locale: "en_IN",
      type: page.type ?? "website",
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

// Paths whose page was marked "hide from Google" in the SEO panel, left out of the sitemap
export async function noindexPaths() {
  return new Set((await getAllPageSeo()).filter((p) => p.noindex).map((p) => p.path));
}

// Trims a long description to a search-friendly length at a word boundary
export function clip(text: string, max = DESCRIPTION_MAX) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}
