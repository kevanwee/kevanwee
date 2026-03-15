import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kevan Wee",
  description:
    "Kevan Wee — Computing & Law student at SMU building technology at the intersection of law and software.",
  keywords: [
    "Kevan Wee",
    "Computing Law",
    "SMU",
    "LegalTech",
    "Singapore",
    "Portfolio",
  ],
  authors: [{ name: "Kevan Wee" }],
  openGraph: {
    title: "Kevan Wee",
    description:
      "Computing & Law student at SMU. Building technology at the intersection of law and software.",
    url: "https://kevanwee.vercel.app",
    siteName: "Kevan Wee",
    locale: "en_SG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Kevan Wee",
    description:
      "Computing & Law student at SMU. Building technology at the intersection of law and software.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-950 text-slate-400 antialiased">{children}</body>
    </html>
  );
}
