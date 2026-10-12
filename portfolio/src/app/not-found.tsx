import Link from "next/link";
import LostCave from "@/components/LostCave";

const SECTIONS = [
  ["About", "/#about"],
  ["Experience", "/#experience"],
  ["Projects", "/#projects"],
  ["Media", "/#media"],
  ["Contact", "/#contact"],
];

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-warm-400">404</p>
      <h1 className="mt-2 font-serif text-4xl font-bold text-warm-900">Lost in Crystal Crossing</h1>
      <p className="mt-3 text-warm-600">This page isn&apos;t here, and neither is Psyduck&apos;s way out.</p>
      <LostCave />
      <nav aria-label="Back to the portfolio" className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Link href="/" className="font-medium text-sage-600 underline-offset-4 transition-colors hover:text-sage-700 hover:underline">
          ← Back home
        </Link>
        {SECTIONS.map(([label, href]) => (
          <Link key={href} href={href} className="text-warm-500 underline-offset-4 transition-colors hover:text-sage-600 hover:underline">
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
