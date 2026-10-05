"use client";

import { useEffect, useRef, useState } from "react";
import { usePokemonCursor, type PokemonId } from "@/components/PokemonCursorContext";
import { ALL_CURSORS, CURSOR_ROSTER, DEFAULT_LINEUP, LINEUP_MAX } from "@/components/cursorRoster";

/** A small "Edit" button after the Poké Balls: choose up to six cursor Pokémon and their order. */
export default function CursorLineupPicker() {
  const { lineup, setLineup } = usePokemonCursor();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node) && e.target !== button.current) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); button.current?.focus(); } };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", away); window.removeEventListener("keydown", key); };
  }, [open]);
  const others = ALL_CURSORS.filter(p => !lineup.includes(p));
  const move = (index: number, by: number) => {
    const next = [...lineup];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    setLineup(next);
  };
  const Ball = ({ pokemon }: { pokemon: PokemonId }) =>
    // eslint-disable-next-line @next/next/no-img-element
    <img src={CURSOR_ROSTER[pokemon].ball} alt="" width={18} height={18} style={{ imageRendering: "pixelated" }} />;
  const iconButton = "grid h-7 w-7 place-items-center rounded-lg text-[13px] text-warm-600 hover:bg-cream-100 disabled:opacity-30";
  return <div className="relative">
    <button ref={button} type="button" aria-expanded={open} aria-controls="cursor-lineup" onClick={() => setOpen(v => !v)}
      className="ml-1 rounded-full border border-cream-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warm-400 hover:text-warm-600">
      Edit
    </button>
    {open && <div ref={box} id="cursor-lineup" role="dialog" aria-label="Cursor Pokémon"
      className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-64 -translate-x-1/2 rounded-xl border border-cream-200 bg-white p-3 text-left shadow-lg">
      <p className="text-[12px] font-semibold text-warm-600">Cursor Pokémon</p>
      <p className="mt-0.5 text-[10px] text-warm-400">Choose up to {LINEUP_MAX} and their order.</p>
      <ol className="mt-2 grid gap-1" aria-label="In the Poké Ball row">
        {lineup.map((pokemon, i) => <li key={pokemon} className="flex items-center gap-2 rounded-lg border border-cream-200 px-2 py-0.5 text-[12px]">
          <span className="w-3 text-[10px] text-warm-400">{i + 1}</span><Ball pokemon={pokemon} />
          <span className="flex-1">{CURSOR_ROSTER[pokemon].label}</span>
          <button type="button" className={iconButton} aria-label={`Move ${CURSOR_ROSTER[pokemon].label} earlier`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
          <button type="button" className={iconButton} aria-label={`Move ${CURSOR_ROSTER[pokemon].label} later`} disabled={i === lineup.length - 1} onClick={() => move(i, 1)}>↓</button>
          <button type="button" className={iconButton} aria-label={`Remove ${CURSOR_ROSTER[pokemon].label}`} disabled={lineup.length === 1} onClick={() => setLineup(lineup.filter(p => p !== pokemon))}>−</button>
        </li>)}
      </ol>
      {others.length > 0 && <ul className="mt-1 grid gap-1" aria-label="Not in the row">
        {others.map(pokemon => <li key={pokemon} className="flex items-center gap-2 rounded-lg border border-dashed border-cream-200 px-2 py-0.5 text-[12px] text-warm-400">
          <span className="w-3" /><Ball pokemon={pokemon} /><span className="flex-1">{CURSOR_ROSTER[pokemon].label}</span>
          <button type="button" className={iconButton} aria-label={`Add ${CURSOR_ROSTER[pokemon].label}`} disabled={lineup.length >= LINEUP_MAX}
            title={lineup.length >= LINEUP_MAX ? `The row holds ${LINEUP_MAX}: remove one first` : undefined} onClick={() => setLineup([...lineup, pokemon])}>+</button>
        </li>)}
      </ul>}
      {lineup.join() !== DEFAULT_LINEUP.join() && <button type="button" className="mt-2 text-[11px] text-warm-400 underline" onClick={() => setLineup(DEFAULT_LINEUP)}>Reset to default</button>}
    </div>}
  </div>;
}
