const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 mkdirSync('artifacts/legal-engineering',{recursive:true});
 try {
  for(const width of [1440,390]) {
   const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   // Synthetic iframe document; production keeps its portfolio-only allowlist.
   await page.route('https://legal-engineering-defined.vercel.app/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><h1>Synthetic legal engineering reader fixture</h1><p>Reader content loads inside the frame.</p></body></html>'}));
   await page.goto(process.env.BASE_URL||'http://127.0.0.1:3020',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
   await page.getByRole('navigation',{name:'Page sections'}).getByRole('button',{name:'Legal Engineering',exact:true}).click();
   await page.waitForFunction(()=>Math.abs(document.querySelector('#legal-engineering [data-section-scroll-target]').getBoundingClientRect().top-24)<2);
   assert.equal(await page.locator('#legal-engineering p').count(),3);
   assert.equal(await page.locator('#experience').getByRole('tab',{name:'PwC',exact:true}).count(),2);
   assert.ok(await page.locator('#experience').getByText(/Something is brewing/).isVisible());
   for(const title of ['Highlights','Legal systems & data','Agent skills & workflows','Other experiments']) assert.equal(await page.locator('#projects').getByRole('heading',{name:title,exact:true}).count(),1);
   assert.equal(await page.locator('#projects a[href="https://github.com/kevanwee/sg-legalresearch-skill"]').count(),1);
   const ids=await page.locator('[data-overworld-kind="other-project"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.overworldSurface));
   assert.equal(ids.length,new Set(ids).size,'unique resident surfaces');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page fits viewport');
   await page.screenshot({path:`artifacts/legal-engineering/section-${width}.png`});
   const launcher=page.getByRole('button',{name:'Read more',exact:true});await launcher.click();
   const dialog=page.getByRole('dialog',{name:'Legal Engineering Defined',exact:true});await dialog.waitFor();
   assert.equal(await dialog.locator('iframe').getAttribute('src'),'https://legal-engineering-defined.vercel.app/');
   await page.frameLocator('iframe[title="Legal Engineering Defined"]').getByText('Synthetic legal engineering reader fixture').waitFor();
   assert.equal(await dialog.getByRole('link',{name:/Open original/}).getAttribute('target'),'_blank');
   const rect=await dialog.locator('.legal-engineering-reader').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width+1);
   await page.screenshot({path:`artifacts/legal-engineering/reader-${width}.png`});
   await dialog.getByRole('button',{name:'Close legal engineering reader'}).click();
   assert.equal(await launcher.evaluate(e=>e===document.activeElement),true,'focus return');
   await launcher.click();await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
   assert.deepEqual(errors,[]);console.log(`${width}px: PwC/NewLaw, categories, reader, close/Escape, focus and viewport passed`);await page.close();
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
