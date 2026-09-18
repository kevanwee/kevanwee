import type { WorldMap } from "./pokemon-world";
export interface Camera { x: number; y: number; zoom: number }
export function clampCamera(camera: Camera, map: Pick<WorldMap, "width" | "height">, width: number, height: number) {
  // Cover both viewport axes. Even a very wide/short map must never reveal empty canvas.
  const minimum = Math.max(width / map.width, height / map.height, .01);
  camera.zoom = Math.max(minimum, Math.min(Math.max(5, minimum), camera.zoom));
  const halfW = width / camera.zoom / 2, halfH = height / camera.zoom / 2;
  camera.x = Math.max(halfW, Math.min(map.width-halfW, camera.x));
  camera.y = Math.max(halfH, Math.min(map.height-halfH, camera.y));
}
