const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const sizes = [[320,568],[360,640],[390,844],[414,896],[568,320],[667,375],[844,390],
  [768,1024],[912,1368],[1023,600],[1024,320],[1024,600],[1024,768],[1024,900],
  [1152,648],[1280,720],[1366,768],[1440,900],[1440,901],[1440,600],[1440,500],
  [1920,1080],[2560,1440],[720,450]];

(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  try {
    const page = await browser.newPage({reducedMotion:'reduce'}), errors=[];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.BASE_URL || 'http://localhost:3005', {waitUntil:'domcontentloaded'});
    await page.waitForSelector('.portfolio-panel-frame[data-fits]');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    const roster = await page.locator('[data-pokemon]').evaluateAll(es=>es.map(e=>e.dataset.pokemon).sort());
    let sticky=0, flowing=0;
    for (const [width,height] of sizes) {
      await page.setViewportSize({width,height});
      await page.evaluate(() => scrollTo(0,0));
      await page.waitForTimeout(150);
      const layout = await page.evaluate(() => {
        const panel=document.querySelector('.left-panel-zoom'), frame=panel.parentElement;
        const controls=[...panel.querySelectorAll('.portfolio-actions .resume-launcher, [data-ssh-launcher], nav button, .portfolio-panel-footer a, .portfolio-panel-footer button')];
        const rect=panel.getBoundingClientRect(), offset=parseFloat(getComputedStyle(frame).top);
        return {fits:rect.height+offset+24<=innerHeight,sticky:getComputedStyle(frame).position==='sticky',
          overflow:document.documentElement.scrollWidth>innerWidth, zoom:getComputedStyle(panel).zoom,
          heights:controls.map(e=>e.getBoundingClientRect().height)};
      });
      assert.equal(layout.overflow,false,`Horizontal overflow at ${width}x${height}`);
      assert.equal(layout.zoom,'1','Do not shrink text or touch targets');
      assert.ok(layout.heights.every(h=>h>=43.5),`Small controls at ${width}x${height}: ${layout.heights}`);
      assert.equal(layout.sticky,width>=1024&&layout.fits,`Incorrect sticky behavior at ${width}x${height}`);
      layout.sticky ? sticky++ : flowing++;
      // Focusing each lower control must bring it entirely into the viewport.
      const controls=page.locator('.left-panel-zoom nav button, .portfolio-panel-footer a, .portfolio-panel-footer button');
      for(let i=0;i<await controls.count();i++){
        await controls.nth(i).focus();
        const r=await controls.nth(i).boundingBox();
        assert.ok(r&&r.y>=-1&&r.y+r.height<=height+1,`Unreachable lower control ${i} at ${width}x${height}: ${JSON.stringify(r)}`);
      }
      await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(80);
      if(layout.sticky){
        const r=await page.locator('.left-panel-zoom').boundingBox();
        assert.ok(r.y>=0&&r.y+r.height<=height-20,`Pinned content clips at ${width}x${height}`);
      }
      assert.deepEqual(await page.locator('[data-pokemon]').evaluateAll(es=>es.map(e=>e.dataset.pokemon).sort()),roster,'Responsive reflow must preserve the visit roster');
    }
    // A font/content-height change without a window resize must also unpin safely.
    await page.setViewportSize({width:1440,height:900});
    await page.locator('.portfolio-intro').evaluate(e=>{e.style.fontSize='40px';e.style.lineHeight='2';});
    await page.waitForFunction(()=>document.querySelector('.portfolio-panel-frame').dataset.fits==='false');
    assert.equal(await page.locator('.portfolio-panel-frame').evaluate(e=>getComputedStyle(e).position),'static');
    await page.locator('.portfolio-intro').evaluate(e=>{e.style.fontSize='';e.style.lineHeight='';});
    await page.waitForFunction(()=>document.querySelector('.portfolio-panel-frame').dataset.fits==='true');
    await page.setViewportSize({width:390,height:844});
    await page.locator('.resume-launcher').click();
    assert.equal(await page.getByRole('dialog').isVisible(),true);
    await page.keyboard.press('Escape');
    await page.getByRole('navigation',{name:'Page sections'}).getByRole('button',{name:'Projects',exact:true}).click();
    const project=await page.locator('#projects').boundingBox();assert.ok(project.y>=0&&project.y<200);
    assert.deepEqual(errors,[]);
    console.log(`${sizes.length} viewport layouts passed: ${sticky} pinned, ${flowing} naturally scrolling; all lower controls focusable in view, >=44px targets, no overflow, roster preserved, font growth and modal/navigation passed.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
