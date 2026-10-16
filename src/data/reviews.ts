// How a review is shown on the site. Reviews are stored in the database (reviews table); only
// approved ones reach a product page.

export interface ProductReview {
  id: string;
  name: string;
  location: string;
  rating: number; // 1-5
  title: string;
  text: string;
  date: string;
}

export function getRatingSummary(reviews: ProductReview[]) {
  const total = reviews.length;
  const average = total ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  return { total, average, counts };
}
