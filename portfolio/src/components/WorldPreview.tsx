"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useWorldPreferences } from "./useWorldPreferences";
import { loadWorld, type WorldSession } from "@/lib/world-session";
import type { SceneId } from "@/lib/pokemon-world";
import WorldCanvas from "./WorldCanvas";
const WorldPlayground = dynamic(() => import("./WorldPlayground"), { ssr: false });

export default function WorldPreview({ id }: { id: SceneId }) {
  const ref = useRef<HTMLButtonElement>(null);
  const camera = useRef({ x: 0, y: 0, zoom: 1 });
  const [visible, setVisible] = useState(false);
  const [session, setSession] = useState<WorldSession>();
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const { paused, modalCount, portfolioDialogOpen } = useWorldPreferences();
  const title = id === "rt111" ? "Route 111" : "Mauville City";
  useEffect(() => {
    setReady(true);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(ref.current!); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || session) return;
    let mounted = true;
    loadWorld(id).then(value => { if (mounted) setSession(value); }).catch(() => {});
    return () => { mounted = false; };
  }, [id, visible, session]);
  return <div className={id === "rt111" ? "mb-10" : "mt-12"}>
    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-warm-600">Currently roaming · {title}</p>
    <button ref={ref} className="group relative block h-[200px] w-full overflow-hidden rounded-2xl border border-cream-200 bg-sage-100 text-left"
      onClick={() => setExpanded(true)} disabled={!ready} aria-label={`Explore ${title}`} aria-haspopup="dialog">
      {session ? <WorldCanvas session={session} camera={camera} active={visible && !paused && modalCount === 0 && !portfolioDialogOpen && !expanded} /> :
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={`/worlds/${id}/poster.webp`} alt="" className="h-full w-full object-cover object-top" loading="lazy" />}
      <span className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs text-warm-800 shadow-sm">
        <span className="font-semibold">Explore {title} ↗</span>
        <span>{id === "rt111" ? 32 : 12} Pokémon · {paused ? "paused" : "live"}</span>
      </span>
    </button>
    {expanded && <WorldPlayground initialScene={id} onClose={() => setExpanded(false)} />}
  </div>;
}
