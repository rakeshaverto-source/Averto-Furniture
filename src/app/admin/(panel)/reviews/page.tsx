import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate } from "@/lib/admin-format";
import { deleteReview, setReviewStatus } from "@/app/admin/store-actions";
import { primaryButton, secondaryButton } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import OfflineReviewForm from "@/components/admin/OfflineReviewForm";
import type { ReviewStatus } from "@/generated/prisma/client";

const TABS: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "On the shop" },
  { value: "rejected", label: "Rejected" },
];

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("reviews");
  const { status: requested } = await searchParams;
  const status = TABS.find((t) => t.value === requested)?.value ?? "pending";

  const [reviews, counts, samples, products] = await Promise.all([
    prisma.review.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: { select: { name: true } } },
    }),
    prisma.review.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.review.count({ where: { isSample: true } }),
    prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  const countOf = (value: ReviewStatus) => counts.find((c) => c.status === value)?._count._all ?? 0;

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl text-[#111110]">Reviews</h1>
      <p className="mt-1 text-sm text-stone-500">New reviews wait here. They appear on the shop only after you approve them.</p>

      {samples > 0 && (
        <p className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          {samples} sample review{samples === 1 ? " is" : "s are"} still on the shop (marked “Sample” below). They are not
          from real customers; delete them before launch.
        </p>
      )}

      <details className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 group">
        <summary className="cursor-pointer list-none font-medium text-stone-900 flex items-center justify-between gap-3">
          Add a review from a store customer
          <span className="text-sm font-normal text-stone-500 group-open:hidden">For customers who bought in person</span>
        </summary>
        <div className="mt-5">
          <OfflineReviewForm products={products} />
        </div>
      </details>

      <nav aria-label="Filter reviews" className="mt-6 flex flex-wrap gap-1.5 text-sm">
        {TABS.map((tab) => {
          const active = tab.value === status;
          return (
            <Link
              key={tab.value}
              href={`/admin/reviews?status=${tab.value}`}
              aria-current={active ? "page" : undefined}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                active ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-700 hover:border-stone-400"
              }`}
            >
              {tab.label} <span className={active ? "text-white/70" : "text-stone-400"}>{countOf(tab.value)}</span>
            </Link>
          );
        })}
      </nav>

      <ul className="mt-5 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-amber-600 tracking-wider" aria-label={`${r.rating} out of 5 stars`}>
                  {"★".repeat(r.rating)}
                  <span className="text-stone-300">{"★".repeat(5 - r.rating)}</span>
                </p>
                <p className="mt-1 font-medium text-stone-900">{r.title}</p>
              </div>
              <div className="text-right text-xs text-stone-500">
                <Link href={`/admin/products/${r.productId}`} className="text-stone-700 hover:underline underline-offset-4">
                  {r.product.name}
                </Link>
                <p>{formatDate(r.createdAt)}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-stone-700 whitespace-pre-line">{r.text}</p>
            <p className="mt-3 text-xs text-stone-500">
              {r.name}
              {r.location ? `, ${r.location}` : ""}
              {r.email ? ` · ${r.email}` : ""}
              {r.verified && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">✓ Verified buyer</span>
              )}
              {r.offline && (
                <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-800">Bought in store</span>
              )}
              {r.isSample && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">Sample</span>
              )}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {r.status !== "approved" && (
                <form action={setReviewStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="approved" />
                  <button type="submit" className={primaryButton}>
                    Approve
                  </button>
                </form>
              )}
              {r.status !== "rejected" && (
                <form action={setReviewStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button type="submit" className={secondaryButton}>
                    {r.status === "approved" ? "Remove from shop" : "Reject"}
                  </button>
                </form>
              )}
              <form action={deleteReview} className="ml-auto">
                <input type="hidden" name="id" value={r.id} />
                <ConfirmButton
                  message="Delete this review for good?"
                  className="text-sm text-red-700 hover:text-red-800 underline underline-offset-4 cursor-pointer"
                >
                  Delete
                </ConfirmButton>
              </form>
            </div>
          </li>
        ))}
        {reviews.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-sm text-stone-500">
            {status === "pending" ? "No reviews waiting. Nice." : "Nothing here."}
          </li>
        )}
      </ul>
    </div>
  );
}
