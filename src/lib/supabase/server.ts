// Supabase client for Server Components, Server Actions and Route Handlers, signed in as whoever's
// session cookie came with the request. Create a new one per request; never share it.
import "server-only";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Supabase records the browser behind each login (shown under "Where you're logged in"); without
// this every login made from the server would read "node"
const browserHeaders = (userAgent: string | null): Record<string, string> =>
  userAgent ? { "User-Agent": userAgent.slice(0, 400) } : {};

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const userAgent = (await headers()).get("user-agent");
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: browserHeaders(userAgent) },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
          } catch {
            // Server Components can't set cookies; src/proxy.ts refreshes the session instead
          }
        },
      },
    },
  );
}
