// Export the same safe initial seats for the script-free README renderer.
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("src/components/friend-areas.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { createResidents } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const catalog = JSON.parse(
  fs.readFileSync("public/friend-areas/catalog.json", "utf8"),
);
fs.writeFileSync(
  "public/friend-areas/seats.json",
  JSON.stringify(
    Object.fromEntries(
      catalog.areas.map((area) => {
        // One safe seat per actual resident slot. README assigns guests to the
        // final seats at regeneration; it never needs to duplicate nav code.
        return [area.id, createResidents(area,()=>0.5)];
      }),
    ),
    null,
    2,
  ) + "\n",
);
