"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { educationHistory } from "@/data";

interface Props {
  onClose: () => void;
}

export default function EducationModal({ onClose }: Props) {
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
      aria-label="Education history"
    >
      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-2xl"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-cream-200 bg-white/90 px-5 py-3.5 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-warm-400">
            Academic History
          </p>
          <button
            onClick={onClose}
            className="text-warm-300 transition-colors hover:text-warm-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            {educationHistory.map((entry, i) => (
              <div key={i} className="flex gap-4">
                {/* Logo */}
                <div className="mt-0.5 h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-cream-200 bg-cream-50">
                  {entry.logo ? (
                    <Image
                      src={entry.logo}
                      alt={entry.institution}
                      width={40}
                      height={40}
                      className="h-full w-full object-contain p-0.5"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-warm-300">
                      {entry.institution.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-warm-900">{entry.institution}</p>
                  <p className="mt-0.5 text-xs text-warm-600">{entry.qualification}</p>
                  <p className="text-xs text-warm-400">{entry.period}</p>

                  {entry.grade && (
                    <span className="mt-1.5 inline-block rounded-full border border-sage-200 bg-sage-50 px-2 py-0.5 text-[11px] text-sage-700">
                      {entry.grade}
                    </span>
                  )}

                  {entry.activities && entry.activities.length > 0 && (
                    <div className="mt-2.5">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-warm-300">
                        Activities
                      </p>
                      <ul className="space-y-0.5">
                        {entry.activities.map((a, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-warm-500">
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-cream-300" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.leadership && entry.leadership.length > 0 && (
                    <div className="mt-2.5">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-warm-300">
                        Leadership
                      </p>
                      <ul className="space-y-0.5">
                        {entry.leadership.map((l, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-warm-500">
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-cream-300" />
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.achievements && entry.achievements.length > 0 && (
                    <div className="mt-2.5">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-warm-300">
                        Achievements
                      </p>
                      <ul className="space-y-0.5">
                        {entry.achievements.map((a, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-warm-500">
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-cream-300" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
