"use client";

import { useEffect, useRef } from "react";
import spriteData from "@/data/overworld-sprites.json";
import { animationFrame, createOverworld, SILVALLY_FORMS, shuffle, stepOverworld } from "@/lib/pokemon-overworld";

type Animation = { src: string; w: number; h: number; rows: number; durations: number[]; bounds: number[][] };
type Sprite = { flying: boolean; scale: number; feet: number[]; animations: Record<string, Animation> };
const SPRITES: Record<string, Sprite> = spriteData;
const COLORS: Record<string, string> = {
  bug: "#94aa35", dark: "#6c5871", dragon: "#7860bc", electric: "#dcb83e", fairy: "#d08aaf",
  fighting: "#ba7551", fire: "#d78848", flying: "#91aad0", ghost: "#8c73b2", grass: "#78a65b",
  ground: "#ba9b62", ice: "#91c9d1", poison: "#ab78b3", psychic: "#d57c99", rock: "#a79664",
  steel: "#98a7b1", water: "#6b9dc6",
};

/** Frame sheets keep their original origin; feet stay planted across animations. */
function paint(el: HTMLElement, sprite: Sprite, name: string, elapsed: number, direction: number, x: number, y: number, scaleFactor = 1) {
  const anim = sprite.animations[name] ?? sprite.animations.Walk;
  const row = anim.rows === 1 ? 0 : direction;
  const loop = !["Attack", "Shoot", "Hurt", "RearUp", "Double"].includes(name);
  const frame = animationFrame(anim.durations, elapsed, loop);
  const scale = sprite.scale * scaleFactor;
  el.style.width = `${anim.w * scale}px`;
  el.style.height = `${anim.h * scale}px`;
  el.style.backgroundImage = `url("${anim.src}")`;
  el.style.backgroundSize = `${anim.w * anim.durations.length * scale}px ${anim.h * anim.rows * scale}px`;
  el.style.backgroundPosition = `${-frame * anim.w * scale}px ${-row * anim.h * scale}px`;
  el.style.transform = `translate3d(${Math.round(x - anim.w / 2 * scale)}px,${Math.round(y - (anim.h / 2 + sprite.feet[row]) * scale)}px,0)`;
  el.dataset.animation = name;
  el.dataset.frame = String(frame);
  el.dataset.direction = String(row);
}

