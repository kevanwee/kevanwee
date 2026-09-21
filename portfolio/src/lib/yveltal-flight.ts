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
export function stepFlight(a: FlightState, delta: number, bounds: FlightBounds, held = false, random = Math.random, obstacles: FlightBounds[] = []) {
  constrainFlight(a, bounds);
  const dt = Math.min(64, Math.max(0, delta));
  if (held || dt === 0) return;
  if (a.wait > 0) { a.wait = Math.max(0, a.wait - dt); a.vx *= .9; a.vy *= .9; return; }
  const dx = a.targetX - a.x, dy = a.targetY - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 10) {
    for (let i = 0; i < 16; i++) {
      const x = bounds.left + random() * (bounds.right - bounds.left);
      const y = bounds.top + random() * (bounds.bottom - bounds.top);
      if (obstacles.some(b => x > b.left - 24 && x < b.right + 24 && y > b.top - 24 && y < b.bottom + 24)) continue;
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
  a.x += a.vx * dt / 1000; a.y += a.vy * dt / 1000;
  a.turnWait = Math.max(0, a.turnWait - dt);
  if (!a.turnWait && Math.hypot(a.vx, a.vy) > 5) {
    const facing = directionFromMotion(a.vx, a.vy);
    if (facing !== a.direction) { a.direction = facing; a.turnWait = 350; }
  }
  constrainFlight(a, bounds);
}
