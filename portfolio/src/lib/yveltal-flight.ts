import { directionFromMotion } from "./pokemon-overworld";

export type FlightBounds = { left: number; right: number; top: number; bottom: number };
export type FlightState = { x: number; y: number; vx: number; vy: number; targetX: number; targetY: number; wait: number; direction: number; turnWait: number; speed: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function createFlight(x: number, y: number): FlightState {
  return { x, y, vx: 0, vy: 0, targetX: x, targetY: y, wait: 0, direction: 0, turnWait: 0, speed: 30 };
}
export function constrainFlight(a: FlightState, b: FlightBounds) {
  a.x = clamp(a.x, b.left, b.right); a.y = clamp(a.y, b.top, b.bottom);
  a.targetX = clamp(a.targetX, b.left, b.right); a.targetY = clamp(a.targetY, b.top, b.bottom);
}
/** Obstacles are expanded by the sprite footprint before entering this controller. */
export function clearFlightPath(x: number, y: number, nextX: number, nextY: number, obstacles: FlightBounds[]) {
  return !obstacles.some(b => {
    let enter = 0, leave = 1;
    for (const [start, delta, min, max] of [[x, nextX - x, b.left, b.right], [y, nextY - y, b.top, b.bottom]]) {
      if (Math.abs(delta) < .00001) { if (start < min || start > max) return false; }
      else {
        const a = (min - start) / delta, z = (max - start) / delta;
        enter = Math.max(enter, Math.min(a, z)); leave = Math.min(leave, Math.max(a, z));
        if (enter > leave) return false;
      }
    }
    return true;
  });
}

/** Find a clear starting point after awakening or a responsive layout change. */
export function settleFlight(a: FlightState, bounds: FlightBounds, obstacles: FlightBounds[], reach = 640) {
  constrainFlight(a, bounds);
  if (clearFlightPath(a.x, a.y, a.x, a.y, obstacles)) return true;
  // Rings outwards rather than a scan of the whole page: the habitat is the entire
  // document now, and the nearest gap is what keeps a reflow from teleporting him.
  for (let radius = 8; radius <= reach; radius += 8) {
    let best: {x: number; y: number; distance: number} | undefined;
    for (let step = 0, count = Math.max(8, Math.round(radius / 2)); step < count; step++) {
      const angle = step / count * Math.PI * 2;
      const x = clamp(a.x + Math.cos(angle) * radius, bounds.left, bounds.right);
      const y = clamp(a.y + Math.sin(angle) * radius, bounds.top, bounds.bottom);
      const distance = Math.hypot(x - a.x, y - a.y);
      if ((!best || distance < best.distance) && clearFlightPath(x, y, x, y, obstacles)) best = {x, y, distance};
    }
    if (!best) continue;
    a.x = a.targetX = best.x; a.y = a.targetY = best.y; a.vx = a.vy = 0; a.wait = 0;
    return true;
  }
  return false;
}
export function stepFlight(a: FlightState, delta: number, bounds: FlightBounds, held = false, random = Math.random, obstacles: FlightBounds[] = []) {
  constrainFlight(a, bounds);
  const dt = Math.min(64, Math.max(0, delta));
  if (held || dt === 0) return;
  if (a.wait > 0) { a.wait = Math.max(0, a.wait - dt); a.vx *= .9; a.vy *= .9; return; }
  const dx = a.targetX - a.x, dy = a.targetY - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 10 || !clearFlightPath(a.x, a.y, a.targetX, a.targetY, obstacles)) {
    a.targetX = a.x; a.targetY = a.y;
    for (let i = 0; i < 48; i++) {
      // Nearby options allow wandering in narrow whitespace between components.
      const reach = i < 24 ? 90 : 240;
      const x = clamp(a.x + (random() * 2 - 1) * reach, bounds.left, bounds.right);
      const y = clamp(a.y + (random() * 2 - 1) * reach, bounds.top, bounds.bottom);
      if (!clearFlightPath(a.x, a.y, x, y, obstacles)) continue;
      a.targetX = x; a.targetY = y; break;
    }
    a.wait = 400 + random() * 1700;
    a.speed = (bounds.right - bounds.left < 500 ? 17 : 27) + random() * 12;
    return;
  }
  const speed = Math.min(a.speed, Math.max(6, distance * .9));
  const response = Math.min(1, dt / 700);
  a.vx += (dx / distance * speed - a.vx) * response;
  a.vy += (dy / distance * speed - a.vy) * response;
  const nextX = a.x + a.vx * dt / 1000, nextY = a.y + a.vy * dt / 1000;
  if (!clearFlightPath(a.x, a.y, nextX, nextY, obstacles)) {
    a.vx = a.vy = 0; a.targetX = a.x; a.targetY = a.y; a.wait = 0; return;
  }
  a.x = nextX; a.y = nextY;
  a.turnWait = Math.max(0, a.turnWait - dt);
  if (!a.turnWait && Math.hypot(a.vx, a.vy) > 5) {
    const facing = directionFromMotion(a.vx, a.vy);
    if (facing !== a.direction) { a.direction = facing; a.turnWait = 350; }
  }
  constrainFlight(a, bounds);
}
