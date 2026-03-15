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
            <span className="flex items-center justify-between w-full">
              <span className="text-xs font-medium text-warm-800">{org}</span>
              <span className="text-xs text-warm-400">{role}</span>
            </span>
          );

          return url ? (
            <a
              key={org}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center rounded-sm border border-cream-200 bg-white px-3 py-2.5 transition-colors hover:border-sage-200 hover:bg-sage-50"
            >
              {inner}
            </a>
          ) : (
            <div
              key={org}
              className="flex items-center rounded-sm border border-cream-200 bg-white px-3 py-2.5"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
