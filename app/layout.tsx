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
        <header className="border-b border-brand-black-border px-4 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">rapid</span>
              <span className="text-brand-orange">tal</span>
            </span>
            <span className="text-brand-text-ghost text-sm ml-1">/ apply</span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-65px)]">{children}</main>
      </body>
    </html>
  );
}
