"use client";

import { useState } from "react";
import { legalEngineering } from "@/data";
import Modal from "./Modal";
import "./legal-engineering.css";

export default function LegalEngineering() {
  const [reading, setReading] = useState(false);
  return <section id="legal-engineering" className="legal-engineering mb-24 scroll-mt-24 border-t border-cream-200 pt-24 lg:mb-36" aria-labelledby="legal-engineering-heading">
    <h2 id="legal-engineering-heading" className="mb-6 font-serif text-3xl font-bold text-warm-900">{legalEngineering.title}</h2>
    <div className="space-y-5 text-sm leading-8 text-warm-500">
      {legalEngineering.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </div>
    <button type="button" className="manifesto-launcher" onClick={() => setReading(true)} aria-haspopup="dialog">
      Read the manifesto
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
    </button>
    {reading && <Modal label={legalEngineering.manifestoTitle} onClose={() => setReading(false)}>
      <div className="manifesto-reader">
        <header className="manifesto-reader-header">
          <h3 className="font-serif text-lg font-semibold text-warm-900">{legalEngineering.manifestoTitle}</h3>
          <div className="manifesto-reader-actions">
            <a href={legalEngineering.manifestoUrl} target="_blank" rel="noopener noreferrer">Open original <span aria-hidden="true">&#8599;</span></a>
            <button type="button" onClick={() => setReading(false)} aria-label="Close manifesto reader">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
            </button>
          </div>
        </header>
        <iframe src={legalEngineering.manifestoUrl} title={legalEngineering.manifestoTitle} referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" />
      </div>
    </Modal>}
  </section>;
}
