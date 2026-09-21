/** Small, DOM-independent simulation for residents of the portfolio itself. */
export const GROUND_SPECIES = ["breloom", "fidough", "flareon", "goomy", "pawmi", "tyrunt"];
export const FLYING_SPECIES = ["beautifly", "corviknight", "noivern", "rowlet", "talonflame"];
export const SILVALLY_FORMS = ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "poison", "psychic", "rock", "steel", "water"];

export type Surface = { id: string; width: number; divider: boolean };
export type Resident = {
  id: string; species: string; surface: string; flying: boolean;
  progress: number; direction: 2 | 6; speed: number;
  rest: number; untilRest: number; elapsed: number; animation: string;
};
export type Battle = { surface: string; elapsed: number; phase: string; center: number };
export type Overworld = { residents: Resident[]; battle: Battle | null };

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createOverworld(surfaces: Surface[], random = Math.random): Overworld {
  const dividers = shuffle(surfaces.filter(s => s.divider && s.width >= 240), random);
  const battleSurface = dividers[0];
  const platforms = shuffle(surfaces.filter(s => s.id !== battleSurface?.id && s.id !== "sky-about" && s.width >= 100), random);
  const residents: Resident[] = [];
  const add = (species: string, surface: string, flying: boolean) => {
    residents.push({ id: species, species, surface, flying, progress: .15 + random() * .7,
      direction: random() < .5 ? 2 : 6, speed: flying ? 21 + random() * 11 : 9 + random() * 8,
      rest: random() * 2000, untilRest: 3500 + random() * 6000,
      elapsed: random() * 1000, animation: flying ? "Hover" : "Idle" });
  };
  shuffle(GROUND_SPECIES, random).forEach((species, i) => {
    if (platforms[i]) add(species, platforms[i].id, false);
  });
  const airspace = shuffle(surfaces.filter(s => s.divider || s.id === "sky-about"), random);
  shuffle(FLYING_SPECIES, random).forEach((species, i) => {
    if (airspace[i]) add(species, airspace[i].id, true);
  });
  if (battleSurface) {
    add("armarouge", battleSurface.id, false);
    add("ceruledge", battleSurface.id, false);
  }
  return { residents, battle: battleSurface ? { surface: battleSurface.id, elapsed: 0, phase: "approach", center: .5 } : null };
}

export const BATTLE_CYCLE_MS = 16000;

/** Both actors use one clock: approach, trade attacks, retreat, then rest. */
export function battlePose(elapsed: number) {
  const t = elapsed % BATTLE_CYCLE_MS;
  if (t < 3200) return { phase: "approach", gap: 83 - t / 3200 * 42, left: "Walk", right: "Walk", outward: false, lunge: 0 };
  if (t < 4000) return { phase: "ready", gap: 41, left: "Idle", right: "Idle", outward: false, lunge: 0 };
  if (t < 5200) return { phase: "armarouge-attacks", gap: 41, left: "Shoot", right: t > 4420 ? "Hurt" : "Idle", outward: false, lunge: Math.sin((t - 4000) / 1200 * Math.PI) * 9 };
  if (t < 5600) return { phase: "ready", gap: 41, left: "Idle", right: "Idle", outward: false, lunge: 0 };
  if (t < 6800) return { phase: "ceruledge-attacks", gap: 41, left: t > 6010 ? "Hurt" : "Idle", right: "Attack", outward: false, lunge: -Math.sin((t - 5600) / 1200 * Math.PI) * 19 };
  if (t < 7600) return { phase: "ready", gap: 41, left: "Idle", right: "Idle", outward: false, lunge: 0 };
  if (t < 10800) return { phase: "retreat", gap: 41 + (t - 7600) / 3200 * 42, left: "Walk", right: "Walk", outward: true, lunge: 0 };
  return { phase: "rest", gap: 83, left: "Idle", right: "Idle", outward: false, lunge: 0 };
}

function animate(actor: Resident, animation: string, dt: number) {
  if (actor.animation !== animation) { actor.animation = animation; actor.elapsed = 0; }
  else actor.elapsed += dt;
}

/** Only visible surfaces advance. A long browser suspension never fast-forwards. */
export function stepOverworld(world: Overworld, delta: number, visibleWidths: Map<string, number>, random = Math.random) {
  const dt = Math.min(Math.max(delta, 0), 64);
  for (const actor of world.residents) {
    const width = visibleWidths.get(actor.surface);
    if (!width || actor.species === "armarouge" || actor.species === "ceruledge") continue;
    if (!actor.flying && actor.rest > 0) {
      actor.rest -= dt;
      animate(actor, "Idle", dt);
      continue;
    }
    animate(actor, actor.flying ? "Hover" : "Walk", dt);
    actor.progress += (actor.direction === 2 ? 1 : -1) * actor.speed * dt / 1000 / Math.max(1, width - 80);
    if (actor.progress >= 1 || actor.progress <= 0) {
      actor.progress = Math.max(0, Math.min(1, actor.progress));
      actor.direction = actor.direction === 2 ? 6 : 2;
    }
    actor.untilRest -= dt;
    if (!actor.flying && actor.untilRest <= 0) {
      actor.rest = 1800 + random() * 4200;
      actor.untilRest = 4000 + random() * 8000;
    }
  }
  const battle = world.battle;
  const width = battle && visibleWidths.get(battle.surface);
  if (!battle || !width) return;
  const previousCycle = Math.floor(battle.elapsed / BATTLE_CYCLE_MS);
  battle.elapsed += dt;
  if (Math.floor(battle.elapsed / BATTLE_CYCLE_MS) !== previousCycle) battle.center = .4 + random() * .2;
  const pose = battlePose(battle.elapsed);
  battle.phase = pose.phase;
  const gap = pose.gap * Math.min(1, Math.max(0, width - 80) / 166);
  const margin = 40 + Math.min(83, Math.max(0, width - 80) / 2);
  const center = Math.max(margin, Math.min(width - margin, width * battle.center));
  for (const actor of world.residents.filter(a => a.species === "armarouge" || a.species === "ceruledge")) {
    const left = actor.species === "armarouge";
    const x = center + (left ? -gap + Math.max(0, pose.lunge) : gap + Math.min(0, pose.lunge));
    actor.progress = (x - 40) / Math.max(1, width - 80);
    actor.direction = (left !== pose.outward) ? 2 : 6;
    animate(actor, left ? pose.left : pose.right, dt);
  }
}

export function animationFrame(durations: number[], elapsed: number, loop = true) {
  const total = durations.reduce((sum, d) => sum + d * 16, 0);
  let time = loop ? elapsed % total : Math.min(elapsed, total - 1);
  for (let i = 0; i < durations.length; i++) {
    time -= durations[i] * 16;
    if (time < 0) return i;
  }
  return 0;
}
