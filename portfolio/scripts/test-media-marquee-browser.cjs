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
  // A plain click still opens the card.
  await page.waitForTimeout(1600);await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(800);
  assert.equal(opened,1,'a click opens the card');
  // Sideways scrolling moves the strip without scrolling the page.
  const scrollY=await page.evaluate(()=>scrollY);a=await offset();await page.mouse.wheel(150,0);await page.waitForTimeout(100);b=await offset();
  assert.ok(Math.abs(await moved(a,b)-150)<20,'horizontal wheel moves the strip');assert.equal(await page.evaluate(()=>scrollY),scrollY);
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
  console.log('Media marquee checks passed: drift, hover pause, drag without opening, click opens, sideways scroll, focus, reduced motion.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
