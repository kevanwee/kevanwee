import { experiences } from "@/data";

const typeColor: Record<string, string> = {
  "Part-time": "text-sage-600 bg-sage-50 ring-sage-100",
  "Internship": "text-warm-600 bg-warm-50 ring-warm-200",
  "Pro Bono": "text-amber-700 bg-amber-50 ring-amber-100",
  "Full-time (NS)": "text-warm-600 bg-warm-50 ring-warm-200",
};

export default function Experience() {
  return (
    <section
      id="experience"
      className="scroll-mt-20 border-t border-cream-200 px-6 py-24 md:px-10"
      aria-label="Work Experience"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 font-serif text-3xl font-bold text-warm-900">
          Experience
        </h2>

        <ol className="space-y-0">
          {experiences.map((exp, i) => (
            <li
              key={exp.id}
              className={`group relative py-8 ${
                i !== 0 ? "border-t border-cream-200" : ""
              }`}
            >
              {/* Top row: company + period */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <a
                  href={exp.url}
                  target={exp.url !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-warm-900 transition-colors hover:text-sage-600"
                >
                  {exp.company}
                </a>
                <span className="font-mono text-xs text-warm-400 sm:flex-shrink-0">
                  {exp.period}
                </span>
              </div>

              {/* Role + type badge */}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm italic text-warm-600">
                  {exp.role}
                  {exp.subtitle ? ` · ${exp.subtitle}` : ""}
                </span>
                <span
                  className={`inline-block rounded-sm px-2 py-0.5 text-xs ring-1 ${
                    typeColor[exp.type] ?? "text-warm-500 bg-warm-50 ring-warm-200"
                  }`}
                >
                  {exp.type}
                </span>
              </div>

              {/* Bullets */}
              {exp.bullets.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {exp.bullets.map((b, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2.5 text-xs leading-relaxed text-warm-500"
                    >
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sage-300" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
