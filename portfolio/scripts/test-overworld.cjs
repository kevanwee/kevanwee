const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = readFileSync(resolve(__dirname, '../src/lib/pokemon-overworld.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function('exports', js)(api);
const { createOverworld, stepOverworld, createWanderer, stepWanderer, greetResident, GROUND_SPECIES, FLYING_SPECIES, SILVALLY_FORMS, animationFrame } = api;
const assets = JSON.parse(readFileSync(resolve(__dirname, '../src/data/overworld-sprites.json')));
assert.equal(SILVALLY_FORMS.length, 17);
assert.equal(Object.keys(assets).length, 31);

// Validate every runtime source against the actual PNG header, timing and alpha bounds.
for (const [id, sprite] of Object.entries(assets)) {
  for (const [name, anim] of Object.entries(sprite.animations)) {
    const file = resolve(__dirname, '../public' + anim.src);
    assert.ok(existsSync(file), `${id}/${name} missing`);
    const bytes = readFileSync(file);
    assert.equal(bytes.readUInt32BE(16), anim.w * anim.durations.length, `${id}/${name} width`);
    assert.equal(bytes.readUInt32BE(20), anim.h * anim.rows, `${id}/${name} height`);
    assert.ok(anim.durations.every(d => d > 0));
    assert.ok(anim.bounds.every(b => b[0] >= 0 && b[1] >= 0 && b[2] <= anim.w && b[3] <= anim.h));
  }
}
const receipts = JSON.parse(readFileSync(resolve(__dirname, '../public/overworld/sources.json')));
let files = 0;
for (const pack of receipts.packs) for (const file of pack.files) {
  const bytes = readFileSync(resolve(__dirname, `../public/overworld/${pack.id}/${file.name}`));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${pack.id}/${file.name} differs from supplied file`);
  files++;
}

function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
const assignments = new Set();
const phases = new Set();
const sleepers = new Set();
const battleDurations = new Set();
const angles = new Set();
const apparentHeight = id => Math.max(...[2, 6].map(row => { const b = assets[id].animations.Walk.bounds[row]; return (b[3] - b[1]) * assets[id].scale; }));
assert.ok(apparentHeight('rowlet') < 24 && apparentHeight('rowlet') < apparentHeight('corviknight') * .6, 'Rowlet must stay small beside larger birds');
for (let seed = 1; seed <= 32; seed++) {
  const random = seeded(seed);
  const surfaces = [
    { id: 'sky-about', width: 550, divider: false },
    { id: 'sky-footer', width: 550, divider: false, kind: 'air' },
    ...Array.from({ length: 4 }, (_, i) => ({ id: `divider-${i}`, width: 550, divider: true })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `card-${i}`, width: 550, divider: false, kind: 'featured' })),
    ...['skills', 'media-card'].map(kind => ({id: kind, kind, width: 272, divider: false})),
    ...Array.from({length: 3}, (_, i) => ({id: `other-project-${i}`, kind: 'other-project', width: 156, divider: false})),
  ];
  const world = createOverworld(surfaces, random);
  assert.equal(world.residents.length, 13);
  assert.deepEqual(new Set(world.residents.map(a => a.species)), new Set([...GROUND_SPECIES, ...FLYING_SPECIES, 'armarouge', 'ceruledge']));
  const ground = world.residents.filter(a => GROUND_SPECIES.includes(a.species));
  assert.equal(new Set(ground.map(a => a.surface)).size, 7, 'ground residents overlap initial surfaces');
  assert.ok(ground.every(a => a.surface !== 'sky-about' && a.surface !== world.battle.surface));
  for (const kind of ['skills', 'media-card']) assert.ok(ground.some(a => a.surface === kind), `${kind} has no resident`);
  assert.equal(world.residents.find(a => a.species === 'rowlet').flying, false);
  assert.equal(world.residents.find(a => a.species === 'corviknight').surface, 'sky-footer');
  assert.equal(world.residents.find(a => a.species === 'fidough').surface, 'other-project-0');
  assert.equal(world.residents.find(a => a.species === 'goomy').surface, 'other-project-2');
  for (const flyer of world.residents.filter(a => a.flying)) assert.ok(!ground.some(a => a.surface === flyer.surface) && flyer.surface !== world.battle.surface, 'Keep airspaces uncrowded');
  assignments.add(ground.map(a => a.species + a.surface).join(','));
  const before = JSON.stringify(world);
  stepOverworld(world, 50000, new Map(), random);
  assert.equal(JSON.stringify(world), before, 'offscreen actors must freeze');
  let previousPositions;
  let moved = false;
  const wanderer = createWanderer(random);
  for (let frame = 0; frame < 2500; frame++) {
    // Resize during approach/attacks/retreat; check 320px phone through desktop surfaces.
    const width = frame % 210 < 90 ? 272 : frame % 210 < 160 ? 554 : 928;
    const visible = new Map(surfaces.map(s => [s.id, width]));
    stepOverworld(world, 40, visible, random);
    stepWanderer(wanderer, 40, frame % 300 < 150 ? 100 : 272, frame % 300 < 150 ? 500 : 32, random);
    assert.ok(wanderer.x >= 0 && wanderer.x <= 1 && wanderer.y >= 0 && wanderer.y <= 1, 'Silvally escaped habitat');
    angles.add(wanderer.direction);
    if (wanderer.animation === 'Sleep') sleepers.add('silvally');
    phases.add(world.battle.phase);
    battleDurations.add(Math.round(world.battle.duration));
    for (const actor of world.residents) {
      if (actor.flying) assert.notEqual(actor.animation, 'Hover', 'Do not loop action/spin sheets as flight');
      if (actor.animation === 'Sleep') {
        sleepers.add(actor.species);
        assert.equal(actor.altitude, 0, 'A sleeping flyer must have landed');
      }
    }
    for (const actor of world.residents) assert.ok(actor.progress >= 0 && actor.progress <= 1, `${actor.species} escaped surface at ${width}px`);
    const a = world.residents.find(a => a.species === 'armarouge');
    const c = world.residents.find(a => a.species === 'ceruledge');
    assert.equal(a.surface, c.surface);
    assert.ok(c.progress > a.progress, 'battle participants crossed');
    assert.notEqual(a.direction, c.direction, 'battle participants must face opposite ways');
    if (world.battle.phase.includes('attacks')) assert.equal(a.direction, 2, 'attack must face partner');
    const positions = ground.map(a => a.progress).join(',');
    if (previousPositions && positions !== previousPositions) moved = true;
    previousPositions = positions;
  }
  assert.ok(moved, 'ground residents never walked');
  const actor = ground[0];
  actor.nap = true; actor.animation = 'Sleep';
  const position = actor.progress;
  assert.equal(greetResident(actor), true);
  stepOverworld(world, 40, new Map(surfaces.map(s => [s.id, 272])), random);
  assert.equal(actor.nap, false, 'Greeting should wake a sleeper');
  assert.equal(actor.progress, position, 'Greeting must hold still');
  assert.equal(actor.direction, 0, 'Greeting faces the visitor');
  assert.ok(actor.reaction > 0);
  assert.equal(greetResident(world.residents.find(a => a.species === 'armarouge')), false);
}
assert.ok(assignments.size > 20, 'placements are not varied');
for (const phase of ['approach', 'ready', 'armarouge-attacks', 'ceruledge-attacks', 'retreat', 'rest']) assert.ok(phases.has(phase), phase);
assert.equal(angles.size, 8, 'Silvally must expose all eight directions');
assert.ok(battleDurations.size > 100, 'Bouts must vary, not run a fixed cycle');
assert.deepEqual(sleepers, new Set([...GROUND_SPECIES, ...FLYING_SPECIES, 'silvally']));
assert.equal(animationFrame([4, 8, 2], 64), 1);
assert.equal(animationFrame([4, 8, 2], 224), 0);
assert.equal(animationFrame([4, 8, 2], 1000, false), 2);
// Card hopping follows real geometry, including a mid-hop responsive reflow.
const cards = Array.from({length: 3}, (_, i) => ({id: `other-project-${i}`, width: 156, divider: false}));
const cardRects = new Map(cards.map((c, i) => [c.id, {left: i * 170, right: i * 170 + 156, width: 156, top: 100}]));
assert.deepEqual(api.adjacentHopCards('other-project-1', cardRects), ['other-project-0', 'other-project-2']);
const stacked = new Map(cards.map((c, i) => [c.id, {left: 0, right: 272, width: 272, top: i * 280}]));
assert.deepEqual(api.adjacentHopCards('other-project-0', stacked), []);
const visited = {fidough: new Set(), goomy: new Set()};
let hops = 0;
for (let seed = 1; seed <= 12; seed++) {
  const random = seeded(seed), world = createOverworld(cards, random), widths = new Map(cards.map(c => [c.id, c.width]));
  for (let i = 0; i < 10000; i++) {
    stepOverworld(world, 40, widths, random, cardRects);
    for (const a of world.residents) {
      visited[a.species].add(a.surface);
      if (a.hop) { hops++; assert.ok(api.adjacentHopCards(a.hop.from, cardRects).includes(a.hop.to)); }
    }
  }
  const a = world.residents[0];
  a.surface = 'other-project-0'; a.hop = {from: a.surface, to: 'other-project-1', start: 1, landing: 0, elapsed: 200, duration: 700};
  stepOverworld(world, 40, new Map(), random, stacked);
  assert.equal(a.hop, null, 'Cancel even offscreen hops when phone cards stack');
  assert.equal(a.surface, 'other-project-0');
}
assert.ok(hops > 100);
for (const surfaces of Object.values(visited)) assert.equal(surfaces.size, 3, 'Both jumpers can visit all three cards');

const flightSource = readFileSync(resolve(__dirname, '../src/lib/yveltal-flight.ts'), 'utf8');
const flightApi = {};
new Function('exports', 'require', ts.transpileModule(flightSource, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText)(flightApi, () => api);
const flight = flightApi.createFlight(300, 300), random = seeded(42), flightDirections = new Set();
for (let i = 0; i < 20000; i++) {
  const bounds = i % 300 < 150 ? {left: 40, right: 280, top: 75, bottom: 490} : {left: 50, right: 1390, top: 80, bottom: 900};
  flightApi.stepFlight(flight, 40, bounds, false, random);
  assert.ok(flight.x >= bounds.left && flight.x <= bounds.right && flight.y >= bounds.top && flight.y <= bounds.bottom);
  flightDirections.add(flight.direction);
}
assert.equal(flightDirections.size, 8);
const wall = [{left: 40, right: 60, top: 0, bottom: 100}];
assert.equal(flightApi.clearFlightPath(10, 50, 90, 50, wall), false, 'Clear destinations must not permit crossing text in between');
assert.equal(flightApi.clearFlightPath(10, 120, 90, 120, wall), true);
const blockedFlight = flightApi.createFlight(50, 50), arena = {left: 0, right: 100, top: 0, bottom: 160};
assert.equal(flightApi.settleFlight(blockedFlight, arena, wall), true);
for (let i = 0; i < 15000; i++) {
  const before = {x: blockedFlight.x, y: blockedFlight.y};
  flightApi.stepFlight(blockedFlight, 64, arena, false, random, wall);
  assert.ok(flightApi.clearFlightPath(before.x, before.y, blockedFlight.x, blockedFlight.y, wall), 'Each movement segment must avoid obstacles');
}
assert.equal(flightApi.settleFlight(blockedFlight, arena, [{left: -1, right: 101, top: -1, bottom: 161}]), false, 'No space means hide, not overlap');
console.log(`Overworld passed: ${files} source hashes, ground Rowlet, separate flyers, all three hopping cards, responsive hop cancellation, bounded Yveltal flight, naps, greetings, forms and random battles.`);
