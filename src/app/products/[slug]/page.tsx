import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/products/ProductDetail";
import ScrollProgress from "@/components/motion/ScrollProgress";
import { getCategories, getProduct, getProducts, getRelatedProducts, getReviews } from "@/lib/catalog";

// Pages are built ahead of time and refreshed from the database at most every 5 minutes.
// Products added later are built on their first visit.
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProducts()).map((product) => ({ slug: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Piece not found | Averto" };

  return {
    title: `${product.name} | Averto`,
    description: product.description,
    openGraph: {
      title: `${product.name} | Averto`,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [categories, related, reviews] = await Promise.all([
    getCategories(),
    getRelatedProducts(product),
    getReviews(product.id),
  ]);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col pb-16 lg:pb-0">
      <ScrollProgress />
      <Navbar />
      <ProductDetail
        product={product}
        category={categories.find((c) => c.id === product.category)}
        related={related}
        reviews={reviews}
      />
      <Footer />
    </main>
  );
}
