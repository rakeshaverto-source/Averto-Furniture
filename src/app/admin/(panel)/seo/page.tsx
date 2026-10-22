import Link from "next/link";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { imageUrl } from "@/lib/catalog";
import { BUSINESS } from "@/data/business";
import { DESCRIPTION_MAX, SEO_DEFAULTS, SITE_URL, STATIC_PAGES, TITLE_MAX, clip } from "@/lib/seo";
import { savePageSeo, saveProductSeo, saveSeoSettings } from "@/app/admin/seo-actions";
import ActionForm from "@/components/admin/ActionForm";
import ImageUpload from "@/components/admin/ImageUpload";
import SeoFields from "@/components/admin/SeoFields";
import { inputClass, labelClass } from "@/components/admin/ui";

const TABS = [
  { value: "health", label: "Health check" },
  { value: "settings", label: "Site settings" },
  { value: "pages", label: "Pages" },
  { value: "products", label: "Products" },
] as const;
type Tab = (typeof TABS)[number]["value"];

const image = (path: string | null | undefined) => (path ? { path, url: imageUrl(path) } : undefined);

export default async function AdminSeoPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("seo");
  const { tab: requested } = await searchParams;
  const tab: Tab = TABS.find((t) => t.value === requested)?.value ?? "health";

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#111110]">SEO</h1>
          <p className="mt-1 text-sm text-stone-500">How the shop appears on Google and when a link is shared.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <a href="/sitemap.xml" target="_blank" className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900">
            Sitemap <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a href="/robots.txt" target="_blank" className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900">
            robots.txt <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <nav aria-label="SEO sections" className="mt-6 flex flex-wrap rounded-xl border border-stone-200 bg-white p-1 text-sm w-fit">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/seo?tab=${t.value}`}
            aria-current={t.value === tab ? "page" : undefined}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              t.value === tab ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "health" && <HealthCheck />}
        {tab === "settings" && <SiteSettings />}
        {tab === "pages" && <PagesTab />}
        {tab === "products" && <ProductsTab />}
      </div>
    </div>
  );
}

// ─── Health check ───────────────────────────────────────────────────────────

async function HealthCheck() {
  const [settings, products, unlabelled, posts] = await Promise.all([
    prisma.seoSettings.findUnique({ where: { id: "site" } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true, seoTitle: true, seoDescription: true },
    }),
    prisma.productImage.count({ where: { label: "", product: { isActive: true } } }),
    prisma.blogPost.findMany({
      where: { status: "published" },
      select: { id: true, title: true, excerpt: true, seoDescription: true, coverImage: true, coverAlt: true },
    }),
  ]);

  const longTitles = products.filter((p) => (p.seoTitle || `${p.name} | Averto`).length > TITLE_MAX);
  const thinDescriptions = products.filter((p) => (p.seoDescription || p.description).trim().length < 70);
  const postsWithoutSummary = posts.filter((p) => !p.excerpt && !p.seoDescription);
  const coversWithoutAlt = posts.filter((p) => p.coverImage && !p.coverAlt);
  const placeholderBusiness = /placeholder|99999/i.test(`${BUSINESS.legalName} ${BUSINESS.address} ${BUSINESS.phone}`);

  const checks: { ok: boolean; title: string; detail: string; href?: string }[] = [
    {
      ok: !!process.env.NEXT_PUBLIC_SITE_URL,
      title: "Live web address is set",
      detail: process.env.NEXT_PUBLIC_SITE_URL
        ? `Links and the sitemap use ${SITE_URL}.`
        : `NEXT_PUBLIC_SITE_URL is not set on the server, so ${SITE_URL} is assumed. Ask the developer to set it before launch.`,
    },
    {
      ok: !!settings?.googleVerification,
      title: "Google Search Console connected",
      detail: settings?.googleVerification
        ? "Verification code is on every page. Submit /sitemap.xml in Search Console."
        : "Add the HTML-tag code from Google Search Console, then submit /sitemap.xml there.",
      href: "/admin/seo?tab=settings",
    },
    {
      ok: !!settings?.ogImage,
      title: "Share image chosen",
      detail: settings?.ogImage
        ? "Shown when the shop is shared on WhatsApp, Facebook or LinkedIn."
        : "A default photo is used. Upload a 1200 × 630 image made for sharing.",
      href: "/admin/seo?tab=settings",
    },
    {
      ok: !placeholderBusiness,
      title: "Real business details",
      detail: placeholderBusiness
        ? "The address and phone are still placeholders, so they are left out of the business info given to Google (src/data/business.ts)."
        : "Business name, address and phone are given to Google.",
    },
    {
      ok: longTitles.length === 0,
      title: "Product titles fit in Google",
      detail: longTitles.length
        ? `${longTitles.length} product title${longTitles.length === 1 ? " is" : "s are"} over ${TITLE_MAX} characters and will be cut off: ${longTitles
            .slice(0, 4)
            .map((p) => p.name)
            .join(", ")}${longTitles.length > 4 ? "…" : ""}`
        : `All titles are ${TITLE_MAX} characters or less.`,
      href: "/admin/seo?tab=products",
    },
    {
      ok: thinDescriptions.length === 0,
      title: "Product descriptions",
      detail: thinDescriptions.length
        ? `${thinDescriptions.length} product${thinDescriptions.length === 1 ? " has" : "s have"} a very short description. Write 120–160 characters saying what it is and why it is special.`
        : "Every product has a useful description.",
      href: "/admin/seo?tab=products",
    },
    {
      ok: unlabelled === 0,
      title: "Photo descriptions (alt text)",
      detail: unlabelled
        ? `${unlabelled} product photo${unlabelled === 1 ? " has" : "s have"} no description. Google Images and screen readers use it. Ask someone with Products access to fill them in.`
        : "Every product photo has a description.",
    },
    {
      ok: postsWithoutSummary.length === 0 && coversWithoutAlt.length === 0,
      title: "Blog posts",
      detail:
        posts.length === 0
          ? "No posts yet. Regular posts about materials, care and room ideas bring visitors from Google."
          : postsWithoutSummary.length || coversWithoutAlt.length
            ? `${postsWithoutSummary.length} without a summary, ${coversWithoutAlt.length} with a cover photo but no description.`
            : `${posts.length} published post${posts.length === 1 ? "" : "s"}, all complete.`,
      href: "/admin/blog",
    },
  ];
  const passed = checks.filter((c) => c.ok).length;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white">
      <div className="px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <h2 className="font-medium text-stone-900">Checklist</h2>
        <span className="text-sm text-stone-500">
          {passed} of {checks.length} done
        </span>
      </div>
      <ul className="divide-y divide-stone-100">
        {checks.map((c) => (
          <li key={c.title} className="px-5 sm:px-6 py-4 flex gap-3">
            {c.ok ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" aria-label="Done" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" aria-label="To do" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-stone-900">{c.title}</p>
              <p className="mt-0.5 text-sm text-stone-600">{c.detail}</p>
            </div>
            {c.href && !c.ok && (
              <Link href={c.href} className="text-sm text-stone-900 underline underline-offset-4 shrink-0 self-center">
                Fix
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Site settings ──────────────────────────────────────────────────────────

async function SiteSettings() {
  const s = await prisma.seoSettings.findUnique({ where: { id: "site" } });

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <ActionForm action={saveSeoSettings} className="space-y-6">
        <label className={labelClass}>
          Site name
          <input name="siteName" defaultValue={s?.siteName ?? SEO_DEFAULTS.siteName} required maxLength={60} className={`${inputClass} mt-1.5 max-w-sm`} />
        </label>

        <div>
          <p className="text-sm text-stone-500 mb-3">Used for any page that doesn&apos;t have its own title and description.</p>
          <SeoFields
            path="/"
            titleName="defaultTitle"
            descriptionName="defaultDescription"
            initialTitle={s?.defaultTitle}
            initialDescription={s?.defaultDescription}
            fallbackTitle={SEO_DEFAULTS.defaultTitle}
            fallbackDescription={SEO_DEFAULTS.defaultDescription}
            siteUrl={SITE_URL}
          />
        </div>

        <ImageUpload
          name="ogImage"
          folder="seo"
          initial={image(s?.ogImage)}
          label="Share image"
          help="Shown when a link to the shop is shared on WhatsApp, Facebook or LinkedIn. Best size 1200 × 630."
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <label className={labelClass}>
            Google Search Console code
            <input
              name="googleVerification"
              defaultValue={s?.googleVerification}
              placeholder='Paste the whole <meta name="google-site-verification" …> tag'
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className={labelClass}>
            Bing Webmaster code
            <input
              name="bingVerification"
              defaultValue={s?.bingVerification}
              placeholder='Paste the whole <meta name="msvalidate.01" …> tag'
              className={`${inputClass} mt-1.5`}
            />
          </label>
        </div>
      </ActionForm>
    </section>
  );
}

// ─── Pages ──────────────────────────────────────────────────────────────────

async function PagesTab() {
  const saved = await prisma.pageSeo.findMany();

  return (
    <ul className="space-y-3">
      {STATIC_PAGES.map((page) => {
        const row = saved.find((p) => p.path === page.path);
        return (
          <li key={page.path} className="rounded-2xl border border-stone-200 bg-white">
            <details>
              <summary className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 cursor-pointer list-none">
                <span className="font-medium text-stone-900">{page.label}</span>
                <span className="text-sm text-stone-500">{page.path}</span>
                {row?.noindex && <span className="rounded-full bg-amber-50 text-amber-900 px-2 py-0.5 text-xs">Hidden from Google</span>}
                <span className="ml-auto text-xs text-stone-500">{row?.title || row?.description ? "Custom" : "Default"}</span>
              </summary>
              <div className="border-t border-stone-200 px-5 py-5">
                <ActionForm action={savePageSeo} className="space-y-5">
                  <input type="hidden" name="path" value={page.path} />
                  <SeoFields
                    path={page.path}
                    initialTitle={row?.title}
                    initialDescription={row?.description}
                    fallbackTitle={page.title}
                    fallbackDescription={page.description}
                    siteUrl={SITE_URL}
                  />
                  <ImageUpload
                    name="ogImage"
                    folder="seo"
                    initial={image(row?.ogImage)}
                    label="Share image for this page"
                    help="Leave empty to use the site's share image."
                  />
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" name="noindex" defaultChecked={row?.noindex} className="h-4 w-4 accent-stone-900" />
                    Hide this page from Google
                  </label>
                </ActionForm>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Products ───────────────────────────────────────────────────────────────

async function ProductsTab() {
  const products = await prisma.product.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, seoTitle: true, seoDescription: true, isActive: true },
  });

  return (
    <>
      <p className="mb-4 text-sm text-stone-500">
        Leave a field empty to use the product&apos;s name and description. Aim for a title under {TITLE_MAX} characters and
        a description of 120–{DESCRIPTION_MAX}.
      </p>
      <ul className="space-y-3">
        {products.map((p) => {
          const title = p.seoTitle || `${p.name} | Averto`;
          const needsWork = title.length > TITLE_MAX || (p.seoDescription || p.description).trim().length < 70;
          return (
            <li key={p.id} className="rounded-2xl border border-stone-200 bg-white">
              <details>
                <summary className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 cursor-pointer list-none">
                  <span className="font-medium text-stone-900">{p.name}</span>
                  {!p.isActive && <span className="rounded-full bg-stone-100 text-stone-600 px-2 py-0.5 text-xs">Hidden</span>}
                  {needsWork && <span className="rounded-full bg-amber-50 text-amber-900 px-2 py-0.5 text-xs">Needs work</span>}
                  <span className="ml-auto text-xs text-stone-500">{p.seoTitle || p.seoDescription ? "Custom" : "Automatic"}</span>
                </summary>
                <div className="border-t border-stone-200 px-5 py-5">
                  <ActionForm action={saveProductSeo} className="space-y-5">
                    <input type="hidden" name="id" value={p.id} />
                    <SeoFields
                      path={`/products/${p.id}`}
                      initialTitle={p.seoTitle ?? ""}
                      initialDescription={p.seoDescription ?? ""}
                      fallbackTitle={`${p.name} | Averto`}
                      fallbackDescription={clip(p.description)}
                      siteUrl={SITE_URL}
                    />
                    <Link
                      href={`/products/${p.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
                    >
                      View on shop <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </ActionForm>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}
