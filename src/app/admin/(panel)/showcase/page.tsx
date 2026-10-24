import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { imageUrl } from "@/lib/catalog";
import { formatPrice } from "@/data/collections";
import { moveShowcasePiece, setProductInShowcase } from "@/app/admin/actions";
import { secondaryButton } from "@/components/admin/ui";

const iconButton =
  "h-8 w-8 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer disabled:opacity-30 disabled:pointer-events-none";

// The "Signature Monolith Editions" slider on the home page: which products it shows, and in what order
export default async function AdminShowcasePage() {
  await requireAdmin("products");
  const products = await prisma.product.findMany({
    orderBy: [{ showcaseOrder: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: {
      category: { select: { name: true } },
      images: { where: { colorId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  const slides = products.filter((p) => p.inShowcase);
  const others = products.filter((p) => !p.inShowcase);
  // The home page only shows pieces that are on the shop with a photo
  const live = (p: (typeof products)[number]) => p.isActive && p.images.length > 0;

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl text-[#111110]">Home slider</h1>
      <p className="mt-1 text-sm text-stone-500">
        The large slider under &ldquo;Signature Monolith Editions&rdquo; on the home page. Each slide shows the
        product&rsquo;s main photo, name, category and price, and opens its page when clicked. Three to five pieces
        work best; with none, the section is hidden.
      </p>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white">
        <h2 className="px-5 pt-5 font-medium text-stone-900">
          In the slider <span className="text-stone-400 font-normal">({slides.length})</span>
        </h2>
        {slides.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-500">No pieces yet. Add some from the list below.</p>
        ) : (
          <ol className="mt-3 divide-y divide-stone-100">
            {slides.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 sm:gap-4 px-5 py-3">
                <span className="w-5 text-sm text-stone-400 tabular-nums">{i + 1}</span>
                <Thumb path={p.images[0]?.path} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900 truncate">{p.name}</p>
                  <p className="text-xs text-stone-500">
                    {p.category.name} · {formatPrice(p.priceInr)}
                  </p>
                  {!live(p) && (
                    <p className="text-xs text-amber-700">
                      Not shown: {p.isActive ? "add a photo" : "it is hidden from the shop"}.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <form action={moveShowcasePiece}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={i === 0} title="Move up" aria-label={`Move ${p.name} up`} className={iconButton}>
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </form>
                  <form action={moveShowcasePiece}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={i === slides.length - 1}
                      title="Move down"
                      aria-label={`Move ${p.name} down`}
                      className={iconButton}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </form>
                  <form action={setProductInShowcase}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="inShowcase" value="false" />
                    <button
                      type="submit"
                      title="Remove from the slider"
                      aria-label={`Remove ${p.name} from the slider`}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="border-t border-stone-100 px-5 py-3">
          <Link href="/#showcase" target="_blank" className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
            See it on the home page <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white">
        <h2 className="px-5 pt-5 font-medium text-stone-900">Add a piece</h2>
        {others.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-500">Every product is already in the slider.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {others.map((p) => (
              <li key={p.id} className="flex items-center gap-3 sm:gap-4 px-5 py-3">
                <Thumb path={p.images[0]?.path} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900 truncate">{p.name}</p>
                  <p className="text-xs text-stone-500">
                    {p.category.name} · {formatPrice(p.priceInr)}
                    {!live(p) && <span className="text-amber-700"> · {p.isActive ? "no photo yet" : "hidden from the shop"}</span>}
                  </p>
                </div>
                <form action={setProductInShowcase}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="inShowcase" value="true" />
                  <button type="submit" className={secondaryButton}>
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Thumb({ path }: { path?: string }) {
  return path ? (
    // eslint-disable-next-line @next/next/no-img-element -- a small admin thumbnail
    <img src={imageUrl(path)} alt="" className="h-12 w-12 flex-none rounded-lg object-cover border border-stone-200" />
  ) : (
    <span className="h-12 w-12 flex-none rounded-lg border border-dashed border-stone-300" aria-hidden />
  );
}
