const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 try {
  for(const reducedMotion of ['reduce','no-preference']) for(const width of [390,1366]){
   const page=await browser.newPage({viewport:{width,height:768},reducedMotion});
   await page.goto(process.env.BASE_URL||'http://localhost:3005');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
   for(const name of ['Experience','Legal Engineering','Projects','Media','Contact','About']){
    const id=name.toLowerCase().replaceAll(' ','-'),link=page.getByRole('navigation',{name:'Page sections'}).getByRole('button',{name,exact:true});
    await link.click();
    await page.waitForFunction(id=>{const section=document.getElementById(id),h=section.querySelector('[data-section-scroll-target], h2'),target=h.getClientRects().length?h:section;return Math.abs(target.getBoundingClientRect().top-24)<2;},id,{timeout:5000});
    if(width>=1024) assert.equal(await page.locator('.portfolio-panel-frame').evaluate(e=>getComputedStyle(e).position),'sticky');
   }
   console.log(`${width}px ${reducedMotion}: all six links land on content at 24px`);await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
