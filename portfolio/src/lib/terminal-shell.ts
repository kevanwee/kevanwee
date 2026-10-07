// The terminal at /terminal: a pretend SSH session over the portfolio. Its folders are the page's sections and
// its files are built from src/data, the same module the page renders, so it never needs updating on its own.
// Pure (no imports): scripts/test-terminal.cjs drives it with the real data.

export interface Link { label: string; url: string }
export interface File { kind: 'file'; name: string; lines: string[]; links?: Link[]; open?: string }
export interface Dir { kind: 'dir'; name: string; children: Node[] }
export type Node = File | Dir;

/** The shapes the terminal reads from src/data (structurally, so the data module stays the source). */
export interface PortfolioData {
  personal: { name: string; fullName: string; title: string; institution: string; description: string; tagline: string;
    email: string; linkedin: string; github: string; instagram: string };
  aboutParagraphs: readonly string[];
  achievements: readonly string[];
  educationHistory: readonly { institution: string; qualification: string; period: string; grade?: string;
    activities?: string[]; leadership?: string[]; achievements?: string[] }[];
  experiences: readonly { id: string; company: string; role: string; subtitle: string; period: string; type: string;
    url: string; bullets: string[] }[];
  featuredProjects: readonly { id: string; title: string; role?: string; description: string; tags: string[];
    github: string | null; external: string | null; publications?: { label: string; url: string }[] }[];
  otherProjects: readonly { title: string; description: string; tags: string[]; github: string | null; external: string | null }[];
  mediaAppearances: readonly { outlet: string; title: string; date: string; url: string; type: string }[];
  careerDocuments: readonly { id: string; available: boolean; label: string; description: string; href: string; filename: string }[];
}

/** A file name from a title: lower case, words joined by hyphens, at most 40 characters. */
export function slug(text: string): string {
  const s = text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (s.slice(0, 40).replace(/-+$/, '') || 'item');
}

/** Names unique within a folder: a repeat gets -2, -3… */
function unique(nodes: Node[]): Node[] {
  const seen = new Map<string, number>();
  return nodes.map(n => {
    const base = n.name.replace(/\.(txt|pdf|lnk)$/, ''), ext = n.name.slice(base.length);
    const count = (seen.get(n.name) ?? 0) + 1;
    seen.set(n.name, count);
    return count === 1 ? n : { ...n, name: `${base}-${count}${ext}` };
  });
}

const dir = (name: string, children: Node[]): Dir => ({ kind: 'dir', name, children: unique(children) });
const file = (name: string, lines: string[], links: Link[] = [], open?: string): File =>
  ({ kind: 'file', name, lines, links: links.length ? links : undefined, open });
const list = (title: string, items?: readonly string[]) => items?.length ? ['', `${title}:`, ...items.map(i => `  • ${i}`)] : [];

/** The home folder, one folder per section of the page (About, Experience, Projects, Media, Contact). */
export function buildTree(d: PortfolioData): Dir {
  const p = d.personal;
  const about = dir('about', [
    file('bio.txt', [p.fullName, `${p.title} · ${p.institution}`, p.tagline, '', ...d.aboutParagraphs.flatMap((t, i) => i ? ['', t] : [t])]),
    file('achievements.txt', d.achievements.map(a => `• ${a}`)),
    dir('education', d.educationHistory.map(e => file(`${slug(e.institution + ' ' + e.period)}.txt`, [
      e.institution, e.qualification, e.period, ...(e.grade ? [e.grade] : []),
      ...list('Activities', e.activities), ...list('Leadership', e.leadership), ...list('Achievements', e.achievements),
    ]))),
  ]);
  const experience = dir('experience', d.experiences.map(x => file(`${slug(x.company + ' ' + x.role)}.txt`, [
    `${x.role} · ${x.company}`, x.subtitle, `${x.period} · ${x.type}`, '', ...x.bullets.map(b => `• ${b}`),
  ], x.url ? [{ label: x.company, url: x.url }] : [])));
  const projectLinks = (pr: { github: string | null; external: string | null }) =>
    [...(pr.github ? [{ label: 'GitHub', url: pr.github }] : []), ...(pr.external ? [{ label: 'Website', url: pr.external }] : [])];
  const projects = dir('projects', [
    dir('featured', d.featuredProjects.map(pr => file(`${slug(pr.title)}.txt`, [
      pr.title, ...(pr.role ? [pr.role] : []), pr.tags.join(' · '), '', pr.description,
    ], [...projectLinks(pr), ...(pr.publications ?? []).map(u => ({ label: u.label, url: u.url }))]))),
    dir('other', d.otherProjects.map(pr => file(`${slug(pr.title)}.txt`, [pr.title, pr.tags.join(' · '), '', pr.description], projectLinks(pr)))),
  ]);
  const media = dir('media', d.mediaAppearances.map(m => file(`${slug(m.outlet + ' ' + m.date)}.txt`, [
    m.title, `${m.outlet} · ${m.type} · ${m.date}`,
  ], [{ label: 'Read it', url: m.url }])));
  const contact = dir('contact', [
    file('email.lnk', [p.email], [], `mailto:${p.email}`),
    file('linkedin.lnk', [p.linkedin], [], p.linkedin),
    file('github.lnk', [p.github], [], p.github),
    file('instagram.lnk', [p.instagram], [], p.instagram),
    ...d.careerDocuments.filter(c => c.available).map(c => file(c.filename.toLowerCase().replace(/_/g, '-'), [c.description], [], c.href)),
  ]);
  return { kind: 'dir', name: '~', children: [about, experience, projects, media, contact] };
}

