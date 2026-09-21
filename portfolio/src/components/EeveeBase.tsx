"use client";

import { useEffect, useRef } from "react";
import { EEVEELUTIONS, displayName } from "@/lib/pokemon-overworld";
import { createForest, greetForest, stepForest, FOREST_WIDTH } from "@/lib/eevee-base";
import { paintSprite, preloadSpriteSheet, SPRITES } from "@/lib/overworld-sprites";

export default function EeveeBase() {
  const habitat = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = habitat.current!, stone = root.querySelector<HTMLElement>('[data-forest-stone]')!;
    const actors = createForest(), motion = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, last = 0, elapsed = 0, visible = false, disposed = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const nodes = actors.map(actor => {
      const button = root.querySelector<HTMLButtonElement>(`[data-forest-pokemon="${actor.species}"]`)!;
      const art = button.querySelector<HTMLElement>('.overworld-sprite')!, heart = button.querySelector<HTMLElement>('.overworld-heart')!;
      const enter = (e: PointerEvent) => { actor.held = e.pointerType !== 'touch'; wake(); };
      const leave = () => { actor.held = false; wake(); };
      const focus = () => { actor.held = button.matches(':focus-visible'); wake(); };
      const greet = () => {
        greetForest(actor); if (status.current) status.current.textContent = `${displayName(actor.species)} sends you a heart!`;
        const timer = setTimeout(() => { actor.reaction = 0; timers.delete(timer); wake(); }, 1800); timers.add(timer); wake();
      };
      button.addEventListener('click', greet); button.addEventListener('pointerenter', enter); button.addEventListener('pointerleave', leave);
      button.addEventListener('focus', focus); button.addEventListener('blur', leave);
      return {button, art, heart, cleanup: () => {
        button.removeEventListener('click', greet); button.removeEventListener('pointerenter', enter); button.removeEventListener('pointerleave', leave);
        button.removeEventListener('focus', focus); button.removeEventListener('blur', leave);
      }};
    });
    function draw(now: number) {
      raf = 0;
      if (disposed || document.hidden || !visible) { last = 0; return; }
      if (last && now - last < 32) { raf = requestAnimationFrame(draw); return; }
      const dt = last ? Math.min(64, now - last) : 0; last = now;
      const modal = !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
      const scale = root.clientWidth / FOREST_WIDTH;
      if (!motion.matches && !modal) { elapsed += dt; stepForest(actors, dt); }
      const frame = motion.matches ? 9 : Math.floor(elapsed / 120) % 32;
      stone.style.width = `${54 * scale}px`; stone.style.height = `${39 * scale}px`;
      stone.style.left = `${209 * scale}px`; stone.style.top = `${177 * scale}px`;
      stone.style.backgroundSize = `${54 * 32 * scale}px ${39 * scale}px`;
      stone.style.backgroundPosition = `${-frame * 54 * scale}px 0`;
      stone.dataset.frame = String(frame);
      actors.forEach((actor, i) => {
        const {button, art, heart} = nodes[i], sprite = SPRITES[actor.species];
        for (const name of ['Walk', 'Idle', 'Sleep']) void preloadSpriteSheet(sprite.animations[name].src).catch(() => {});
        button.style.transform = `translate3d(${actor.x * scale - 22}px,${actor.y * scale - 44}px,0)`;
        button.style.zIndex = String(Math.round(actor.y));
        paintSprite(art, sprite, actor.animation, motion.matches ? 0 : actor.elapsed, actor.direction, 22, 44, scale * .85);
        button.dataset.x = actor.x.toFixed(2); button.dataset.y = actor.y.toFixed(2); button.dataset.animation = actor.animation;
        heart.hidden = actor.reaction <= 0; heart.style.bottom = `${30 * scale + 5}px`;
      });
      if (!motion.matches && !modal) raf = requestAnimationFrame(draw);
    }
    function wake() { if (!raf && !disposed && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(draw); } }
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }); intersection.observe(root);
    const resize = new ResizeObserver(wake); resize.observe(root);
    const mutations = new MutationObserver(wake); mutations.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'aria-modal']});
    motion.addEventListener('change', wake); document.addEventListener('visibilitychange', wake);
    return () => { disposed = true; cancelAnimationFrame(raf); intersection.disconnect(); resize.disconnect(); mutations.disconnect();
      nodes.forEach(n => n.cleanup()); timers.forEach(clearTimeout); motion.removeEventListener('change', wake); document.removeEventListener('visibilitychange', wake); };
  }, []);
  // The section above owns a full section gap, which it earns because the next section
  // opens with a rule. This has no rule, so it pulls up to the panel's own 64px rhythm.
  return <figure className="-mt-8 mb-24 lg:-mt-20 lg:mb-36" aria-label="Eevee and friends in Transform Forest">
    <div ref={habitat} data-eevee-base className="relative isolate w-full overflow-hidden rounded-2xl border border-cream-200"
      style={{aspectRatio: '480 / 312', background: 'url(/eevee-base/background.png) center / 100% 100%', imageRendering: 'pixelated'}}>
      <span data-forest-stone aria-hidden="true" className="absolute pointer-events-none" style={{backgroundImage: 'url(/eevee-base/stone-frames.png)', backgroundRepeat: 'no-repeat'}} />
      {EEVEELUTIONS.map(species => <button key={species} data-forest-pokemon={species} className="overworld-resident" type="button" aria-label={`Say hello to ${displayName(species)}`}>
        <span className="overworld-sprite" aria-hidden="true" /><span className="overworld-heart" hidden aria-hidden="true" />
      </button>)}
    </div>
    <span ref={status} className="sr-only" role="status" />
  </figure>;
}
