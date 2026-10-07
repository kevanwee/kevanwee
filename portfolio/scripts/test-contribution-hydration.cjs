const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://localhost:3005';
(async () => {
  const browser = await chromium.launch();
  try {
    // The client's calendar day can differ from a cached/prebuilt server page.
    for (const day of ['2026-10-07', '2026-10-09']) {
      const page = await browser.newPage({reducedMotion:'reduce'});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date(`${day}T12:00:00Z`));
      await page.route('https://github-contributions-api.jogruber.de/**', route => route.fulfill({json:{total:{lastYear:3},contributions:[{date:day,count:3,level:2}]}}));
      await page.goto(base);
      await page.locator('.contributions[data-state="ready"]').waitFor();
      assert.equal(await page.locator(`.contributions-cell[data-date="${day}"]`).count(), 1);
      assert.match(await page.locator('.contributions-caption').textContent(), /3 contributions/);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('Contribution hydration passed with differing client calendar days.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
