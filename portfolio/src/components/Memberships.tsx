const memberships = [
  {
    org: "LegalBenchmarks.ai",
    role: "Steering Committee Member",
    url: "https://www.legalbenchmarks.ai/",
  },
  {
    org: "LegalQuants",
    role: "Member",
    url: "https://www.legalquants.com/lawyers/kevan-wee",
  },
];

export default function Memberships() {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-400">
        Memberships
      </p>
      <div className="flex flex-col gap-2">
        {memberships.map(({ org, role, url }) => {
          const inner = (
            <span className="flex items-center justify-between w-full gap-4">
              <span className="text-xs font-semibold text-warm-800">{org}</span>
              <span className="text-[10px] text-warm-400 shrink-0">{role}</span>
            </span>
          );

          return url ? (
            <a
              key={org}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center rounded-full border border-cream-200 bg-white px-4 py-1.5 transition-all duration-200 hover:border-sage-300 hover:bg-sage-50 hover:shadow-sm"
            >
              {inner}
            </a>
          ) : (
            <div
              key={org}
              className="flex items-center rounded-full border border-cream-200 bg-white px-4 py-1.5"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
