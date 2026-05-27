import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apply — RapidTal",
  description: "Pre-screen your skills and apply to work with Australia's fastest-growing businesses.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <header className="border-b border-[#1e1e1e] px-4 py-4 sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">rapid</span>
              <span className="text-brand-orange">tal</span>
            </span>
            <span className="text-[#3f3f50] text-sm ml-1 font-medium">/ apply</span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-65px)]">{children}</main>
      </body>
    </html>
  );
}
