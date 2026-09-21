"use client";

import { useEffect, useRef } from "react";
import { paintSprite, SPRITES } from "@/lib/overworld-sprites";
import { constrainFlight, createFlight, stepFlight, type FlightBounds } from "@/lib/yveltal-flight";

const sprite = SPRITES.yveltal;
const HATCH_MS = sprite.animations.Special0.durations.reduce((sum, d) => sum + d * 16, 0);

export default function YveltalRoamer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spriteRef = useRef<HTMLSpanElement>(null);
  const heartRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const layer = layerRef.current!, button = buttonRef.current!, art = spriteRef.current!, heart = heartRef.current!;
    const perch = document.querySelector<HTMLElement>("[data-yveltal-perch]");
    if (!perch) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let mode: "dormant" | "hatching" | "active" = "dormant";
    let elapsed = 0, last = 0, raf = 0, greeting = 0;
    let disposed = false, loading = false, hovered = false, focused = false;
    let hatchX = 0, hatchY = 0;
    let flight = createFlight(0, 0);
    let clearGreeting: ReturnType<typeof setTimeout> | undefined;
    const viewport = () => {
      const v = window.visualViewport;
      return { left: v?.offsetLeft ?? 0, top: v?.offsetTop ?? 0,
        width: Math.min(document.documentElement.clientWidth, v?.width ?? innerWidth), height: v?.height ?? innerHeight };
    };
    const factor = () => viewport().width < 640 ? .78 : 1;
    const bounds = (): FlightBounds => {
      const v = viewport(), scale = sprite.scale * factor();
      const halfWidth = sprite.animations.Walk.w * scale / 2 + 10;
      const vertical = sprite.animations.Walk.h * scale * .8 + 10;
      return { left: v.left + halfWidth, right: v.left + Math.max(halfWidth, v.width - halfWidth),
        top: v.top + Math.min(vertical, v.height / 2), bottom: v.top + Math.max(v.height / 2, v.height - vertical) };
    };
    const label = () => {
      button.dataset.yveltalState = mode;
      button.setAttribute("aria-label", mode === "dormant" ? "Awaken Yveltal" : mode === "hatching" ? "Yveltal is awakening" : "Say hello to Yveltal");
      button.title = mode === "dormant" ? "Awaken Yveltal" : mode === "active" ? "Say hello to Yveltal" : "Yveltal is awakening";
      button.setAttribute("aria-busy", String(mode === "hatching" || loading));
    };
    label();
    const preload = (src: string) => new Promise<void>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(); image.onerror = reject; image.src = src;
    });
    const awaken = async () => {
      if (loading || mode === "hatching") return;
      if (mode === "active") {
        greeting = 1800; flight.direction = 0;
        if (statusRef.current) statusRef.current.textContent = "Yveltal sends you a heart!";
        clearTimeout(clearGreeting);
        clearGreeting = setTimeout(() => { greeting = 0; wake(); }, 1800);
        wake(); return;
      }
      loading = true; label();
      try {
        await Promise.all([preload(sprite.animations.Special0.src), preload(sprite.animations.Walk.src), preload(sprite.animations.Idle.src)]);
        if (disposed) return;
        const r = perch.getBoundingClientRect();
        hatchX = r.left + r.width / 2; hatchY = r.top;
        elapsed = 0; mode = motion.matches ? "active" : "hatching";
        flight = createFlight(hatchX, hatchY - 24);
        hovered = false;
        if (statusRef.current) statusRef.current.textContent = motion.matches ? "Yveltal is awake." : "Yveltal is awakening.";
      } catch { /* Retain the dormant cocoon if its awakening assets cannot load. */ }
      finally { loading = false; label(); wake(); }
    };
    const onClick = (e: MouseEvent) => { e.stopPropagation(); void awaken(); };
    const enter = (e: PointerEvent) => { hovered = e.pointerType !== "touch"; };
    const leave = () => { hovered = false; };
    const focus = () => { focused = button.matches(":focus-visible"); };
    const blur = () => { focused = false; };
    button.addEventListener("click", onClick); button.addEventListener("pointerenter", enter); button.addEventListener("pointerleave", leave);
    button.addEventListener("focus", focus); button.addEventListener("blur", blur);

    let obstacles: FlightBounds[] = [], untilObstacles = 0;
    function draw(now: number) {
      raf = 0;
      if (disposed || document.hidden) { last = 0; return; }
      if (last && now - last < 32) { raf = requestAnimationFrame(draw); return; }
      const dt = last ? Math.min(64, now - last) : 0; last = now;
      const modal = !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
      const r = perch!.getBoundingClientRect();
      layer.hidden = modal;
      button.hidden = mode === "dormant" && (r.top < 0 || r.top > innerHeight + 50);
      if (!modal && !button.hidden) {
        if (!motion.matches) elapsed += dt;
        greeting = Math.max(0, greeting - dt);
        let x = r.left + r.width / 2, y = r.top, direction = 0;
        let animation = "Special2";
        const size = factor(), scale = sprite.scale * size;
        if (mode === "hatching") {
          const v = viewport(), anim = sprite.animations.Special0;
          const halfWidth = anim.w * scale / 2 + 8;
          hatchX = Math.max(v.left + halfWidth, Math.min(v.left + v.width - halfWidth, hatchX));
          hatchY = Math.max(v.top + 86 * scale + 8, Math.min(v.top + v.height - 74 * scale - 8, hatchY));
          x = hatchX; y = hatchY; animation = "Special0";
          if (elapsed >= HATCH_MS || motion.matches) {
            mode = "active"; elapsed = 0; hovered = false;
            flight = createFlight(x, y - 24); label();
            if (statusRef.current) statusRef.current.textContent = "Yveltal is awake and exploring.";
          }
        }
        if (mode === "active") {
          untilObstacles -= dt;
          if (untilObstacles <= 0) {
            obstacles = [...document.querySelectorAll<HTMLElement>('a, button, input, select, textarea')].filter(e => e !== button).map(e => e.getBoundingClientRect())
              .filter(r => r.width > 0 && r.bottom > 0 && r.top < innerHeight).map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
            untilObstacles = 900;
          }
          constrainFlight(flight, bounds());
          if (!motion.matches) stepFlight(flight, dt, bounds(), hovered || focused || greeting > 0, Math.random, obstacles);
          x = flight.x; y = flight.y + 27 * size; direction = flight.direction;
          animation = "Walk";
        }
        button.style.transform = `translate3d(${Math.round(x - 22)}px,${Math.round(y - 44)}px,0)`;
        paintSprite(art, sprite, animation, motion.matches ? 0 : animation === "Special2" ? elapsed / 1.5 : elapsed, direction, 22, 44, size, animation === "Special0" ? 6 : undefined);
        button.dataset.animation = animation; button.dataset.frame = art.dataset.frame;
        heart.hidden = greeting <= 0;
        heart.style.bottom = `${54 * size + 7}px`;
      }
      if (!motion.matches) raf = requestAnimationFrame(draw);
    }
    function wake() { if (!raf && !disposed && !document.hidden) { last = 0; raf = requestAnimationFrame(draw); } }
    const visible = () => { last = 0; wake(); };
    const observer = new ResizeObserver(wake); observer.observe(perch); observer.observe(document.body);
    const mutations = new MutationObserver(wake);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "aria-modal"] });
    window.addEventListener("resize", wake); window.addEventListener("scroll", wake, { passive: true });
    window.visualViewport?.addEventListener("resize", wake); window.visualViewport?.addEventListener("scroll", wake);
    document.addEventListener("visibilitychange", visible); motion.addEventListener("change", visible);
    wake();
    return () => {
      disposed = true; cancelAnimationFrame(raf); clearTimeout(clearGreeting); observer.disconnect(); mutations.disconnect();
      button.removeEventListener("click", onClick); button.removeEventListener("pointerenter", enter); button.removeEventListener("pointerleave", leave);
      button.removeEventListener("focus", focus); button.removeEventListener("blur", blur);
      window.removeEventListener("resize", wake); window.removeEventListener("scroll", wake);
      window.visualViewport?.removeEventListener("resize", wake); window.visualViewport?.removeEventListener("scroll", wake);
      document.removeEventListener("visibilitychange", visible); motion.removeEventListener("change", visible);
    };
  }, []);
  return <>
    <div ref={layerRef} className="yveltal-layer">
      <button ref={buttonRef} type="button" className="overworld-resident" aria-label="Awaken Yveltal">
        <span ref={spriteRef} className="overworld-sprite" aria-hidden="true" />
        <span ref={heartRef} className="overworld-heart" hidden aria-hidden="true" />
      </button>
    </div>
    <span ref={statusRef} className="sr-only" role="status" />
  </>;
}
