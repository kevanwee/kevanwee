/** DOM-independent wandering, naps and loosely choreographed sparring. */
export const GROUND_SPECIES = ["breloom", "fidough", "flareon", "goomy", "pawmi", "tyrunt"];
export const FLYING_SPECIES = ["beautifly", "corviknight", "noivern", "rowlet", "talonflame"];
export const SILVALLY_FORMS = ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "poison", "psychic", "rock", "steel", "water"];
export type Surface = { id: string; width: number; divider: boolean; kind?: string };
export type Resident = {
  id: string; species: string; surface: string; flying: boolean;
  progress: number; target: number; direction: number; speed: number;
  rest: number; nap: boolean; untilNap: number; elapsed: number; age: number; animation: string;
  altitude: number; targetAltitude: number; reaction: number; held: boolean;
};
export type Battle = { surface: string; elapsed: number; duration: number; phase: string; center: number; rounds: number; attacker: string; gap: number };
export type Overworld = { residents: Resident[]; battle: Battle | null };
const between = (min: number, max: number, random: () => number) => min + random() * (max - min);
const approach = (value: number, target: number, step: number) => value + Math.sign(target - value) * Math.min(Math.abs(target - value), step);

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createOverworld(surfaces: Surface[], random = Math.random): Overworld {
  const battleSurface = shuffle(surfaces.filter(s => s.divider && s.width >= 240), random)[0];
  const available = shuffle(surfaces.filter(s => s.id !== battleSurface?.id && s.id !== "sky-about" && s.width >= 100), random);
  // Guarantee coverage of each requested area before filling random spare ledges.
  const platforms: Surface[] = [];
  for (const kind of ["skills", "other-project", "media-card", "featured", "divider"]) {
    const index = available.findIndex(s => (s.kind ?? (s.divider ? "divider" : "")) === kind);
    if (index >= 0) platforms.push(...available.splice(index, 1));
  }
  platforms.push(...available);
  const residents: Resident[] = [];
  const add = (species: string, surface: string, flying: boolean) => {
    residents.push({ id: species, species, surface, flying, progress: between(.15, .85, random), target: random(),
      direction: random() < .5 ? 2 : 6, speed: between(flying ? 16 : 9, flying ? 28 : 18, random),
      rest: between(500, 3200, random), nap: false, untilNap: between(16000, 60000, random),
      elapsed: random() * 1000, age: random() * 10000, animation: flying ? "Walk" : "Idle",
      altitude: flying ? between(43, 59, random) : 0, targetAltitude: between(40, 62, random), reaction: 0, held: false });
  };
  shuffle(GROUND_SPECIES, random).forEach((species, i) => { if (platforms[i]) add(species, platforms[i].id, false); });
  const airspace = shuffle(surfaces.filter(s => s.divider || s.id === "sky-about"), random);
  shuffle(FLYING_SPECIES, random).forEach((species, i) => { if (airspace[i]) add(species, airspace[i].id, true); });
  if (battleSurface) { add("armarouge", battleSurface.id, false); add("ceruledge", battleSurface.id, false); }
  return { residents, battle: battleSurface ? { surface: battleSurface.id, elapsed: 0, duration: between(2200, 6500, random), phase: "rest", center: between(.4, .6, random), rounds: 0, attacker: "armarouge", gap: 83 } : null };
}

function animate(actor: Resident, animation: string, dt: number) {
  if (actor.animation !== animation) { actor.animation = animation; actor.elapsed = 0; }
  else actor.elapsed += dt;
}

export function greetResident(actor: Resident) {
  if (["armarouge", "ceruledge"].includes(actor.species)) return false;
  actor.reaction = 1800; actor.nap = false; actor.rest = 2400;
  actor.direction = 0; actor.elapsed = 0;
  actor.animation = actor.flying && actor.altitude > 1 ? "Walk" : "Idle";
  return true;
}

function nextBattlePhase(b: Battle, random: () => number) {
  b.elapsed = 0;
  if (b.phase === "rest") {
    b.phase = "approach"; b.duration = between(2200, 4200, random);
    b.rounds = 1 + Math.floor(random() * 4); b.attacker = random() < .5 ? "armarouge" : "ceruledge";
  } else if (b.phase === "approach") {
    b.phase = "ready"; b.duration = between(450, 1600, random);
  } else if (b.phase === "ready") {
    b.phase = `${b.attacker}-attacks`; b.duration = between(720, 1100, random); b.rounds--;
  } else if (b.phase.endsWith("attacks")) {
    if (b.rounds > 0) {
      if (random() < .75) b.attacker = b.attacker === "armarouge" ? "ceruledge" : "armarouge";
      b.phase = "ready"; b.duration = between(500, 1800, random);
    } else { b.phase = "retreat"; b.duration = between(2400, 4400, random); }
  } else { b.phase = "rest"; b.duration = between(6000, 17000, random); }
}

