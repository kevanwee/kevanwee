"use client";

import { useEffect, useRef } from "react";
import { paintSprite, SPRITES } from "@/lib/overworld-sprites";
import { clearFlightPath, createFlight, settleFlight, stepFlight, type FlightBounds } from "@/lib/yveltal-flight";
import { directionFromMotion } from "@/lib/pokemon-overworld";

const sprite = SPRITES.yveltal;
const HATCH_MS = sprite.animations.Special0.durations.reduce((sum, d) => sum + d * 16, 0);
// Tailwind's lg breakpoint. Below it the two columns stack and no blank corridor
// survives, so he keeps his ledge instead of squeezing between the controls.
const FLIGHT_WIDTH = 1024;
const SOLID = "a,button,input,select,textarea,summary,img,svg,canvas,video,iframe,hr";

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
    let mode: "dormant" | "hatching" | "active" | "perched" = "dormant";
    let elapsed = 0, last = 0, raf = 0, greeting = 0;
    let disposed = false, loading = false, hovered = false, focused = false;
    let flight = createFlight(0, 0);
    let launch: {fromX: number; fromY: number; toX: number; toY: number; elapsed: number; duration: number} | undefined;
    let clearGreeting: ReturnType<typeof setTimeout> | undefined;
    const viewport = () => {
      const v = window.visualViewport;
      return { left: v?.offsetLeft ?? 0, top: v?.offsetTop ?? 0,
        width: Math.min(document.documentElement.clientWidth, v?.width ?? innerWidth), height: v?.height ?? innerHeight };
    };
    const factor = () => viewport().width < 640 ? .78 : 1;
    const canFly = () => document.documentElement.clientWidth >= FLIGHT_WIDTH;
    const footprint = () => {
      const size = factor(), scale = sprite.scale * size, anim = sprite.animations.Walk;
      const boxes = anim.bounds.map((b, row) => ({left: (b[0] - anim.w / 2) * scale,
        right: (b[2] - anim.w / 2) * scale, top: 27 * size + (b[1] - anim.h / 2 - sprite.feet[row]) * scale,
        bottom: 27 * size + (b[3] - anim.h / 2 - sprite.feet[row]) * scale}));
      return {left: Math.min(-22, ...boxes.map(b => b.left)) - 6, right: Math.max(22, ...boxes.map(b => b.right)) + 6,
        top: Math.min(27 * size - 44, ...boxes.map(b => b.top)) - 6, bottom: Math.max(27 * size, ...boxes.map(b => b.bottom)) + 6};
    };
    // The whole page is his habitat: he holds a document position and keeps flying
    // wherever the layout leaves blank space, rather than orbiting the viewport.
    const bounds = (): FlightBounds => {
      const body = footprint(), width = document.documentElement.clientWidth;
      const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      return { left: -body.left, right: Math.max(-body.left, width - body.right),
        top: -body.top, bottom: Math.max(-body.top, height - body.bottom) };
    };
    const label = () => {
      button.dataset.yveltalState = mode;
      button.setAttribute("aria-label", mode === "dormant" ? "Awaken Yveltal" : mode === "hatching" ? "Yveltal is awakening" : "Say hello to Yveltal");
      button.title = mode === "dormant" ? "Awaken Yveltal" : mode === "hatching" ? "Yveltal is awakening" : "Say hello to Yveltal";
      button.setAttribute("aria-busy", String(mode === "hatching" || loading));
    };
    label();
    const preload = (src: string) => new Promise<void>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(); image.onerror = reject; image.src = src;
    });
    const awaken = async () => {
      if (loading || mode === "hatching") return;
      if (mode === "active" || mode === "perched") {
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
        elapsed = 0; mode = motion.matches ? (canFly() ? "active" : "perched") : "hatching";
        flight = createFlight(r.left + r.width / 2 + scrollX, r.top + scrollY - 24);
        launch = undefined;
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

    let obstacles: FlightBounds[] = [], nearby: FlightBounds[] = [], nearX = NaN, nearY = NaN;
    let untilObstacles = 0, geometryDirty = true;
    const inked = (style: CSSStyleDeclaration) =>
      style.backgroundImage !== "none" || style.boxShadow !== "none" ||
      !(style.backgroundColor === "transparent" || /,\s*0\)$/.test(style.backgroundColor)) ||
      ["top", "right", "bottom", "left"].some(side => style.getPropertyValue(`border-${side}-style`) !== "none"
        && parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0);
    function measureObstacles() {
      const body = footprint(), boxes: FlightBounds[] = [], travelled = new Map<Element, {top: number; bottom: number}>();
      // A sticky column repaints at a fresh document offset on every scroll. Reserving
      // the whole travel of its containing block instead keeps the map scroll-invariant,
      // so the panel can never shepherd him down the page as the reader moves.
      const travel = (el: Element) => {
        for (let node: Element | null = el; node; node = node.parentElement) {
          const position = getComputedStyle(node).position;
          if (position !== "sticky" && position !== "fixed") continue;
          let range = travelled.get(node);
          if (!range) {
            const scope = position === "fixed" ? document.documentElement : node.parentElement ?? document.documentElement;
            const r = scope.getBoundingClientRect();
            range = {top: r.top + scrollY, bottom: r.bottom + scrollY};
            travelled.set(node, range);
          }
          return range;
        }
        return undefined;
      };
      const add = (left: number, top: number, right: number, bottom: number, range?: {top: number; bottom: number}) => {
        if (right <= left || bottom <= top) return;
        boxes.push({left: left + scrollX - body.right, right: right + scrollX - body.left,
          top: (range ? Math.min(range.top, top + scrollY) : top + scrollY) - body.bottom,
          bottom: (range ? Math.max(range.bottom, bottom + scrollY) : bottom + scrollY) - body.top});
      };
      for (const root of document.querySelectorAll("#teddiursa-panel, main")) {
        for (const el of root.querySelectorAll<HTMLElement>("*")) {
          if (el.hidden || el.closest("script, style, .sr-only")) continue;
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.display === "none") continue;
          const range = travel(el);
          if (el.matches(SOLID) || inked(style)) {
            const r = el.getBoundingClientRect();
            add(r.left, r.top, r.right, r.bottom, range);
            continue;
          }
          // The inked box of a text block, not its individual line rectangles: threading
          // between the lines of a heading still reads as flying over that heading.
          let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
          for (const node of el.childNodes) {
            if (node.nodeType !== 3 || !node.textContent?.trim()) continue;
            const text = document.createRange(); text.selectNodeContents(node);
            for (const r of text.getClientRects()) {
              if (r.width <= 0 || r.height <= 0) continue;
              left = Math.min(left, r.left); top = Math.min(top, r.top);
              right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
            }
          }
          add(left, top, right, bottom, range);
        }
      }
      obstacles = boxes; nearX = nearY = NaN;
      geometryDirty = false; untilObstacles = 1000;
    }
    /** Collision tests run every frame; only the boxes he could reach next matter. */
    const around = (x: number, y: number) => {
      if (!(Math.abs(x - nearX) < 200 && Math.abs(y - nearY) < 200)) {
        nearX = x; nearY = y;
        nearby = obstacles.filter(o => o.right > x - 1100 && o.left < x + 1100 && o.bottom > y - 1100 && o.top < y + 1100);
      }
      return nearby;
    };
    /** The shell sits inside the panel, so part of any take-off has to cross it.
     *  Cast rays out of it and leave through the shortest crossing that exists,
     *  preferring the one with the most open air beyond it. */
    function escapeRoute(area: FlightBounds, boxes: FlightBounds[]) {
      const free = (x: number, y: number) => clearFlightPath(x, y, x, y, boxes);
      let best: {x: number; y: number; crossing: number; room: number} | undefined;
      for (let step = 0; step < 32; step++) {
        const angle = step / 32 * Math.PI * 2, dx = Math.cos(angle), dy = Math.sin(angle);
        for (let reach = 8; reach <= 420; reach += 8) {
          const x = flight.x + dx * reach, y = flight.y + dy * reach;
          if (x < area.left || x > area.right || y < area.top || y > area.bottom) break;
          if (!free(x, y)) continue;
          let room = 0;
          while (room < 120 && free(x + dx * (room + 8), y + dy * (room + 8))) room += 8;
          if (!best || reach < best.crossing - 12 || (reach < best.crossing + 12 && room > best.room)) best = {x, y, crossing: reach, room};
          break;
        }
      }
      return best;
    }
    /** Emerging inside that column would otherwise snap him clear in a single frame. */
    function takeOff() {
      measureObstacles();
      const exit = escapeRoute(bounds(), around(flight.x, flight.y));
      if (!exit) return;
      const dx = exit.x - flight.x, dy = exit.y - flight.y, crossing = Math.hypot(dx, dy) || 1;
      // Carry on a little past the threshold so he lands in open air, not on its edge.
      const beyond = Math.min(exit.room, 40), span = crossing + beyond;
      launch = {fromX: flight.x, fromY: flight.y,
        toX: exit.x + dx / crossing * beyond, toY: exit.y + dy / crossing * beyond,
        elapsed: 0, duration: Math.max(260, Math.min(760, span / .34))};
    }
    function draw(now: number) {
      raf = 0;
      if (disposed || document.hidden) { last = 0; return; }
      // Dormant, hatching and perched all follow a live element rect on a sticky panel,
      // so a skipped frame strands the sprite a whole scroll tick away from its ledge.
      if (mode === "active" && !launch && last && now - last < 32) { raf = requestAnimationFrame(draw); return; }
      const dt = last ? Math.min(64, now - last) : 0; last = now;
      const modal = !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
      const r = perch!.getBoundingClientRect();
      layer.hidden = modal;
      if (mode === "active" && !canFly()) { mode = "perched"; launch = undefined; label(); }
      else if (mode === "perched" && canFly()) { mode = "active"; flight = createFlight(r.left + r.width / 2 + scrollX, r.top + scrollY - 24); label(); }
      // He lives on the page, not on the screen, so the simulation runs whether or not
      // he is in view and only the paint is skipped. Scroll back and he has moved on.
      if (!modal) {
        if (!motion.matches) elapsed += dt;
        greeting = Math.max(0, greeting - dt);
        let x = r.left + r.width / 2 + scrollX, y = r.top + scrollY, direction = 0;
        let animation = "Special2";
        const size = factor(), scale = sprite.scale * size;
        if (mode === "hatching") {
          // The ledge is sticky. Pinning the shell to the document point it occupied at
          // the click leaves the whole hatch behind the moment the reader scrolls, so
          // track the ledge live exactly as the dormant egg does.
          const anim = sprite.animations.Special0;
          const halfWidth = anim.w * scale / 2 + 8;
          x = Math.max(halfWidth, Math.min(document.documentElement.clientWidth - halfWidth, r.left + r.width / 2)) + scrollX;
          y = r.top + scrollY; animation = "Special0";
          if (elapsed >= HATCH_MS || motion.matches) {
            mode = canFly() ? "active" : "perched"; elapsed = 0; hovered = false;
            flight = createFlight(x, y - 24); label();
            if (mode === "active" && !motion.matches) takeOff();
            if (statusRef.current) statusRef.current.textContent = mode === "active" ? "Yveltal is awake and exploring." : "Yveltal is awake on his ledge.";
          }
        }
        if (mode === "perched") animation = "Idle";
        let room = true;
        if (mode === "active") {
          untilObstacles -= dt;
          if (geometryDirty || untilObstacles <= 0) measureObstacles();
          // Reflow can consume an old clear spot. Relocate to nearby whitespace;
          // if none remains, hide until there is room instead of covering content.
          if (launch) {
            launch.elapsed = Math.min(launch.duration, launch.elapsed + dt);
            // Out of the shell fast, easing only into the landing. A symmetric curve
            // spends its slowest moments exactly where he is still over the buttons.
            const t = launch.elapsed / launch.duration, ease = 1 - Math.pow(1 - t, 3);
            flight.x = flight.targetX = launch.fromX + (launch.toX - launch.fromX) * ease;
            flight.y = flight.targetY = launch.fromY + (launch.toY - launch.fromY) * ease;
            flight.direction = directionFromMotion(launch.toX - launch.fromX, launch.toY - launch.fromY);
            if (launch.elapsed >= launch.duration) launch = undefined;
          } else {
            room = settleFlight(flight, bounds(), around(flight.x, flight.y));
            if (!motion.matches) stepFlight(flight, dt, bounds(), hovered || focused || greeting > 0, Math.random, around(flight.x, flight.y));
          }
          x = flight.x; y = flight.y + 27 * size; direction = flight.direction;
          animation = "Walk";
        }
        const pageY = mode === "active" ? flight.y : r.top + scrollY;
        button.hidden = !room || pageY - scrollY < -100 || pageY - scrollY > innerHeight + 100;
        if (!button.hidden) {
          button.style.transform = `translate3d(${Math.round(x - 22)}px,${Math.round(y - 44)}px,0)`;
          paintSprite(art, sprite, animation, motion.matches ? 0 : animation === "Special2" ? elapsed / 1.5 : elapsed, direction, 22, 44, size, animation === "Special0" ? 6 : undefined);
          button.dataset.animation = animation; button.dataset.frame = art.dataset.frame;
          heart.hidden = greeting <= 0;
          heart.style.bottom = `${54 * size + 7}px`;
        }
      }
      if (!motion.matches) raf = requestAnimationFrame(draw);
    }
    function wake() { geometryDirty = true; if (!raf && !disposed && !document.hidden) { last = 0; raf = requestAnimationFrame(draw); } }
    const visible = () => { last = 0; wake(); };
    const observer = new ResizeObserver(wake); observer.observe(perch); observer.observe(document.body);
    const mutations = new MutationObserver(wake);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "aria-modal"] });
    window.addEventListener("resize", wake);
    // Obstacles are scroll-invariant now, so scrolling only has to keep the loop alive.
    const scrolled = () => { if (!raf && !disposed && !document.hidden) { last = 0; raf = requestAnimationFrame(draw); } };
    window.addEventListener("scroll", scrolled, { passive: true });
    window.visualViewport?.addEventListener("resize", wake); window.visualViewport?.addEventListener("scroll", scrolled);
    document.addEventListener("visibilitychange", visible); motion.addEventListener("change", visible);
    wake();
    return () => {
      disposed = true; cancelAnimationFrame(raf); clearTimeout(clearGreeting); observer.disconnect(); mutations.disconnect();
      button.removeEventListener("click", onClick); button.removeEventListener("pointerenter", enter); button.removeEventListener("pointerleave", leave);
      button.removeEventListener("focus", focus); button.removeEventListener("blur", blur);
      window.removeEventListener("resize", wake); window.removeEventListener("scroll", scrolled);
      window.visualViewport?.removeEventListener("resize", wake); window.visualViewport?.removeEventListener("scroll", scrolled);
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