export default function PokemonOverworld() {
  const layerRef = useRef<HTMLDivElement>(null);
  const silvallyRef = useRef<HTMLButtonElement>(null);
  const silvallySpriteRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const button = silvallyRef.current;
    const silvally = silvallySpriteRef.current;
    if (!layer || !button || !silvally) return;
    let disposed = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elements = new Map<string, HTMLElement>();
    document.querySelectorAll<HTMLElement>("[data-overworld-surface]").forEach((el, i) => {
      elements.set(el.dataset.overworldSurface || `platform-${i}`, el);
    });
    const surfaces = [...elements].map(([id, el]) => ({ id, width: el.getBoundingClientRect().width,
      divider: el.dataset.overworldKind === "divider" }));
    const world = createOverworld(surfaces);
    const nodes = new Map(world.residents.map(actor => {
      const node = document.createElement("span");
      node.className = "overworld-sprite";
      node.dataset.pokemon = actor.species;
      node.dataset.surface = actor.surface;
      node.dataset.flying = String(actor.flying);
      layer.appendChild(node);
      return [actor.id, node];
    }));
    // Establish separated battle poses even when reduced motion starts enabled.
    stepOverworld(world, 0, new Map(surfaces.map(s => [s.id, s.width])));

    const images = new Map<string, Promise<void>>();
    function preload(src: string) {
      if (!images.has(src)) {
        images.set(src, new Promise<void>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => { images.delete(src); reject(new Error(`Sprite could not load: ${src}`)); };
          image.src = src;
        }));
      }
      return images.get(src)!;
    }
    let formBag = shuffle(SILVALLY_FORMS);
    let form = formBag.pop()!;
    let nextForm = formBag.pop()!;
    let idleElapsed = 0;
    let nextChange = 18000 + Math.random() * 8000;
    let transition: { elapsed: number; duration: number; animation: string; target: string; switched: boolean; user: boolean } | null = null;
    let loading = false;
    let focused = false;
    let last = 0;
    let raf = 0;
    let dirty = true;
    let lastModalCheck = 0;
    let modal = false;

    const warmNextForm = () => {
      const sprite = SPRITES[`silvally-${nextForm}`];
      void Promise.all(["Idle", "RearUp", "Double"].map(name => preload(sprite.animations[name].src))).catch(() => {});
    };
    const label = () => {
      button.dataset.form = form;
      button.setAttribute("aria-label", `Silvally, ${form} form. Change form`);
      button.title = `Silvally · ${form[0].toUpperCase() + form.slice(1)} — click to change form`;
      button.style.setProperty("--silvally-color", COLORS[form]);
    };
    label();
    warmNextForm();

    const changeForm = async (user = false) => {
      if (transition || loading || disposed) return;
      loading = true;
      const target = nextForm;
      const animation = Math.random() < .5 ? "RearUp" : "Double";
      try {
        await Promise.all([preload(SPRITES[`silvally-${form}`].animations[animation].src),
          preload(SPRITES[`silvally-${target}`].animations[animation].src),
          preload(SPRITES[`silvally-${target}`].animations.Idle.src)]);
        if (disposed) return;
        if (motion.matches) {
          form = target;
          label();
          if (user && statusRef.current) statusRef.current.textContent = `Silvally changed to ${form} form.`;
          pickNext();
        } else {
          const duration = SPRITES[`silvally-${form}`].animations[animation].durations.reduce((s, d) => s + d * 16, 0);
          transition = { elapsed: 0, duration, animation, target, switched: false, user };
          button.dataset.changing = "true";
        }
        dirty = true;
        wake();
      } catch {
        // Keep the current form if an asset fails, and retry on the next interaction.
        nextChange = 18000;
      } finally { loading = false; }
    };
    function pickNext() {
      if (!formBag.length) formBag = shuffle(SILVALLY_FORMS.filter(f => f !== form));
      nextForm = formBag.pop()!;
      nextChange = 18000 + Math.random() * 8000;
      warmNextForm();
    }
    const onClick = () => { void changeForm(true); };
    const onFocus = () => { focused = button.matches(":focus-visible"); };
    const onBlur = () => { focused = false; };
    button.addEventListener("click", onClick);
    button.addEventListener("focus", onFocus);
    button.addEventListener("blur", onBlur);

    function draw(now: number) {
      raf = 0;
      if (disposed || document.hidden) { last = 0; return; }
      // 30fps is ample for 16ms-tick pixel animations; no React renders per frame.
      if (!dirty && now - last < 32) { raf = requestAnimationFrame(draw); return; }
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (dirty || now - lastModalCheck > 150) {
        modal = !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
        lastModalCheck = now;
      }
      dirty = false;
      layer!.hidden = modal;
      button!.hidden = modal;
      if (!modal) {
        // Batch layout reads before any writes, so transforms/hover/resizes remain aligned.
        const rects = new Map([...elements].map(([id, el]) => [id, el.getBoundingClientRect()]));
        const visible = new Map([...rects].filter(([, r]) => r.top > -100 && r.top < window.innerHeight + 150 && r.width > 0)
          .map(([id, r]) => [id, r.width]));
        if (!motion.matches) stepOverworld(world, dt, visible);
        // Re-clamp battle poses to responsive surface widths even while motion is paused.
        else stepOverworld(world, 0, visible);
        for (const actor of world.residents) {
          const node = nodes.get(actor.id)!;
          const rect = rects.get(actor.surface)!;
          const shown = visible.has(actor.surface);
          node.hidden = !shown;
          if (!shown) continue;
          const x = rect.left + 40 + actor.progress * Math.max(1, rect.width - 80);
          const bob = actor.flying ? -52 + Math.sin(actor.elapsed / 900 + actor.speed) * 12 : 0;
          const name = motion.matches ? (actor.flying ? "Hover" : "Idle") : actor.animation;
          const sprite = SPRITES[actor.species];
          if (actor.species === "armarouge" || actor.species === "ceruledge") {
            for (const key of ["Walk", "Idle", "Shoot", "Attack", "Hurt"]) void preload(sprite.animations[key].src).catch(() => {});
          }
          // Load only the animations of nearby residents (never all imported sheets).
          const anim = sprite.animations[name] ?? sprite.animations.Walk;
          void preload(anim.src).catch(() => {});
          paint(node, sprite, name, motion.matches ? 0 : actor.elapsed, actor.direction, x, rect.top + bob);
          if (actor.species === "armarouge" || actor.species === "ceruledge") node.dataset.battlePhase = world.battle?.phase;
        }
        if (!motion.matches) {
          idleElapsed += dt;
          if (!focused && !transition) {
            nextChange -= dt;
            if (nextChange <= 0) void changeForm();
          }
        }
        if (transition) {
          transition.elapsed += dt;
          if (!transition.switched && (transition.elapsed >= transition.duration * .48 || motion.matches)) {
            form = transition.target;
            transition.switched = true;
            label();
            if (transition.user && statusRef.current) statusRef.current.textContent = `Silvally changed to ${form} form.`;
          }
          if (transition.elapsed >= transition.duration || motion.matches) {
            transition = null;
            button!.dataset.changing = "false";
            idleElapsed = 0;
            pickNext();
          }
        }
        const sprite = SPRITES[`silvally-${form}`];
        paint(silvally!, sprite, transition?.animation ?? "Idle", transition?.elapsed ?? (motion.matches ? 0 : idleElapsed), 2, 55, 73);
      }
      // In reduced motion, observers/events trigger renders; no perpetual RAF loop.
      if (!motion.matches) raf = requestAnimationFrame(draw);
    }
    function wake() {
      dirty = true;
      if (!raf && !document.hidden && !disposed) raf = requestAnimationFrame(draw);
    }
    const visibility = () => { last = 0; wake(); };
    const resizeObserver = new ResizeObserver(wake);
    resizeObserver.observe(document.body);
    for (const el of elements.values()) resizeObserver.observe(el);
    // Detect modal opening/closing even when reduced motion has no RAF running.
    const mutations = new MutationObserver(wake);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "aria-modal"] });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    motion.addEventListener("change", wake);
    document.fonts.ready.then(() => { if (!disposed) wake(); });
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", wake);
      button.removeEventListener("click", onClick);
      button.removeEventListener("focus", onFocus);
      button.removeEventListener("blur", onBlur);
      nodes.forEach(node => node.remove());
    };
  }, []);

  return (
    <>
      <div ref={layerRef} className="pokemon-overworld" aria-hidden="true" />
      <button ref={silvallyRef} type="button" className="silvally-resident" aria-label="Silvally. Change form">
        <span className="silvally-aura" aria-hidden="true" />
        <span ref={silvallySpriteRef} className="overworld-sprite" aria-hidden="true" />
      </button>
      <span ref={statusRef} className="sr-only" role="status" aria-live="polite" />
    </>
  );
}
