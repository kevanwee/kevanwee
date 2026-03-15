import { mediaAppearances } from "@/data";

export default function MediaAppearances() {
  if (mediaAppearances.length === 0) return null;

  return (
    <section
      className="scroll-mt-20 border-t border-cream-200 px-6 py-24 md:px-10"
      aria-label="Media & Appearances"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 font-serif text-3xl font-bold text-warm-900">
          Media & Appearances
        </h2>

        <ul className="space-y-3">
          {mediaAppearances.map((item, i) => (
            <li key={i}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-4 rounded-sm border border-cream-200 bg-white px-5 py-4 transition-all hover:border-sage-200 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug text-warm-800 group-hover:text-sage-700 transition-colors">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-sage-500">{item.outlet}</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warm-300 transition-colors group-hover:text-sage-400"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-warm-400">
          Also featured on{" "}
          <a
            href="https://www.legalquants.com/lawyers/kevan-wee"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-warm-600 transition-colors"
          >
            LegalQuants
          </a>
          .
        </p>
      </div>
    </section>
  );
}
