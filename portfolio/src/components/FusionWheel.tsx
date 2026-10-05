"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FUSION_HOST, MEGA_CAPABLE, usePokemonCursor, type FusionId } from "./PokemonCursorContext";
import MegaEvolution, { MEGA_TIMING, type MegaSequence } from "./MegaEvolution";
import { FUSION_CONFIGS, POKEMON_CONFIGS } from "./PokemonCursor";
import { SPRITES } from "@/lib/overworld-sprites";
import { motionPreference } from "@/lib/motion";
import "./fusion.css";

/** Who Ceruledge can fuse with, and the colours of their soul in the sequence. */
type Sheet = { src: string; w: number; h: number; frames: number; rows: number };
const fromSprites = (species: string): Sheet => {
  const idle = SPRITES[species].animations.Idle;
  return { src: idle.src, w: idle.w, h: idle.h, frames: idle.durations.length, rows: idle.rows };
};
/** `size` scales the partner in the wheel and the transformation (Zygarde's sheet is large). */
const PARTNERS: { id: FusionId; label: string; idle: Sheet; soul: string; size?: number }[] = [
  { id: "armarouge", label: "Armarouge", idle: fromSprites("armarouge"), soul: "#ff8a24" },
  // Darkrai isn't a resident: its idle sheet ships with the fusion (from the owner's darkrai.zip).
  { id: "darkrai", label: "Darkrai", idle: { src: "/fusion/partners/darkrai/Idle-Anim.png", w: 40, h: 80, frames: 7, rows: 8 }, soul: "#e0204a" },
  // Shiny Zygarde (Complete Forme), from the owner's zygarde.zip.
  { id: "zygarde", label: "Zygarde", idle: { src: "/fusion/partners/zygarde/Idle-Anim.png", w: 88, h: 112, frames: 8, rows: 8 }, soul: "#37e0b3", size: .5 },
];
/** How long the switch-to-Ceruledge hint stays up. */
const HINT_MS = 4000;
const HOST_SOUL = "#6f8cff";
/** Matches the CSS timeline in fusion.css: the fused form appears at the white-out. */
const REVEAL_MS = 1250, SEQUENCE_MS = 2000, SPLIT_MS = 900;

/** One still frame (facing the viewer) of an idle sheet. */
function Still({ src, w, h, frames, rows, scale, className, style }: {
  src: string; w: number; h: number; frames: number; rows: number; scale: number; className?: string; style?: CSSProperties;
}) {
  return <span className={className} style={{
    width: w * scale, height: h * scale, backgroundImage: `url(${src})`,
    backgroundSize: `${w * frames * scale}px ${h * rows * scale}px`, backgroundPosition: "0 0", ...style,
  }} />;
}
const hostStill = (scale: number, fused?: FusionId | null) => {
  const idle = (fused ? FUSION_CONFIGS[fused] : POKEMON_CONFIGS.ceruledge).idle;
  return { src: idle.src, w: idle.frameWidth, h: idle.frameHeight, frames: idle.durations.length, rows: idle.rows, scale };
};
const partnerStill = (sheet: Sheet, scale: number) => ({ ...sheet, scale });
/** Where the cursor's anchor falls on a fused sprite (padding aside), as the cursor computes it. */
const fusedAnchor = (id: FusionId, scale: number, origin = false) => {
  const { idle, anchorX, anchorY } = FUSION_CONFIGS[id];
  const padX = idle.padX ?? 0, padTop = idle.padTop ?? 0;
  const x = ((idle.frameWidth - 2 * padX) * anchorX + padX) * scale, y = ((idle.frameHeight - padTop) * anchorY + padTop) * scale;
  return origin ? `${x}px ${y}px` : `${-x}px ${-y}px`;
};

const editable = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return !!el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable);
};

type Sequence = { kind: "fuse" | "split"; partner: (typeof PARTNERS)[number]; x: number; y: number };

/**
 * Soul Unison, after Mega Man Battle Network's Double Soul: with the Ceruledge cursor, F opens a wheel
 * of partners at the pointer; choosing one plays the transformation and the cursor becomes the
 * fusion. The wheel offers Separate while fused. Reduced motion swaps forms without the sequence.
 */
