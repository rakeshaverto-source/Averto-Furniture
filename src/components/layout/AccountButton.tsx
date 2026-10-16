"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

// "Login" for visitors, "My account" once signed in. Pages stay static: the state is read in the
// browser after load, and the label fades in so it never flips in front of the visitor.
export default function AccountButton() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className={`text-sm text-stone-700 hover:text-stone-950 underline-offset-4 hover:underline transition-opacity inline-block whitespace-nowrap ${
        signedIn === null ? "opacity-0" : "opacity-100"
      }`}
    >
      {signedIn ? "My account" : "Login"}
    </Link>
  );
}
