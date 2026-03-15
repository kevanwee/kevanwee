import { mediaAppearances, MediaAppearance } from "@/data";

const typeStyle: Record<MediaAppearance["type"], string> = {
  Profile: "text-sage-600 bg-sage-50 ring-sage-100",
  Interview: "text-amber-700 bg-amber-50 ring-amber-100",
  Article: "text-warm-600 bg-warm-50 ring-warm-200",
  Feature: "text-warm-600 bg-warm-50 ring-warm-200",
};

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

        <ul className="space-y-0">
          {mediaAppearances.map((item, i) => (
            <li
              key={i}
              className={`group py-7 ${i !== 0 ? "border-t border-cream-200" : ""}`}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <span className="text-sm font-semibold text-warm-900 transition-colors group-hover:text-sage-600">
                    {item.outlet}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-xs ring-1 ${typeStyle[item.type]}`}
                    >
                      {item.type}
                    </span>
                    <span className="font-mono text-xs text-warm-400">
                      {item.date}
                    </span>
                  </div>
                </div>

                <p className="mt-1 text-sm italic text-warm-700 group-hover:text-sage-700 transition-colors flex items-center gap-1.5">
                  {item.title}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-warm-500">
                  {item.description}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
