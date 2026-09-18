"use client";

import { useState } from "react";
import { education } from "@/data";
import EducationModal from "@/components/EducationModal";

export default function EducationCard() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowHistory(true)}
        className="group inline-flex flex-col items-start gap-0 rounded-2xl border border-cream-200 bg-white p-4 text-left transition-colors hover:border-sage-200"
        aria-label="View full academic history"
      >
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sage-400" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-warm-900">{education.institution}</p>
            <p className="mt-0.5 text-xs text-warm-600">{education.degree}</p>
            <p className="text-xs text-warm-500">{education.secondMajor}</p>
            <p className="mt-1 text-xs text-warm-400">{education.expected}</p>
          </div>
        </div>

        {/* Hint */}
        <div className="mt-3 flex items-center gap-1 text-[11px] text-warm-300 transition-colors group-hover:text-sage-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span>See full academic history</span>
        </div>
      </button>

      {showHistory && <EducationModal onClose={() => setShowHistory(false)} />}
    </>
  );
}
