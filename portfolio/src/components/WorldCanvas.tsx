"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { stepWorld, type Point } from "@/lib/pokemon-world";
import { drawWorld, type WorldSession } from "@/lib/world-session";
import { clampCamera, type Camera } from "@/lib/world-camera";

export default function WorldCanvas({ session, active, camera, focused = false, selected, revision = 0, onPick }: {
  session: WorldSession; active: boolean; camera: MutableRefObject<Camera>;
  focused?: boolean; selected?: string; revision?: number; onPick?: (p: Point) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [tabVisible, setTabVisible] = useState(true);
  const pointer = useRef<{ x: number; y: number; startX: number; startY: number; moved: boolean } | null>(null);
  const repaint = useRef(() => {});
  useEffect(() => {
    const update = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", update); update();
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    const element = canvas.current!, context = element.getContext("2d")!;
    let width = 0, height = 0, frame = 0, previous = 0, accumulator = 0;
    const paint = () => {
      if (!focused) {
        const map = session.world.map;
        camera.current.zoom = Math.max(width/map.width, height/map.height);
        const excursion = (Math.sin(session.world.time/35 - Math.PI/2)+1)/2;
        camera.current.x = map.width > map.height ? width/camera.current.zoom/2 + excursion*(map.width-width/camera.current.zoom) : map.width/2;
        camera.current.y = map.height > map.width ? height/camera.current.zoom/2 + excursion*(map.height-height/camera.current.zoom) : map.height/2;
      }
      clampCamera(camera.current, session.world.map, width, height);
      drawWorld(context, session, camera.current, width, height, selected);
      element.dataset.time = session.world.time.toFixed(3);
      element.dataset.residents = String(session.world.actors.length);
      element.dataset.camera = JSON.stringify(camera.current);
    };
    repaint.current = paint;
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width; height = entry.contentRect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      element.width = Math.round(width*dpr); element.height = Math.round(height*dpr);
      context.setTransform(dpr,0,0,dpr,0,0); paint();
    });
    resize.observe(element);
    const tick = (time: number) => {
      accumulator += previous ? Math.min((time-previous)/1000, .1) : 0; previous = time;
      if (accumulator >= 1/30) {
        while (accumulator >= 1/30) { stepWorld(session.world, 1/30); accumulator -= 1/30; }
        paint();
      }
      frame = requestAnimationFrame(tick);
    };
    if (active && tabVisible) frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); repaint.current = () => {}; };
  }, [session, active, tabVisible, focused, camera, selected, revision]);
  return <canvas ref={canvas} className="h-full w-full" aria-label={`${session.world.map.title}: ${session.world.actors.length} Pokémon. Use the resident selector below to explore with a keyboard.`}
    role="img" tabIndex={focused ? 0 : undefined}
    style={{ touchAction: focused ? "none" : "auto", cursor: focused ? "grab" : "inherit" }}
    onKeyDown={e => {
      if (!focused) return;
      const vector: Record<string, [number, number]> = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
      if (vector[e.key]) {
        e.preventDefault(); camera.current.x += vector[e.key][0]*64/camera.current.zoom; camera.current.y += vector[e.key][1]*64/camera.current.zoom; repaint.current();
      }
    }}
    onWheel={e => {
      if (!focused) return;
      camera.current.zoom *= e.deltaY > 0 ? .9 : 1.1; repaint.current();
    }}
    onPointerDown={e => {
      if (!focused || !e.isPrimary) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      pointer.current = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false };
    }}
    onPointerMove={e => {
      const drag = pointer.current;
      if (!drag || !e.isPrimary) return;
      if (Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5) drag.moved = true;
      if (drag.moved) {
        camera.current.x -= (e.clientX-drag.x)/camera.current.zoom;
        camera.current.y -= (e.clientY-drag.y)/camera.current.zoom;
        repaint.current();
      }
      drag.x = e.clientX; drag.y = e.clientY;
    }}
    onPointerUp={e => {
      const drag = pointer.current; pointer.current = null;
      if (drag && !drag.moved) {
        const rect = e.currentTarget.getBoundingClientRect();
        onPick?.({x: camera.current.x+(e.clientX-rect.left-rect.width/2)/camera.current.zoom,
          y: camera.current.y+(e.clientY-rect.top-rect.height/2)/camera.current.zoom});
      }
    }}
    onPointerCancel={() => { pointer.current = null; }} onLostPointerCapture={() => { pointer.current = null; }} />;
}
