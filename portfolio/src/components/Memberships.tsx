const memberships = [
  {
    org: "LegalBenchmarks.ai",
    role: "Steering Committee",
    url: "https://www.legalbenchmarks.ai/",
  },
  {
    org: "LegalQuants",
    role: "Member",
    url: "https://www.legalquants.com/lawyers/kevan-wee",
  },
  {
    org: "Singapore Academy of Law",
    role: "Associate Student Member",
    url: null,
  },
  {
    org: "MENSA",
    role: "Member",
    url: null,
  },
];

export default function Memberships() {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
        Memberships
      </p>
      <div className="flex flex-wrap gap-2">
        {memberships.map(({ org, role, url }) => {
          const content = (
            <>
              <span className="font-semibold text-warm-700">{org}</span>
              <span className="text-warm-300 mx-1.5">·</span>
              <span className="text-warm-400">{role}</span>
            </>
          );

          const base =
            "inline-flex items-center rounded-full border border-cream-200 bg-white px-3 py-1 text-[11px] transition-all duration-200";

          return url ? (
            <a
              key={org}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${base} hover:border-sage-300 hover:bg-sage-50 hover:shadow-sm hover:-translate-y-px`}
            >
              {content}
            </a>
          ) : (
            <span key={org} className={base}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
