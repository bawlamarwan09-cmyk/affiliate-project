import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";
import "./public-pages.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const display = Manrope({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Dealora", template: "%s · Dealora" },
  description: "Curated products, honest recommendations, and worthwhile deals.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${sans.variable} ${display.variable}`}>{children}</body></html>;
}
