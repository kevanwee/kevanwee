"use client";

import { useEffect, useRef } from "react";
import spriteData from "@/data/overworld-sprites.json";
import { animationFrame, createOverworld, createWanderer, greetResident, SILVALLY_FORMS, shuffle, stepOverworld, stepWanderer } from "@/lib/pokemon-overworld";

type Animation = { src: string; w: number; h: number; rows: number; durations: number[]; bounds: number[][] };
type Sprite = { flying: boolean; flightTempo: number; scale: number; feet: number[]; animations: Record<string, Animation> };
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
  const frame = animationFrame(anim.durations, elapsed / (sprite.flying && name === "Walk" ? sprite.flightTempo : 1), loop);
  const scale = sprite.scale * scaleFactor;
  el.style.width = `${anim.w * scale}px`;
  el.style.height = `${anim.h * scale}px`;
  el.style.backgroundImage = `url("${anim.src}")`;
  el.style.backgroundSize = `${anim.w * anim.durations.length * scale}px ${anim.h * anim.rows * scale}px`;
  el.style.backgroundPosition = `${-frame * anim.w * scale}px ${-row * anim.h * scale}px`;
  const foot = name === "Sleep" ? anim.bounds[row][3] : anim.h / 2 + sprite.feet[row];
  el.style.transform = `translate3d(${Math.round(x - anim.w / 2 * scale)}px,${Math.round(y - foot * scale)}px,0)`;
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
      divider: el.dataset.overworldKind === "divider", kind: el.dataset.overworldKind }));
    const world = createOverworld(surfaces);
    const wanderer = createWanderer();
    const habitat = document.querySelector<HTMLElement>("[data-silvally-habitat]");
    const reactionTimers = new Map<string, ReturnType<typeof setTimeout>>();
    const nodes = new Map(world.residents.map(actor => {
      const interactive = !["armarouge", "ceruledge"].includes(actor.species);
      const node: HTMLElement = document.createElement(interactive ? "button" : "span");
      node.className = interactive ? "overworld-resident" : "overworld-resident overworld-battler";
      node.dataset.pokemon = actor.species;
      node.dataset.surface = actor.surface;
      node.dataset.flying = String(actor.flying);
      const sprite = document.createElement("span");
      sprite.className = "overworld-sprite";
      sprite.setAttribute("aria-hidden", "true");
      const heart = document.createElement("span");
      heart.className = "overworld-heart";
      heart.setAttribute("aria-hidden", "true");
      heart.hidden = true;
      node.append(sprite, heart);
      if (interactive) {
        (node as HTMLButtonElement).type = "button";
        const name = actor.species[0].toUpperCase() + actor.species.slice(1);
        node.setAttribute("aria-label", `Say hello to ${name}`);
        node.title = `Say hello to ${name}`;
        let pointer = false, keyboard = false;
        const hold = () => { actor.held = pointer || keyboard; wake(); };
        node.addEventListener("pointerenter", event => { pointer = event.pointerType !== "touch"; hold(); });
        node.addEventListener("pointerleave", () => { pointer = false; hold(); });
        node.addEventListener("focus", () => { keyboard = node.matches(":focus-visible"); hold(); });
        node.addEventListener("blur", () => { keyboard = false; hold(); });
        node.addEventListener("click", event => {
          event.stopPropagation();
          greetResident(actor);
          actor.untilNap = 25000 + Math.random() * 50000;
          if (statusRef.current) statusRef.current.textContent = `${name} sends you a heart!`;
          clearTimeout(reactionTimers.get(actor.id));
          reactionTimers.set(actor.id, setTimeout(() => {
            actor.reaction = 0; reactionTimers.delete(actor.id); wake();
          }, 1800));
          wake();
        });
      } else node.setAttribute("aria-hidden", "true");
      layer.appendChild(node);
      return [actor.id, { node, sprite, heart }];
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
    let nextChange = 18000 + Math.random() * 8000;
    let transition: { elapsed: number; duration: number; animation: string; target: string; switched: boolean; user: boolean } | null = null;
    let loading = false;
    let focused = false;
    let hovered = false;
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
        wanderer.nap = false; wanderer.untilNap = 30000 + Math.random() * 60000;
        wanderer.animation = "Idle"; wanderer.elapsed = 0; wanderer.wait = 1500;
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
    const onEnter = (event: PointerEvent) => { hovered = event.pointerType !== "touch"; };
    const onLeave = () => { hovered = false; };
    button.addEventListener("click", onClick);
    button.addEventListener("focus", onFocus);
    button.addEventListener("blur", onBlur);
    button.addEventListener("pointerenter", onEnter);
    button.addEventListener("pointerleave", onLeave);

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
        const area = habitat?.getBoundingClientRect();
        const visible = new Map([...rects].filter(([, r]) => r.top > -100 && r.top < window.innerHeight + 150 && r.width > 0)
          .map(([id, r]) => [id, r.width]));
        if (!motion.matches) stepOverworld(world, dt, visible);
        // Re-clamp battle poses to responsive surface widths even while motion is paused.
        else stepOverworld(world, 0, visible);
        for (const actor of world.residents) {
          const { node, sprite: spriteNode, heart } = nodes.get(actor.id)!;
          const rect = rects.get(actor.surface)!;
          const shown = visible.has(actor.surface);
          node.hidden = !shown;
          if (!shown) continue;
          const x = rect.left + 40 + actor.progress * Math.max(1, rect.width - 80);
          const bob = actor.flying ? -actor.altitude : 0;
          const name = motion.matches ? (actor.nap && actor.altitude === 0 ? "Sleep" : actor.flying && actor.altitude > 0 ? "Walk" : "Idle") : actor.animation;
          const sprite = SPRITES[actor.species];
          if (actor.species === "armarouge" || actor.species === "ceruledge") {
            for (const key of ["Walk", "Idle", "Shoot", "Attack", "Hurt"]) void preload(sprite.animations[key].src).catch(() => {});
          }
          // Load only the animations of nearby residents (never all imported sheets).
          const anim = sprite.animations[name] ?? sprite.animations.Walk;
          void preload(anim.src).catch(() => {});
          node.style.transform = `translate3d(${Math.round(x - 22)}px,${Math.round(rect.top + bob - 44)}px,0)`;
          paint(spriteNode, sprite, name, motion.matches ? 0 : actor.elapsed, actor.direction, 22, 44);
          for (const key of ["animation", "frame", "direction"]) node.dataset[key] = spriteNode.dataset[key];
          node.dataset.sleeping = String(name === "Sleep");
          node.dataset.reacting = String(actor.reaction > 0);
          heart.hidden = actor.reaction <= 0;
          const bounds = anim.bounds[anim.rows === 1 ? 0 : actor.direction];
          heart.style.bottom = `${Math.max(28, (bounds[3] - bounds[1]) * sprite.scale + 4)}px`;
          if (actor.species === "armarouge" || actor.species === "ceruledge") node.dataset.battlePhase = world.battle?.phase;
        }
        const silvallyVisible = !!area && area.bottom > 0 && area.top < window.innerHeight;
        button!.hidden = !silvallyVisible;
        if (!motion.matches && silvallyVisible) {
          if (!focused && !hovered && !transition) stepWanderer(wanderer, dt, Math.max(1, area!.width - 44), Math.max(1, area!.height - 64));
          if (!focused && !hovered && !transition && !wanderer.nap) {
            nextChange -= dt;
            if (nextChange <= 0) void changeForm();
          }
        }
        if (transition && silvallyVisible) {
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
            wanderer.elapsed = 0;
            pickNext();
          }
        }
        const sprite = SPRITES[`silvally-${form}`];
        if (area && silvallyVisible) {
          const x = area.left + 22 + wanderer.x * Math.max(1, area.width - 44);
          const y = area.top + 60 + wanderer.y * Math.max(1, area.height - 64);
          button!.style.transform = `translate3d(${Math.round(x - 28)}px,${Math.round(y - 64)}px,0)`;
          const name = transition?.animation ?? (motion.matches || focused || hovered ? (wanderer.nap ? "Sleep" : "Idle") : wanderer.animation);
          paint(silvally!, sprite, name, transition?.elapsed ?? (motion.matches ? 0 : wanderer.elapsed), wanderer.direction, 28, 64);
          button!.dataset.direction = String(wanderer.direction);
          button!.dataset.animation = name;
        }
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
    if (habitat) resizeObserver.observe(habitat);
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
      button.removeEventListener("pointerenter", onEnter);
      button.removeEventListener("pointerleave", onLeave);
      reactionTimers.forEach(timer => clearTimeout(timer));
      nodes.forEach(({ node }) => node.remove());
    };
  }, []);

  return (
    <>
      <div ref={layerRef} className="pokemon-overworld" role="group" aria-label="Roaming Pokémon" />
      <button ref={silvallyRef} type="button" className="silvally-resident" hidden aria-label="Silvally. Change form">
        <span className="silvally-aura" aria-hidden="true" />
        <span ref={silvallySpriteRef} className="overworld-sprite" aria-hidden="true" />
      </button>
      <span ref={statusRef} className="sr-only" role="status" aria-live="polite" />
    </>
  );
}
