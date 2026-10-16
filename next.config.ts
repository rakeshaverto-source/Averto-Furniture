import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photos live in the public "products" bucket of Supabase Storage.
    remotePatterns: [
      new URL("https://ylonclayfczcymwwrwqs.supabase.co/storage/v1/object/public/products/**"),
    ],
  },
};

export default nextConfig;
