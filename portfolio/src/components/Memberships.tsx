const memberships = [
  {
    org: "LegalBenchmarks.ai",
    role: "Steering Committee Member",
    url: "https://www.legalbenchmarks.ai/",
  },
  {
    org: "LegalQuants",
    role: "Member",
    url: null,
  },
];

export default function Memberships() {
  return (
    <div className="mt-10">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
        Memberships
      </p>
      <div className="flex flex-wrap gap-2">
        {memberships.map(({ org, role, url }) => {
          const inner = (
            <>
              <span className="text-slate-200">{org}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{role}</span>
            </>
          );

          return url ? (
            <a
              key={org}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs transition-colors hover:border-slate-700 hover:bg-slate-800/60"
            >
              {inner}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 text-slate-600"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ) : (
            <span
              key={org}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs"
            >
              {inner}
            </span>
          );
        })}
      </div>
    </div>
  );
}
