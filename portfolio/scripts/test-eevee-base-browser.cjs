const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const {join} = require('node:path');
const {tmpdir} = require('node:os');
const base = process.env.BASE_URL || 'http://localhost:3005';
const expected = ['eevee','vaporeon','jolteon','flareon','umbreon','sylveon'];
(async () => {
  const browser = await chromium.launch({headless: true});
  const errors = [], missing = [];
  try {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({viewport: {width, height: 900}, isMobile: width < 640, hasTouch: width < 640});
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => {if (/\/(overworld|eevee-base)\//.test(r.url()) && r.status() >= 400) missing.push(r.url());});
      await page.goto(base, {waitUntil: 'domcontentloaded'});
      await page.locator('[data-eevee-base]').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('[data-forest-pokemon] .overworld-sprite')].every(e => e.style.backgroundImage));
      assert.deepEqual(await page.locator('[data-forest-pokemon]').evaluateAll(es => es.map(e => e.dataset.forestPokemon)), expected);
      assert.equal(await page.locator(expected.map(s => `[data-pokemon="${s}"]`).join(',')).count(), 0);
      const frames = new Set(), positions = new Set();
      for (let i = 0; i < 45; i++) {
        frames.add(await page.locator('[data-forest-stone]').getAttribute('data-frame'));
        positions.add(await page.locator('[data-forest-pokemon]').evaluateAll(es => es.map(e => e.style.transform).join('|')));
        const clipped = await page.locator('[data-eevee-base]').evaluate(root => {
          const r = root.getBoundingClientRect();
          return [...root.querySelectorAll('.overworld-sprite')].some(e => {const b = e.getBoundingClientRect(); return b.left < r.left || b.right > r.right || b.top < r.top || b.bottom > r.bottom;});
        });
        assert.equal(clipped, false);
        await page.waitForTimeout(100);
      }
      assert.ok(frames.size >= 28, 'Original stone colour frames should cycle');
      assert.ok(positions.size > 10, 'Residents must wander');
      for (const species of expected) {
        const button = page.locator(`[data-forest-pokemon="${species}"]`);
        // Focus holds the chosen resident still; click/tap remains a native button action.
        await button.focus();
        await page.keyboard.press('Enter');
        await button.locator('.overworld-heart').waitFor({state: 'visible'});
        assert.equal(await button.getAttribute('data-animation'), 'Idle');
      }
      await page.screenshot({path: join(tmpdir(), `eevee-base-${width}.png`)});
      await page.emulateMedia({reducedMotion: 'reduce'});
      await page.waitForTimeout(200);
      const snapshot = () => page.locator('[data-forest-pokemon]').evaluateAll(es => es.map(e => e.style.cssText));
      const before = await snapshot(), frame = await page.locator('[data-forest-stone]').getAttribute('data-frame');
      await page.waitForTimeout(900);
      assert.deepEqual(await snapshot(), before); assert.equal(await page.locator('[data-forest-stone]').getAttribute('data-frame'), frame);
      await page.emulateMedia({reducedMotion: 'no-preference'});
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(200);
      const offscreen = await snapshot(); await page.waitForTimeout(500); assert.deepEqual(await snapshot(), offscreen);
      await page.close(); console.log(`${width}px: all six, animated stone, roaming, keyboard hearts, clipping, reduced motion and offscreen pause passed.`);
    }
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode = 1;});
