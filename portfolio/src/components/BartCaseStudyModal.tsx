"use client";

import { useEffect, useCallback } from "react";

interface Props {
  onClose: () => void;
}

interface Section {
  heading: string;
  body?: string;
  images: { src: string; caption: string; wide?: boolean }[];
}

const SECTIONS: Section[] = [
  {
    heading: "The Problem",
    body: "Junior lawyers and banking & finance associates spend significant non-billable time manually verifying statutory citations in legal documents — checking that sections referenced in agreements actually exist, are still in force, and are correctly numbered. BART automates this entirely inside Microsoft Word.",
    images: [
      {
        src: "/projects/bart/image25.png",
        caption: "User persona — Rachel Lim, Junior Associate (Banking & Finance). Her core pain: manual verification of statutory references is time-consuming, error-prone, and disrupts her drafting flow.",
        wide: true,
      },
    ],
  },
  {
    heading: "User Workflow",
    body: "BART integrates as a Word task pane add-in. The interaction model is designed to be non-disruptive — scan, surface findings grouped by confidence, let the user inspect evidence in-document, then accept or reject corrections. Track Changes captures every accepted edit so the drafter retains full visibility.",
    images: [
      {
        src: "/projects/bart/image12.png",
        caption: "End-to-end user workflow — from opening the add-in to producing a reviewed, compliant document with Track Changes.",
        wide: true,
      },
    ],
  },
  {
    heading: "Processing Pipeline",
    body: "Each candidate citation is passed through a 7-stage pipeline. Hybrid retrieval (BM25 + dense vector search via RRF fusion) is used because statutory text is lexically precise — sparse retrieval catches exact act names while dense retrieval handles paraphrases and incomplete references. A cross-encoder reranker then reorders candidates before version verification.",
    images: [
      {
        src: "/projects/bart/image20.png",
        caption: "The 7-step citation pipeline: Extract → Normalise → Retrieve (hybrid BM25 + dense) → Rerank (cross-encoder) → Arbitrate → Verify (version + date) → Recommend.",
        wide: true,
      },
    ],
  },
  {
    heading: "End-to-End Architecture",
    body: "The Office.js frontend (Next.js) communicates with a FastAPI backend over HTTPS. The backend hosts the full retrieval pipeline — embedder, vector store, BM25 index, and reranker. An async job path lets long documents run as background jobs with polling, so Word remains responsive.",
    images: [
      {
        src: "/projects/bart/image19.png",
        caption: "Full system architecture — Office.js/Next.js Word add-in, FastAPI unified scan endpoint, retrieval pipeline (chunk + hybrid retrieval → merge → version verify → recommend + format), and offline scraper/ingest pipeline for the statutory corpus.",
        wide: true,
      },
    ],
  },
  {
    heading: "Scan Workflow & Data Security",
    body: "Document text is processed transiently — it lives only in active memory during the request and is discarded after the response. No client text is written to any persistence layer: no app logs, no database rows, no file storage, no analytics. The statutory corpus (public data only) is the sole persistent store.",
    images: [
      {
        src: "/projects/bart/image18.png",
        caption: "BART scan request lifecycle — AOS-hosted backend, in-memory processing pipeline, results-only response, no document persistence anywhere in the stack.",
        wide: true,
      },
    ],
  },
  {
    heading: "Retrieval Stack",
    body: "MatchingService is the retrieval abstraction layer. It wires four infrastructure components behind a clean interface: a Qwen3-0.6B dense embedder, a Chroma/pgvector vector store, a BM25Okapi sparse index with a legal-aware tokeniser, and a BGE cross-encoder reranker. Swapping backends (e.g. Chroma → RDS pgvector for production) requires only a config flag.",
    images: [
      {
        src: "/projects/bart/image16.png",
        caption: "MatchingService component diagram — Qwen3 embeddings, Chroma persistent client (dev) / PostgreSQL pgvector (prod), BM25Index with legal tokenisation, BGE cross-encoder reranker.",
        wide: true,
      },
    ],
  },
  {
    heading: "Data Store Design",
    body: "Offline ingestion chunks the statute corpus (≤800 chars per chunk), embeds with Qwen3-0.6B, and populates both the vector store and the BM25 index. Each chunk carries version metadata (YYYYMMDD) so the verification step can flag outdated, removed, or renumbered provisions.",
    images: [
      {
        src: "/projects/bart/image21.png",
        caption: "Persistent stores: Statute Corpus (JSON, version-keyed) → ingest_corpus.py → Vector Store (Chroma/pgvector, 1024-dim cosine) + BM25 Index (~299 MB, legal-aware tokeniser). Scan results are transient — discarded on server restart.",
        wide: true,
      },
    ],
  },
  {
    heading: "In Action",
    body: "The task pane surfaces results grouped by verification status and confidence. Each finding links directly to the relevant paragraph so the lawyer can inspect the citation in context before accepting or rejecting the suggested correction.",
    images: [
      {
        src: "/projects/bart/image5.png",
        caption: "Word add-in task pane — match results with confidence scores, verification status (VALID / AMENDED / REMOVED / RENUMBERED), and inline suggested corrections.",
      },
      {
        src: "/projects/bart/image3.png",
        caption: "Citation detection in action — statute references are extracted from the document, matched against the corpus, and surfaced with evidence excerpts and recommended actions.",
      },
    ],
  },
  {
    heading: "CI/CD Pipeline",
    body: "Every push and pull request triggers bart-ci.yml. A lint gate (ruff check + format) blocks all downstream jobs if it fails. Three test suites then run in parallel: scraper unit tests, backend unit tests (CPU-only torch, pytest with coverage), and frontend tests (Vitest, 65 total tests).",
    images: [
      {
        src: "/projects/bart/image15.png",
        caption: "CI pipeline architecture — lint gate (ruff, py310/py312) → parallel scraper-tests (pytest, JUnit XML), backend-tests (pytest + coverage), frontend-tests (Vitest, 6 files · 65 tests).",
        wide: true,
      },
      {
        src: "/projects/bart/image4.png",
        caption: "Successful GitHub Actions CI run — all 4 jobs pass in 3m 20s on a pull request.",
      },
      {
        src: "/projects/bart/image1.png",
        caption: "Backend unit test coverage report — 99 test functions across 14 modules, run against the full FastAPI service.",
      },
    ],
  },
  {
    heading: "Sprint Timeline",
    body: "BART was built across 6 two-week sprints (Jan–Apr 2026) under the SMU IS483 capstone framework, totalling 300 story points. Each sprint had a defined technical focus — from Office.js scaffolding and scraper initialisation through to CI/CD hardening, async processing, and AWS deployment.",
    images: [
      {
        src: "/projects/bart/image10.png",
        caption: "6-sprint Agile roadmap — Sprint 1 (initiation & research, 28 SP) through Sprint 6 (hardening & delivery, 55 SP). Midterm presentation at Sprint 3, finals due end of Sprint 6.",
        wide: true,
      },
    ],
  },
];

