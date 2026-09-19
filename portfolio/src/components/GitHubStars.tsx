"use client";

import { useEffect, useState } from "react";

export default function GitHubStars({ href, title }: { href: string; title: string }) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let activeRequest: AbortController | undefined;

    const refresh = async () => {
      if (document.hidden) return;
      activeRequest?.abort();
      const controller = new AbortController();
      activeRequest = controller;
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch("/api/legalquants-stars", { signal: controller.signal });
        if (!response.ok) throw new Error("Star count unavailable");
        const data = await response.json();
        if (!Number.isSafeInteger(data.stars) || data.stars < 0) throw new Error("Invalid star count");
        if (!disposed && activeRequest === controller) setStars(data.stars);
      } catch {
        // Keep the repository link usable without inventing a count.
        if (!disposed && activeRequest === controller) setStars(null);
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, 300_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      activeRequest?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} on GitHub`}
      className="inline-flex flex-wrap items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3 py-1.5 text-xs font-medium text-sage-700 transition-colors hover:border-sage-300 hover:bg-sage-100"
    >
      View on GitHub <span aria-hidden="true">↗</span>
      {stars !== null && (
        <span className="border-l border-sage-200 pl-2 tabular-nums" aria-label={`${stars} GitHub stars`} title="GitHub stars · refreshed periodically">
          <span aria-hidden="true">★</span> {stars.toLocaleString("en-US")}
        </span>
      )}
    </a>
  );
}
