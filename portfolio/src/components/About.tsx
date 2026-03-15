import { aboutParagraphs, achievements, education } from "@/data";
import Memberships from "@/components/Memberships";

export default function About() {
  return (
    <section
      id="about"
      className="mb-24 scroll-mt-16 lg:mb-36 lg:scroll-mt-24"
      aria-label="About"
    >
      <div className="section-heading lg:hidden">About</div>

      <div className="space-y-4 text-sm leading-relaxed">
        {aboutParagraphs.map((p, i) => (
          <p key={i} className="text-slate-400">
            {p}
          </p>
        ))}
      </div>

      {/* Education */}
      <div className="mt-10">
        <div className="inline-flex items-start gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-slate-700">
          <div className="mt-0.5 flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              {education.institution}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{education.degree}</p>
            <p className="text-xs text-slate-500">{education.secondMajor}</p>
            <p className="mt-1 text-xs text-slate-600">{education.expected}</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          Recognition
        </p>
        <ul className="space-y-2">
          {achievements.map((a, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-500" />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <Memberships />
    </section>
  );
}
