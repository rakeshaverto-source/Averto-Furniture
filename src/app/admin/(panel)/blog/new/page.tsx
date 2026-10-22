import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { SITE_URL } from "@/lib/seo";
import PostForm from "@/components/admin/PostForm";

export default async function NewPostPage() {
  const admin = await requireAdmin("blog");
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div>
      <Link href="/admin/blog" className="text-sm text-stone-500 hover:text-stone-900">
        ← All posts
      </Link>
      <div className="mt-4">
        <PostForm
          siteUrl={SITE_URL}
          products={products}
          post={{
            slug: "",
            title: "",
            excerpt: "",
            coverAlt: "",
            tags: "",
            productIds: [],
            status: "draft",
            publishedAt: "",
            authorName: admin.email.split("@")[0],
            seoTitle: "",
            seoDescription: "",
          }}
        />
      </div>
    </div>
  );
}
