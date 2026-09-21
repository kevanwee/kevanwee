const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = readFileSync(resolve(__dirname, '../src/lib/pokemon-overworld.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function('exports', js)(api);
const { createOverworld, stepOverworld, GROUND_SPECIES, FLYING_SPECIES, SILVALLY_FORMS, animationFrame } = api;
const assets = JSON.parse(readFileSync(resolve(__dirname, '../src/data/overworld-sprites.json')));
assert.equal(SILVALLY_FORMS.length, 17);
assert.equal(Object.keys(assets).length, 30);

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
for (let seed = 1; seed <= 32; seed++) {
  const random = seeded(seed);
  const surfaces = [
    { id: 'sky-about', width: 550, divider: false },
    ...Array.from({ length: 4 }, (_, i) => ({ id: `divider-${i}`, width: 550, divider: true })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `card-${i}`, width: 550, divider: false })),
  ];
  const world = createOverworld(surfaces, random);
  assert.equal(world.residents.length, 13);
  assert.deepEqual(new Set(world.residents.map(a => a.species)), new Set([...GROUND_SPECIES, ...FLYING_SPECIES, 'armarouge', 'ceruledge']));
  const ground = world.residents.filter(a => GROUND_SPECIES.includes(a.species));
  assert.equal(new Set(ground.map(a => a.surface)).size, 6, 'ground residents overlap surfaces');
  assert.ok(ground.every(a => a.surface !== 'sky-about' && a.surface !== world.battle.surface));
  assignments.add(ground.map(a => a.species + a.surface).join(','));
  const before = JSON.stringify(world);
  stepOverworld(world, 50000, new Map(), random);
  assert.equal(JSON.stringify(world), before, 'offscreen actors must freeze');
  let previousPositions;
  let moved = false;
  for (let frame = 0; frame < 2500; frame++) {
    // Resize during approach/attacks/retreat; check 320px phone through desktop surfaces.
    const width = frame % 210 < 90 ? 272 : frame % 210 < 160 ? 554 : 928;
    const visible = new Map(surfaces.map(s => [s.id, width]));
    stepOverworld(world, 40, visible, random);
    phases.add(world.battle.phase);
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
}
assert.ok(assignments.size > 20, 'placements are not varied');
for (const phase of ['approach', 'ready', 'armarouge-attacks', 'ceruledge-attacks', 'retreat', 'rest']) assert.ok(phases.has(phase), phase);
assert.equal(animationFrame([4, 8, 2], 64), 1);
assert.equal(animationFrame([4, 8, 2], 224), 0);
assert.equal(animationFrame([4, 8, 2], 1000, false), 2);
console.log(`Overworld passed: ${files} source hashes, 30 variants, all 13 residents, 32 random seeds, 100 simulated seconds each, responsive bounds and all battle phases.`);
