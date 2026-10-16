// Storage for product photos, through the secret-key client. Only call it after requireAdmin().
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const PRODUCT_BUCKET = "products";

export const productStorage = () => supabaseAdmin().storage.from(PRODUCT_BUCKET);

// Sample photos live in /public and are not in the bucket, so there is nothing to delete for them
export const isBucketPath = (path: string) => !path.startsWith("/") && !path.startsWith("http");
