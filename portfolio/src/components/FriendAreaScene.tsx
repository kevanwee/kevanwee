"use client";
import { useEffect, useRef, useState } from "react";
import {
  createResidents,
  frameAt,
  stepResidents,
  type Area,
  type Catalog,
  type Resident,
} from "./friend-areas";

export default function FriendAreaScene({
  area,
  catalog,
  residents,
  overlay = false,
  paused = false,
}: {
  area: Area;
  catalog: Catalog;
  residents: Map<string, Resident[]>;
  overlay?: boolean;
  paused?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = canvas.current!,
      ctx = element.getContext("2d")!;
    let disposed = false,
      raf = 0,
      last = 0,
      visible = false;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const images = new Map<string, HTMLImageElement>();
    let actors = residents.get(area.id);
    if (!actors) {
      actors = createResidents(area);
      residents.set(area.id, actors);
    }
    const population = actors;
    const quiet = () => {
      try {
        return (
          media.matches || localStorage.getItem("voracity.quiet") === "true"
        );
      } catch {
        return media.matches;
      }
    };
    const covered = () =>
      !element.closest("dialog[open]") &&
      !!document.querySelector(
        'dialog[open], [role="dialog"][aria-modal="true"]',
      );
    function draw(now: number) {
      raf = 0;
      if (disposed || document.hidden || !visible) {
        last = 0;
        return;
      }
      if (last && now - last < 33) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      if (!quiet() && !paused && !covered())
        stepResidents(area, population, dt);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, ...(area.size as [number, number]));
      const background = images.get(area.background);
      if (background) ctx.drawImage(background, 0, 0);
      if (overlay) {
        for (const [polygons, color] of [
          [area.zones, "#62ffb0"],
          [area.obstacles, "#ff536b"],
        ] as const)
          for (const p of polygons) {
            ctx.beginPath();
            p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.closePath();
            ctx.fillStyle = color + "44";
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
      }
      for (const actor of [...population].sort((a, b) => a.y - b.y)) {
        const animation =
          catalog.sprites[actor.id].animations[actor.moving ? "Walk" : "Idle"];
        const sheet = images.get(animation.src);
        if (!sheet) continue;
        const row = Math.min(actor.direction, animation.rows - 1),
          frame = frameAt(animation, quiet() ? 0 : actor.elapsed),
          [ox, oy] = animation.origins[row];
        ctx.drawImage(
          sheet,
          frame * animation.w,
          row * animation.h,
          animation.w,
          animation.h,
          Math.round(actor.x - ox),
          Math.round(actor.y - oy),
          animation.w,
          animation.h,
        );
        if (overlay) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(actor.x - 1, actor.y - 1, 3, 3);
        }
      }
      if (!quiet() && !paused && !covered()) raf = requestAnimationFrame(draw);
    }
    function wake() {
      if (!disposed && !raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(draw);
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    observer.observe(element);
    const dialogs = new MutationObserver(wake);
    dialogs.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open", "aria-modal"],
    });
    const paths = [
      area.background,
      ...area.roster.flatMap((id) =>
        ["Idle", "Walk"].map((a) => catalog.sprites[id].animations[a].src),
      ),
    ];
    setError("");
    Promise.all(
      [...new Set(paths)].map(
        (src) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              images.set(src, img);
              resolve();
            };
            img.onerror = () => reject(new Error(src));
            img.src = "/friend-areas/" + src;
          }),
      ),
    )
      .then(wake)
      .catch(() => {
        if (!disposed)
          setError("This area could not load. Please reopen it to try again.");
      });
    media.addEventListener("change", wake);
    window.addEventListener("voracity:motion-change", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      dialogs.disconnect();
      media.removeEventListener("change", wake);
      window.removeEventListener("voracity:motion-change", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [area, catalog, residents, overlay, paused]);
  return (
    <>
      <canvas
        ref={canvas}
        width={area.size[0]}
        height={area.size[1]}
        role="img"
        aria-label={`${area.name}. Residents: ${area.roster.map((id) => catalog.sprites[id].name).join(", ")}`}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          imageRendering: "pixelated",
        }}
      />
      {error && <p role="alert">{error}</p>}
    </>
  );
}
