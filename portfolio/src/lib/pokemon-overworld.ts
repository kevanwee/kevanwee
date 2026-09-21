/** DOM-independent wandering, naps and loosely choreographed sparring. */
export const GROUND_SPECIES = ["breloom", "fidough", "goomy", "pawmi", "tyrunt", "rowlet",
  "appletun", "charcadet", "corphish", "dragonair", "dragonite", "gible", "giratina", "mega-zeraora",
  "skitty", "squirtle",
  ...["zorua", "hisuian-zorua", "mega-gardevoir", "mega-gallade", "dratini", "shiny-dratini", "growlithe", "arcanine"]];
export const FLYING_SPECIES = ["beautifly", "corviknight", "noivern", "talonflame",
  "mega-rayquaza", "mega-skarmory", "naganadel",
  "primal-kyogre", "shadow-mewtwo", "zapdos"];
/** This family lives together in Transform Forest, outside the ledge lottery. */
export const EEVEELUTIONS = ["eevee", "vaporeon", "jolteon", "flareon", "umbreon", "sylveon"];
/** Bonded pairs share a ledge, and the second one trails the first everywhere it goes. */
export const PAIRS: readonly (readonly [string, string])[] = [
  ["zorua", "hisuian-zorua"], ["mega-gardevoir", "mega-gallade"],
  ["dratini", "shiny-dratini"], ["growlithe", "arcanine"]];
/** How many project tiles get a resident. Lower this first to thin the crowd. */
export const TILE_RESIDENTS = 5;
/** A long divider or card carries a small group; a narrow ledge gets one resident.
 *  Two is the ceiling either way; the eeveelution line is the one exception. */
export const capacity = (width: number) => Math.max(1, Math.min(2, Math.floor(width / 180)));
/** "mega-gallade" reads as "Mega Gallade" in tooltips and labels. */
export const displayName = (species: string) =>
  species.split("-").map(part => part[0].toUpperCase() + part.slice(1)).join(" ");
