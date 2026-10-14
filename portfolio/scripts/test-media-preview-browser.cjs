const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();const errors=[];
 try {
  for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:1024,height:480}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.BASE_URL||'http://127.0.0.1:3198');
   const frame=page.locator('.media-marquee');await frame.scrollIntoViewIfNeeded();await page.waitForTimeout(1200);await frame.scrollIntoViewIfNeeded();
   const link=frame.locator('ul:not([aria-hidden]) a').first();await link.focus();await link.hover();
   const panel=page.getByRole('tooltip');await panel.waitFor();await page.waitForTimeout(300);
   assert.equal(await link.getAttribute('aria-describedby'),await panel.getAttribute('id'));
   const c=await link.boundingBox(),p=await panel.boundingBox();
   assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=viewport.width+1&&p.y+p.height<=viewport.height+1,'panel fits '+JSON.stringify(viewport));
   assert.ok(p.y+p.height<=c.y||p.y>=c.y+c.height,'panel leaves source link clear');
   assert.equal(await link.evaluate(e=>getComputedStyle(e,'::before').content),'none','no blurred photograph layer');
   if(process.env.CAPTURE_MEDIA) await page.screenshot({path:`artifacts/media-after-${viewport.width}.png`});
   await panel.hover();await page.waitForTimeout(350);assert.equal(await panel.count(),1,'preview remains while hovered');
   await page.keyboard.press('Escape');assert.equal(await panel.count(),0,'Escape dismisses');
   await page.mouse.move(0,0);await link.evaluate(e=>e.blur());await link.hover();await page.waitForTimeout(50);await page.keyboard.press('Escape');await page.waitForTimeout(350);assert.equal(await panel.count(),0,'Escape cancels pending preview');
   await page.close();
  }
  assert.deepEqual(errors,[]);console.log('Preview review passed: desktop/mobile/short viewport, original clean cards, accessible description, hoverable preview and Escape.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
