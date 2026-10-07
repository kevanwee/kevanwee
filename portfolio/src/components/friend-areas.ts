export type Point = [number, number];
export type Area = {
  id: string;
  name: string;
  size: number[];
  background: string;
  description: string;
  roster: number[];
  zones: Point[][];
  obstacles: Point[][];
};
export type Animation = {
  src: string;
  w: number;
  h: number;
  rows: number;
  durations: number[];
  origins: Point[];
};
export type Catalog = {
  areas: Area[];
  sprites: Record<
    string,
    { name: string; animations: Record<string, Animation> }
  >;
};
export type Resident = {
  id: number;
  x: number;
  y: number;
  target: Point;
  direction: number;
  elapsed: number;
  rest: number;
  moving: boolean;
};

export function inside([x, y]: Point, polygon: Point[]) {
  let yes = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i],
      [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      yes = !yes;
  }
  return yes;
}
// Zones describe feet on the ground. Obstacles include the painted scenery plus
// conservative clearance; a 6px foot radius is also checked in eight directions.
export function walkable(area: Area, point: Point) {
  const samples: Point[] = [
    point,
    ...Array.from({ length: 8 }, (_, i): Point => [
      point[0] + 6 * Math.cos((i * Math.PI) / 4),
      point[1] + 6 * Math.sin((i * Math.PI) / 4),
    ]),
  ];
  return (
    area.zones.some((zone) => samples.every((p) => inside(p, zone))) &&
    !samples.some((p) => area.obstacles.some((o) => inside(p, o)))
  );
}
export function segment(area: Area, from: Point, to: Point) {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 2),
  );
  for (let i = 0; i <= steps; i++)
    if (
      !walkable(area, [
        from[0] + ((to[0] - from[0]) * i) / steps,
        from[1] + ((to[1] - from[1]) * i) / steps,
      ])
    )
      return false;
  return true;
}
export function createResidents(area: Area): Resident[] {
  const candidates: Point[] = [];
  for (let y = 8; y < area.size[1]; y += 8)
    for (let x = 8; x < area.size[0]; x += 8)
      if (walkable(area, [x, y])) candidates.push([x, y]);
  const chosen: Point[] = [];
  return area.roster.map((id, i) => {
    // Spread the native roster across safe floor, stable for this visit.
    const ordered = candidates.slice().sort((a, b) => {
      const score = (p: Point) =>
        chosen.length
          ? Math.min(...chosen.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])))
          : -Math.hypot(p[0] - area.size[0] / 2, p[1] - area.size[1] * 0.8);
      return score(b) - score(a);
    });
    const p = ordered[0];
    if (!p) throw new Error(`No safe spawn in ${area.id}`);
    chosen.push(p);
    return {
      id,
      x: p[0],
      y: p[1],
      target: p,
      direction: 0,
      elapsed: 0,
      rest: 1200 + i * 850,
      moving: false,
    };
  });
}
export function stepResidents(
  area: Area,
  actors: Resident[],
  dt: number,
  random = Math.random,
) {
  dt = Math.max(0, Math.min(64, dt));
  for (const actor of actors) {
    actor.elapsed += dt;
    if (actor.rest > 0) {
      actor.rest -= dt;
      actor.moving = false;
      continue;
    }
    const dx = actor.target[0] - actor.x,
      dy = actor.target[1] - actor.y,
      dist = Math.hypot(dx, dy);
    if (dist < 1) {
      actor.moving = false;
      actor.rest = 1500 + random() * 4500;
      for (let n = 0; n < 24; n++) {
        const target: Point = [
          actor.x + (random() - 0.5) * 100,
          actor.y + (random() - 0.5) * 80,
        ];
        if (
          Math.hypot(target[0] - actor.x, target[1] - actor.y) > 12 &&
          segment(area, [actor.x, actor.y], target)
        ) {
          actor.target = target;
          break;
        }
      }
    } else {
      const amount = Math.min(dist, dt * 0.013),
        next: Point = [
          actor.x + (dx / dist) * amount,
          actor.y + (dy / dist) * amount,
        ];
      // Reserve nearby feet rather than letting residents merge into one another.
      if (
        actors.some(
          (other) =>
            other !== actor &&
            Math.hypot(other.x - next[0], other.y - next[1]) < 18,
        )
      ) {
        actor.target = [actor.x, actor.y];
        actor.rest = 800;
        actor.moving = false;
        continue;
      }
      if (!segment(area, [actor.x, actor.y], next)) {
        actor.target = [actor.x, actor.y];
        actor.moving = false;
        continue;
      }
      actor.x = next[0];
      actor.y = next[1];
      actor.moving = true;
      actor.direction =
        (Math.round(Math.atan2(dx, dy) / (Math.PI / 4)) + 8) % 8;
    }
  }
}
export function frameAt(animation: Animation, elapsed: number) {
  let tick =
    ((elapsed * 60) / 1000) % animation.durations.reduce((a, b) => a + b, 0);
  for (let i = 0; i < animation.durations.length; i++) {
    if (tick < animation.durations[i]) return i;
    tick -= animation.durations[i];
  }
  return 0;
}