/** Only visible surfaces advance; no fast-forward after browser suspension. */
export function stepOverworld(world: Overworld, delta: number, visibleWidths: Map<string, number>, random = Math.random) {
  const dt = Math.min(Math.max(delta, 0), 64);
  for (const actor of world.residents) {
    const width = visibleWidths.get(actor.surface);
    if (!width || ["armarouge", "ceruledge"].includes(actor.species)) continue;
    actor.age += dt;
    if (actor.reaction > 0) {
      actor.reaction = Math.max(0, actor.reaction - dt);
      animate(actor, actor.flying && actor.altitude > 1 ? "Walk" : "Idle", dt); continue;
    }
    if (actor.held) { animate(actor, actor.flying && actor.altitude > 1 ? "Walk" : actor.nap ? "Sleep" : "Idle", dt); continue; }
    actor.untilNap -= dt;
    if (!actor.nap && actor.untilNap <= 0) {
      actor.nap = true; actor.rest = between(7000, 18000, random); actor.target = actor.progress;
    }
    if (actor.flying) {
      // Land before sleeping. Altitude is independent of frame/behavior clocks.
      actor.altitude = approach(actor.altitude, actor.nap ? 0 : actor.targetAltitude, dt * .012);
      if (actor.nap && actor.altitude > 0) { animate(actor, "Walk", dt); continue; }
    }
    if (actor.rest > 0) {
      actor.rest = Math.max(0, actor.rest - dt);
      animate(actor, actor.nap ? "Sleep" : actor.flying ? "Walk" : "Idle", dt);
      if (actor.rest === 0) {
        if (actor.nap) { actor.nap = false; actor.untilNap = between(30000, 95000, random); }
        actor.target = between(.03, .97, random);
        actor.speed = between(actor.flying ? 14 : 8, actor.flying ? 30 : 19, random);
        actor.targetAltitude = between(40, 63, random);
        animate(actor, actor.flying ? "Walk" : "Idle", 0);
      }
      continue;
    }
    const distance = (actor.target - actor.progress) * Math.max(1, width - 80);
    if (Math.abs(distance) < .8) {
      actor.progress = actor.target; actor.rest = between(1000, actor.flying ? 5000 : 6500, random);
      animate(actor, actor.flying ? "Walk" : "Idle", dt);
      if (!actor.flying && random() < .4) actor.direction = [0, 2, 4, 6][Math.floor(random() * 4)];
    } else {
      actor.direction = distance > 0 ? 2 : 6;
      const speed = Math.min(actor.speed, Math.max(3, Math.abs(distance) * 1.8));
      actor.progress = approach(actor.progress, actor.target, speed * dt / 1000 / Math.max(1, width - 80));
      animate(actor, "Walk", dt);
    }
  }
  const b = world.battle;
  const width = b && visibleWidths.get(b.surface);
  if (!b || !width) return;
  b.elapsed += dt;
  if (b.elapsed >= b.duration) nextBattlePhase(b, random);
  const t = Math.min(1, b.elapsed / b.duration);
  b.gap = b.phase === "approach" ? 83 - t * 42 : b.phase === "retreat" ? 41 + t * 42 : b.phase === "rest" ? 83 : 41;
  const gap = b.gap * Math.min(1, Math.max(0, width - 80) / 166);
  const margin = 40 + Math.min(83, Math.max(0, width - 80) / 2);
  const center = Math.max(margin, Math.min(width - margin, width * b.center));
  for (const actor of world.residents.filter(a => ["armarouge", "ceruledge"].includes(a.species))) {
    const left = actor.species === "armarouge";
    const attacking = b.phase === `${actor.species}-attacks`;
    const hit = b.phase.endsWith("attacks") && !attacking && t > .35;
    const lunge = attacking ? Math.sin(t * Math.PI) * (left ? 9 : 19) : 0;
    actor.progress = (center + (left ? -gap + lunge : gap - lunge) - 40) / Math.max(1, width - 80);
    actor.direction = (left !== (b.phase === "retreat")) ? 2 : 6;
    animate(actor, attacking ? left ? "Shoot" : "Attack" : hit ? "Hurt" : ["approach", "retreat"].includes(b.phase) ? "Walk" : "Idle", dt);
  }
}

export type Wanderer = { x: number; y: number; targetX: number; targetY: number; direction: number; wait: number; untilNap: number; nap: boolean; elapsed: number; animation: string; speed: number };
export function createWanderer(random = Math.random): Wanderer {
  return { x: .5, y: .7, targetX: random(), targetY: random(), direction: 2, wait: 1200,
    untilNap: between(28000, 70000, random), nap: false, elapsed: 0, animation: "Idle", speed: 17 };
}
export function directionFromMotion(dx: number, dy: number) {
  return [2, 1, 0, 7, 6, 5, 4, 3][(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
}
export function stepWanderer(a: Wanderer, delta: number, width: number, height: number, random = Math.random) {
  const dt = Math.min(64, Math.max(0, delta));
  a.elapsed += dt; a.untilNap -= dt;
  if (!a.nap && a.untilNap <= 0) { a.nap = true; a.wait = between(8000, 18000, random); a.animation = "Sleep"; a.elapsed = 0; }
  if (a.wait > 0) {
    a.wait = Math.max(0, a.wait - dt);
    if (!a.wait) {
      if (a.nap) { a.nap = false; a.untilNap = between(35000, 100000, random); }
      a.targetX = between(.06, .94, random); a.targetY = between(.06, .94, random);
      a.speed = between(12, 23, random); a.animation = "Walk"; a.elapsed = 0;
    }
    return;
  }
  const dx = (a.targetX - a.x) * width, dy = (a.targetY - a.y) * height;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) {
    a.wait = between(900, 5500, random); a.animation = "Idle"; a.elapsed = 0;
    if (random() < .4) a.direction = Math.floor(random() * 8);
  } else {
    const step = Math.min(distance, a.speed * dt / 1000);
    a.x += dx / distance * step / Math.max(1, width);
    a.y += dy / distance * step / Math.max(1, height);
    a.direction = directionFromMotion(dx, dy);
  }
}

export function animationFrame(durations: number[], elapsed: number, loop = true) {
  const total = durations.reduce((sum, d) => sum + d * 16, 0);
  let time = loop ? elapsed % total : Math.min(elapsed, total - 1);
  for (let i = 0; i < durations.length; i++) { time -= durations[i] * 16; if (time < 0) return i; }
  return 0;
}
