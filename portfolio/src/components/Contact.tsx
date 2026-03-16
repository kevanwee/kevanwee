import { personal } from "@/data";
import MauvilleBanner from "@/components/MauvilleBanner";

export default function Contact() {
  return (
    <section
      id="contact"
      className="scroll-mt-24 border-t border-cream-200 pt-24 pb-24"
      aria-label="Contact"
    >
      <div>
        <div className="max-w-lg">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-serif text-3xl font-bold text-warm-900">
              Get in touch
            </h2>
            {/* Charcadet gif — top whitespace cropped via overflow clip */}
            <div style={{ overflow: "hidden", height: 72, width: 100, flexShrink: 0 }} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/charc.gif" alt="" width={100} style={{ marginTop: -28, display: "block", imageRendering: "pixelated" }} />
            </div>
          </div>
          <p className="mb-8 text-sm leading-relaxed text-warm-500">
            Whether you&apos;re working on something at the intersection of law
            and technology, looking for a collaborator, or just want to connect
            — I&apos;d love to hear from you.
          </p>
          <a
            href={`mailto:${personal.email}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-sage-600 underline underline-offset-4 decoration-sage-300 hover:text-sage-700 hover:decoration-sage-500 transition-all duration-200"
          >
            {personal.email}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

        <MauvilleBanner />

        <footer className="mt-24 border-t border-cream-200 pt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-warm-400">© {new Date().getFullYear()} Kevan Wee</p>
          <div className="flex items-center gap-4">
            <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-warm-400 hover:text-warm-700 transition-colors duration-200">LinkedIn</a>
            <a href={personal.github} target="_blank" rel="noopener noreferrer" className="text-xs text-warm-400 hover:text-warm-700 transition-colors duration-200">GitHub</a>
            <a href={personal.funPortfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-warm-400 hover:text-warm-700 transition-colors duration-200">3D Portfolio</a>
          </div>
        </footer>
      </div>
    </section>
  );
}
