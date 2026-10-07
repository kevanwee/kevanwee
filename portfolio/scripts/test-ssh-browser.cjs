/** The SSH window: run against a production server (npm run build && npx next start -p 3005), like the other
 *  browser checks. BASE_URL and PLAYWRIGHT_MODULE work as in test-overworld-browser. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://localhost:3005';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/');
  const ssh = page.locator('[data-ssh-launcher]');
  // The SSH button replaces 3D, and Yveltal's egg docks on it
  assert.equal((await ssh.innerText()).replace(/\s+/g, ' ').trim(), '>_ SSH');
  assert.equal(await page.getByTitle('View 3D portfolio').count(), 0);
  assert.ok(await ssh.getAttribute('data-yveltal-perch') !== null);
  const win = page.getByRole('dialog', { name: /guest@kevanwee/ });
  const command = page.getByLabel('Terminal command');
  const run = async c => { await command.fill(c); await command.press('Enter'); };
  // Measure only once the open/restore animation has finished
  const settle = () => page.evaluate(() => Promise.all((document.querySelector('.term-floating')?.getAnimations() ?? []).map(a => a.finished.catch(() => null))));
  await ssh.click(); await command.waitFor(); await settle();
  assert.ok(await command.evaluate(el => el === document.activeElement), 'the prompt has focus');
  // On a wide screen it opens beside the button, leaving the button free
  const opened = await win.boundingBox(), button = await ssh.boundingBox();
  assert.ok(opened.x >= button.x + button.width, 'opens beside the button');
  // The welcome starts in view from the top: the name banner
  assert.ok(await win.locator('.term-banner').evaluate(el => { const r = el.getBoundingClientRect(), s = el.closest('.term-screen').getBoundingClientRect(); return r.top >= s.top - 1; }));
  // The button minimises an open window, like a taskbar
  await ssh.click(); await win.waitFor({ state: 'hidden' }); await ssh.click(); await win.waitFor(); await settle();
  await run('cd projects');
  await page.waitForFunction(() => document.querySelector('#ssh-title')?.textContent?.includes('~/projects'));
  // Dragged by its title bar, kept on screen
  const bar = await win.locator('.term-bar').boundingBox(), before = await win.boundingBox();
  await page.mouse.move(bar.x + 300, bar.y + 15); await page.mouse.down();
  await page.mouse.move(bar.x + 100, bar.y + 115, { steps: 8 }); await page.mouse.up();
  const after = await win.boundingBox();
  assert.deepEqual([Math.round(after.x - before.x), Math.round(after.y - before.y)], [-200, 100]);
  await page.mouse.move(bar.x + 100, bar.y + 115); await page.mouse.down();
  await page.mouse.move(-2000, -2000, { steps: 4 }); await page.mouse.up();
  const kept = await win.boundingBox();
  assert.deepEqual([kept.x, kept.y], [0, 0], 'the title bar and its buttons stay reachable');
  // Minimise shrinks it into the button and keeps the session; the button restores it
  await win.getByRole('button', { name: 'Minimise' }).click();
  await win.waitFor({ state: 'hidden' });
  assert.ok(await ssh.evaluate(el => el === document.activeElement), 'focus returns to the button');
  await ssh.click(); await win.waitFor();
  assert.match(await page.locator('#ssh-title').innerText(), /~\/projects/);
  // Escape minimises too
  await command.focus(); await page.keyboard.press('Escape'); await win.waitFor({ state: 'hidden' });
  await ssh.click(); await win.waitFor(); await settle();
  // Maximise fills the viewport, and back
  await win.getByRole('button', { name: 'Maximise' }).click();
  const max = await win.boundingBox(); assert.ok(max.width > 1400 && max.height > 860);
  await win.getByRole('button', { name: 'Restore size' }).click();
  // exit closes; the next open is a fresh session
  await run('exit'); await page.getByRole('dialog').waitFor({ state: 'detached' });
  await ssh.click(); await command.waitFor();
  assert.match(await page.locator('#ssh-title').innerText(), /: ~ —/);
  await win.getByRole('button', { name: 'Close' }).click(); await page.getByRole('dialog').waitFor({ state: 'detached' });
  // A phone gets the whole screen, without horizontal overflow
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await phone.goto(base + '/');
  await phone.locator('[data-ssh-launcher]').scrollIntoViewIfNeeded(); await phone.locator('[data-ssh-launcher]').tap();
  await phone.getByLabel('Terminal command').waitFor();
  const box = await phone.getByRole('dialog').boundingBox();
  assert.deepEqual([box.x, box.y, box.width], [8, 8, 374]);
  assert.ok(await phone.locator('.term-banner').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'the banner fits');
  // Reduced motion: no animation, same behaviour
  const still = await browser.newPage({ reducedMotion: 'reduce' });
  await still.goto(base + '/'); await still.locator('[data-ssh-launcher]').click();
  await still.getByRole('dialog').getByRole('button', { name: 'Minimise' }).click();
  await still.getByRole('dialog').waitFor({ state: 'hidden', timeout: 500 });
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('ssh window: open, drag, clamp, minimise, restore, escape, maximise, exit, close, phone, reduced motion ok');
})().catch(e => { console.error(e); process.exit(1); });
