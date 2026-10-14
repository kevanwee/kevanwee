const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.BASE_URL||'http://localhost:3198';
 const offset=()=>page.locator('.media-marquee-track').evaluate(e=>-new DOMMatrix(getComputedStyle(e).transform).m41);
 const loop=()=>page.locator('.media-marquee-list').first().evaluate(e=>e.offsetWidth);
 // Distance moved forward, allowing for the loop wrapping round.
 // Smooth scrolling and late-loading sections above move the strip; measure once its position holds.
 const settle=async()=>{let y=null,same=0;for(let i=0;i<80&&same<5;i++){await page.locator('.media-marquee').scrollIntoViewIfNeeded();const n=(await page.locator('.media-marquee').boundingBox()).y;same=n===y?same+1:0;y=n;await page.waitForTimeout(100);}};
 const moved=async(from,to)=>{const l=await loop();return ((to-from)%l+l)%l;};
 try {
  await page.goto(base);
  const frame=page.locator('.media-marquee');await frame.scrollIntoViewIfNeeded();await settle();
  const box=await frame.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y-200);
  // It drifts on its own.
  let a=await offset();await page.waitForTimeout(1000);let b=await offset();
  assert.ok(await moved(a,b)>5,'the strip drifts');
  // Hovering pauses it.
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);a=await offset();await page.waitForTimeout(700);b=await offset();
  assert.ok(Math.abs(b-a)<1,'hover pauses the strip: '+a+' -> '+b);
  // Dragging moves it by the drag distance and does not open the card under the pointer.
  let opened=0;context.on('page',p=>{opened++;void p.close();});
  a=await offset();
  await page.mouse.down();for(let i=1;i<=10;i++)await page.mouse.move(box.x+box.width/2-30*i,box.y+box.height/2);await page.mouse.up();
  b=await offset();
  const dragged=await moved(a,b);assert.ok(dragged>250&&dragged<400,`drag moved ${dragged}px`);
  await page.waitForTimeout(300);assert.equal(opened,0,'a drag never opens a card');
  // A plain click still opens the card. Some outlets (LinkedIn) take over a second to open their tab.
  await page.waitForTimeout(1600);await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  for(let i=0;i<40&&opened<1;i++)await page.waitForTimeout(100);
  assert.equal(opened,1,'a click opens the card');
  // Sideways scrolling moves the strip without scrolling the page.
  const scrollY=await page.evaluate(()=>scrollY);a=await offset();await page.mouse.wheel(150,0);await page.waitForTimeout(100);b=await offset();
  assert.ok(Math.abs(await moved(a,b)-150)<20,'horizontal wheel moves the strip');assert.equal(await page.evaluate(()=>scrollY),scrollY);
  // Hovering a card opens a glass preview beside it, on screen and inside its own bounds; leaving closes it.
  {
   const f0=await frame.boundingBox(),cy=f0.y+f0.height/2;
   await page.mouse.move(f0.x+f0.width/2,f0.y-200);await page.mouse.move(f0.x+f0.width/2,cy,{steps:6});await page.waitForTimeout(400);
   // Hover the middle of whichever card is now paused under the pointer (never the gap between two).
   const c=await page.evaluate(([x,y])=>{const a=document.elementFromPoint(x,y)?.closest('a')||document.elementFromPoint(x+24,y)?.closest('a');const r=a.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};},[f0.x+f0.width/2,cy]);
   const cx=Math.min(Math.max(c.x+c.width/2,f0.x+20),f0.x+f0.width-20);
   await page.mouse.move(cx,cy,{steps:4});await page.waitForTimeout(600);
   const preview=page.locator('.media-preview');assert.equal(await preview.count(),1,'hover opens a preview');
   const p=await preview.boundingBox(),vp=page.viewportSize();
   assert.ok(p.y>=0&&p.y+p.height<=vp.height&&p.x>=0&&p.x+p.width<=vp.width,'the preview stays on screen');
   assert.ok(p.y+p.height<=c.y+1||p.y>=c.y+c.height-1,'the preview does not cover its card');
   assert.ok(await preview.evaluate(e=>[...e.querySelectorAll('*')].every(n=>n.getBoundingClientRect().right<=e.getBoundingClientRect().right+1)),'preview content fits the panel');
   assert.ok(await preview.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0),'the featured image loads');
   await page.mouse.move(cx,f0.y-200);await page.waitForTimeout(200);assert.equal(await preview.count(),0,'leaving closes the preview');
  }
  // Keyboard focus brings the focused card into the frame.
  await page.mouse.move(box.x+box.width/2,box.y-200);
  const cards=frame.locator('ul:not([aria-hidden]) a');const last=cards.nth(await cards.count()-1);
  await last.focus();await page.waitForTimeout(100);
  const card=await last.boundingBox(),f=await frame.boundingBox();
  assert.ok(card.x>=f.x-1&&card.x+card.width<=f.x+f.width+1,'the focused card is visible');
  // Reduced motion: no drift; a mouse drag scrolls the plain row.
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await frame.scrollIntoViewIfNeeded();await settle();
  const r=await frame.boundingBox();
  assert.equal(await page.locator('.media-marquee-track').evaluate(e=>getComputedStyle(e).transform),'none');
  await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();for(let i=1;i<=8;i++)await page.mouse.move(r.x+r.width/2-25*i,r.y+r.height/2);await page.mouse.up();
  assert.ok(await frame.evaluate(e=>e.scrollLeft)>150,'reduced motion: dragging scrolls the row');
  assert.deepEqual(errors,[]);
  console.log('Media marquee checks passed: drift, hover pause, drag without opening, click opens, glass preview, sideways scroll, focus, reduced motion.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