export const SILVALLY_FORMS = ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "poison", "psychic", "rock", "steel", "water"];
/** Every tile in the "other noteworthy projects" grid, on any row. */
export const HOP_CARD = /^other-project-\d+$/;
export type Surface = { id: string; width: number; divider: boolean; kind?: string };
export type SurfaceRect = { left: number; right: number; top: number; width: number };
export type Hop = { from: string; to: string; start: number; landing: number; elapsed: number; duration: number };
export type Resident = {
  id: string; species: string; surface: string; flying: boolean;
  progress: number; target: number; direction: number; speed: number;
  rest: number; nap: boolean; untilNap: number; elapsed: number; age: number; animation: string;
  altitude: number; targetAltitude: number; reaction: number; held: boolean;
  hop: Hop | null; hopTarget: string | null; leader: string | null;
};
export type Battle = { surface: string; elapsed: number; duration: number; phase: string; center: number; rounds: number; attacker: string; gap: number };
export type Overworld = { residents: Resident[]; battle: Battle | null };
const between = (min: number, max: number, random: () => number) => min + random() * (max - min);
const approach = (value: number, target: number, step: number) => value + Math.sign(target - value) * Math.min(Math.abs(target - value), step);
const pace = (species: string) => species === "mega-zeraora" ? 1.35 : 1;

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
  const hopCards = surfaces.filter(s => HOP_CARD.test(s.id));
  const available = shuffle(surfaces.filter(s => s.id !== battleSurface?.id && s.id !== "sky-about" && s.kind !== "air" && !hopCards.includes(s) && s.width >= 100), random);
  // Guarantee coverage of each requested area before filling random spare ledges.
  const platforms: Surface[] = [];
  for (const kind of ["skills", "media-card", "featured", "divider"]) {
    const index = available.findIndex(s => (s.kind ?? (s.divider ? "divider" : "")) === kind);
    if (index >= 0) platforms.push(...available.splice(index, 1));
  }
  platforms.push(...available.filter(s => !s.divider));
  const residents: Resident[] = [];
  const add = (species: string, surface: string, flying: boolean, leader: string | null = null, lane = 0) => {
    // Sharing a ledge means sharing its length, and for flyers its headroom too.
    const floor = 40 + lane * 13, spread = lane ? .5 / (lane + 1) : .7;
    residents.push({ id: species, species, surface, flying, leader,
      progress: between(.5 - spread / 2, .5 + spread / 2, random), target: random(),
      direction: random() < .5 ? 2 : 6, speed: between(flying ? 16 : 9, flying ? 28 : 18, random) * pace(species),
      rest: between(500, 3200, random), nap: false, untilNap: between(16000, 60000, random),
      elapsed: random() * 1000, age: random() * 10000, animation: flying ? "Walk" : "Idle",
      altitude: flying ? between(floor, floor + 12, random) : 0,
      targetAltitude: between(floor, floor + 12, random), reaction: 0, held: false, hop: null, hopTarget: null });
  };
  // Bonded pairs get a wide ledge to themselves and arrive together.
  const bonded = new Set(PAIRS.flat());
  const taken = new Set<string>();
  for (const [lead, follower] of shuffle(PAIRS, random)) {
    const ledge = platforms.find(s => !taken.has(s.id) && s.width >= 200);
    if (!ledge) break;
    taken.add(ledge.id);
    add(lead, ledge.id, false);
    add(follower, ledge.id, false, lead);
    const leader = residents[residents.length - 2], companion = residents[residents.length - 1];
    const gap = Math.min(.42, 46 / Math.max(1, ledge.width - 80));
    leader.progress = Math.max(gap + .03, Math.min(.97 - gap, leader.progress));
    companion.progress = companion.target = leader.progress + (leader.direction === 2 ? -gap : gap);
  }
  // No species owns the project grid. Draw whoever turns up for its tiles and let
  // the rest walk; hopping is a property of the tile you land on, not of who you are.
  const spokenFor = new Set([...bonded, ...EEVEELUTIONS]);
  const roster = shuffle(GROUND_SPECIES.filter(s => !spokenFor.has(s)), random);
  let next = 0;
  for (const ledge of platforms) {
    if (taken.has(ledge.id)) continue;
    taken.add(ledge.id);
    for (let lane = 0; lane < capacity(ledge.width) && roster[next]; lane++) add(roster[next++], ledge.id, false, null, lane);
  }
  for (const card of shuffle(hopCards, random).slice(0, TILE_RESIDENTS)) if (roster[next]) add(roster[next++], card.id, false);
  const occupied = new Set(residents.map(a => a.surface));
  const airspace = shuffle(surfaces.filter(s => (s.divider || s.id === "sky-about" || s.kind === "air") && s.id !== battleSurface?.id && !occupied.has(s.id)), random);
  const corviknight = airspace.findIndex(s => s.id === "sky-footer");
  if (corviknight >= 0) add("corviknight", airspace.splice(corviknight, 1)[0].id, true);
  const flyers = shuffle(FLYING_SPECIES.filter(s => corviknight < 0 || s !== "corviknight"), random);
  let aloft = 0;
  for (const sky of airspace)
    for (let lane = 0; lane < capacity(sky.width) && flyers[aloft]; lane++) add(flyers[aloft++], sky.id, true, null, lane);
  if (battleSurface) { add("armarouge", battleSurface.id, false); add("ceruledge", battleSurface.id, false); }
  return { residents, battle: battleSurface ? { surface: battleSurface.id, elapsed: 0, duration: between(2200, 6500, random), phase: "rest", center: between(.4, .6, random), rounds: 0, attacker: "armarouge", gap: 83 } : null };
}

function animate(actor: Resident, animation: string, dt: number) {
  if (actor.animation !== animation) { actor.animation = animation; actor.elapsed = 0; }
  else actor.elapsed += dt;
}

