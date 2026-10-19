import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-stone-500 hover:text-stone-900">
        ← All products
      </Link>
      <h1 className="mt-2 font-serif text-3xl text-[#111110]">Add product</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Fill in the steps and press &ldquo;Create product&rdquo;. Photos are added right after.
      </p>
      <ProductForm categories={categories} />
    </div>
  );
}
