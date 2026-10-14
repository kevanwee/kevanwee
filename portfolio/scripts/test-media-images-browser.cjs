const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();const errors=[];
 try {
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.BASE_URL||'http://127.0.0.1:3198');
   const section=page.locator('#media'),tooltip=page.getByRole('tooltip');
   for(const code of ['DNR2Nr7P-Ni','DB7tIbtTl3_','C_cFPGryaLW']){
    const link=section.locator(`ul:not([aria-hidden]) a[href*="${code}"]`);
    await link.focus();await link.scrollIntoViewIfNeeded();
    await tooltip.waitFor();
    await tooltip.locator('img').evaluate(img=>img.decode());
    assert.ok(await tooltip.locator('img').evaluate(img=>img.naturalWidth>0),'Instagram image loads');
    assert.equal(await tooltip.locator('img').evaluate(img=>getComputedStyle(img).objectFit),'contain','group photo stays intact');
    await page.keyboard.press('Escape');
   }
   const link=section.getByRole('link',{name:'LegalQuants',exact:true});
   await link.scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.mouse.move(0,0);await link.hover();
   await tooltip.waitFor();await page.waitForTimeout(300);
   const images=tooltip.locator('img');assert.equal(await images.count(),2,'page capture and LQ logo');
   await images.evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
   assert.ok(await tooltip.getByAltText('LegalQuants logo').evaluate(img=>img.naturalWidth>0),'official logo loads');
   assert.ok(await tooltip.getByAltText(/Preview of Kevan/).evaluate(img=>img.naturalWidth>0),'profile page capture loads');
   assert.equal(await link.getAttribute('aria-describedby'),await tooltip.getAttribute('id'));
   const p=await tooltip.boundingBox(),c=await link.boundingBox();
   assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=viewport.width+1&&p.y+p.height<=viewport.height+1,'profile preview fits');
   assert.ok(p.y+p.height<=c.y||p.y>=c.y+c.height,'inline link remains clear');
   if(process.env.CAPTURE_MEDIA) await page.screenshot({path:`artifacts/profile-preview-${viewport.width}.png`});
   await tooltip.hover();await page.waitForTimeout(300);assert.equal(await tooltip.count(),1,'profile preview remains hoverable');
   await page.keyboard.press('Escape');assert.equal(await tooltip.count(),0);
   await page.mouse.move(0,0);await link.focus();await tooltip.waitFor();
   assert.match(await tooltip.innerText(),/Kevan Wee on LegalQuants/,'keyboard preview');
   await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('Media images passed: all three Instagram photos, complete image framing, LegalQuants page and logo, hover/focus/Escape and desktop/mobile fit.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