// ---------------------------------------------------------------------------------------------- the shell

/** One printed line: plain text, or parts with a style and an optional command run when clicked. */
export interface Part { text: string; tone?: 'dir' | 'file' | 'link' | 'muted' | 'error' | 'accent'; run?: string; href?: string }
export type Line = Part[];
export interface Result { lines: Line[]; cwd: string[]; clear?: boolean; exit?: boolean; open?: string }

export const COMMANDS: Record<string, string> = {
  help: 'list the commands',
  ls: 'list a folder (dir works too); -l for details',
  cd: 'change folder: cd projects, cd .., cd ~',
  cat: 'print a file (type works too)',
  open: 'open a file’s link or a .lnk in a new tab',
  tree: 'show every folder and file',
  pwd: 'print the current folder',
  whoami: 'who you are connected as',
  neofetch: 'show the welcome card again',
  history: 'commands you have run',
  clear: 'clear the screen (cls works too)',
  exit: 'leave the session and go back to the portfolio',
};
const ALIASES: Record<string, string> = { dir: 'ls', type: 'cat', cls: 'clear', logout: 'exit', ll: 'ls', '?': 'help', start: 'open' };

export const pathText = (cwd: string[]) => '~' + cwd.map(c => '/' + c).join('');
const err = (text: string): Line => [{ text, tone: 'error' }];
const plain = (text: string): Line => [{ text }];

/** The node at cwd + path, or null. Accepts ~, /, .., . and both slash directions. */
export function resolve(root: Dir, cwd: string[], path: string): { node: Node; at: string[] } | null {
  const parts = path.replace(/\\/g, '/').split('/');
  let at = path.startsWith('~') || path.startsWith('/') ? [] : [...cwd];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part || part === '.' || part === '~') continue;
    if (part === '..') { at.pop(); continue; }
    at = [...at, part];
  }
  let node: Node = root;
  const exact: string[] = [];
  for (const name of at) {
    if (node.kind !== 'dir') return null;
    const next: Node | undefined = node.children.find(c => c.name === name) ?? node.children.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!next) return null;
    node = next; exact.push(next.name);
  }
  return { node, at: exact };
}

function listing(d: Dir, base: string[], long: boolean): Line[] {
  if (!d.children.length) return [[{ text: '(empty)', tone: 'muted' }]];
  const entry = (n: Node): Part => {
    const path = [...base, n.name].join('/');
    return n.kind === 'dir' ? { text: n.name + '/', tone: 'dir', run: `cd ~/${path}` }
      : { text: n.name, tone: 'file', run: `cat ~/${path}` };
  };
  if (long) return d.children.map(n => [
    { text: n.kind === 'dir' ? 'd ' : '- ', tone: 'muted' },
    { text: (n.kind === 'dir' ? `${n.children.length} items` : `${n.lines.length} lines`).padEnd(10), tone: 'muted' }, entry(n)]);
  const line: Line = [];
  d.children.forEach((n, i) => { if (i) line.push({ text: '  ' }); line.push(entry(n)); });
  return [line];
}

function treeLines(d: Dir, base: string[], prefix = ''): Line[] {
  return d.children.flatMap((n, i) => {
    const last = i === d.children.length - 1, path = [...base, n.name];
    const head: Line = [{ text: prefix + (last ? '└── ' : '├── '), tone: 'muted' },
      n.kind === 'dir' ? { text: n.name + '/', tone: 'dir', run: `cd ~/${path.join('/')}` } : { text: n.name, tone: 'file', run: `cat ~/${path.join('/')}` }];
    return n.kind === 'dir' ? [head, ...treeLines(n, path, prefix + (last ? '    ' : '│   '))] : [head];
  });
}

function fileLines(f: File): Line[] {
  const body = f.lines.map(plain);
  const links = (f.links ?? []).map(l => [{ text: '→ ', tone: 'muted' as const }, { text: l.label, tone: 'link' as const, href: l.url }, { text: '  ' + l.url, tone: 'muted' as const }]);
  if (f.open) links.push([{ text: '→ ', tone: 'muted' }, { text: f.open.replace(/^mailto:/, ''), tone: 'link', href: f.open }]);
  return links.length ? [...body, [], ...links] : body;
}

