import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apply — RapidTal",
  description: "Pre-screen your skills and apply to work with Australia's fastest-growing businesses.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[#1c1c1c] px-4 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">rapid</span>
              <span className="text-[#f97316]">tal</span>
            </span>
            <span className="text-[#444] text-sm ml-1">/ apply</span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-65px)]">{children}</main>
      </body>
    </html>
  );
}
