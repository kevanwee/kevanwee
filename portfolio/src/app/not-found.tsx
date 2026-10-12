import Link from "next/link";
import LostCave from "@/components/LostCave";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-warm-400">404</p>
      <h1 className="mt-2 font-serif text-4xl font-bold text-warm-900">Looks like we&apos;re lost</h1>
      <LostCave />
      <Link href="/" className="mt-8 self-start text-sm font-medium text-sage-600 underline-offset-4 transition-colors hover:text-sage-700 hover:underline">
        ← Back home
      </Link>
    </main>
  );
}
