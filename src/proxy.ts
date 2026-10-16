// Keeps the visitor's Supabase session fresh on every page (pages can't write cookies, so the
// refreshed token is saved here) and sends signed-out visitors away from /admin. This is only a
// convenience: real checks are requireAdmin() / getCustomer(), which pages and actions run themselves.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  // No Supabase cookie means nobody is signed in: skip the work for ordinary shoppers
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLogin = request.nextUrl.pathname === "/admin/login";
  if (!hasSession) {
    return isAdmin && !isAdminLogin
      ? NextResponse.redirect(new URL("/admin/login", request.url))
      : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  if (isAdmin && !isAdminLogin && !data?.claims) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return response;
}

export const config = {
  // Every page, but not static files or the photo upload route (large bodies; it checks the admin itself)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/admin/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)"],
};
