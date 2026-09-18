"use client";

import Modal from "@/components/Modal";

import { useEffect, useRef, useState } from "react";
import { careerDocuments } from "@/data";

interface Props {
  onClose: () => void;
}

// Mobile browsers (iOS Safari in particular) don't render PDFs inside an
// iframe, so small/coarse-pointer viewports get an open/download card instead.
function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export default function ResumeModal({ onClose }: Props) {
  const isMobile = useMobileViewport();
  const [selectedId, setSelectedId] = useState<(typeof careerDocuments)[number]["id"]>("resume");
  const selectedDocument = careerDocuments.find((item) => item.id === selectedId)!;
  const initialButton = useRef<HTMLButtonElement>(null);


  return (
    <Modal onClose={onClose} label="Resume and CV" describedBy="career-document-description">
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-2xl"
        style={{ height: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-cream-200 bg-white/90 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Choose document" className="inline-flex rounded-xl bg-cream-100 p-1">
              {careerDocuments.map((item, index) => (
                <button
                  key={item.id}
                  ref={index === 0 ? initialButton : undefined}
                  type="button"
                  aria-pressed={selectedId === item.id}
                  title={`${selectedId === item.id ? "Viewing" : "View"} ${item.label}: ${item.description} ${item.switchHint}`}
                  onClick={() => setSelectedId(item.id)}
                  className={`rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 ${
                    selectedId === item.id
                      ? "bg-white text-sage-700 shadow-sm"
                      : "text-warm-600 hover:bg-white/60 hover:text-sage-700"
                  }`}
                >
                  <span className="block text-xs font-bold uppercase tracking-widest">{item.label}</span>
                  <span className="mt-0.5 block text-[11px]">{item.summary}</span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <a
                href={selectedDocument.href}
                download={selectedDocument.filename}
                title={`Download ${selectedDocument.label} (PDF)`}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-warm-600 transition-all duration-200 hover:border-sage-300 hover:text-sage-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                  className="h-3 w-3" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download {selectedDocument.label}
              </a>
              {!isMobile && <a href={selectedDocument.href} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-sage-700 underline underline-offset-4">Open {selectedDocument.label}</a>}
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center text-warm-600 transition-colors hover:text-warm-700"
                aria-label="Close document viewer"
              >
                ✕
              </button>
            </div>
          </div>
          <p id="career-document-description" aria-live="polite" className="mt-3 text-xs leading-5 text-warm-600">
            <span className="font-semibold">{selectedDocument.label}:</span>{" "}
            {selectedDocument.description}{" "}
            {selectedDocument.switchHint}
          </p>
        </div>

        {/* PDF viewer */}
        {isMobile ? (
          <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-4 overflow-y-auto px-6 py-8 text-center">
            <div className="my-auto flex shrink-0 flex-col items-center gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-warm-600">
                Kevan Wee · {selectedDocument.label}
              </p>
              <p className="max-w-xs text-sm text-warm-600">
                PDF preview isn&apos;t available on this device — open or download
                it instead.
              </p>
              <a
                href={selectedDocument.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-sage-600 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-all duration-200 hover:bg-sage-700"
              >
                Open {selectedDocument.label}
              </a>
            </div>
          </div>
        ) : (
          <iframe
            tabIndex={-1}
            key={selectedDocument.id}
            src={selectedDocument.href}
            className="min-h-0 w-full flex-1 border-0"
            title={`Kevan Wee ${selectedDocument.label}`}
          />
        )}
      </div>
    </Modal>
  );
}
