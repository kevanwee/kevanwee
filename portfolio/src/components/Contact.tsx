import { personal } from "@/data";

export default function Contact() {
  return (
    <section
      className="border-t border-cream-200 px-6 py-24 md:px-10"
      aria-label="Contact"
    >
      <div className="mx-auto max-w-4xl">
        <div className="max-w-lg">
          <h2 className="mb-4 font-serif text-3xl font-bold text-warm-900">
            Get in touch
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-warm-500">
            Whether you&apos;re working on something at the intersection of law
            and technology, looking for a collaborator, or just want to connect
            — I&apos;d love to hear from you.
          </p>
          <a
            href={`mailto:${personal.email}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-sage-600 underline underline-offset-4 decoration-sage-300 hover:text-sage-700 hover:decoration-sage-500 transition-colors"
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

        <footer className="mt-24 border-t border-cream-200 pt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-warm-400">© {new Date().getFullYear()} Kevan Wee</p>
          <div className="flex items-center gap-4">
            <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-warm-400 hover:text-warm-700 transition-colors">LinkedIn</a>
            <a href={personal.github} target="_blank" rel="noopener noreferrer" className="text-xs text-warm-400 hover:text-warm-700 transition-colors">GitHub</a>
            <a href={personal.funPortfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-warm-400 hover:text-warm-700 transition-colors">3D Portfolio</a>
          </div>
        </footer>
      </div>
    </section>
  );
}
