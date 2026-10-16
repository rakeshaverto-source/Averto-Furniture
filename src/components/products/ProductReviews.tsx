import { BadgeCheck, Star } from "lucide-react";
import { getRatingSummary, type ProductReview } from "@/data/reviews";
import WriteReviewButton from "./ReviewForm";

export function StarRating({ value, className = "w-4 h-4" }: { value: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-[#E08A50]" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= rounded ? "fill-current" : "text-stone-300"}`} />
      ))}
    </span>
  );
}

export default function ProductReviews({
  reviews,
  productId,
  productName,
}: {
  reviews: ProductReview[];
  productId: string;
  productName: string;
}) {
  const { total, average, counts } = getRatingSummary(reviews);

  return (
    <section id="reviews" className="scroll-mt-24 w-full bg-white border-t border-stone-200 py-16 sm:py-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#111110]">Customer reviews</h2>
          <WriteReviewButton
            productId={productId}
            productName={productName}
            className="px-6 py-3 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium cursor-pointer transition-colors"
          >
            Write a review
          </WriteReviewButton>
        </div>

        {total === 0 ? (
          <div className="mt-8 py-12 border-y border-stone-200 text-center">
            <p className="text-stone-700">No reviews yet for {productName}.</p>
            <p className="mt-1 text-sm text-stone-500">Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Summary */}
            <div className="lg:col-span-4">
              <div className="flex items-end gap-4">
                <span className="font-serif text-6xl leading-none text-stone-950">{average.toFixed(1)}</span>
                <div className="pb-1">
                  <StarRating value={average} className="w-5 h-5" />
                  <p className="text-sm text-stone-500 mt-1">
                    Based on {total} {total === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>

              <ul className="mt-8 space-y-2.5">
                {counts.map(({ stars, count }) => (
                  <li key={stars} className="flex items-center gap-3 text-sm text-stone-600">
                    <span className="w-10 shrink-0 tabular-nums">{stars} star</span>
                    <span className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-[#E08A50]"
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </span>
                    <span className="w-5 text-right tabular-nums text-stone-500">{count}</span>
                  </li>
                ))}
              </ul>

            </div>

            {/* Reviews */}
            <ul className="lg:col-span-8 border-t border-stone-200">
              {reviews.map((review) => (
                <li key={review.id} className="py-7 border-b border-stone-200">
                  <div className="flex items-center justify-between gap-4">
                    <StarRating value={review.rating} />
                    <span className="text-xs text-stone-500">{review.date}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-stone-950">{review.title}</h3>
                  <p className="mt-2 text-stone-700 leading-relaxed">{review.text}</p>
                  <p className="mt-4 text-sm text-stone-500">
                    <span className="text-stone-900 font-medium">{review.name}</span>
                    {review.location && <> &middot; {review.location}</>}
                    {review.verified && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified buyer
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
