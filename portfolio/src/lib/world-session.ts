import { createWorld, type World, type SceneId, type WorldMap } from "./pokemon-world";
import type { Camera } from "./world-camera";

export interface WorldSession { world: World; images: Map<string, HTMLImageElement> }
const sessions = new Map<SceneId, Promise<WorldSession>>();
export function loadWorld(id: SceneId): Promise<WorldSession> {
  const existing = sessions.get(id);
  if (existing) return existing;
  const pending = (async () => {
    const response = await fetch(`/worlds/${id}/map.json`);
    if (!response.ok) throw new Error("Map unavailable");
    const map: WorldMap = await response.json();
    const images = new Map<string, HTMLImageElement>();
    const sources = new Set([...map.layers, ...map.foreground, ...(map.structures ? [map.structures] : []), ...map.overlays.map(o => o.src), ...map.actors.map(a => a.sprite), "/worlds/items/oran_berry.png", "/worlds/reactions/exclamation.png", "/worlds/reactions/heart.png"]);
    await Promise.all([...sources].map(async src => {
      const image = new Image(); image.src = src;
      await image.decode(); images.set(src, image);
    }));
    return { world: createWorld(map, crypto.getRandomValues(new Uint32Array(1))[0]), images };
  })();
  sessions.set(id, pending);
  pending.catch(() => { if (sessions.get(id) === pending) sessions.delete(id); });
  return pending;
}

export function drawWorld(context: CanvasRenderingContext2D, session: WorldSession, camera: Camera, width: number, height: number, selected?: string) {
  const { world, images } = session, { map } = world;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#e8ead7"; context.fillRect(0, 0, width, height);
  context.save(); context.translate(width/2, height/2); context.scale(camera.zoom, camera.zoom); context.translate(-camera.x, -camera.y);
  context.imageSmoothingEnabled = false;
  for (const src of map.layers) context.drawImage(images.get(src)!, 0, 0);
  const waterFrame = Math.floor(world.time / .35) % 8;
  for (const overlay of map.overlays) if (overlay.steps.includes(waterFrame)) context.drawImage(images.get(overlay.src)!, 0, 0);
  // Complete the terrain first: upper-floor/cap artwork is not a blanket mask.
  for (const src of map.foreground) context.drawImage(images.get(src)!, 0, 0);
  for (const berry of world.berries) context.drawImage(images.get("/worlds/items/oran_berry.png")!, berry.x-8, berry.y-12, 16,16);
  const spans = (map.occlusion || []).filter(span =>
    span.x+span.width > camera.x-width/camera.zoom/2 && span.x < camera.x+width/camera.zoom/2 &&
    span.y+span.height > camera.y-height/camera.zoom/2 && span.y < camera.y+height/camera.zoom/2);
  let spanIndex = 0;
  const structures = map.structures ? images.get(map.structures) : undefined;
  const drawSpansThrough = (feet: number) => {
    while (spanIndex < spans.length && spans[spanIndex].y+spans[spanIndex].height <= feet) {
      const span = spans[spanIndex++];
      if (structures) context.drawImage(structures, span.x,span.y,span.width,span.height,span.x,span.y,span.width,span.height);
    }
  };
  // Cull pixels, never residents. Feet determine depth, even when resting.
  for (const actor of [...world.actors].sort((a,b) => a.y-b.y)) {
    const size = actor.size;
    if (Math.abs(actor.x-camera.x) > width/camera.zoom/2+size || Math.abs(actor.y-camera.y) > height/camera.zoom/2+size) continue;
    drawSpansThrough(actor.y);
    if (actor.id === selected) {
      context.strokeStyle = "#fff"; context.lineWidth = 2/camera.zoom;
      context.beginPath(); context.ellipse(actor.x, actor.y-2, actor.radius+3, 4, 0, 0, Math.PI*2); context.stroke();
    }
    const sheet = images.get(actor.sprite)!;
    const frame = Math.floor(world.time/(actor.next ? .12 : .24)) % (sheet.width/actor.frameSize);
    context.drawImage(sheet, frame*actor.frameSize, actor.direction*actor.frameSize, actor.frameSize, actor.frameSize, actor.x-size/2, actor.y-size, size, size);
  }
  drawSpansThrough(Infinity);
  // Reactions are field-effect sprites above the scene, never cut apart by roof caps.
  for (const actor of world.actors) if (actor.state === "greeting" || actor.state === "eating") {
    const reaction = images.get(`/worlds/reactions/${actor.state === "eating" ? "heart" : "exclamation"}.png`)!;
    context.drawImage(reaction, actor.x-8, actor.y-actor.size*.65-18, 16,16);
  }
  context.restore();
}
