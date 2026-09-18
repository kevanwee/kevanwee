"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import WorldCanvas from "./WorldCanvas";
import { usePokemonCursor } from "./PokemonCursorContext";
import { useWorldPreferences } from "./useWorldPreferences";
import { loadWorld, type WorldSession } from "@/lib/world-session";
import { callActor, dropBerry, greet, type SceneId, type Point, type Actor } from "@/lib/pokemon-world";

type Mode = "inspect" | "call" | "berry";
export default function WorldPlayground({ initialScene, onClose }: { initialScene: SceneId; onClose: () => void }) {
  const { selectedPokemon } = usePokemonCursor();
  const { paused, setPaused } = useWorldPreferences();
  const [scene, setScene] = useState(initialScene);
  const [session, setSession] = useState<WorldSession>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState<Mode>("inspect");
  const [message, setMessage] = useState("Select a Pokémon to meet it. Drag the map to explore.");
  const [journal, setJournal] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const camera = useRef({ x: 320, y: 320, zoom: 2 });
  const visited = useRef(new Set<string>());
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("pokemon-journal-v1") || "[]");
      if (Array.isArray(saved)) { visited.current = new Set(saved.filter((id): id is string => typeof id === "string")); setJournal([...visited.current]); }
    } catch { /* Discovery still works when storage is unavailable. */ }
  }, []);
  useEffect(() => {
    let mounted = true; setSession(undefined); setError(false); setMode("inspect");
    loadWorld(scene).then(value => {
      if (!mounted) return;
      setSession(value);
      const actor = value.world.actors.find(a => a.id === selectedPokemon) || value.world.actors[0];
      setSelected(actor.id); camera.current = { x: actor.x, y: actor.y, zoom: 2 };
    }).catch(() => { if (mounted) setError(true); });
    return () => { mounted = false; };
  }, [scene, attempt, selectedPokemon]);
  const actor = session?.world.actors.find(a => a.id === selected);
  const discover = (resident: Actor) => {
    setSelected(resident.id);
    visited.current.add(`${scene}:${resident.id}`); setJournal([...visited.current]);
    try { localStorage.setItem("pokemon-journal-v1", JSON.stringify([...visited.current])); } catch { /* Optional persistence. */ }
    setMessage(`${resident.name}${resident.shiny ? " · Shiny" : ""} · ${resident.habitat === "water" ? "Water resident" : "Land resident"}. Say hello or offer a berry.`);
  };
  const update = () => setRevision(v => v+1);
  const pick = (p: Point) => {
    if (!session) return;
    if (mode !== "inspect" && paused) { setMessage("Resume motion to call a Pokémon or offer a berry."); return; }
    if (mode === "call") setMessage(callActor(session.world, selected, p));
    else if (mode === "berry") setMessage(dropBerry(session.world, p));
    else {
      const found = [...session.world.actors].sort((a,b)=>b.y-a.y).find(a => Math.abs(a.x-p.x) < Math.max(14,a.size/2) && p.y > a.y-a.size && p.y < a.y+8);
      if (found) discover(found); else setMessage("Tap a Pokémon, or choose one from the resident list.");
    }
    update();
  };
  const zoom = (factor: number) => { camera.current.zoom *= factor; update(); };
  const locate = () => { if (actor) { camera.current.x=actor.x; camera.current.y=actor.y; update(); } };
  const title = scene === "rt111" ? "Route 111" : "Mauville City";
  const count = session?.world.actors.filter(a => journal.includes(`${scene}:${a.id}`)).length || 0;
  return <Modal onClose={onClose} label="Pokémon playground" describedBy="playground-help" className="p-2 sm:p-5">
    <section className="flex h-[96dvh] max-h-[1000px] w-full max-w-6xl flex-col overflow-y-auto rounded-2xl border border-cream-200 bg-cream-50 shadow-2xl">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-cream-200 px-3 py-2 sm:px-5">
        <div><h2 className="flex items-center gap-2 font-serif text-lg font-bold text-warm-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/worlds/items/poke_ball.png" alt="" width={24} height={24} style={{ imageRendering: "pixelated" }} />Pokémon playground
        </h2><p className="text-xs text-warm-600">{title} · Meet all {scene === "rt111" ? 32 : 12} residents</p></div>
        <button className="world-control" onClick={onClose}>Back to portfolio</button>
      </header>
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2 sm:px-5">
        <label className="sr-only" htmlFor="world-scene">Map</label>
        <select id="world-scene" className="world-control max-w-full" value={scene} onChange={e => { setScene(e.target.value as SceneId); setMessage("Choose a resident to explore this map."); }}>
          <option value="rt111">Route 111</option><option value="mauville">Mauville City</option>
        </select>
        <button className="world-control" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Resume motion" : "Pause motion"}</button>
        <div className="flex gap-1" role="group" aria-label="Map zoom">
          <button className="world-control" onClick={() => zoom(.8)} aria-label="Zoom out">−</button>
          <button className="world-control" onClick={() => zoom(1.25)} aria-label="Zoom in">+</button>
          <button className="world-control" onClick={locate} disabled={!actor}>Find selected</button>
        </div>
      </div>
      <div className="relative min-h-[180px] flex-1 overflow-hidden border-y border-cream-200 bg-sage-100">
        {session ? <WorldCanvas session={session} camera={camera} active={!paused} focused selected={selected} revision={revision} onPick={pick} /> : <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/worlds/${scene}/poster.webp`} alt={`${title} map`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-white/70"><div className="rounded-xl bg-white p-4 text-sm" role="status">{error ? <>Map could not load. <button className="world-control" onClick={() => setAttempt(v=>v+1)}>Retry</button></> : "Preparing the playground…"}</div></div>
        </>}
        {paused && session && <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-warm-800">Paused · you can still explore</span>}
      </div>
      <div className="max-h-[42dvh] shrink-0 overflow-y-auto px-3 py-3 sm:px-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-semibold text-warm-700 sm:w-auto sm:min-w-[200px] sm:flex-1" htmlFor="world-resident">
            Residents · {count}/{scene === "rt111" ? 32 : 12} met
            <select id="world-resident" className="world-control w-full min-w-[160px]" value={selected} disabled={!session} onChange={e => {
              const resident = session!.world.actors.find(a=>a.id===e.target.value)!; discover(resident);
              camera.current.x=resident.x; camera.current.y=resident.y; update();
            }}>{session?.world.actors.map(a => <option key={a.id} value={a.id}>{a.name}{a.shiny ? " ★" : ""}{journal.includes(`${scene}:${a.id}`) ? " · met" : ""}</option>)}</select>
          </label>
          <button className="world-control" disabled={!actor} onClick={() => { if (actor) { discover(actor); setMessage(greet(session!.world,actor.id)); update(); } }}>Say hello</button>
          <button className="world-control" disabled={!actor || paused} onClick={() => { if (actor) { setMessage(dropBerry(session!.world, actor.next || actor)); update(); } }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/worlds/items/oran_berry.png" alt="" width={24} height={24} style={{ imageRendering: "pixelated" }} /> Offer berry
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Map interaction">
          {([ ["inspect", "Inspect"], ["call", "Call here"], ["berry", "Place berry"] ] as const).map(([id,label]) =>
            <button className={`world-control ${mode===id ? "!border-sage-600 !bg-sage-100" : ""}`} key={id} aria-pressed={mode===id} disabled={!session || (paused && id!=="inspect")}
              onClick={() => { setMode(id); setMessage(id==="inspect" ? "Tap a Pokémon to meet it." : `Tap a clear spot on the map to ${id==="call" ? "call the selected Pokémon" : "place an Oran Berry"}.`); }}>{label}</button>)}
          {mode === "call" && <button className="world-control" onClick={() => pick(camera.current)}>Call to map centre</button>}
        </div>
        <p role="status" aria-live="polite" className="mt-2 min-h-10 text-sm text-warm-800">{message}</p>
        <details className="mt-1 text-xs leading-5 text-warm-600">
          <summary className="flex min-h-11 items-center underline underline-offset-2">Controls &amp; credits</summary>
          <p id="playground-help">Drag to pan · scroll or + / − to zoom · arrow keys pan when the map is focused. Your discoveries stay on this browser. Escape returns to the portfolio.</p>
          <p className="mt-2 text-[11px]">Original game artwork © Pokémon / Nintendo. <a className="underline underline-offset-2" href="/worlds/README.md" target="_blank" rel="noreferrer">Asset sources</a></p>
        </details>
      </div>
    </section>
  </Modal>;
}
