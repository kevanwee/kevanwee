"use client";

import { useEffect, useRef, useState } from "react";
import { frameAt, type Animation } from "./friend-areas";

/** The 404 page's scene: one of three Explorers of Sky caves (Crystal Crossing, a starlit cave lake or a crystal
 *  lakeshore, chosen per visit) with its native palette or tile animation. Diancie and its Carbink keep watch by the crystals while a
 *  lost shiny Psyduck wanders under a question mark. Credits live in the site's Credits dialog.
 *  Assets: public/lost-cave (scripts/sky_scenery.py, scripts/fetch-lost-cave.py); Diancie and Carbink share the
 *  Crystal Crossing Friend Area's sheets. */
type Layer = { src: string; x: number; y: number; w: number; h: number; frames: number; durations: number[] };
type Point = [number, number];
type Resident = { key: string; at: Point; direction: number };
type Scene = { name: string; base?: string; background: string; size: number[]; layers: Layer[]; route: Point[]; residents: Resident[] };
type Sprite = { name: string; base: string; animations: Record<string, Animation> };
type Catalog = { scenes: Record<string, Scene>; sprites: Record<string, Sprite> };
type Actor = { key: string; x: number; y: number; direction: number; animation: string; elapsed: number };

// PMD facing rows: 0 down, 1 down-right, 2 right, 3 up-right, 4 up, 5 up-left, 6 left, 7 down-left.
function facing(dx: number, dy: number) {
  const angle = Math.atan2(dy, dx); // screen space: +y is down
  return [2, 1, 0, 7, 6, 5, 4, 3][(Math.round(angle / (Math.PI / 4)) + 8) % 8];
}
const LOOKS = [0, 6, 2, 0];
const PAUSE = 2400, SPEED = 0.028, TICK = 1000 / 60;

export default function LostCave() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sceneKey, setSceneKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/lost-cave/catalog.json", { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Catalog) => {
        const keys = Object.keys(data.scenes);
        setSceneKey(keys[Math.floor(Math.random() * keys.length)]);
        setCatalog(data);
      })
      .catch((e) => { if (e.name !== "AbortError") setFailed(true); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!catalog || !sceneKey) return;
    const scene = catalog.scenes[sceneKey], route = scene.route, sprites = catalog.sprites;
    // Crystal Crossing's scenery is shared with its Friend Area; the other caves live in /lost-cave/.
    const sceneBase = scene.base ?? "/lost-cave/";
    const element = canvas.current!, ctx = element.getContext("2d")!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const images = new Map<string, HTMLImageElement>();
    const duck: Actor = { key: "shiny-psyduck", x: route[0][0], y: route[0][1], direction: 0, animation: "Idle", elapsed: 0 };
    // Staggered clocks so the watchers don't idle in lockstep.
    const watchers: Actor[] = scene.residents.map((r, i) => ({ key: r.key, x: r.at[0], y: r.at[1], direction: r.direction, animation: "Idle", elapsed: i * 370 }));
    const actors = [...watchers, duck];
    let leg = 1, pause = PAUSE, clock = 0, raf = 0, last = 0, visible = false, disposed = false;
    function step(dt: number) {
      clock += dt;
      for (const actor of actors) actor.elapsed += dt;
      if (pause > 0) {
        pause -= dt;
        duck.direction = LOOKS[Math.min(LOOKS.length - 1, Math.floor((1 - Math.max(0, pause) / PAUSE) * LOOKS.length))];
        if (pause <= 0) { duck.animation = "Walk"; duck.elapsed = 0; }
        return;
      }
      const [tx, ty] = route[leg], dx = tx - duck.x, dy = ty - duck.y, distance = Math.hypot(dx, dy), stride = SPEED * dt;
      duck.direction = facing(dx, dy);
      if (distance <= stride) {
        duck.x = tx; duck.y = ty; leg = (leg + 1) % route.length;
        pause = PAUSE; duck.animation = "Idle"; duck.elapsed = 0;
      } else { duck.x += (dx / distance) * stride; duck.y += (dy / distance) * stride; }
    }
    const sheetKey = (key: string, src: string) => sprites[key].base + src;
    function draw() {
      ctx.imageSmoothingEnabled = false;
      const background = images.get(sceneBase + scene.background);
      if (background) ctx.drawImage(background, 0, 0);
      // Each layer loops at its own native speed (palettes cycle independently in Explorers maps).
      for (const layer of scene.layers) {
        const strip = images.get(sceneBase + layer.src); if (!strip) continue;
        const total = layer.durations.reduce((a, b) => a + b, 0) * TICK;
        let t = motion.matches ? 0 : clock % total, frame = 0;
        while (frame < layer.frames - 1 && t >= layer.durations[frame] * TICK) { t -= layer.durations[frame] * TICK; frame++; }
        ctx.drawImage(strip, frame * layer.w, 0, layer.w, layer.h, layer.x, layer.y, layer.w, layer.h);
      }
      for (const actor of [...actors].sort((a, b) => a.y - b.y)) {
        const animation = sprites[actor.key].animations[actor.animation], sheet = images.get(sheetKey(actor.key, animation.src));
        if (!sheet) continue;
        const row = Math.min(actor.direction, animation.rows - 1), [ox, oy] = animation.origins[row];
        ctx.drawImage(sheet, frameAt(animation, motion.matches ? 0 : actor.elapsed) * animation.w, row * animation.h, animation.w, animation.h,
          Math.round(actor.x - ox), Math.round(actor.y - oy), animation.w, animation.h);
      }
      // The question mark: an original pixel bubble above Psyduck's head.
      const bob = motion.matches ? 0 : Math.round(Math.sin(clock / 260) * 1.5);
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
    const sources = new Set([sceneBase + scene.background, ...scene.layers.map((l) => sceneBase + l.src)]);
    for (const key of new Set(actors.map((a) => a.key)))
      for (const name of key === "shiny-psyduck" ? ["Idle", "Walk"] : ["Idle"]) sources.add(sheetKey(key, sprites[key].animations[name].src));
    Promise.all([...sources].map((src) => new Promise<void>((resolve, reject) => {
      const img = new Image(); img.onload = () => { images.set(src, img); resolve(); };
      img.onerror = () => reject(new Error(src)); img.src = src;
    }))).then(wake).catch(() => { if (!disposed) setFailed(true); });
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
    observer.observe(element);
    motion.addEventListener("change", wake); document.addEventListener("visibilitychange", wake);
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      motion.removeEventListener("change", wake); document.removeEventListener("visibilitychange", wake);
    };
  }, [catalog, sceneKey]);

  if (failed) return null;
  const scene = catalog && sceneKey ? catalog.scenes[sceneKey] : null;
  const size = scene?.size ?? [504, 432];
  return (
    <canvas
      ref={canvas}
      width={size[0]}
      height={size[1]}
      role="img"
      aria-label={`Diancie and three Carbink keep watch in ${scene?.name ?? "a glowing cave"} while a lost shiny Psyduck wanders with a question mark over its head.`}
      className="mx-auto mt-8 block h-auto w-full max-w-[560px] rounded-2xl border border-cream-200 bg-[#16222c]"
      style={{ imageRendering: "pixelated", aspectRatio: `${size[0]} / ${size[1]}` }}
    />
  );
}
