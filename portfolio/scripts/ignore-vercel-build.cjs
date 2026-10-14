const { spawnSync } = require('node:child_process');

// Vercel: exit 0 skips a build; exit 1 builds. A shallow clone may not contain
// the last deployed SHA. Never let a missing baseline fail or skip a deployment.
function unchanged(base = process.env.VERCEL_GIT_PREVIOUS_SHA, cwd = process.cwd()) {
  if (!base || !/^[a-f0-9]{7,40}$/i.test(base)) return false;
  const git = args => spawnSync('git', args, { cwd, stdio: 'ignore', timeout: 5000 });
  if (git(['cat-file', '-e', `${base}^{commit}`]).status !== 0) return false;
  return git(['diff', '--quiet', base, 'HEAD', '--', '.']).status === 0;
}
module.exports = { unchanged };
if (require.main === module) {
  const skip = unchanged();
  console.log(skip ? 'Portfolio unchanged; skipping build.' : 'Portfolio changed or baseline unavailable; building.');
  process.exitCode = skip ? 0 : 1;
}
