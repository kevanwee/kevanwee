import { personal } from "@/data";

export default function Contact() {
  return (
    <section
      id="contact"
      className="mb-16 pb-16 scroll-mt-16 lg:scroll-mt-24"
      aria-label="Contact"
    >
      <p className="mb-10 max-w-md text-sm leading-relaxed text-slate-400">
        I&apos;m always open to conversations about legal technology, geospatial
        intelligence, or interesting projects at the intersection of law and
        software. My inbox is open.
      </p>
      <a
        href={`mailto:${personal.email}`}
        className="inline-flex items-center gap-2 rounded border border-indigo-500/50 bg-transparent px-5 py-3 text-sm font-medium text-indigo-400 transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-400/10 hover:text-indigo-300"
      >
        Say hello
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </a>

      <footer className="mt-16 border-t border-slate-800 pt-8">
        <p className="text-xs text-slate-600">
          Designed & built by Kevan Wee. Inspired by{" "}
          <a
            href="https://brittanychiang.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-400 transition-colors"
          >
            Brittany Chiang
          </a>
          .
        </p>
      </footer>
    </section>
  );
}
