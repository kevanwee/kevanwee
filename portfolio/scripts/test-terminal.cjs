// The terminal reads the portfolio's own data: every section, project, role and article appears as a file,
// and the shell's commands behave. Run: node scripts/test-terminal.cjs
const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const load = file => {
  const js = ts.transpileModule(readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const api = {}; new Function('exports', js)(api); return api;
};
const data = load('src/data/index.ts');
const sh = load('src/lib/terminal-shell.ts');
const root = sh.buildTree(data);
const text = r => r.lines.map(l => l.map(p => p.text).join('')).join('\n');
const names = d => d.children.map(c => c.name);

// The page's sections are the folders
assert.deepEqual(names(root), ['about', 'experience', 'projects', 'media', 'contact']);
// Everything in the data module shows up, so nothing needs updating separately
const all = []; (function walk(d, at) { for (const c of d.children) c.kind === 'dir' ? walk(c, [...at, c.name]) : all.push(c); })(root, []);
const body = all.map(f => f.lines.join('\n') + (f.links ?? []).map(l => l.url).join('\n') + (f.open ?? '')).join('\n');
for (const x of data.experiences) { assert.ok(body.includes(x.company), x.company); for (const b of x.bullets) assert.ok(body.includes(b)); }
for (const p of [...data.featuredProjects, ...data.otherProjects]) { assert.ok(body.includes(p.title), p.title); assert.ok(body.includes(p.description)); }
for (const m of data.mediaAppearances) { assert.ok(body.includes(m.title)); assert.ok(body.includes(m.url)); }
for (const e of data.educationHistory) assert.ok(body.includes(e.qualification));
for (const a of data.aboutParagraphs) assert.ok(body.includes(a));
for (const a of data.achievements) assert.ok(body.includes(a));
assert.ok(body.includes(data.personal.email) && body.includes(data.personal.linkedin));
assert.equal(sh.resolve(root, [], 'contact').node.children.filter(c => c.name.endsWith('.pdf')).length,
  data.careerDocuments.filter(c => c.available).length);
// Names are unique within each folder
(function walk(d) { assert.equal(new Set(names(d)).size, d.children.length, d.name); d.children.forEach(c => c.kind === 'dir' && walk(c)); })(root);

// Commands
let r = sh.run(root, [], 'ls');
assert.equal(text(r), 'about/  experience/  projects/  media/  contact/');
assert.equal(r.lines[0][0].run, 'cd ~/about');
assert.deepEqual(sh.run(root, [], 'dir').lines, r.lines, 'dir is ls');
r = sh.run(root, [], 'cd projects/featured'); assert.deepEqual(r.cwd, ['projects', 'featured']);
r = sh.run(root, ['projects', 'featured'], 'cd ..'); assert.deepEqual(r.cwd, ['projects']);
r = sh.run(root, ['projects'], 'cd ~'); assert.deepEqual(r.cwd, []);
r = sh.run(root, [], 'cd ABOUT'); assert.deepEqual(r.cwd, ['about'], 'case-insensitive');
r = sh.run(root, [], String.raw`cd about\education`); assert.deepEqual(r.cwd, ['about', 'education'], 'backslashes, as on Windows');
assert.match(text(sh.run(root, [], 'cd nowhere')), /no such folder/);
assert.match(text(sh.run(root, [], 'cd about/bio.txt')), /not a folder/);
assert.ok(text(sh.run(root, [], 'cat about/bio.txt')).includes(data.aboutParagraphs[0]));
assert.ok(text(sh.run(root, ['about'], 'type bio.txt')).includes(data.personal.fullName), 'type is cat');
assert.match(text(sh.run(root, [], 'cat about')), /is a folder/);
assert.equal(sh.run(root, [], 'open contact/linkedin.lnk').open, data.personal.linkedin);
assert.equal(sh.run(root, [], 'open contact/email.lnk').open, `mailto:${data.personal.email}`);
assert.match(text(sh.run(root, [], 'tree')), /├── about\//);
assert.equal(text(sh.run(root, ['media'], 'pwd')), '/home/guest/media');
assert.ok(sh.run(root, [], 'cls').clear);
assert.ok(sh.run(root, [], 'exit').exit);
assert.match(text(sh.run(root, [], 'rm -rf /')), /command not found/);
assert.match(text(sh.run(root, [], 'ls -l')), /^d 3 items {3}about\//m);

// Tab completion
assert.equal(sh.complete(root, [], 'he').input, 'help ');
assert.equal(sh.complete(root, [], 'cd pro').input, 'cd projects/');
assert.equal(sh.complete(root, [], 'cd projects/fe').input, 'cd projects/featured/');
assert.deepEqual(sh.complete(root, [], 'c').options.sort(), ['cat', 'cd', 'clear', 'cls'].sort());
assert.equal(sh.complete(root, [], 'cd zz').input, 'cd zz');

console.log(`terminal: ${all.length} files from src/data, all commands ok`);
