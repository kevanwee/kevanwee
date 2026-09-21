/** Run against a production server; uses the same Playwright setup as test-overworld-browser. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const assets = require('../src/data/overworld-sprites.json');
const base = process.env.BASE_URL || 'http://localhost:3005';

async function inBounds(page) {
  const issues = await page.evaluate(sprite => {
    const button = document.querySelector('[data-yveltal-state]');
    const art = button.querySelector('.overworld-sprite'), rect = art.getBoundingClientRect();
    const anim = sprite.animations[button.dataset.animation];
    const b = anim.bounds[Number(art.dataset.direction)];
    const scale = rect.width / anim.w;
    return [rect.left + b[0] * scale, rect.top + b[1] * scale,
      innerWidth - (rect.left + b[2] * scale), innerHeight - (rect.top + b[3] * scale)];
  }, assets.yveltal);
  assert.ok(issues.every(n => n >= -1), `Yveltal clipped: ${issues}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [], missing = [];
  try {
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: {width, height: width === 1440 ? 1000 : 568}, isMobile: width < 640, hasTouch: width < 640 });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => {if (r.url().includes('/overworld/') && r.status() >= 400) missing.push(r.url());});
      await page.goto(base, {waitUntil: 'domcontentloaded'});
      await page.waitForSelector('[data-yveltal-state="dormant"]');
      await page.waitForTimeout(1000);
      const button = page.locator('[data-yveltal-state]');
      assert.equal(await button.getAttribute('data-animation'), 'Special2');
      await inBounds(page);
      await page.screenshot({path: join(tmpdir(), `yveltal-dormant-${width}.png`)});
      const perched = await button.evaluate(e => {
        const r = e.getBoundingClientRect(), p = document.querySelector('[data-yveltal-perch]').getBoundingClientRect();
        return Math.abs(r.bottom - p.top) < 2 && Math.abs((r.left + r.width / 2) - (p.left + p.width / 2)) < 2;
      });
      assert.ok(perched, 'Cocoon must sit on its left-panel ledge');
      if (width < 640) await button.tap(); else await button.click();
      await page.waitForFunction(() => document.querySelector('[data-yveltal-state]').dataset.animation === 'Special0');
      const started = Date.now(), frames = new Set();
      while (await button.getAttribute('data-yveltal-state') === 'hatching') {
        assert.equal(await button.getAttribute('data-animation'), 'Special0');
        frames.add(Number(await button.getAttribute('data-frame')));
        await inBounds(page);
        await page.waitForTimeout(90);
        assert.ok(Date.now() - started < 7000, 'Awakening never completed');
      }
      assert.ok(Date.now() - started >= 4000, 'Do not cut short Special0');
      assert.ok(frames.size >= 23 && Math.max(...frames) === 26, `Full hatch frames: ${[...frames]}`);
      assert.equal(await button.getAttribute('data-animation'), 'Walk');
      await page.mouse.move(0, 0);
      const start = await button.getAttribute('style');
      await page.waitForTimeout(3500);
      assert.notEqual(await button.getAttribute('style'), start, 'Active Yveltal must roam');
      for (const viewport of [{width: 320, height: 568}, {width: 568, height: 320}, {width: 390, height: 844}]) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(150);
        await inBounds(page);
      }
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);
      assert.equal(await button.isVisible(), true, 'Active Yveltal remains in viewport after scrolling');
      await inBounds(page);
      await button.dispatchEvent('click');
      await button.locator('.overworld-heart').waitFor({state: 'visible'});
      assert.equal(await button.locator('.overworld-heart').isVisible(), true);
      await page.waitForTimeout(2100);
      assert.equal(await button.locator('.overworld-heart').isVisible(), false);
      await page.screenshot({path: join(tmpdir(), `yveltal-active-${width}.png`)});

      // Keep the heading close to the map, with Silvally entirely beside its text.
      for (const size of [320, 390, 768, 1440]) {
        await page.setViewportSize({width: size, height: 900});
        await page.locator('[data-silvally-surface]').scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const check = await page.evaluate(assets => {
          const label = document.querySelector('[data-silvally-label]'), range = document.createRange();
          range.selectNodeContents(label);
          const map = document.querySelector('[data-silvally-surface]').getBoundingClientRect();
          const node = document.querySelector('.silvally-resident'), art = node.querySelector('.overworld-sprite');
          const sprite = assets['silvally-' + node.dataset.form], anim = sprite.animations[node.dataset.animation];
          const bounds = anim.bounds[Number(node.dataset.direction)], r = art.getBoundingClientRect();
          return {gap: map.top - label.getBoundingClientRect().bottom, clearance: r.left + bounds[0] * sprite.scale - range.getBoundingClientRect().right};
        }, assets);
        assert.ok(check.gap <= 13 && check.gap >= 11, `Heading gap: ${check.gap}`);
        assert.ok(check.clearance >= 4, `Silvally overlaps label: ${check.clearance}`);
      }
      await page.getByRole('button', {name: 'Explore Route 111', exact: true}).click();
      await page.waitForFunction(() => document.querySelector('.yveltal-layer').hidden);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.yveltal-layer').hidden);
      await context.close();
      console.log(`${width}px: dormant perch, complete hatch, bounded flight/resize, greeting, map label and modal passed.`);
    }
    const reduced = await browser.newPage({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
    await reduced.goto(base, {waitUntil: 'domcontentloaded'});
    const button = reduced.locator('[data-yveltal-state]');
    await button.click();
    await reduced.waitForFunction(() => document.querySelector('[data-yveltal-state]').dataset.yveltalState === 'active');
    const style = await button.getAttribute('style');
    await reduced.waitForTimeout(1500);
    assert.equal(await button.getAttribute('style'), style);
    await reduced.close();
    const hopping = await browser.newPage({viewport: {width: 1440, height: 1000}});
    hopping.on('pageerror', e => errors.push(e.message));
    await hopping.addInitScript(() => {
      const raf = requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => raf(time => callback(time * 4));
    });
    await hopping.goto(base, {waitUntil: 'domcontentloaded'});
    await hopping.locator('[data-overworld-surface="other-project-0"]').scrollIntoViewIfNeeded();
    const jumped = new Set();
    for (let i = 0; i < 450 && jumped.size < 2; i++) {
      const actors = await hopping.locator('[data-pokemon="fidough"], [data-pokemon="goomy"]').evaluateAll(es => es.map(e => ({id: e.dataset.pokemon, hopping: e.dataset.hopping, animation: e.dataset.animation, direction: e.dataset.direction})));
      for (const a of actors) if (a.hopping === 'true') {
        assert.equal(a.animation, 'Hop');
        assert.ok(['2', '6'].includes(a.direction), 'Jump toward the landing card');
        jumped.add(a.id);
      }
      await hopping.waitForTimeout(100);
    }
    assert.equal(jumped.size, 2, 'Both Fidough and Goomy should visibly hop');
    await hopping.setViewportSize({width: 390, height: 844});
    await hopping.waitForTimeout(200);
    assert.equal(await hopping.locator('[data-hopping="true"]').count(), 0, 'Stacked phone cards must stop hopping');
    console.log('Fidough/Goomy both visibly hop; phone reflow stops cross-card hops.');
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    console.log('Reduced motion passed; no browser exceptions or broken sprite requests.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