/** Runs one command line. `history` is what was run before it. */
export function run(root: Dir, cwd: string[], input: string, history: string[] = [], user = 'guest'): Result {
  const [word = '', ...args] = input.trim().split(/\s+/);
  const cmd = ALIASES[word.toLowerCase()] ?? word.toLowerCase();
  const flags = args.filter(a => a.startsWith('-') && a.length > 1), target = args.filter(a => !flags.includes(a)).join(' ');
  const same = { cwd };
  switch (cmd) {
    case '': return { lines: [], ...same };
    case 'help': return { ...same, lines: [plain('Folders are the portfolio’s sections. Click any name, or type:'), [],
      ...Object.entries(COMMANDS).map(([c, d]) => [{ text: c.padEnd(10), tone: 'accent' as const, run: c === 'cd' || c === 'cat' || c === 'open' ? undefined : c }, { text: d, tone: 'muted' as const }]),
      [], [{ text: 'Tab completes names; ↑ and ↓ step through history.', tone: 'muted' }]] };
    case 'pwd': return { ...same, lines: [plain(`/home/${user}/${pathText(cwd).slice(2)}`.replace(/\/$/, ''))] };
    case 'whoami': return { ...same, lines: [plain(user)] };
    case 'history': return { ...same, lines: history.map((h, i) => [{ text: String(i + 1).padStart(4) + '  ', tone: 'muted' }, { text: h, run: h }]) };
    case 'clear': return { ...same, lines: [], clear: true };
    case 'exit': return { ...same, lines: [plain('Connection to kevanwee closed.')], exit: true };
    case 'ls': case 'tree': {
      const hit = resolve(root, cwd, target || '.');
      if (!hit) return { ...same, lines: [err(`${word}: ${target}: no such file or folder`)] };
      if (hit.node.kind === 'file') return { ...same, lines: [[{ text: hit.node.name, tone: 'file', run: `cat ~/${hit.at.join('/')}` }]] };
      return { ...same, lines: cmd === 'tree' ? [[{ text: pathText(hit.at), tone: 'dir' }], ...treeLines(hit.node, hit.at)]
        : listing(hit.node, hit.at, flags.some(f => f.includes('l'))) };
    }
    case 'cd': {
      const hit = resolve(root, cwd, target || '~');
      if (!hit) return { ...same, lines: [err(`cd: ${target}: no such folder`)] };
      if (hit.node.kind !== 'dir') return { ...same, lines: [err(`cd: ${target}: not a folder (try cat ${target})`)] };
      return { cwd: hit.at, lines: [] };
    }
    case 'cat': case 'open': {
      if (!target) return { ...same, lines: [err(`${word}: name a file, e.g. ${word} about/bio.txt`)] };
      const hit = resolve(root, cwd, target);
      if (!hit) return { ...same, lines: [err(`${word}: ${target}: no such file`)] };
      if (hit.node.kind === 'dir') return { ...same, lines: [err(`${word}: ${target}: is a folder (try cd ${target})`)] };
      if (cmd === 'open') {
        const url = hit.node.open ?? hit.node.links?.[0]?.url;
        return url ? { ...same, open: url, lines: [[{ text: 'Opening ', tone: 'muted' }, { text: url, tone: 'link', href: url }]] }
          : { ...same, lines: [err(`open: ${hit.node.name} has no link (try cat)`)] };
      }
      return { ...same, lines: fileLines(hit.node) };
    }
    case 'neofetch': return { ...same, lines: [] };
    case 'sudo': return { ...same, lines: [err(`${user} is not in the sudoers file. This incident will be reported.`)] };
    default: return { ...same, lines: [err(`${word}: command not found. Type help.`)] };
  }
}

/** Tab completion: the command or the path being typed, completed as far as it is unambiguous. */
export function complete(root: Dir, cwd: string[], input: string): { input: string; options: string[] } {
  const m = input.match(/^(\s*)(\S*)(\s+)?(.*)$/)!;
  if (!m[3]) {
    const names = [...Object.keys(COMMANDS), ...Object.keys(ALIASES)].filter(c => c.startsWith(m[2].toLowerCase()));
    return names.length === 1 ? { input: m[1] + names[0] + ' ', options: [] } : { input, options: names };
  }
  const arg = m[4], cut = Math.max(arg.lastIndexOf('/'), arg.lastIndexOf('\\')) + 1;
  const folder = resolve(root, cwd, arg.slice(0, cut) || '.'), stem = arg.slice(cut).toLowerCase();
  if (!folder || folder.node.kind !== 'dir') return { input, options: [] };
  const hits = folder.node.children.filter(c => c.name.toLowerCase().startsWith(stem));
  const head = input.slice(0, input.length - arg.length) + arg.slice(0, cut);
  if (hits.length === 1) return { input: head + hits[0].name + (hits[0].kind === 'dir' ? '/' : ''), options: [] };
  if (!hits.length) return { input, options: [] };
  let common = hits[0].name;
  for (const h of hits) while (!h.name.toLowerCase().startsWith(common.toLowerCase())) common = common.slice(0, -1);
  return { input: head + (common.length > stem.length ? common : arg.slice(cut)), options: hits.map(h => h.name + (h.kind === 'dir' ? '/' : '')) };
}
