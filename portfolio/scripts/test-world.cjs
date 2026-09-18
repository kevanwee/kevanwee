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
  for (let y=0;y<map.land.length;y++) for(let x=0;x<map.land[y].length;x++) {
    assert.ok(!(map.land[y][x]==='1' && map.solid?.[y][x]==='1'), `${id}: structural collision was overridden at ${x},${y}`);
  }
  assert.ok(map.occlusion?.length > 0);
  for(let i=1;i<map.occlusion.length;i++) assert.ok(map.occlusion[i].y>=map.occlusion[i-1].y,'occlusion spans must be ordered north to south');
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
// Offering a berry must create a clear, reachable tile outside the recipient's body.
const offered = createWorld({...corridor, actors:corridor.actors.slice(0,1)}, 7);
const recipient = offered.actors[0];
assert.match(dropBerry(offered, recipient, recipient.id), /spotted/);
assert.equal(offered.berries.length, 1);
const berry = offered.berries[0];
assert.ok(Math.hypot(recipient.x-berry.x,recipient.y-berry.y) >= recipient.radius+5);
assert.ok(terrainFits(offered.map,recipient,berry));
assert.ok(recipient.path.length > 0);
for(let n=0;n<300;n++) stepWorld(offered,1/30);
assert.equal(offered.berries.length,0,'recipient reaches and eats the offset berry');
const cameraCode=ts.transpileModule(readFileSync(resolve(__dirname,'../src/lib/world-camera.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const cameras={}; new Function('exports',cameraCode)(cameras);
for(const id of ['rt111','mauville']) for(const [w,h] of [[304,360],[1100,500],[1800,100],[200,1200]]) {
  const map=mapFor(id);
  for(const requested of [.0001,.2,1,10]) {
    const camera={x:-200,y:99999,zoom:requested}; cameras.clampCamera(camera,map,w,h);
    assert.ok(camera.x-w/camera.zoom/2>=-1e-6 && camera.x+w/camera.zoom/2<=map.width+1e-6);
    assert.ok(camera.y-h/camera.zoom/2>=-1e-6 && camera.y+h/camera.zoom/2<=map.height+1e-6);
  }
}
console.log('PASS offset berries are reachable; zoom/pan never expose space outside either map');
const elevated={...corridor,elevation:['333333333333','333333333333','444444444444','444444444444','444444444444']};
assert.equal(api.elevationsConnect(elevated,12,24),false,'cannot cross between different heights');
elevated.elevation[2]='044444444444';
assert.equal(api.elevationsConnect(elevated,12,24),true,'explicit transition permits a height change');
// Regression: a tall sprite south of a cliff cap must not be painted over by it.
// Moving behind the same structure reverses the draw order.
const renderCode=ts.transpileModule(readFileSync(resolve(__dirname,'../src/lib/world-session.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const renderer={}; new Function('exports','require',renderCode)(renderer,()=>api);
const draws=[];
const context=new Proxy({drawImage:(...args)=>draws.push(args)}, {get:(target,key)=>key in target?target[key]:()=>{}});
const structure={width:128},sprite={width:256};
const renderMap={...corridor,width:128,height:128,layers:[],foreground:['structure'],structures:'structure',
  occlusion:[{x:48,y:16,width:16,height:32,elevation:3}]};
const renderActor={...recipient,x:56,y:56,size:64,sprite:'sprite',next:null,state:'resting',direction:0};
const session={world:{...offered,map:renderMap,actors:[renderActor],berries:[]},images:new Map([['structure',structure],['sprite',sprite]])};
renderer.drawWorld(context,session,{x:64,y:64,zoom:1},128,128);
assert.ok(draws.findIndex(d=>d[0]===sprite)>draws.findLastIndex(d=>d[0]===structure),'sprite in front of cliff cap remains whole');
draws.length=0; renderActor.y=32;
renderer.drawWorld(context,session,{x:64,y:64,zoom:1},128,128);
assert.ok(draws.findIndex(d=>d[0]===sprite)<draws.findLastIndex(d=>d[0]===structure),'structure occludes the sprite behind it');
console.log('PASS cliff-cap foreground regression and elevation transitions');
console.log(`PASS deterministic replay, unreachable commands, dense crossings; ${checks.toLocaleString()} reservation checks`);
