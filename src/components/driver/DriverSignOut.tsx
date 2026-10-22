"use client";

import { useRouter } from "next/navigation";

export default function DriverSignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        if (!window.confirm("Sign out? Location sharing will stop.")) return;
        await fetch("/api/driver/logout", { method: "POST" }).catch(() => undefined);
        router.replace("/driver/login");
        router.refresh();
      }}
      className="text-sm text-stone-500 hover:text-stone-900 cursor-pointer"
    >
      Sign out
    </button>
  );
}
