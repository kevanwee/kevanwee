/** Responsive action geometry and Yveltal's complete awakening, using real sprite ink. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const sprite = require('../src/data/overworld-sprites.json').yveltal;
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  try {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({viewport: {width, height: 1000}});
      await page.goto(process.env.BASE_URL || 'http://localhost:3005', {waitUntil: 'domcontentloaded'});
      await page.waitForSelector('[data-yveltal-state="dormant"]');
      await page.waitForTimeout(800);
      const errors = await page.evaluate(async sprite => {
        const issues = new Set();
        const rendered = new Set();
        const action = document.querySelector('.resume-launcher').getBoundingClientRect();
        const ssh = document.querySelector('[data-ssh-launcher]').getBoundingClientRect();
        if (Math.abs(action.height - ssh.height) > .5) issues.add('action heights differ');
        if (document.documentElement.scrollWidth > innerWidth) issues.add('horizontal overflow');
        const actor = document.querySelector('[data-yveltal-state]');
        const inspect = () => {
          if (actor.hidden || actor.dataset.yveltalState === 'active') return;
          const art = actor.querySelector('.overworld-sprite'), r = art.getBoundingClientRect();
          // The renderer retains the prior complete pose while a new sheet loads.
          const name = art.dataset.animation;
          const animation = sprite.animations[name];
          if (!animation) return;
          rendered.add(name);
          const b = animation.bounds[Number(art.dataset.direction) || 0], scale = r.width / animation.w;
          const expected = sprite.scale * (innerWidth < 640 ? .78 : 1);
          if (Math.abs(scale - expected) > .01) issues.add('Yveltal animation unexpectedly shrank');
          const ink = {left:r.left+b[0]*scale,right:r.left+b[2]*scale,top:r.top+b[1]*scale,bottom:r.top+b[3]*scale};
          for (const el of document.querySelectorAll('.portfolio-intro, .portfolio-actions .resume-launcher, [data-ssh-launcher]')) {
            const box = el.getBoundingClientRect();
            if (ink.left < box.right && ink.right > box.left && ink.top < box.bottom && ink.bottom > box.top) issues.add('Yveltal overlaps ' + el.className);
          }
        };
        inspect(); actor.click();
        await new Promise(resolve => { const until = performance.now() + 6500; const tick = () => { inspect(); if (performance.now() < until) requestAnimationFrame(tick); else resolve(); }; tick(); });
        if (!['active','perched'].includes(actor.dataset.yveltalState)) issues.add('awakening did not finish');
        if (!rendered.has('Special0')) issues.add('awakening sheet was never rendered');
        return [...issues];
      }, sprite);
      assert.deepEqual(errors, [], `${width}px`);
      await page.close(); console.log(`${width}px: equal actions, no overflow, egg and complete hatch clear of copy/controls`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
