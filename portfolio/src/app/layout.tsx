import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Kevan Wee",
  description:
    "Kevan Wee - Computing & Law at SMU. Building technology at the intersection of law and software.",
  keywords: ["Kevan Wee", "Computing Law", "SMU", "LegalTech", "Singapore"],
  authors: [{ name: "Kevan Wee" }],
  openGraph: {
    title: "Kevan Wee",
    description:
      "Computing & Law at SMU. Building technology at the intersection of law and software.",
    siteName: "Kevan Wee",
    locale: "en_SG",
    type: "website",
  },
  icons: {
    icon: "/cloud-chibi.png",
    shortcut: "/cloud-chibi.png",
    apple: "/cloud-chibi.png",
  },
  verification: {
    google: "google7f96513fc0efb233",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-cream-50 text-warm-800 font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
