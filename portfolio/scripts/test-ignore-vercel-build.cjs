const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { unchanged } = require('./ignore-vercel-build.cjs');

test('only skips a known unchanged portfolio, and builds safely with a missing shallow-clone baseline', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'portfolio-ignore-'));
  const app = path.join(root, 'portfolio');
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    mkdirSync(app);
    git('init'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.com');
    writeFileSync(path.join(app, 'page.txt'), 'first'); git('add', '.'); git('commit', '-m', 'Initial portfolio');
    const baseline = git('rev-parse', 'HEAD');
    writeFileSync(path.join(root, 'README.md'), 'Garden refresh'); git('add', '.'); git('commit', '-m', 'README only');
    assert.equal(unchanged(baseline, app), true);
    writeFileSync(path.join(app, 'page.txt'), 'new media design'); git('add', '.'); git('commit', '-m', 'Media change');
    assert.equal(unchanged(baseline, app), false);
    assert.equal(unchanged('a'.repeat(40), app), false);
    assert.equal(unchanged('', app), false);
    assert.equal(unchanged('invalid', app), false);
    assert.equal(unchanged(baseline, tmpdir()), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
