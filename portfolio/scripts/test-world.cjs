const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
// Compile the pure module in memory, using the project's existing compiler.
const source = readFileSync(resolve(__dirname, '../src/lib/pokemon-world.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function('exports', js)(api);
const { createWorld, stepWorld, terrainFits, callActor, dropBerry, greet, segmentDistance } = api;
const mapFor = id => JSON.parse(readFileSync(resolve(__dirname, `../public/worlds/${id}/map.json`), 'utf8'));
let checks = 0;
function invariant(world) {
  assert.equal(world.actors.length, world.map.actors.length);
  for (let i = 0; i < world.actors.length; i++) {
    const a = world.actors[i];
    assert.ok(terrainFits(world.map, a, a), `${world.map.id}: ${a.id} escaped terrain at ${a.x},${a.y}`);
    for (let j = i+1; j < world.actors.length; j++) {
      const b = world.actors[j];
      assert.ok(segmentDistance(a, a.next || a, b, b.next || b) >= a.radius+b.radius+.99,
        `${world.map.id}: ${a.id}/${b.id} collided`);
      checks++;
    }
  }
}
assert.equal(segmentDistance({x:0,y:5},{x:10,y:5},{x:5,y:0},{x:5,y:10}), 0);
assert.equal(segmentDistance({x:0,y:0},{x:10,y:0},{x:10,y:0},{x:0,y:0}), 0);
for (const id of ['rt111','mauville']) {
  const map = mapFor(id);
  assert.equal(map.actors.length, id === 'rt111' ? 32 : 12);
  for (let seed = 1; seed <= 8; seed++) {
    const world = createWorld(map, seed);
    for (let frame = 0; frame < 30 * 120; frame++) {
      if (frame % 150 === 0) {
        const actor = world.actors[(frame / 150) % world.actors.length];
        if (frame % 300 === 0) greet(world, actor.id);
        else callActor(world, actor.id, {x: actor.x + 64, y: actor.y});
        dropBerry(world, {x: actor.x, y: actor.y + 32});
      }
      stepWorld(world, 1/30);
      invariant(world);
    }
    assert.ok(world.actors.every(a => a.steps > 0), `immobile residents: ${world.actors.filter(a=>!a.steps).map(a=>a.id)}`);
    console.log(`PASS ${id} seed ${seed}: all ${world.actors.length} residents move safely`);
  }
  const a = createWorld(map, 42), b = createWorld(map, 42);
  for (let n=0;n<300;n++) { stepWorld(a,1/30); stepWorld(b,1/30); }
  assert.deepEqual(a.actors.map(p=>[p.x,p.y,p.state]), b.actors.map(p=>[p.x,p.y,p.state]));
  assert.match(callActor(a, a.actors[0].id, {x:-100,y:-100}), /cannot reach/);
}
// Dense opposing calls exercise stalls/replanning and reservations in a shared corridor.
const corridor = {id:'mauville',title:'Test',width:192,height:80,tileSize:16,
  land:Array(5).fill('111111111111'),water:Array(5).fill('000000000000'),layers:[],foreground:[],overlays:[],
  actors:Array.from({length:8},(_,i)=>({id:`actor${i}`,name:`Actor ${i}`,size:28,frameSize:64,sprite:'',
    shiny:false,habitat:'land',bounds:null,home:{x:24+(i%4)*40,y:i<4?24:56}}))};
const crowd=createWorld(corridor,31);
for(let n=0;n<3600;n++) {
  if(n%90===0) for(const actor of crowd.actors) callActor(crowd,actor.id,{x:184-actor.x,y:actor.y});
  stepWorld(crowd,1/30); invariant(crowd);
}
assert.ok(crowd.actors.every(a=>a.steps>5));
console.log(`PASS deterministic replay, unreachable commands, dense crossings; ${checks.toLocaleString()} reservation checks`);
