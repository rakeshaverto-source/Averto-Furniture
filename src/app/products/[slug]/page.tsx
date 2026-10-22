import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/products/ProductDetail";
import ScrollProgress from "@/components/motion/ScrollProgress";
import JsonLd from "@/components/seo/JsonLd";
import { getCategories, getProduct, getProducts, getRelatedProducts, getReviews } from "@/lib/catalog";
import { clip, pageMetadata } from "@/lib/seo";
import { breadcrumbLd, productLd } from "@/lib/structured-data";

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

  return pageMetadata(`/products/${product.id}`, {
    title: product.seoTitle || `${product.name} | Averto`,
    description: product.seoDescription || clip(product.description),
    image: product.image,
  });
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

  const category = categories.find((c) => c.id === product.category);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col pb-16 lg:pb-0">
      <JsonLd
        data={[
          productLd(product, product.seoDescription || product.description, reviews),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Collections", path: "/collections" },
            ...(category ? [{ name: category.name, path: `/collections?category=${category.id}` }] : []),
            { name: product.name, path: `/products/${product.id}` },
          ]),
        ]}
      />
      <ScrollProgress />
      <Navbar />
      <ProductDetail
        product={product}
        category={category}
        related={related}
        reviews={reviews}
      />
      <Footer />
    </main>
  );
}