export default function BartCaseStudyModal({ onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="BART case study"
    >
      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-2xl"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-cream-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div>
            <p className="font-serif text-base font-bold text-warm-900">BART</p>
            <p className="text-[11px] text-warm-400">
              IS483 · Final Year Project · Allen &amp; Overy Shearman
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-full border border-sage-200 bg-sage-50 px-2.5 py-0.5 text-[11px] font-semibold text-sage-700">
              Case Study
            </span>
            <button
              onClick={onClose}
              className="text-warm-300 transition-colors hover:text-warm-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-8">
          {/* Intro */}
          <div className="mb-10">
            <h2 className="mb-2 font-serif text-2xl font-bold text-warm-900">
              Statutory Reference Checker
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-warm-500">
              A Microsoft Word add-in that scans and verifies statutory citations in legal documents against Singapore Statutes Online — combining hybrid BM25 + dense vector retrieval, cross-encoder reranking, and version-aware verification inside the drafting environment.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Next.js", "FastAPI", "Office.js", "Qwen3", "ChromaDB", "pgvector", "BGE Reranker", "GitHub Actions", "AWS"].map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-14">
            {SECTIONS.map((section, i) => (
              <div key={i}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-warm-300">
                  {section.heading}
                </p>
                {section.body && (
                  <p className="mb-5 max-w-2xl text-sm leading-relaxed text-warm-500">
                    {section.body}
                  </p>
                )}
                <div className={`grid gap-4 ${section.images.length > 1 && !section.images[0].wide ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {section.images.map((img, j) => (
                    <figure key={j} className="overflow-hidden rounded-xl border border-cream-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={img.caption}
                        className="w-full object-contain"
                        loading="lazy"
                      />
                      <figcaption className="border-t border-cream-100 bg-cream-50 px-3 py-2 text-[11px] leading-relaxed text-warm-400">
                        {img.caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer spacer */}
          <div className="mt-12 border-t border-cream-100 pt-6">
            <p className="text-[11px] text-warm-300">
              BART · IS483 Software Project Management · Singapore Management University · AY2025/2026 Term 2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
