"use client";

import { useEffect, useCallback } from "react";

interface Props {
  onClose: () => void;
}

export default function ResumeModal({ onClose }: Props) {
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
      aria-label="Resume"
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-2xl"
        style={{ height: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-cream-200 bg-white/90 px-5 py-3 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-warm-400">
            Resume
          </p>
          <div className="flex items-center gap-3">
            <a
              href="/resume.pdf"
              download="Kevan_Wee_Resume.pdf"
              className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-warm-400 transition-all duration-200 hover:border-sage-300 hover:text-sage-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                className="h-3 w-3" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </a>
            <button
              onClick={onClose}
              className="text-warm-300 transition-colors hover:text-warm-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <iframe
          src="/resume.pdf"
          className="h-full w-full border-0"
          title="Kevan Wee Resume"
        />
      </div>
    </div>
  );
}
