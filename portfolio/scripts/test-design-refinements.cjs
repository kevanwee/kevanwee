/** Responsive action geometry: Resume and SSH share one height, with no horizontal overflow. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  try {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({viewport: {width, height: 1000}});
      await page.goto(process.env.BASE_URL || 'http://localhost:3005', {waitUntil: 'domcontentloaded'});
      await page.waitForSelector('.resume-launcher');
      await page.waitForTimeout(800);
      const errors = await page.evaluate(() => {
        const issues = [];
        const action = document.querySelector('.resume-launcher').getBoundingClientRect();
        const ssh = document.querySelector('[data-ssh-launcher]').getBoundingClientRect();
        if (Math.abs(action.height - ssh.height) > .5) issues.push('action heights differ');
        if (getComputedStyle(document.querySelector('.resume-launcher')).backgroundColor !== 'rgb(58, 107, 89)') issues.push('Resume is not the green action');
        if (document.documentElement.scrollWidth > innerWidth) issues.push('horizontal overflow');
        return issues;
      });
      assert.deepEqual(errors, [], `${width}px`);
      await page.close(); console.log(`${width}px: equal actions, green Resume, no overflow`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
