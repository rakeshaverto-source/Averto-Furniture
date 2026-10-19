import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { imageUrl } from "@/lib/catalog";
import ProductForm from "@/components/admin/ProductForm";
import PhotoManager from "@/components/admin/PhotoManager";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { created, saved }] = await Promise.all([params, searchParams]);

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        colors: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      },
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  const onShop = product.isActive && product.images.length > 0;
  // the same main photo the shop uses: the first one for all colours, else the first one
  const main = product.images.find((img) => !img.colorId) ?? product.images[0];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/products" className="text-sm text-stone-500 hover:text-stone-900">
        ← All products
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#111110]">Edit product</h1>
          <p className="mt-1 text-sm text-stone-500">Go through the steps and press Save at the bottom. Photos save by themselves.</p>
        </div>
        {onShop && (
          <Link href={`/products/${product.id}`} target="_blank" className="text-sm text-stone-700 underline underline-offset-4">
            View on shop ↗
          </Link>
        )}
      </div>

      {(created || saved) && (
        <p role="status" className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
          {created ? "Product created. Now add its photos in step 4." : "Saved. The shop shows the change now."}
        </p>
      )}

      <div className="mt-6 space-y-8">
        {/* Re-mounts after every save, so the form always starts from what is stored */}
        <ProductForm
          key={product.updatedAt.toISOString()}
          categories={categories}
          mainPhoto={main ? { url: imageUrl(main.path), fit: main.fit } : undefined}
          product={{
            id: product.id,
            name: product.name,
            categoryId: product.categoryId,
            badge: product.badge,
            description: product.description,
            specs: product.specs,
            priceInr: product.priceInr,
            originalPriceInr: product.originalPriceInr,
            sortOrder: product.sortOrder,
            isActive: product.isActive,
            colors: product.colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex, priceDelta: c.priceDelta })),
          }}
          photos={
            <PhotoManager
              productId={product.id}
              photos={product.images.map((img) => ({
                id: img.id,
                url: imageUrl(img.path),
                label: img.label,
                fit: img.fit,
                colorId: img.colorId,
              }))}
              colors={product.colors.map((c) => ({ id: c.id, name: c.name }))}
            />
          }
        />

        <section className="rounded-2xl border border-red-200 bg-white p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-red-800">Delete this product</h2>
            <p className="mt-0.5 text-sm text-stone-500">
              Removes it and its photos for good. Past orders keep their details. To only take it off the shop, untick step 5 instead.
            </p>
          </div>
          <DeleteProductButton id={product.id} name={product.name} />
        </section>
      </div>
    </div>
  );
}