export default function FusionWheel() {
  const { selectedPokemon, fusion, setFusion, fusing, setFusing, mega, setMega } = usePokemonCursor();
  const [megaSequence, setMegaSequence] = useState<MegaSequence | null>(null);
  const [wheel, setWheel] = useState<{ x: number; y: number } | null>(null);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [status, setStatus] = useState("");
  // Server-rendered first (Next.js): the pointer starts at 0,0 and follows the mouse once mounted.
  const pointer = useRef({ x: 0, y: 0 });
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const returnFocus = useRef<HTMLElement | null>(null);
  const live = useRef({ selectedPokemon, fusion, fusing, wheel, mega });
  live.current = { selectedPokemon, fusion, fusing, wheel, mega };

  // Switching to a cursor with forms shows a brief hint (bottom left): F opens Ceruledge's wheel, or
  // Mega Evolves (and reverts) Greninja, Latias and Latios.
  const [hint, setHint] = useState<string | null>(null);
  const previous = useRef(selectedPokemon);
  useEffect(() => {
    const was = previous.current;
    previous.current = selectedPokemon;
    const forms = selectedPokemon === FUSION_HOST || MEGA_CAPABLE.includes(selectedPokemon);
    if (!forms || was === selectedPokemon) { setHint(null); return; }
    if (!document.documentElement.classList.contains("pokemon-cursor")) return;
    setHint(selectedPokemon === FUSION_HOST ? "to select a form" : live.current.mega ? "to revert" : "to Mega Evolve");
    const timer = window.setTimeout(() => setHint(null), HINT_MS);
    return () => window.clearTimeout(timer);
  }, [selectedPokemon]);
  useEffect(() => { if (wheel || megaSequence) setHint(null); }, [wheel, megaSequence]);

  useEffect(() => {
    const move = (e: MouseEvent) => { pointer.current = { x: e.clientX, y: e.clientY }; };
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "f" || e.ctrlKey || e.metaKey || e.altKey || e.repeat || editable(e.target)) return;
      const { selectedPokemon: host, fusing: busy, wheel: open, mega: isMega } = live.current;
      if (busy || !document.documentElement.classList.contains("pokemon-cursor")) return;
      if (MEGA_CAPABLE.includes(host)) {
        if (document.querySelector("dialog[open]")) return;
        e.preventDefault();
        megaEvolve(!isMega);
        return;
      }
      if (host !== FUSION_HOST) return;
      if (!open && document.querySelector("dialog[open]")) return;
      e.preventDefault();
      if (open) { close(); return; }
      returnFocus.current = document.activeElement as HTMLElement | null;
      const margin = 110;
      setWheel({
        x: Math.min(window.innerWidth - margin, Math.max(margin, pointer.current.x)),
        y: Math.min(window.innerHeight - margin, Math.max(margin, pointer.current.y)),
      });
    };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("keydown", key); };
  }, []);

  // Focus the first choice when the wheel opens.
  useEffect(() => { if (wheel) items.current.find(Boolean)?.focus(); }, [wheel]);
  // The fusion is Ceruledge's: close the wheel if the cursor changes.
  useEffect(() => { if (selectedPokemon !== FUSION_HOST) setWheel(null); }, [selectedPokemon]);

  /** Mega Evolve (or revert) the selected cursor, with the sequence unless motion is reduced. */
  function megaEvolve(on: boolean) {
    const pokemon = live.current.selectedPokemon;
    const name = pokemon[0].toUpperCase() + pokemon.slice(1);
    const done = on ? `${name} Mega Evolved.` : `${name} returned to normal.`;
    if (motionPreference().matches) { setMega(on, pokemon); setStatus(done); return; }
    const timing = MEGA_TIMING[on ? "evolve" : "revert"];
    setFusing(true);
    setMegaSequence({ kind: on ? "evolve" : "revert", pokemon, x: pointer.current.x, y: pointer.current.y });
    window.setTimeout(() => setMega(on, pokemon), timing.reveal);
    window.setTimeout(() => { setMegaSequence(null); setFusing(false); setStatus(done); }, timing.end);
  }

  function close() {
    setWheel(null);
    returnFocus.current?.focus?.({ preventScroll: true });
  }

  const choose = (partner: (typeof PARTNERS)[number] | null) => {
    const at = wheel ?? pointer.current;
    close();
    const target = partner ?? PARTNERS.find(p => p.id === fusion)!;
    const kind = partner ? "fuse" : "split";
    if (partner?.id === fusion) return;
    const done = kind === "fuse" ? `Ceruledge fused with ${target.label}.` : `Ceruledge and ${target.label} separated.`;
    if (motionPreference().matches) { setFusion(partner?.id ?? null); setStatus(done); return; }
    setFusing(true);
    setSequence({ kind, partner: target, x: pointer.current.x || at.x, y: pointer.current.y || at.y });
    window.setTimeout(() => setFusion(partner?.id ?? null), kind === "fuse" ? REVEAL_MS : SPLIT_MS / 2);
    window.setTimeout(() => { setSequence(null); setFusing(false); setStatus(done); }, kind === "fuse" ? SEQUENCE_MS : SPLIT_MS);
  };

  const options = [...PARTNERS.map(p => ({ key: p.id, label: p.label, partner: p as (typeof PARTNERS)[number] | null, current: fusion === p.id })),
    ...(fusion ? [{ key: "split", label: "Separate", partner: null, current: false }] : [])];
  const radius = 74;

  return <>
    <span className="sr-only" role="status">{status}</span>
    {hint && <div className="fusion-hint" role="status">Press <kbd>F</kbd> {hint}</div>}
    {wheel && <div className="fusion-backdrop" onPointerDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="fusion-wheel" role="menu" aria-label="Soul Unison" style={{ left: wheel.x, top: wheel.y }}
        onKeyDown={e => {
          const i = items.current.indexOf(document.activeElement as HTMLButtonElement);
          if (e.key === "Escape") { e.preventDefault(); close(); }
          else if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
            items.current[(i + step + options.length) % options.length]?.focus();
          } else if (e.key === "Tab") e.preventDefault();
        }}>
        <span className="fusion-hub" aria-hidden="true"><Still {...hostStill(1.3, fusion)} className="fusion-sprite" /></span>
        {options.map((option, i) => {
          // Spread choices around the ring, starting at the top.
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(options.length, 3);
          return <button key={option.key} ref={el => { items.current[i] = el; }} type="button" role="menuitem"
            className={`fusion-choice${option.current ? " current" : ""}${option.partner ? "" : " split"}`}
            aria-current={option.current || undefined} disabled={option.current}
            style={{ transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)`, ["--soul" as string]: option.partner?.soul ?? HOST_SOUL }}
            onClick={() => choose(option.partner)}>
            {option.partner ? <Still {...partnerStill(option.partner.idle, option.partner.size ?? 1)} className="fusion-sprite" />
              : <Still {...hostStill(1, null)} className="fusion-sprite" />}
            <span>{option.label}</span>
          </button>;
        })}
      </div>
    </div>}
    {sequence && <SoulUnison {...sequence} />}
    {megaSequence && <MegaEvolution {...megaSequence} />}
  </>;
}

/**
 * The transformation, timed in CSS: the screen dims, the partner flies in as its soul colour,
 * both flash to silhouettes, two soul rings and a pillar of light rise, a white-out, and the
 * fused form stands in the afterglow. Splitting plays a short burst the other way.
 */
function SoulUnison({ kind, partner, x, y }: Sequence) {
  // Played at 2x for the moment; it grows from and shrinks back to the cursor's 1.3x (see fusion.css).
  const host = hostStill(2), fusedForm = hostStill(2, partner.id), guest = partnerStill(partner.idle, 2 * (partner.size ?? 1));
  const at = { left: x, top: y };
  return <div className={`soul-unison ${kind}`} aria-hidden="true" style={{ ["--soul" as string]: partner.soul, ["--host" as string]: HOST_SOUL }}>
    <span className="soul-dim" />
    <span className="soul-pillar" style={at} />
    <span className="soul-ring outer" style={at} />
    <span className="soul-ring inner" style={at} />
    <span className="soul-actor host" style={at}><Still {...host} className="fusion-sprite" /></span>
    <span className="soul-actor guest" style={at}><Still {...guest} className="fusion-sprite" /></span>
    <span className="soul-actor fused" style={{ ...at, translate: fusedAnchor(partner.id, 2), transformOrigin: fusedAnchor(partner.id, 2, true) }}><Still {...fusedForm} className="fusion-sprite" /></span>
    {Array.from({ length: 10 }, (_, i) => <span key={i} className="soul-spark" style={{ ...at, ["--i" as string]: i }} />)}
    <span className="soul-flash" />
  </div>;
}
