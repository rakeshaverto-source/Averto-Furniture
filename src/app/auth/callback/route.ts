// Where the links in Supabase emails land (confirm email, reset password). The code in the link is
// swapped for a session cookie, then the visitor continues to `next`.
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/customer-auth";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  // Usually the link was opened in a different browser. The email is confirmed anyway, so
  // signing in normally works.
  return NextResponse.redirect(new URL(`/login?link=1&next=${encodeURIComponent(next)}`, url.origin));
}
