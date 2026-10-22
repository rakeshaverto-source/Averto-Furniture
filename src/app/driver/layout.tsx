import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Driver | Averto",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#FAF8F5" };

// The website version of the driver app: phone-sized, no shop menus
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="mx-auto max-w-lg px-4 py-6">{children}</div>
    </div>
  );
}
