"use client";

import { useState } from "react";
import { featuredProjects, otherProjects, projectGroups } from "@/data";
import Skills from "@/components/Skills";
import BartCaseStudyModal from "@/components/BartCaseStudyModal";
import GitHubStars from "@/components/GitHubStars";
import ContributionGarden from "@/components/ContributionGarden";
import MessageLog from "@/components/MessageLog";
import WeatherForecast from "@/components/WeatherForecast";
import { useProjectPreview } from "@/components/ProjectPreview";

function skillRank(title: string) {
  const order = ["sg-legalresearch-skill", "legal-extraction-skill", "Singapore clause drafting", "PDPA assessment", "sg-deadline"];
  const rank = order.indexOf(title);
  return rank < 0 ? order.length : rank;
}

function featuredGroup(id: string) { return id === "scrum" || id === "scrum-skill" ? "process" : "legal"; }

export default function Projects() {
  const [showBart, setShowBart] = useState(false);
  const { bind, panel } = useProjectPreview();
  return (
    <section
      id="projects"
      data-overworld-surface="projects-divider"
      data-overworld-kind="divider"
      className="mb-24 scroll-mt-24 border-t border-cream-200 pt-24 lg:mb-36"
      aria-label="Projects"
    >
      <div>
        <h2 className="mb-3 font-serif text-3xl font-bold text-warm-900">
          Projects
        </h2>
        <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-warm-300">
          LegalTech · Legal AI · LegalOps
        </p>

        {/* Contributions, under the heading */}
        <div className="mb-12">
          <ContributionGarden />
        </div>

        {/* Individual project cards grouped inside larger category panels. */}
        <div className="space-y-10">
          {projectGroups.map(group => <section key={group.id} data-project-group={group.id} className="rounded-3xl border border-cream-200 bg-cream-50 p-4 sm:p-6" aria-labelledby={`projects-${group.id}`}>
          <h3 id={`projects-${group.id}`} className="mb-2 font-serif text-2xl font-semibold text-warm-900">{group.title}</h3>
          <p className="mb-8 text-sm leading-relaxed text-warm-600">{group.description}</p>
        <ol className="space-y-6">
          {featuredProjects.filter(project => featuredGroup(project.id) === group.id).map((project) => (
            <li
              key={project.id}
              data-overworld-surface={`project-${project.id}`}
              data-overworld-kind="featured"
              className={`group rounded-2xl border border-cream-200 bg-white p-5 transition-all duration-300 ease-out hover:border-sage-200 hover:shadow-lg hover:shadow-sage-100/60 hover:-translate-y-0.5 ${project.hasCaseStudy ? "cursor-pointer" : ""}`}
              onClick={project.hasCaseStudy ? () => setShowBart(true) : undefined}
              {...bind(project.title, project.preview)}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center gap-2.5 mb-1">
                    <h3 className="text-sm font-semibold text-warm-800 group-hover:text-sage-700 transition-colors">
                      {project.title}
                    </h3>
                    {project.isPrivate && (
                      <span className="rounded-sm border border-warm-200 px-1.5 py-0.5 font-mono text-[10px] text-warm-400">
                        private
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-warm-500">
                    {project.summary}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <li key={tag} className="tag">
                        {tag}
                      </li>
                    ))}
                  </ul>
                  {project.showGithubStars && project.github && (
                    <div className="mt-4">
                      <GitHubStars href={project.github} title={project.title} />
                    </div>
                  )}
                </div>

                {/* Links */}
                <div className="flex shrink-0 items-center gap-3">
                  {project.hasCaseStudy && (
                    <button
                      onClick={e => { e.stopPropagation(); setShowBart(true); }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 bg-sage-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-sage-600 transition-all duration-200 hover:border-sage-300 hover:bg-sage-100"
                      aria-label="View BART case study"
                    >
                      Details
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  {project.github && !project.showGithubStars && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.title} on GitHub`}
                      className="text-warm-400 transition-colors hover:text-warm-800"
                      onClick={e => e.stopPropagation()}
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
                      className="text-warm-400 transition-colors hover:text-warm-800"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalIcon />
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

<div className="mt-6">          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherProjects.filter(project => project.category === group.id).sort((a, b) => skillRank(a.title) - skillRank(b.title)).map(project => (
              <li
                key={project.title}
                data-overworld-surface={`other-project-${otherProjects.indexOf(project)}`}
                data-overworld-kind="other-project"
                {...bind(project.title, project.preview)}
                className="group min-w-0 flex flex-col justify-between rounded-2xl border border-cream-200 border-t-2 border-t-sage-100 bg-white p-5 transition-all duration-300 ease-out hover:border-sage-200 hover:border-t-sage-300 hover:shadow-lg hover:shadow-sage-100/60 hover:-translate-y-1"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-sage-300"
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
                    <div className="flex items-center gap-2">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${project.title} on GitHub`}
                          className="text-warm-300 transition-colors hover:text-warm-700"
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
                          className="text-warm-300 transition-colors hover:text-warm-700"
                        >
                          <ExternalIcon />
                        </a>
                      )}
                    </div>
                  </div>
                  <h4 className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-warm-800 group-hover:text-sage-700 transition-colors">
                    {project.title}
                    {project.preview && <span className="project-preview-badge">▶ preview</span>}
                  </h4>
                  <p className="text-xs leading-relaxed text-warm-500">
                    {project.summary}
                  </p>
                </div>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs text-warm-500"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
</div></section>)}
        </div>
        <div className="mt-6"><MessageLog /></div>
        {panel}
        {showBart && <BartCaseStudyModal onClose={() => setShowBart(false)} />}

        {/* Castform's forecast, above the skills card */}
        <div className="mt-16">
          <WeatherForecast />
        </div>

        <Skills />
      </div>
    </section>
  );
}

function GitHubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
