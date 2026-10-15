import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/products/ProductDetail";
import ScrollProgress from "@/components/motion/ScrollProgress";
import {
  collectionProducts,
  getProduct,
  getRelatedProducts,
} from "@/data/collections";
import { getReviews } from "@/data/reviews";

export function generateStaticParams() {
  return collectionProducts.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
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
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col pb-16 lg:pb-0">
      <ScrollProgress />
      <Navbar />
      <ProductDetail
        product={product}
        related={getRelatedProducts(product)}
        reviews={getReviews(product.id)}
      />
      <Footer />
    </main>
  );
}
