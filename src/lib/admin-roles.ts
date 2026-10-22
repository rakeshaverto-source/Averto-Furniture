// Which admin sections each team role can open. Shared by the server checks (admin-auth.ts) and
// the sidebar, so a section someone can't use is neither shown nor reachable.
import type { StaffRole } from "@/generated/prisma/enums";

export type { StaffRole };

export type AdminSection =
  | "dashboard"
  | "orders"
  | "drivers"
  | "products"
  | "reviews"
  | "coupons"
  | "categories"
  | "seo"
  | "blog"
  | "team";

export const ROLE_SECTIONS: Record<StaffRole, AdminSection[]> = {
  owner: ["dashboard", "orders", "drivers", "products", "reviews", "coupons", "categories", "seo", "blog", "team"],
  seo: ["seo", "blog"],
  orders: ["orders", "drivers"],
  content: ["products", "categories", "reviews"],
  blog: ["blog"],
};

export const ROLES: { value: StaffRole; label: string; help: string }[] = [
  { value: "owner", label: "Owner", help: "Everything, including sales and the team" },
  { value: "seo", label: "SEO", help: "SEO settings and the blog" },
  { value: "orders", label: "Orders manager", help: "Orders and drivers" },
  { value: "content", label: "Content", help: "Products, categories and reviews" },
  { value: "blog", label: "Blog writer", help: "Blog posts only" },
];

export const roleLabel = (role: StaffRole) => ROLES.find((r) => r.value === role)?.label ?? role;

// Where each role lands after signing in, and where a page they can't use sends them
export const SECTION_HOME: Record<StaffRole, string> = {
  owner: "/admin",
  seo: "/admin/seo",
  orders: "/admin/orders",
  content: "/admin/products",
  blog: "/admin/blog",
};

export const canUse = (role: StaffRole, section: AdminSection) => ROLE_SECTIONS[role].includes(section);
