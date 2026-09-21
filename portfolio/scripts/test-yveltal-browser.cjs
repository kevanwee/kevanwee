/** Run against a production server; uses the same Playwright setup as test-overworld-browser. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const assets = require('../src/data/overworld-sprites.json');
const base = process.env.BASE_URL || 'http://localhost:3005';
// Below Tailwind's lg the columns stack and he perches instead of flying.
const FLIGHT_WIDTH = 1024;

async function inBounds(page) {
  const issues = await page.evaluate(sprite => {
    const button = document.querySelector('[data-yveltal-state]');
    if (button.hidden) return [];
    const art = button.querySelector('.overworld-sprite'), rect = art.getBoundingClientRect();
    const anim = sprite.animations[button.dataset.animation];
    const b = anim.bounds[Number(art.dataset.direction)];
    const scale = rect.width / anim.w;
    return [rect.left + b[0] * scale, rect.top + scrollY + b[1] * scale,
      document.documentElement.clientWidth - (rect.left + b[2] * scale), document.body.scrollHeight - (rect.top + scrollY + b[3] * scale)];
  }, assets.yveltal);
  assert.ok(issues.every(n => n >= -1), `Yveltal clipped: ${issues}`);
}

async function clearOfContent(page) {
  const overlaps = await page.evaluate(sprite => {
    const node = document.querySelector('[data-yveltal-state]');
    if (node.hidden) return [];
    const art = node.querySelector('.overworld-sprite'), r = art.getBoundingClientRect();
    const anim = sprite.animations[node.dataset.animation] || sprite.animations.Walk;
    const b = anim.bounds[Number(art.dataset.direction)] || anim.bounds[0], scale = r.width / anim.w;
    const body = {left: r.left + b[0] * scale, right: r.left + b[2] * scale, top: r.top + b[1] * scale, bottom: r.top + b[3] * scale};
    // Ink, not boxes: a painted background, a replaced element or a glyph rectangle.
    // Sitting inside the empty half of a block box is blank space and stays allowed.
    const paints = el => {
      const st = getComputedStyle(el);
      if (st.backgroundImage !== 'none' || st.boxShadow !== 'none') return true;
      if (!(st.backgroundColor === 'transparent' || /,\s*0\)$/.test(st.backgroundColor))) return true;
      return ['top', 'right', 'bottom', 'left'].some(k => st.getPropertyValue(`border-${k}-style`) !== 'none' && parseFloat(st.getPropertyValue(`border-${k}-width`)) > 0);
    };
    const REPLACED = new Set(['IMG', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME', 'INPUT', 'HR']);
    const glyph = (el, x, y) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walker.nextNode())) {
        if (!text.textContent.trim() || text.parentElement.closest('.sr-only')) continue;
        const range = document.createRange(); range.selectNodeContents(text);
        for (const q of range.getClientRects()) if (x >= q.left && x <= q.right && y >= q.top && y <= q.bottom) return text.textContent.trim().slice(0, 32);
      }
      return null;
    };
    const hits = new Set();
    for (let y = body.top + 1; y < body.bottom; y += 3) for (let x = body.left + 1; x < body.right; x += 3) {
      for (const el of document.elementsFromPoint(x, y)) {
        if (el.closest('.yveltal-layer, .pokemon-overworld, .silvally-resident')) continue;
        if (!el.closest('#teddiursa-panel, main')) break;
        if (REPLACED.has(el.tagName) || paints(el)) { hits.add(el.tagName.toLowerCase()); break; }
        const text = glyph(el, x, y);
        if (text) hits.add(JSON.stringify(text));
        break;
      }
    }
    return [...hits];
  }, assets.yveltal);
  assert.deepEqual(overlaps, [], 'Flying Yveltal must not overlap any visible content');
}

const xy = t => { const m = /translate3d\((-?[\d.]+)px, ?(-?[\d.]+)px/.exec(t || '') || [0, 0, 0]; return {x: +m[1], y: +m[2]}; };

const onLedge = page => page.locator('[data-yveltal-state]').evaluate(e => {
  const r = e.getBoundingClientRect(), p = document.querySelector('[data-yveltal-perch]').getBoundingClientRect();
  return Math.abs(r.bottom - p.top) < 2 && Math.abs((r.left + r.width / 2) - (p.left + p.width / 2)) < 2;
});

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
      assert.ok(await onLedge(page), 'Cocoon must sit on its left-panel ledge');
      // Sampled every frame: a skipped frame strands the egg a whole scroll tick from
      // the sticky ledge, which reads as jumping.
      await page.evaluate(() => {
        window.__drift = [];
        const tick = () => {
          const egg = document.querySelector('[data-yveltal-state]'), ledge = document.querySelector('[data-yveltal-perch]');
          // A hidden egg measures as a zero rect, which is not drift.
          if (egg && ledge && !egg.hidden) window.__drift.push(egg.getBoundingClientRect().bottom - ledge.getBoundingClientRect().top);
          window.__driftRaf = requestAnimationFrame(tick);
        };
        tick();
      });
      await page.mouse.move(Math.round(width / 2), 300);
      for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 60); await page.waitForTimeout(24); }
      await page.waitForTimeout(300);
      const drift = await page.evaluate(() => { cancelAnimationFrame(window.__driftRaf); return window.__drift; });
      assert.ok(drift.length > 10, `Only ${drift.length} frames sampled the dormant egg`);
      const wandered = Math.max(...drift.map(v => Math.abs(v - drift[0])));
      assert.ok(wandered < 2, `The dormant egg drifted ${wandered.toFixed(1)}px off its ledge while scrolling`);
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(300);
      // Record every frame across the hatch: a fast exit and a teleport look the same
      // to a poll, and only the per-frame step tells them apart.
      await page.evaluate(() => {
        window.__path = [];
        const tick = () => {
          const n = document.querySelector('[data-yveltal-state]');
          if (n && !n.hidden) { const r = n.getBoundingClientRect(); window.__path.push({x: r.left, y: r.top, s: scrollY}); }
          window.__pathRaf = requestAnimationFrame(tick);
        };
        tick();
      });
      if (width < 640) await button.tap(); else await button.click();
      await page.waitForFunction(() => document.querySelector('[data-yveltal-state]').dataset.animation === 'Special0');
      const started = Date.now(), frames = new Set();
      let moved = 0;
      while (await button.getAttribute('data-yveltal-state') === 'hatching') {
        assert.equal(await button.getAttribute('data-animation'), 'Special0');
        frames.add(Number(await button.getAttribute('data-frame')));
        // The shell rides its sticky ledge; pinning it to the page would leave the
        // whole hatch behind as soon as the reader scrolls.
        assert.ok(await onLedge(page), `The hatch left its ledge ${Date.now() - started}ms in`);
        await inBounds(page);
        if (!moved && Date.now() - started > 900) { await page.evaluate(() => scrollTo(0, 300)); moved = 1; }
        else if (moved === 1 && Date.now() - started > 2100) { await page.evaluate(() => scrollTo(0, 0)); moved = 2; }
        await page.waitForTimeout(90);
        assert.ok(Date.now() - started < 7000, 'Awakening never completed');
      }
      assert.equal(moved, 2, 'The mid-hatch scroll check never ran');
      assert.ok(Date.now() - started >= 4000, 'Do not cut short Special0');
      assert.ok(frames.size >= 23 && Math.max(...frames) === 26, `Full hatch frames: ${[...frames]}`);
      assert.equal(await button.getAttribute('data-yveltal-state'), width >= FLIGHT_WIDTH ? 'active' : 'perched');
      await page.mouse.move(0, 0);
      if (width < FLIGHT_WIDTH) {
        // Stacked columns leave no blank corridor, so he keeps his ledge instead.
        assert.equal(await button.getAttribute('data-animation'), 'Idle');
        const still = await button.evaluate(e => JSON.stringify(e.getBoundingClientRect()));
        await page.waitForTimeout(1500);
        assert.equal(await button.evaluate(e => JSON.stringify(e.getBoundingClientRect())), still, 'A perched Yveltal must not drift');
        assert.ok(await onLedge(page), 'A perched Yveltal must stay on his ledge');
      } else {
        assert.equal(await button.getAttribute('data-animation'), 'Walk');
        // The shell sits inside the panel's no-fly column, so settling would otherwise
        // snap him clear in one frame. He flies out of it instead.
        await page.waitForTimeout(1000);
        const path = await page.evaluate(() => { cancelAnimationFrame(window.__pathRaf); return window.__path; });
        let biggest = 0;
        for (let i = 1; i < path.length; i++) {
          // Scrolling legitimately carries the shell along its sticky ledge through
          // document space, so only compare frames taken at the same scroll offset.
          if (path[i].s !== path[i - 1].s) continue;
          biggest = Math.max(biggest, Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
        }
        assert.ok(path.length > 60, `Only ${path.length} frames recorded across the hatch`);
        // He leaves fast on purpose, so a step is only suspicious next to the whole
        // exit: a teleport covers it in one, a flight needs many.
        const span = Math.hypot(path[path.length - 1].x - path[0].x, path[path.length - 1].y - path[0].y);
        assert.ok(biggest < Math.max(50, span * .45), `Yveltal jumped ${biggest.toFixed(0)}px of a ${span.toFixed(0)}px exit in one frame`);
        await clearOfContent(page);
        const start = await button.getAttribute('style');
        for (let i = 0; i < 60; i++) { await page.waitForTimeout(100); assert.equal(await button.isVisible(), true); await clearOfContent(page); }
        assert.notEqual(await button.getAttribute('style'), start, 'Active Yveltal must roam');
        // He lives on the page, so he keeps flying out of view: come back to a new spot.
        const parked = await button.evaluate(e => e.style.transform);
        await page.evaluate(() => scrollTo(0, 3000));
        await page.waitForTimeout(8000);
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(400);
        assert.notEqual(await button.evaluate(e => e.style.transform), parked, 'Yveltal must keep roaming while off screen');
        await clearOfContent(page);
        // The habitat is the whole document: scrolling, including past a sticky column,
        // must translate him exactly with the page and never tow him along.
        await page.emulateMedia({reducedMotion: 'reduce'});
        await page.waitForTimeout(150);
        const position = await button.evaluate(e => ({top: e.getBoundingClientRect().top, scroll: scrollY}));
        for (const step of [80, 260, 500]) {
          await page.evaluate(v => scrollTo(0, v), step);
          await page.waitForTimeout(150);
          const after = await button.evaluate(e => ({top: e.getBoundingClientRect().top, scroll: scrollY}));
          if (await button.isVisible()) assert.ok(Math.abs(after.top - position.top + after.scroll - position.scroll) < 2, `Yveltal drifted ${after.top - position.top + after.scroll - position.scroll}px at scrollY ${step}`);
        }
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(250);
        assert.equal(await button.isVisible(), false, 'Yveltal must leave the screen with his page area');
        await page.evaluate(() => scrollTo(0, 0));
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await page.waitForTimeout(400);
      }
      // Reflow across the flight breakpoint, in both directions.
      for (const viewport of [{width: 320, height: 568}, {width: 568, height: 320}, {width: 1440, height: 720}, {width: 900, height: 800}, {width: 1152, height: 900}, {width: 390, height: 844}]) {
        await page.setViewportSize(viewport);
        // A short viewport can drop the ledge below the fold, where a hidden sprite
        // measures as a zero rect rather than a misplaced one.
        await page.evaluate(() => document.querySelector('[data-yveltal-perch]').scrollIntoView({block: 'center'}));
        await page.waitForTimeout(450);
        assert.equal(await button.getAttribute('data-yveltal-state'), viewport.width >= FLIGHT_WIDTH ? 'active' : 'perched', `Wrong mode at ${viewport.width}px`);
        if (viewport.width >= FLIGHT_WIDTH) await clearOfContent(page); else assert.ok(await onLedge(page), `Must perch at ${viewport.width}px`);
        await inBounds(page);
      }
      await page.setViewportSize({width: 390, height: 1000});
      await page.waitForTimeout(250);
      await button.dispatchEvent('click');
      await button.locator('.overworld-heart').waitFor({state: 'visible'});
      assert.equal(await button.locator('.overworld-heart').isVisible(), true);
      await page.waitForTimeout(2100);
      assert.equal(await button.locator('.overworld-heart').isVisible(), false);
      await page.screenshot({path: join(tmpdir(), `yveltal-active-${width}.png`)});

      // Keep the heading close to the map, with Silvally entirely beside its text.
      for (const size of [320, 390, 768, 1440]) {
        await page.setViewportSize({width: size, height: 900});
        // Park the map a third of the way down. Silvally perches on its top edge and
        // is hidden by design once that edge leaves the viewport, so pin it explicitly.
        await page.evaluate(() => scrollBy(0, document.querySelector('[data-silvally-surface]').getBoundingClientRect().top - Math.round(innerHeight / 3)));
        await page.waitForTimeout(250);
        const check = await page.evaluate(assets => {
          const label = document.querySelector('[data-silvally-label]'), range = document.createRange();
          range.selectNodeContents(label);
          const map = document.querySelector('[data-silvally-surface]').getBoundingClientRect();
          const node = document.querySelector('.silvally-resident'), art = node.querySelector('.overworld-sprite');
          const sprite = assets['silvally-' + node.dataset.form], anim = sprite.animations[node.dataset.animation];
          const bounds = anim.bounds[Number(node.dataset.direction)], r = art.getBoundingClientRect();
          return {hidden: node.hidden, mapTop: Math.round(map.top), scroll: Math.round(scrollY),
            gap: map.top - label.getBoundingClientRect().bottom, clearance: r.left + bounds[0] * sprite.scale - range.getBoundingClientRect().right};
        }, assets);
        assert.equal(check.hidden, false, `Silvally hidden at ${size}px with his map at y=${check.mapTop}, scrollY ${check.scroll}`);
        assert.ok(check.gap <= 13 && check.gap >= 11, `Heading gap: ${check.gap}`);
        assert.ok(check.clearance >= 4, `Silvally overlaps label: ${check.clearance}`);
      }
      await page.getByRole('button', {name: 'Explore Route 111', exact: true}).click();
      await page.waitForFunction(() => document.querySelector('.yveltal-layer').hidden);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.yveltal-layer').hidden);
      await context.close();
      console.log(`${width}px: complete hatch, ${width >= FLIGHT_WIDTH ? 'ink-free page flight, scroll-away' : 'a settled ledge perch'}, reflow across the flight breakpoint, greeting, label and modal passed.`);
    }
    const reduced = await browser.newPage({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
    await reduced.goto(base, {waitUntil: 'domcontentloaded'});
    const button = reduced.locator('[data-yveltal-state]');
    await button.click();
    await reduced.waitForFunction(() => document.querySelector('[data-yveltal-state]').dataset.yveltalState === 'perched');
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
    // Centre the grid so every row counts as visible; residents off screen are frozen.
    await hopping.evaluate(() => document.querySelector('[data-overworld-surface="other-project-4"]').scrollIntoView({block: 'center'}));
    await hopping.waitForSelector('[data-pokemon]');
    await hopping.waitForTimeout(600);
    const onTiles = await hopping.locator('[data-pokemon]').evaluateAll(es => es
      .filter(e => /^other-project-\d+$/.test(e.dataset.surface || '')).map(e => e.dataset.pokemon));
    assert.equal(onTiles.length, 2, `Project tiles hold ${onTiles.join(',') || 'nobody'}`);
    // Whoever drew a tile this load must hop, whatever species and whatever row.
    const jumped = new Set();
    for (let i = 0; i < 600 && jumped.size < onTiles.length; i++) {
      const actors = await hopping.locator('[data-pokemon]').evaluateAll(es => es
        .filter(e => /^other-project-\d+$/.test(e.dataset.surface || ''))
        .map(e => ({id: e.dataset.pokemon, hopping: e.dataset.hopping, animation: e.dataset.animation, direction: e.dataset.direction})));
      for (const a of actors) if (a.hopping === 'true') {
        assert.equal(a.animation, 'Hop');
        assert.ok(['2', '6'].includes(a.direction), 'Jump toward the landing card');
        jumped.add(a.id);
      }
      await hopping.waitForTimeout(100);
    }
    assert.deepEqual([...jumped].sort(), [...onTiles].sort(), 'Every project-tile resident should visibly hop');
    await hopping.setViewportSize({width: 390, height: 844});
    await hopping.waitForTimeout(200);
    assert.equal(await hopping.locator('[data-hopping="true"]').count(), 0, 'Stacked phone cards must stop hopping');
    console.log(`${onTiles.join(' and ')} drew the project tiles and both visibly hop; phone reflow stops cross-card hops.`);
    assert.deepEqual(errors, []); assert.deepEqual(missing, []);
    console.log('Reduced motion passed; no browser exceptions or broken sprite requests.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