export function greetResident(actor: Resident, random = Math.random) {
  if (["armarouge", "ceruledge"].includes(actor.species)) return false;
  if (actor.hop) { actor.surface = actor.hop.to; actor.progress = actor.hop.landing; actor.hop = null; }
  actor.hopTarget = null;
  actor.reaction = 1800; actor.nap = false; actor.rest = 2400;
  actor.untilNap = between(25000, 75000, random);
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
export function adjacentHopCards(surface: string, rects: Map<string, SurfaceRect>) {
  const from = rects.get(surface);
  if (!from || !HOP_CARD.test(surface)) return [];
  return [...rects].filter(([id, r]) => id !== surface && HOP_CARD.test(id) && Math.abs(r.top - from.top) < 3 &&
    (Math.abs(r.left - from.right) <= 40 || Math.abs(from.left - r.right) <= 40)).map(([id]) => id);
}

export function stepOverworld(world: Overworld, delta: number, visibleWidths: Map<string, number>, random = Math.random, rects = new Map<string, SurfaceRect>()) {
  const dt = Math.min(Math.max(delta, 0), 64);
  for (const actor of world.residents) {
    const width = visibleWidths.get(actor.surface);
    if (actor.hop && !adjacentHopCards(actor.hop.from, rects).includes(actor.hop.to)) {
      actor.hop = null; actor.hopTarget = null; actor.rest = 1000; animate(actor, "Idle", 0);
    }
    if (actor.hopTarget && !adjacentHopCards(actor.surface, rects).includes(actor.hopTarget)) actor.hopTarget = null;
    if (!width || ["armarouge", "ceruledge"].includes(actor.species)) continue;
    if (actor.hop) {
      if (!actor.held) actor.hop.elapsed += dt;
      animate(actor, "Hop", dt);
      if (actor.hop.elapsed >= actor.hop.duration) {
        actor.surface = actor.hop.to; actor.progress = actor.hop.landing;
        actor.hop = null; actor.rest = between(800, 3500, random); animate(actor, "Idle", 0);
      }
      continue;
    }
    actor.age += dt;
    if (actor.reaction > 0) {
      actor.reaction = Math.max(0, actor.reaction - dt);
      animate(actor, actor.flying && actor.altitude > 1 ? "Walk" : "Idle", dt); continue;
    }
    if (actor.held) { animate(actor, actor.flying && actor.altitude > 1 ? "Walk" : actor.nap ? "Sleep" : "Idle", dt); continue; }
    // A follower runs no errands of its own: it shadows its partner, naps when the
    // partner naps, and hops after it rather than being teleported across.
    const partner = actor.leader ? world.residents.find(a => a.id === actor.leader) : undefined;
    if (partner) {
      actor.hopTarget = null;
      actor.nap = partner.nap; actor.untilNap = partner.untilNap;
      if (partner.surface !== actor.surface && !actor.hop && !partner.hop) {
        if (adjacentHopCards(actor.surface, rects).includes(partner.surface)) {
          actor.hopTarget = partner.surface;
          actor.target = rects.get(partner.surface)!.left > rects.get(actor.surface)!.left ? 1 : 0;
          actor.rest = 0;
        } else { actor.surface = partner.surface; actor.progress = partner.progress; }
      } else if (!actor.hop) {
        // Hold station a body's width behind, measured in pixels so narrow project
        // tiles do not squeeze the pair inside each other's collision gap.
        const gap = Math.min(.42, 42 / Math.max(1, width - 80));
        actor.target = Math.min(.97, Math.max(.03, partner.progress + (partner.direction === 2 ? -gap : gap)));
        actor.speed = Math.max(actor.speed, partner.speed * 1.2);
        if (partner.nap) actor.rest = Math.max(actor.rest, 400);
        else if (Math.abs(actor.target - actor.progress) * Math.max(1, width - 80) > 6) actor.rest = 0;
      }
    }
    actor.untilNap -= dt;
    if (!actor.nap && actor.untilNap <= 0) {
      actor.nap = true; actor.rest = between(7000, 18000, random); actor.target = actor.progress; actor.hopTarget = null;
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
        actor.hopTarget = null;
        // Whoever is standing on a project tile may hop to the one beside it.
        const options = adjacentHopCards(actor.surface, rects);
        if (options.length && random() < .7) {
          actor.hopTarget = options[Math.floor(random() * options.length)];
          actor.target = rects.get(actor.hopTarget)!.left > rects.get(actor.surface)!.left ? 1 : 0;
        }
        actor.speed = between(actor.flying ? 14 : 8, actor.flying ? 30 : 19, random) * pace(actor.species);
        actor.targetAltitude = between(40, 63, random);
        animate(actor, actor.flying ? "Walk" : "Idle", 0);
      }
      continue;
    }
    const distance = (actor.target - actor.progress) * Math.max(1, width - 80);
    if (Math.abs(distance) < .8) {
      actor.progress = actor.target; actor.rest = between(1000, actor.flying ? 5000 : 6500, random);
      if (actor.hopTarget && adjacentHopCards(actor.surface, rects).includes(actor.hopTarget)) {
        const landing = actor.target === 1 ? 0 : 1;
        const destination = actor.hopTarget;
        const occupied = world.residents.some(other => other !== actor && (
          (other.surface === destination && Math.abs(other.progress - landing) * Math.max(1, rects.get(destination)!.width - 80) < 34) ||
          (other.hop?.to === destination && other.hop.landing === landing)));
        if (!occupied) actor.hop = { from: actor.surface, to: destination, start: actor.progress, landing, elapsed: 0, duration: between(650, 850, random) };
        actor.hopTarget = null;
      }
      animate(actor, actor.flying ? "Walk" : "Idle", dt);
      if (actor.hop) {
        actor.direction = actor.hop.landing === 0 ? 2 : 6;
        animate(actor, "Hop", 0);
      } else if (!actor.flying && random() < .4) actor.direction = [0, 2, 4, 6][Math.floor(random() * 4)];
    } else {
      actor.direction = distance > 0 ? 2 : 6;
      const speed = Math.min(actor.speed, Math.max(3, Math.abs(distance) * 1.8));
      const next = approach(actor.progress, actor.target, speed * dt / 1000 / Math.max(1, width - 80));
      // Residents can pass on shared ledges; collision waits can deadlock a pair
      // trying to swap places. Hop landings still avoid occupied edge positions.
      actor.progress = next;
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
