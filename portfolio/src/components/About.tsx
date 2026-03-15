import { aboutParagraphs, achievements, education } from "@/data";
import Memberships from "@/components/Memberships";
import PokemonBanner from "@/components/PokemonBanner";

export default function About() {
  return (
    <section
      id="about"
      className="mb-24 scroll-mt-24 lg:mb-36"
      aria-label="About"
    >
      {/* Heading — mobile only */}
      <h2 className="mb-8 font-serif text-3xl font-bold text-warm-900 lg:hidden">
        About
      </h2>

      <PokemonBanner />

      {/* Bio */}
      <div className="space-y-4">
        {aboutParagraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-warm-600">
            {p}
          </p>
        ))}
      </div>

      {/* Education card */}
      <div className="mt-10">
        <div className="inline-flex items-start gap-4 rounded-2xl border border-cream-200 bg-white p-4 transition-colors hover:border-sage-200">
          <div className="mt-0.5 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sage-400" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-warm-900">{education.institution}</p>
            <p className="mt-0.5 text-xs text-warm-600">{education.degree}</p>
            <p className="text-xs text-warm-500">{education.secondMajor}</p>
            <p className="mt-1 text-xs text-warm-400">{education.expected}</p>
          </div>
        </div>
      </div>

      {/* Recognition */}
      <div className="mt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
          Recognition
        </p>
        <ul className="space-y-2.5">
          {achievements.map((a, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-warm-600">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sage-400" />
              {a}
            </li>
          ))}
        </ul>
      </div>

      {/* Memberships */}
      <div className="mt-8">
        <Memberships />
      </div>
    </section>
  );
}
