import { directionFromMotion, EEVEELUTIONS } from "./pokemon-overworld";

export const FOREST_WIDTH = 480, FOREST_HEIGHT = 312;
/** Body width in background pixels; nobody walks closer than this to a friend. */
export const FOREST_GAP = 17;
/** Straight on first, then progressively wider sidesteps around whoever is in the way. */
const SIDESTEP = [0, .8, -.8, 1.5, -1.5];
export type Point = { x: number; y: number };
// Measured in the original background's pixels, inside the roots and canopy.
export const CLEARING = [[203,137],[221,128],[239,157],[255,132],[271,141],[284,162],
  [300,179],[321,198],[326,222],[314,249],[306,282],[284,304],[193,304],
  [174,289],[165,261],[151,239],[150,210],[162,190],[177,175],[194,161]];
function inside(x: number, y: number) {
  let result = false;
  for (let i = 0, j = CLEARING.length - 1; i < CLEARING.length; j = i++) {
    const [ax, ay] = CLEARING[i], [bx, by] = CLEARING[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) result = !result;
  }
  return result;
}
export function forestWalkable(x: number, y: number) {
  // Room for feet at the tree edge, and the entire body around the stone.
  return [[0,0],[-9,0],[9,0],[0,-7],[0,4]].every(([dx,dy]) => inside(x + dx, y + dy)) &&
    !(x + 17 > 209 && x - 17 < 263 && y > 177 && y - 30 < 216);
}
export function forestSegment(a: Point, b: Point) {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
  for (let i = 0; i <= steps; i++) if (!forestWalkable(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps)) return false;
  return true;
}
const grid: Point[] = [];
for (let y = 128; y < 304; y += 8) for (let x = 144; x < 328; x += 8) if (forestWalkable(x, y)) grid.push({x, y});
const neighbors = grid.map(a => grid.flatMap((b, i) => Math.hypot(a.x - b.x, a.y - b.y) <= 11.4 && a !== b && forestSegment(a, b) ? [i] : []));
/** `avoid` are the others standing about; a napping friend is a wall, not a hazard to
 *  bump into later, so routes are planned around them instead of straight through. */
export function forestRoute(from: Point, to: Point, avoid: readonly Point[] = []) {
  const shut = (p: Point) => avoid.some(o => Math.hypot(p.x - o.x, p.y - o.y) < FOREST_GAP);
  const nearest = (point: Point, whereItStands: boolean) => grid.reduce((best, p, i) =>
    (whereItStands || !shut(p)) && forestSegment(point, p)
      && (best < 0 || Math.hypot(p.x - point.x, p.y - point.y) < Math.hypot(grid[best].x - point.x, grid[best].y - point.y)) ? i : best, -1);
  const start = nearest(from, true), end = nearest(to, false);
  if (start < 0 || end < 0) return [];
  const queue = [start], previous = new Map<number, number>([[start, -1]]);
  for (let q = 0; q < queue.length && !previous.has(end); q++) for (const next of neighbors[queue[q]]) {
    if (!previous.has(next) && !shut(grid[next])) { previous.set(next, queue[q]); queue.push(next); }
  }
  if (!previous.has(end)) return [];
  const path: Point[] = [to];
  for (let at = end; at !== -1; at = previous.get(at)!) path.unshift(grid[at]);
  return path;
}
export type ForestResident = Point & { species: string; path: Point[]; speed: number; rest: number; untilNap: number; nap: boolean;
  direction: number; animation: string; elapsed: number; reaction: number; held: boolean; blocked: number };
const between = (a: number, b: number, random: () => number) => a + random() * (b - a);
export function createForest(random = Math.random): ForestResident[] {
  const starts = [{x:208,y:168},{x:280,y:168},{x:176,y:224},{x:304,y:232},{x:200,y:280},{x:272,y:280}];
  return EEVEELUTIONS.map((species, i) => ({...starts[i], species, path: [], speed: between(9, 15, random), rest: between(800, 3500, random),
    untilNap: between(20000, 70000, random), nap: false, direction: 0, animation: "Idle", elapsed: random() * 1000, reaction: 0, held: false, blocked: 0}));
}
export function greetForest(a: ForestResident, random = Math.random) {
  a.nap = false; a.untilNap = between(30000, 80000, random); a.reaction = 1800; a.rest = 2400;
  a.direction = 0; a.animation = "Idle"; a.elapsed = 0; a.path = [];
}
export function stepForest(actors: ForestResident[], delta: number, random = Math.random) {
  const dt = Math.min(64, Math.max(0, delta));
  for (const a of actors) {
    const before = a.animation;
    a.elapsed += dt; a.reaction = Math.max(0, a.reaction - dt);
    if (a.held || a.reaction > 0) { a.animation = a.nap ? "Sleep" : "Idle"; continue; }
    a.untilNap -= dt;
    if (!a.nap && a.untilNap <= 0) { a.nap = true; a.rest = between(8000, 19000, random); a.path = []; }
    if (a.rest > 0) {
      a.rest = Math.max(0, a.rest - dt); a.animation = a.nap ? "Sleep" : "Idle";
      if (!a.rest) {
        if (a.nap) { a.nap = false; a.untilNap = between(35000, 100000, random); }
        // Choose somewhere nobody is already standing, so one route call does it:
        // retrying a blocked destination is the only part of this that is expensive.
        const others = actors.filter(b => b !== a);
        const open = grid.filter(p => !others.some(o => Math.hypot(p.x - o.x, p.y - o.y) < FOREST_GAP));
        a.path = open.length ? forestRoute(a, open[Math.floor(random() * open.length)], others) : [];
        a.speed = between(9, 15, random);
      }
    } else if (a.path.length) {
      const target = a.path[0], dx = target.x - a.x, dy = target.y - a.y, distance = Math.hypot(dx, dy);
      if (distance < .2) { a.x = target.x; a.y = target.y; a.path.shift(); }
      else {
        const step = Math.min(distance, a.speed * dt / 1000);
        // Only closing the distance counts, so two who start close can still separate.
        const crowds = (x: number, y: number) => actors.some(b => b !== a
          && Math.hypot(x - b.x, y - b.y) < FOREST_GAP && Math.hypot(x - b.x, y - b.y) < Math.hypot(a.x - b.x, a.y - b.y));
        // Walking through a friend is out, and so is stopping dead: six of them in one
        // glade would gridlock. Slide around instead, widening the angle until it fits.
        const slid = SIDESTEP.some(turn => {
          const cos = Math.cos(turn), sin = Math.sin(turn);
          const ux = (dx * cos - dy * sin) / distance, uy = (dx * sin + dy * cos) / distance;
          const nx = a.x + ux * step, ny = a.y + uy * step;
          if (!forestWalkable(nx, ny) || crowds(nx, ny)) return false;
          a.x = nx; a.y = ny; a.direction = directionFromMotion(ux, uy); a.animation = "Walk"; a.blocked = 0;
          return true;
        });
        if (!slid) {
          // Nose to nose with nowhere to slide: give way and find another way round.
          a.animation = "Idle";
          if ((a.blocked += dt) > 600) {
            a.blocked = 0; a.path = []; a.rest = between(200, 700, random);
          }
        }
      }
    } else { a.rest = between(900, 5500, random); a.animation = "Idle"; if (random() < .3) a.direction = Math.floor(random() * 8); }
    if (a.animation !== before) a.elapsed = 0;
  }
}
