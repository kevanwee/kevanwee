import { aboutParagraphs, achievements } from "@/data";
import Memberships from "@/components/Memberships";
import PokemonBanner from "@/components/PokemonBanner";
import SubstituteSandbox from "@/components/SubstituteSandbox";
import EducationCard from "@/components/EducationCard";

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

      {/* Education card + Substitute sandbox */}
      <div className="mt-10 flex w-full items-stretch gap-3">
        <EducationCard />
        <SubstituteSandbox className="flex-1" />
      </div>

      {/* Misc */}
      <div className="mt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
          Misc
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
