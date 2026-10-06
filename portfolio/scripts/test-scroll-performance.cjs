// Start a production build first. Reuses the existing browser-test dependency convention.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch();
 try {
  for (const width of [390, 1440]) {
   const page = await browser.newPage({viewport:{width,height:850},reducedMotion:'no-preference'});
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(() => {
    const days=Array.from({length:365},(_,i)=>{const d=new Date();d.setDate(d.getDate()-364+i);return {date:d.toISOString().slice(0,10),count:i%5,level:i%5};});
    localStorage.setItem('kevanwee.contributions',JSON.stringify({login:'kevanwee',days,total:730,fetchedAt:Date.now()}));
   });
   await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5198');
   await page.waitForFunction(()=>document.querySelector('.contributions')?.dataset.animationPaused==='true');
   await page.locator('.contributions').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('.contributions')?.dataset.animationPaused==='false');
   assert.equal(await page.locator('.contributions [data-date]').count(),365);
   assert.equal(await page.locator('.contributions').evaluate(e=>getComputedStyle(e).animationTimingFunction),'steps(120)');
   await page.mouse.move(130,170); await page.waitForTimeout(80);
   const glow=await page.locator('[aria-hidden="true"] > div').evaluateAll(es=>es.find(e=>e.style.willChange==='transform')?.style.transform);
   assert.equal(glow,'translate3d(-470px, -430px, 0px)');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.emulateMedia({reducedMotion:'reduce'});
   if (width === 1440) {
    await page.evaluate(()=>{ Element.prototype.scrollIntoView=function(options){window.__scrollChoice=options.behavior;}; });
    await page.getByRole('navigation',{name:'Page sections'}).getByRole('button',{name:'Experience',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__scrollChoice),'instant');
   }
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
   assert.equal(await page.locator('.contributions').evaluate(e=>getComputedStyle(e).animationName),'none');
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   await page.waitForFunction(()=>document.querySelector('.contributions')?.dataset.animationPaused==='true');
   assert.deepEqual(errors,[]); await page.close();
   console.log(`PASS ${width}px: visibility pause/resume, RGB coverage, pointer glow, reduced motion and page bounds`);
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
