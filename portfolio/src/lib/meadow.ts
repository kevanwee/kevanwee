/** Thunder Meadow (Castform's friend area, 456 × 335): the forecast's view of it, where Castform may walk,
 *  and the dead tree in the middle, which it walks around and never onto. Points are in meadow pixels; y grows down. */
export interface Point { x: number; y: number }

export const MEADOW = { w: 456, h: 335 };
/** The window onto the meadow: the plateau with the tree in the middle. */
export const VIEW = { x: 28, y: 108, w: 400, h: 184 };
/** The plateau's grass, inside the cliffs, boulders and the hills at the bottom. */
export const WALKABLE: Point[] = [
  { x: 112, y: 152 }, { x: 340, y: 152 }, { x: 366, y: 186 }, { x: 384, y: 222 }, { x: 404, y: 252 }, { x: 336, y: 262 },
  { x: 300, y: 280 }, { x: 160, y: 280 }, { x: 126, y: 262 }, { x: 52, y: 252 }, { x: 62, y: 228 }, { x: 84, y: 190 },
];
/** Where Castform's feet may not go: the tree, with room for Castform's own width and height. */
export const TREE = { x0: 178, y0: 184, x1: 282, y1: 276 };

export function inside(p: Point, polygon: Point[] = WALKABLE): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

export const onTree = (p: Point) => p.x >= TREE.x0 && p.x <= TREE.x1 && p.y >= TREE.y0 && p.y <= TREE.y1;
export const walkable = (p: Point) => inside(p) && !onTree(p);

/** True when the segment a→b touches the tree's footprint (Liang–Barsky clipping against the box). */
export function crossesTree(a: Point, b: Point): boolean {
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  for (const [p, q] of [[-dx, a.x - TREE.x0], [dx, TREE.x1 - a.x], [-dy, a.y - TREE.y0], [dy, TREE.y1 - a.y]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
    if (t0 > t1) return false;
  }
  return true;
}

/** True when the straight walk from a to b stays on the grass and never touches the tree. */
export function clearPath(a: Point, b: Point): boolean {
  if (crossesTree(a, b)) return false;
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2);
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    if (!inside({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
  }
  return true;
}

/** Somewhere new to walk to, reachable in a straight line; null if nothing turned up (Castform then waits). */
export function pickTarget(from: Point, random: () => number = Math.random): Point | null {
  for (let tries = 0; tries < 40; tries++) {
    const p = { x: VIEW.x + random() * VIEW.w, y: VIEW.y + random() * VIEW.h };
    if (Math.hypot(p.x - from.x, p.y - from.y) > 30 && walkable(p) && clearPath(from, p)) return p;
  }
  return null;
}

/** Somewhere near a friend (within `reach`, not on top of it), so a companion keeps it company; falls back to
 *  anywhere reachable when nothing near turns up. */
export function pickNear(from: Point, friend: Point, random: () => number = Math.random, reach = 64): Point | null {
  for (let tries = 0; tries < 40; tries++) {
    const angle = random() * Math.PI * 2, r = 22 + random() * (reach - 22);
    const p = { x: friend.x + Math.cos(angle) * r, y: friend.y + Math.sin(angle) * r * .6 };
    if (Math.hypot(p.x - from.x, p.y - from.y) > 18 && walkable(p) && clearPath(from, p)) return p;
  }
  return pickTarget(from, random);
}

/** The PMD sheet row for walking along (dx, dy): 0 down, 1 down-right, 2 right … 6 left, 7 down-left. */
export function facing(dx: number, dy: number): number {
  const deg = Math.atan2(dy, dx) * 180 / Math.PI;
  return ((Math.round((90 - deg) / 45) % 8) + 8) % 8;
}

/** Where Castform first stands: on the grass, left of the tree. */
export const START: Point = { x: 140, y: 236 };
/** Where its shiny companion first stands: beside it, a little further back. */
export const COMPANION_START: Point = { x: 96, y: 208 };
