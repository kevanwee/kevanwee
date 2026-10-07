import type { CSSProperties } from "react";
import { mediaAppearances } from "@/data";

export default function MediaAppearances() {
  if (mediaAppearances.length === 0) return null;

  return (
    <section
      id="media"
      data-overworld-surface="media-divider"
      data-overworld-kind="divider"
      className="mb-24 scroll-mt-24 border-t border-cream-200 pt-24 lg:mb-36"
      aria-label="Media & Appearances"
    >
      <div>
        <h2 className="mb-12 font-serif text-3xl font-bold text-warm-900">
          Media & Appearances
        </h2>

        {/* A slow strip of articles that pauses under the pointer or keyboard focus. Its frame stays put, so it
            keeps the media card's resident perch; under reduced motion it is a plain row you scroll. */}
        <div
          className="media-marquee"
          data-overworld-surface="media-card"
          data-overworld-kind="media-card"
          style={{ "--marquee-duration": `${mediaAppearances.length * 9}s` } as CSSProperties}
        >
          <div className="media-marquee-track">
            {[false, true].map((copy) => (
              <ul key={String(copy)} className="media-marquee-list" aria-hidden={copy || undefined}>
                {mediaAppearances.map((item, i) => (
                  <li key={i}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={copy ? -1 : undefined}
                      className="group flex h-full w-[272px] flex-col justify-between gap-3 rounded-sm border border-cream-200 bg-white px-5 py-4 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-sage-200 hover:shadow-md focus-visible:border-sage-300"
                    >
                      <p className="line-clamp-3 text-sm font-medium leading-snug text-warm-800 transition-colors group-hover:text-sage-700">
                        {item.title}
                      </p>
                      <p className="flex items-center justify-between gap-3 text-xs text-sage-500">
                        <span className="truncate">{item.outlet} · {item.date}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5 flex-shrink-0 text-warm-300 transition-colors group-hover:text-sage-400"
                          aria-hidden="true"
                        >
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

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
