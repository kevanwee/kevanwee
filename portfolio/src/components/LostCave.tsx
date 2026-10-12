"use client";

import { useEffect, useRef, useState } from "react";
import { frameAt, type Animation } from "./friend-areas";

/** The 404 page's scene: Explorers of Sky's Crystal Crossing, with its native palette animation, and a lost
 *  shiny Psyduck wandering the cavern floor with a question mark. Diancie and Carbink live in the Crystal
 *  Crossing Friend Area; here the cave is Psyduck's alone.
 *  Assets: the Crystal Crossing scenery in public/friend-areas (scripts/sky_scenery.py) and Psyduck in
 *  public/lost-cave (scripts/fetch-lost-cave.py). */
type Layer = { src: string; x: number; y: number; w: number; h: number; frames: number; durations: number[] };
type Catalog = {
  scene: { background: string; size: number[]; layers: Layer[] };
  sprites: Record<string, { name: string; credits: string[]; animations: Record<string, Animation> }>;
};
type Point = [number, number];

// PMD facing rows: 0 down, 1 down-right, 2 right, 3 up-right, 4 up, 5 up-left, 6 left, 7 down-left.
function facing(dx: number, dy: number) {
  const angle = Math.atan2(dy, dx); // screen space: +y is down
  return [2, 1, 0, 7, 6, 5, 4, 3][(Math.round(angle / (Math.PI / 4)) + 8) % 8];
}
// A loop across the cavern floor; at each stop Psyduck looks around before setting off again.
const ROUTE: Point[] = [[214, 334], [300, 392], [392, 336], [352, 284], [248, 284]];
const LOOKS = [0, 6, 2, 0];
const PAUSE = 2400, SPEED = 0.028, TICK = 1000 / 60;

