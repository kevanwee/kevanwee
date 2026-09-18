import { createWorld, type World, type SceneId, type WorldMap } from "./pokemon-world";

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
    const sources = new Set([...map.layers, ...map.foreground, ...map.overlays.map(o => o.src), ...map.actors.map(a => a.sprite), "/worlds/items/oran_berry.png"]);
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

export interface Camera { x: number; y: number; zoom: number }
export function clampCamera(camera: Camera, world: World, width: number, height: number) {
  const { map } = world;
  camera.zoom = Math.max(.2, Math.min(5, camera.zoom));
  const halfW = width / camera.zoom / 2, halfH = height / camera.zoom / 2;
  camera.x = halfW * 2 >= map.width ? map.width / 2 : Math.max(halfW, Math.min(map.width-halfW, camera.x));
  camera.y = halfH * 2 >= map.height ? map.height / 2 : Math.max(halfH, Math.min(map.height-halfH, camera.y));
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
  for (const berry of world.berries) context.drawImage(images.get("/worlds/items/oran_berry.png")!, berry.x-8, berry.y-12, 16,16);
  // Cull pixels, never residents. Feet determine depth, even when resting.
  for (const actor of [...world.actors].sort((a,b) => a.y-b.y)) {
    const size = actor.size;
    if (Math.abs(actor.x-camera.x) > width/camera.zoom/2+size || Math.abs(actor.y-camera.y) > height/camera.zoom/2+size) continue;
    if (actor.id === selected) {
      context.strokeStyle = "#fff"; context.lineWidth = 2/camera.zoom;
      context.beginPath(); context.ellipse(actor.x, actor.y-2, actor.radius+3, 4, 0, 0, Math.PI*2); context.stroke();
    }
    const sheet = images.get(actor.sprite)!, frame = actor.next ? Math.floor(world.time/.16) % (sheet.width/actor.frameSize) : 0;
    context.drawImage(sheet, frame*actor.frameSize, actor.direction*actor.frameSize, actor.frameSize, actor.frameSize, actor.x-size/2, actor.y-size, size, size);
    if (actor.state === "greeting" || actor.state === "eating") {
      context.font = "bold 10px sans-serif"; context.textAlign = "center";
      const badgeY = actor.y-size*.65-12;
      context.fillStyle = "#fff"; context.fillRect(actor.x-7,badgeY,14,12);
      context.fillStyle = "#3f493b"; context.fillText(actor.state === "eating" ? "♥" : "!", actor.x,badgeY+10);
    }
  }
  for (const src of map.foreground) context.drawImage(images.get(src)!, 0, 0);
  context.restore();
}
