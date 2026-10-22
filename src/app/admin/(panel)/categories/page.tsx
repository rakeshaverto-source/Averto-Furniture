import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteCategory } from "@/app/admin/store-actions";
import CategoryForm from "@/components/admin/CategoryForm";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ inuse?: string }> }) {
  await requireAdmin("categories");
  const { inuse } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  const blocked = inuse ? categories.find((c) => c.id === inuse) : undefined;

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl text-[#111110]">Categories</h1>
      <p className="mt-1 text-sm text-stone-500">Shown as filters on the collections page, in this order (lower position first).</p>

      {blocked && (
        <p role="alert" className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          {blocked.name} still has {blocked._count.products} product{blocked._count.products === 1 ? "" : "s"}. Move them to
          another category first, then delete it.
        </p>
      )}

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-medium text-stone-900 mb-4">New category</h2>
        <CategoryForm />
      </section>

      <ul className="mt-6 space-y-3">
        {categories.map((c) => (
          <li key={c.id} className="rounded-2xl border border-stone-200 bg-white">
            <details>
              <summary className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 cursor-pointer list-none">
                <span className="font-medium text-stone-900">{c.name}</span>
                <span className="text-sm text-stone-500 truncate max-w-md">{c.blurb}</span>
                <Link
                  href={`/collections?category=${c.id}`}
                  target="_blank"
                  className="ml-auto text-xs text-stone-500 hover:text-stone-900"
                >
                  {c._count.products} product{c._count.products === 1 ? "" : "s"} ↗
                </Link>
              </summary>
              <div className="border-t border-stone-200 px-5 py-5">
                <CategoryForm category={{ id: c.id, name: c.name, blurb: c.blurb, sortOrder: c.sortOrder }} />
                <form action={deleteCategory} className="mt-4 flex justify-end">
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton
                    message={`Delete the ${c.name} category?`}
                    className="text-sm text-red-700 hover:text-red-800 underline underline-offset-4 cursor-pointer"
                  >
                    Delete category
                  </ConfirmButton>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
