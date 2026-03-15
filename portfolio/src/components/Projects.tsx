import { featuredProjects, otherProjects } from "@/data";

export default function Projects() {
  return (
    <section
      id="projects"
      className="mb-24 scroll-mt-16 lg:mb-36 lg:scroll-mt-24"
      aria-label="Projects"
    >
      <div className="section-heading lg:hidden">Projects</div>

      {/* Featured projects */}
      <ol className="group/list space-y-10">
        {featuredProjects.map((project) => (
          <li key={project.id} className="group relative">
            <div className="rounded-lg border border-transparent p-5 transition-all duration-300 group-hover:border-slate-700/50 group-hover:bg-slate-800/30 group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)]">
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold leading-snug text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {project.title}
                    </h3>
                    {project.isPrivate && (
                      <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                        private
                      </span>
                    )}
                  </div>
                  {project.collab && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      In collaboration with{" "}
                      <span className="text-slate-400">{project.collab}</span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3 pt-0.5">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.title} GitHub`}
                      className="text-slate-500 transition-colors hover:text-slate-200"
                    >
                      <GitHubIcon />
                    </a>
                  )}
                  {project.external && (
                    <a
                      href={project.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.title} external link`}
                      className="text-slate-500 transition-colors hover:text-slate-200"
                    >
                      <ExternalIcon />
                    </a>
                  )}
                </div>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-slate-400">
                {project.description}
              </p>

              <ul className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      {/* Other projects */}
      <div className="mt-14">
        <h3 className="mb-6 text-center text-sm font-semibold text-slate-400 lg:text-left">
          Other noteworthy projects
        </h3>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherProjects.map((project) => (
            <li
              key={project.title}
              className="group flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-800/50 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <div className="flex items-center gap-2.5">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.title} GitHub`}
                        className="text-slate-500 transition-colors hover:text-slate-200"
                      >
                        <GitHubIcon />
                      </a>
                    )}
                    {project.external && (
                      <a
                        href={project.external}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.title} external link`}
                        className="text-slate-500 transition-colors hover:text-slate-200"
                      >
                        <ExternalIcon />
                      </a>
                    )}
                  </div>
                </div>
                <h4 className="mb-2 text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                  {project.title}
                </h4>
                <p className="text-xs leading-relaxed text-slate-500">
                  {project.description}
                </p>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
