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

  return (
    <div className="max-w-4xl">
      <Link href="/admin/products" className="text-sm text-stone-500 hover:text-stone-900">
        ← All products
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl text-[#111110]">{product.name}</h1>
        {onShop ? (
          <Link href={`/products/${product.id}`} target="_blank" className="text-sm text-stone-700 underline underline-offset-4">
            View on shop ↗
          </Link>
        ) : (
          <span className="text-sm text-stone-500">{product.isActive ? "Not on the shop until it has a photo" : "Hidden from the shop"}</span>
        )}
      </div>

      {(created || saved) && (
        <p role="status" className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
          {created ? "Product created. Now add its photos below." : "Saved. The shop shows the change now."}
        </p>
      )}

      <div className="mt-8 space-y-8">
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

        {/* Re-mounts after every save, so the form always starts from what is stored */}
        <ProductForm
          key={product.updatedAt.toISOString()}
          categories={categories}
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
        />

        <div className="flex justify-end border-t border-stone-200 pt-6">
          <DeleteProductButton id={product.id} name={product.name} />
        </div>
      </div>
    </div>
  );
}
