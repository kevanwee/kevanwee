/** Requires Playwright (or PLAYWRIGHT_MODULE pointing to a local playwright-core install).
 * Start the production site first, then run this script. BASE_URL defaults to localhost:3005.
 * Screenshots go to the OS temporary directory, never public/.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const base = process.env.BASE_URL || 'http://localhost:3005';
const assets = require('../src/data/overworld-sprites.json');

async function scrollSurface(page, id) {
  await page.evaluate(id => {
    const e = [...document.querySelectorAll('[data-overworld-surface]')].find(e => e.dataset.overworldSurface === id);
    window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 160, behavior: 'instant' });
  }, id);
  await page.waitForTimeout(200);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const brokenAssets = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (/\/(overworld|ceruledge)\//.test(r.url()) && r.status() >= 400) brokenAssets.push(r.url()); });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.silvally-resident')?.dataset.form);
    assert.equal(await page.locator('[data-pokemon]').count(), 13);
    await page.screenshot({ path: join(tmpdir(), 'overworld-desktop-top.png') });
    const initialForm = await page.locator('.silvally-resident').getAttribute('data-form');
    await page.waitForFunction(form => document.querySelector('.silvally-resident').dataset.form !== form, initialForm, { timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('.silvally-resident').dataset.changing !== 'true');
    console.log('Automatic Silvally form transition passed.');

    // Enter and Space activate the same real button; every supplied form is reachable.
    await page.locator('.silvally-resident').focus();
    const forms = new Set([initialForm]);
    for (let i = 0; i < 18; i++) {
      const previous = await page.locator('.silvally-resident').getAttribute('data-form');
      forms.add(previous);
      await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
      await page.waitForFunction(form => document.querySelector('.silvally-resident').dataset.form !== form, previous);
      await page.waitForFunction(() => document.querySelector('.silvally-resident').dataset.changing === 'false');
    }
    assert.equal(forms.size, 17);
    console.log('All 17 forms passed keyboard transitions.');

    const battleSurface = await page.locator('[data-pokemon="armarouge"]').getAttribute('data-surface');
    assert.equal(await page.locator('[data-pokemon="ceruledge"]').getAttribute('data-surface'), battleSurface);
    await scrollSurface(page, battleSurface);
    const phases = new Set();
    for (let i = 0; i < 86; i++) {
      phases.add(await page.locator('[data-pokemon="armarouge"]').getAttribute('data-battle-phase'));
      await page.waitForTimeout(200);
    }
    for (const phase of ['approach', 'armarouge-attacks', 'ceruledge-attacks', 'retreat', 'rest']) assert.ok(phases.has(phase), phase);
    await page.screenshot({ path: join(tmpdir(), 'overworld-battle.png') });
    console.log('Paired battle completed every phase.');

    const surfaceIds = await page.locator('[data-overworld-surface]').evaluateAll(es => es.map(e => e.dataset.overworldSurface));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
      for (const id of surfaceIds) {
        await scrollSurface(page, id);
        const issues = await page.evaluate(({ assets, id }) => {
          const issues = [];
          const surface = [...document.querySelectorAll('[data-overworld-surface]')].find(e => e.dataset.overworldSurface === id).getBoundingClientRect();
          // The existing Experience filters overflow at 320px. Verify this feature
          // adds no document width, without silently changing unrelated page layout.
          const widthWithResidents = document.documentElement.scrollWidth;
          const overlays = [document.querySelector('.pokemon-overworld'), document.querySelector('.silvally-resident')];
          overlays.forEach(e => { e.style.display = 'none'; });
          const baselineWidth = document.documentElement.scrollWidth;
          overlays.forEach(e => e.style.removeProperty('display'));
          if (widthWithResidents > baselineWidth) issues.push('overworld adds horizontal overflow');
          for (const node of document.querySelectorAll('[data-pokemon]')) {
            if (node.hidden || node.dataset.surface !== id) continue;
            const sprite = assets[node.dataset.pokemon];
            const anim = sprite.animations[node.dataset.animation] || sprite.animations.Walk;
            const rect = node.getBoundingClientRect();
            const box = anim.bounds[Number(node.dataset.direction)];
            const left = rect.left + box[0] * sprite.scale;
            const right = rect.left + box[2] * sprite.scale;
            if (left < -1 || right > innerWidth + 1) issues.push(node.dataset.pokemon + ' offscreen horizontally');
            if (node.dataset.flying === 'false' && ['Walk', 'Idle'].includes(node.dataset.animation)) {
              const feet = rect.top + box[3] * sprite.scale;
              if (Math.abs(feet - surface.top) > 9) issues.push(node.dataset.pokemon + ' feet offset ' + (feet - surface.top));
            }
          }
          return issues;
        }, { assets, id });
        assert.deepEqual(issues, [], `${width}px / ${id}: ${issues.join(', ')}`);
      }
      await scrollSurface(page, 'projects-divider');
      await page.screenshot({ path: join(tmpdir(), `overworld-projects-${width}.png`) });
    }
    console.log('320/390/768/1440px placement, feet alignment, resizing and no added overflow passed.');

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const sleeping = await page.locator('[data-pokemon]').evaluateAll(es => es.map(e => e.style.cssText));
    await page.waitForTimeout(600);
    assert.deepEqual(await page.locator('[data-pokemon]').evaluateAll(es => es.map(e => e.style.cssText)), sleeping);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await scrollSurface(page, battleSurface);
    const snapshot = () => page.locator('[data-pokemon]:not([hidden])').evaluateAll(es => es.map(e => e.style.cssText));
    const still = await snapshot();
    await page.waitForTimeout(1200);
    assert.deepEqual(await snapshot(), still, 'reduced motion must remain still');
    const before = await page.locator('.silvally-resident').getAttribute('data-form');
    await page.locator('.silvally-resident').click();
    await page.waitForFunction(form => document.querySelector('.silvally-resident').dataset.form !== form, before);
    assert.notEqual(await page.locator('.silvally-resident').getAttribute('data-changing'), 'true');
    await scrollSurface(page, 'sky-about');
    await page.getByRole('button', { name: 'Explore Route 111', exact: true }).click();
    await page.waitForSelector('dialog[open]');
    await page.waitForFunction(() => document.querySelector('.silvally-resident').hidden && document.querySelector('.pokemon-overworld').hidden);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.silvally-resident').hidden);
    console.log('Reduced motion, manual changes, map modal and restoration passed.');

    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const phone = await touch.newPage();
    await phone.goto(base, { waitUntil: 'domcontentloaded' });
    await phone.waitForFunction(() => document.querySelector('.silvally-resident')?.dataset.form);
    const touchForm = await phone.locator('.silvally-resident').getAttribute('data-form');
    await phone.locator('.silvally-resident').tap();
    await phone.waitForFunction(form => document.querySelector('.silvally-resident').dataset.form !== form, touchForm);
    await touch.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(brokenAssets, []);
    console.log('Touch passed; no browser exceptions or broken sprite requests.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
