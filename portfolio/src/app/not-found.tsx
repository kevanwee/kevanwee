import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p className="font-mono text-xs text-slate-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-200">Page not found</h1>
      <Link
        href="/"
        className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        ← Back home
      </Link>
    </div>
  );
}
