import { aboutParagraphs, achievements, education } from "@/data";
import Memberships from "@/components/Memberships";

export default function About() {
  return (
    <section
      id="about"
      className="scroll-mt-20 px-6 py-24 md:px-10"
      aria-label="About"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 font-serif text-3xl font-bold text-warm-900">
          About
        </h2>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Bio */}
          <div className="lg:col-span-3 space-y-4">
            {aboutParagraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-warm-600">
                {p}
              </p>
            ))}
          </div>

          {/* Right column: education + recognition */}
          <div className="lg:col-span-2 space-y-8">
            {/* Education */}
            <div className="rounded-sm border border-cream-200 bg-white p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-warm-400">
                Education
              </p>
              <p className="mt-3 text-sm font-semibold text-warm-900">
                {education.institution}
              </p>
              <p className="mt-0.5 text-xs text-warm-600">{education.degree}</p>
              <p className="text-xs text-warm-500">{education.secondMajor}</p>
              <p className="mt-3 text-xs text-warm-400">{education.expected}</p>
            </div>

            {/* Recognition */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
                Recognition
              </p>
              <ul className="space-y-2.5">
                {achievements.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-warm-600"
                  >
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sage-400" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <Memberships />
          </div>
        </div>
      </div>
    </section>
  );
}
