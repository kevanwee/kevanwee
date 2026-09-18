/** Pure, seeded simulation. Rendering never owns positions or collision state. */
export type SceneId = "rt111" | "mauville";
export type Point = { x: number; y: number };
export interface Resident {
  id: string; name: string; sprite: string; size: number; frameSize: number;
  shiny: boolean; habitat: "land" | "water"; home: Point;
  bounds: [number, number, number, number] | null;
}
export interface WorldMap {
  id: SceneId; title: string; width: number; height: number; tileSize: number;
  land: string[]; water: string[]; layers: string[]; foreground: string[];
  overlays: { src: string; steps: number[] }[]; actors: Resident[];
}
export interface Actor extends Resident, Point {
  radius: number; speed: number; direction: number; state: "wandering" | "resting" | "greeting" | "eating" | "waiting";
  next: Point | null; path: Point[]; goal: Point | null; wait: number;
  allowed: Set<number>; cells: number[]; steps: number;
}
export interface Berry extends Point { id: number; actor: string; expires: number }
export interface World {
  map: WorldMap; actors: Actor[]; berries: Berry[]; time: number;
  random: () => number; turn: number; lastBerry: number; nextBerry: number;
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const cols = (map: WorldMap) => map.width / map.tileSize;
const cell = (map: WorldMap, p: Point) => Math.floor(p.y / map.tileSize) * cols(map) + Math.floor(p.x / map.tileSize);
const point = (map: WorldMap, n: number): Point => ({ x: (n % cols(map) + .5) * map.tileSize, y: (Math.floor(n / cols(map)) + .5) * map.tileSize });
function neighbours(map: WorldMap, n: number) {
  const width = cols(map), result = [n - width, n + width];
  if (n % width) result.push(n - 1);
  if (n % width < width - 1) result.push(n + 1);
  return result;
}
export function terrainFits(map: WorldMap, actor: Pick<Actor, "habitat" | "bounds" | "radius">, p: Point) {
  const tile = map.tileSize, grid = map[actor.habitat];
  const x0 = Math.floor((p.x - actor.radius) / tile), x1 = Math.floor((p.x + actor.radius) / tile);
  const y0 = Math.floor((p.y - actor.radius) / tile), y1 = Math.floor((p.y + actor.radius) / tile);
  const b = actor.bounds;
  if (b && (x0 < b[0] || y0 < b[1] || x1 >= b[2] || y1 >= b[3])) return false;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (grid[y]?.[x] !== "1") return false;
  return true;
}
function seeded(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function createWorld(map: WorldMap, seed: number): World {
  const world: World = { map, actors: [], berries: [], time: 0, random: seeded(seed), turn: 0, lastBerry: -10, nextBerry: 0 };
  for (const resident of map.actors) {
    const actor: Actor = { ...resident, ...resident.home, radius: Math.min(10, resident.size * .24),
      speed: 14 + world.random() * 10, direction: 0, state: "resting", next: null, path: [], goal: null,
      wait: world.random() * 3, allowed: new Set(), cells: [], steps: 0 };
    const valid: number[] = [];
    for (let n = 0; n < map.land.length * cols(map); n++) if (terrainFits(map, actor, point(map, n))) valid.push(n);
    valid.sort((a, b) => distance(point(map, a), actor.home) - distance(point(map, b), actor.home));
    const start = valid.find(n => world.actors.every(other => distance(point(map, n), other) > actor.radius + other.radius + 1));
    if (start === undefined) throw new Error(`No safe spawn for ${resident.name}`);
    Object.assign(actor, point(map, start));
    // Keep each resident in its connected habitat, including large footprints.
    const all = new Set(valid), queue = [start]; actor.allowed.add(start);
    for (let i = 0; i < queue.length; i++) for (const n of neighbours(map, queue[i])) {
      if (all.has(n) && !actor.allowed.has(n)) { actor.allowed.add(n); queue.push(n); }
    }
    actor.cells = queue; world.actors.push(actor);
  }
  return world;
}
function pointSegment(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}
/** Axis-aligned reserved movement capsules include both endpoints: no swaps or crossings. */
export function segmentDistance(a: Point, b: Point, c: Point, d: Point) {
  const cross = (p: Point, q: Point, r: Point) => (q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  if (cross(a,b,c)*cross(a,b,d) < 0 && cross(c,d,a)*cross(c,d,b) < 0) return 0;
  return Math.min(pointSegment(a,c,d), pointSegment(b,c,d), pointSegment(c,a,b), pointSegment(d,a,b));
}
function blockers(world: World, actor: Actor, from: Point, to: Point) {
  return world.actors.filter(other => other !== actor && segmentDistance(from, to, other, other.next || other) < actor.radius + other.radius + 1);
}
function route(world: World, actor: Actor, target: Point, avoidActors = false): Point[] | null {
  const from = actor.next || actor, start = cell(world.map, from), end = cell(world.map, target);
  if (!actor.allowed.has(end)) return null;
  const parent = new Map<number, number>([[start, -1]]), queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current === end) {
      const path: Point[] = [];
      for (let n = end; n !== start; n = parent.get(n)!) path.unshift(point(world.map, n));
      return path;
    }
    for (const n of neighbours(world.map, current)) {
      if (!actor.allowed.has(n) || parent.has(n)) continue;
      if (avoidActors && blockers(world, actor, point(world.map, current), point(world.map, n)).length) continue;
      parent.set(n, current); queue.push(n);
    }
  }
  return null;
}
function wander(world: World, actor: Actor) {
  const nearby = actor.cells.filter(n => distance(point(world.map, n), actor) < 140);
  const target = point(world.map, nearby[Math.floor(world.random() * nearby.length)]);
  actor.path = route(world, actor, target, true) || [];
  actor.goal = null;
  if (!actor.path.length) actor.wait = .6 + world.random();
}
export function greet(world: World, id: string) {
  const actor = world.actors.find(a => a.id === id)!;
  // Finish the reserved step before stopping, so no actor is stranded between cells.
  actor.path = []; actor.goal = null; actor.wait = 3; actor.state = "greeting";
  world.berries = world.berries.filter(b => b.actor !== id);
  return `${actor.name} says hello!`;
}
export function callActor(world: World, id: string, destination: Point) {
  const actor = world.actors.find(a => a.id === id)!;
  const target = point(world.map, cell(world.map, destination));
  const path = route(world, actor, target, true);
  if (!path || blockers(world, actor, target, target).length) return `${actor.name} cannot reach that spot. Choose a clear ${actor.habitat === "water" ? "water" : "ground"} tile.`;
  actor.path = path; actor.goal = target; actor.wait = 0;
  world.berries = world.berries.filter(b => b.actor !== id);
  return `${actor.name} is coming over.`;
}
export function dropBerry(world: World, destination: Point) {
  if (world.berries.length >= 3 || world.time - world.lastBerry < 2) return "Give them a moment to enjoy their berries.";
  const target = point(world.map, cell(world.map, destination));
  for (const actor of [...world.actors].sort((a, b) => distance(a,target)-distance(b,target))) {
    if (world.berries.some(b => b.actor === actor.id) || blockers(world, actor, target, target).length) continue;
    const path = route(world, actor, target, true);
    if (!path || path.length > 28) continue;
    actor.path = path; actor.goal = target; actor.wait = 0;
    world.berries.push({ ...target, id: world.nextBerry++, actor: actor.id, expires: world.time + 45 });
    world.lastBerry = world.time;
    return `${actor.name} spotted an Oran Berry!`;
  }
  return "Place a berry on clear ground or water near a Pokémon.";
}
export function stepWorld(world: World, dt: number) {
  // Never catch up through a suspended tab. Caller uses fixed 30 Hz steps.
  dt = Math.max(0, Math.min(dt, 1 / 30)); world.time += dt;
  world.berries = world.berries.filter(b => b.expires > world.time);
  const order = world.actors.length;
  for (let i = 0; i < order; i++) {
    const actor = world.actors[(i + world.turn) % order];
    if (actor.next) {
      const remaining = distance(actor, actor.next), travel = actor.speed * dt;
      if (remaining <= travel) { Object.assign(actor, actor.next); actor.next = null; actor.steps++; }
      else { actor.x += (actor.next.x-actor.x) / remaining * travel; actor.y += (actor.next.y-actor.y) / remaining * travel; }
      continue;
    }
    if (actor.wait > 0) { actor.wait -= dt; continue; }
    if (!actor.path.length) {
      const berry = world.berries.find(b => b.actor === actor.id && distance(actor,b) < 2);
      if (berry) {
        world.berries = world.berries.filter(b => b !== berry); actor.state = "eating"; actor.wait = 3;
      } else if (actor.goal && distance(actor, actor.goal) > 2) {
        actor.path = route(world, actor, actor.goal, true) || [];
        if (!actor.path.length) { actor.state = "waiting"; actor.wait = .8; }
      } else if (actor.goal) { actor.goal = null; actor.state = "greeting"; actor.wait = 2; }
      else if (world.random() < .3) { actor.state = "resting"; actor.wait = 1 + world.random() * (actor.size > 30 ? 7 : 4); }
      else wander(world, actor);
      continue;
    }
    const next = actor.path[0], blocked = blockers(world, actor, actor, next);
    if (blocked.length) {
      actor.state = "waiting"; actor.wait = .4 + world.random() * .6;
      // Replan around a reservation; abandoned wandering paths choose a new destination.
      actor.path = actor.goal ? route(world, actor, actor.goal, true) || [] : [];
      for (const other of blocked) if (!other.next && !other.goal && other.wait > 1) other.wait = .2;
    } else {
      actor.next = actor.path.shift()!; actor.state = "wandering";
      actor.direction = next.y > actor.y ? 0 : next.y < actor.y ? 3 : next.x < actor.x ? 1 : 2;
    }
  }
  world.turn = (world.turn + 1) % order;
}
