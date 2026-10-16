import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { getProducts } from "@/lib/catalog";
import { removeFromWishlist } from "@/app/actions/account-data";
import PriceTag from "@/components/products/PriceTag";

export default async function WishlistPage() {
  const customer = await requireCustomer("/account/wishlist");
  const [items, products] = await Promise.all([
    prisma.wishlistItem.findMany({ where: { userId: customer.id }, orderBy: { createdAt: "desc" } }),
    getProducts(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  // Hidden or removed products drop out of the list on their own
  const saved = items.flatMap((i) => {
    const product = byId.get(i.productId);
    return product ? [product] : [];
  });

  return (
    <div>
      <h2 className="font-serif text-3xl text-[#111110]">Wishlist</h2>
      <p className="mt-1 text-sm text-stone-500">Pieces you saved with the ♥ on a product page.</p>

      {saved.length === 0 ? (
        <div className="mt-6 rounded-sm border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
          <Heart className="mx-auto w-8 h-8 text-stone-300" strokeWidth={1.4} />
          <p className="mt-3 font-serif text-xl text-stone-900">Nothing saved yet</p>
          <p className="mt-1 text-sm text-stone-500">Tap the heart on any piece to keep it here.</p>
          <Link href="/collections" className="inline-block mt-6 px-7 py-3 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium transition-colors">
            Explore collections
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {saved.map((p) => (
            <li key={p.id} className="group relative rounded-sm border border-stone-200 bg-white overflow-hidden">
              <Link href={`/products/${p.id}`} className="block">
                <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 300px"
                    className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${p.zoomClass ?? ""}`}
                  />
                </div>
                <div className="p-4">
                  <p className="font-medium text-stone-900">{p.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{p.specs}</p>
                  <div className="mt-3">
                    <PriceTag price={p.priceInr} original={p.originalPriceInr} />
                  </div>
                </div>
              </Link>
              <form action={removeFromWishlist} className="absolute top-3 right-3">
                <input type="hidden" name="productId" value={p.id} />
                <button
                  type="submit"
                  aria-label={`Remove ${p.name} from wishlist`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white hover:text-stone-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
