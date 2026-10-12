// Every Friend Area: assets exist, natives and visitors have sheets, and ten simulated minutes keep each resident on walkable floor.
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("src/components/friend-areas.ts", "utf8");
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { createResidents, stepResidents, walkable } = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
const root = "public/friend-areas/";
const catalog = JSON.parse(fs.readFileSync(root + "catalog.json", "utf8"));
const ids = new Set();
let seed = 1;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
for (const area of catalog.areas) {
  assert.ok(!ids.has(area.id), `duplicate ${area.id}`); ids.add(area.id);
  for (const file of [area.background, ...(area.layers ?? []).map((l) => l.src)]) assert.ok(fs.existsSync(root + file), `${area.id}: missing ${file}`);
  for (const id of [...area.roster, ...(area.guests ?? []).map((g) => g.id)]) {
    const sprite = catalog.sprites[id];
    assert.ok(sprite, `${area.id}: no sprite ${id}`);
    for (const name of ["Idle", "Walk"]) assert.ok(fs.existsSync(root + sprite.animations[name].src), `${area.id}: missing ${sprite.animations[name].src}`);
  }
  assert.ok(area.zones?.length, `${area.id}: no walk zones`);
  for (let visit = 0; visit < 3; visit++) {
    const actors = createResidents(area, random);
    for (const a of actors) assert.ok(walkable(area, [a.x, a.y]), `${area.id}: spawn off floor`);
    for (let t = 0; t < 10 * 60 * 1000; t += 50) stepResidents(area, actors, 50, random);
    for (const a of actors) assert.ok(walkable(area, [a.x, a.y]), `${area.id}: ${a.id} left the floor`);
  }
}
const original = ["mushroomforest", "mtmoonview", "decrepitlab", "seafloorcave", "volcanicpit", "thundermeadow", "rainbowpeak", "legendaryisland", "healingforest", "waterfalllake", "crystalcrossing"];
assert.deepEqual(catalog.areas.slice(0, original.length).map((a) => a.id), original, "original areas keep their place");
console.log(`Friend Areas passed: ${catalog.areas.length} areas, ${Object.keys(catalog.sprites).length} species, three ten-minute visits each.`);