export default function LostCave() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/lost-cave/catalog.json", { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCatalog)
      .catch((e) => { if (e.name !== "AbortError") setFailed(true); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!catalog) return;
    const element = canvas.current!, ctx = element.getContext("2d")!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const images = new Map<string, HTMLImageElement>();
    const duck = { x: ROUTE[0][0], y: ROUTE[0][1], direction: 0, animation: "Idle", elapsed: 0 };
    let leg = 1, pause = PAUSE, scenery = 0, raf = 0, last = 0, visible = false, disposed = false;
    function step(dt: number) {
      scenery += dt; duck.elapsed += dt;
      if (pause > 0) {
        pause -= dt;
        duck.direction = LOOKS[Math.min(LOOKS.length - 1, Math.floor((1 - Math.max(0, pause) / PAUSE) * LOOKS.length))];
        if (pause <= 0) { duck.animation = "Walk"; duck.elapsed = 0; }
        return;
      }
      const [tx, ty] = ROUTE[leg], dx = tx - duck.x, dy = ty - duck.y, distance = Math.hypot(dx, dy), stride = SPEED * dt;
      duck.direction = facing(dx, dy);
      if (distance <= stride) {
        duck.x = tx; duck.y = ty; leg = (leg + 1) % ROUTE.length;
        pause = PAUSE; duck.animation = "Idle"; duck.elapsed = 0;
      } else { duck.x += (dx / distance) * stride; duck.y += (dy / distance) * stride; }
    }
    function draw() {
      const { scene, sprites } = catalog!;
      ctx.imageSmoothingEnabled = false;
      const background = images.get(scene.background);
      if (background) ctx.drawImage(background, 0, 0);
      for (const layer of scene.layers) {
        const strip = images.get(layer.src); if (!strip) continue;
        const total = layer.durations.reduce((a, b) => a + b, 0) * TICK;
        let t = motion.matches ? 0 : scenery % total, frame = 0;
        while (frame < layer.frames - 1 && t >= layer.durations[frame] * TICK) { t -= layer.durations[frame] * TICK; frame++; }
        ctx.drawImage(strip, frame * layer.w, 0, layer.w, layer.h, layer.x, layer.y, layer.w, layer.h);
      }
      const animation = sprites["shiny-psyduck"].animations[duck.animation], sheet = images.get(animation.src);
      if (sheet) {
        const row = Math.min(duck.direction, animation.rows - 1), [ox, oy] = animation.origins[row];
        ctx.drawImage(sheet, frameAt(animation, motion.matches ? 0 : duck.elapsed) * animation.w, row * animation.h, animation.w, animation.h,
          Math.round(duck.x - ox), Math.round(duck.y - oy), animation.w, animation.h);
      }
      // The question mark: an original pixel bubble above Psyduck's head.
      const bob = motion.matches ? 0 : Math.round(Math.sin(scenery / 260) * 1.5);
      const bx = Math.round(duck.x) - 6, by = Math.round(duck.y) - 44 + bob;
      ctx.fillStyle = "#1b2a3a"; ctx.fillRect(bx - 1, by - 1, 14, 16);
      ctx.fillStyle = "#fbf7e8"; ctx.fillRect(bx, by, 12, 14);
      ctx.fillStyle = "#1b2a3a";
      for (const [x, y, w, h] of [[3, 2, 6, 2], [8, 3, 2, 3], [6, 6, 2, 2], [5, 7, 2, 2], [5, 11, 2, 2], [2, 3, 2, 2]]) ctx.fillRect(bx + x, by + y, w, h);
    }
    function frame(now: number) {
      raf = 0;
      if (disposed || !visible || document.hidden) { last = 0; return; }
      if (last && now - last < 33) { raf = requestAnimationFrame(frame); return; }
      const dt = last ? Math.min(64, now - last) : 0; last = now;
      if (!motion.matches) step(dt);
      draw();
      if (!motion.matches) raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!disposed && !raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    // Scenery is shared with the Crystal Crossing Friend Area; Psyduck's sheets live here.
    const sources: [string, string][] = [[catalog.scene.background, "/friend-areas/"], ...catalog.scene.layers.map((l): [string, string] => [l.src, "/friend-areas/"]),
      ...Object.values(catalog.sprites["shiny-psyduck"].animations).map((a): [string, string] => [a.src, "/lost-cave/"])];
    Promise.all(sources.map(([src, base]) => new Promise<void>((resolve, reject) => {
      const img = new Image(); img.onload = () => { images.set(src, img); resolve(); };
      img.onerror = () => reject(new Error(src)); img.src = base + src;
    }))).then(wake).catch(() => { if (!disposed) setFailed(true); });
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
    observer.observe(element);
    motion.addEventListener("change", wake); document.addEventListener("visibilitychange", wake);
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      motion.removeEventListener("change", wake); document.removeEventListener("visibilitychange", wake);
    };
  }, [catalog]);

  const size = catalog?.scene.size ?? [600, 480];
  if (failed) return null;
  const duck = catalog?.sprites["shiny-psyduck"];
  return (
    <figure className="mt-8">
      <canvas
        ref={canvas}
        width={size[0]}
        height={size[1]}
        role="img"
        aria-label="Crystal Crossing: a lost shiny Psyduck wanders the glowing cavern with a question mark over its head."
        className="block h-auto w-full rounded-2xl border border-cream-200 bg-[#16222c]"
        style={{ imageRendering: "pixelated", aspectRatio: `${size[0]} / ${size[1]}` }}
      />
      {duck && (
        <figcaption className="mt-2 text-[11px] leading-relaxed text-warm-400">
          Crystal Crossing, Pokémon Mystery Dungeon: Explorers of Sky (map data via{" "}
          <a className="underline underline-offset-2" href="https://github.com/pret/pmd-sky" target="_blank" rel="noreferrer">pret/pmd-sky</a>).
          Shiny Psyduck sprite: <a className="underline underline-offset-2" href="https://github.com/PMDCollab/SpriteCollab" target="_blank" rel="noreferrer">PMD SpriteCollab</a>{" "}
          ({duck.credits.map((c) => (c.startsWith("Discord:") ? "an uncredited contributor" : c)).join(", ")}). Pokémon © Nintendo, Creatures, GAME FREAK and Spike Chunsoft.
        </figcaption>
      )}
    </figure>
  );
}
