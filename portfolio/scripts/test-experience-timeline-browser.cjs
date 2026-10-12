const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto(process.env.BASE_URL||'http://localhost:3198');
  const section=page.locator('#experience'),timeline=section.locator('.experience-timeline'),stops=timeline.locator('.experience-timeline-stop'),tabs=section.getByRole('tab');
  // Smooth scrolling and late sections move the page; measure once the section holds still.
  let y=null;for(let i=0,same=0;i<80&&same<5;i++){await section.scrollIntoViewIfNeeded();const n=(await section.boundingBox()).y;same=n===y?same+1:0;y=n;await page.waitForTimeout(100);}
  // Between the heading row and the tabs, with one stop per role; the tabs are unchanged.
  const count=await tabs.count();assert.equal(await stops.count(),count);
  assert.ok((await timeline.boundingBox()).y+(await timeline.boundingBox()).height<=(await section.getByRole('tablist').boundingBox()).y,'timeline sits above the tabs');
  // Oldest to newest.
  const starts=await stops.evaluateAll(es=>es.map(e=>+e.dataset.start));
  assert.deepEqual(starts,[...starts].sort((a,b)=>a-b),'stops run oldest to newest');
  // Bars are as long as their roles: 22px a month (Rajah & Tann, Jun–Nov 2024, is six months).
  assert.equal(Math.round((await timeline.locator('[data-timeline-id="rnt"] .experience-timeline-bar').boundingBox()).width),6*22);
  // Overlapping roles stack: no two bars (or their labels) share space.
  const boxes=await stops.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),n=e.querySelector('.experience-timeline-name').getBoundingClientRect();return {l:r.left,r:Math.max(r.right,n.right),t:r.top,b:r.bottom};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.r<=b.l||b.r<=a.l||a.b<=b.t||b.b<=a.t,'stops '+i+' and '+j+' overlap');}
  assert.ok(await timeline.locator('.experience-timeline-year').count()>=5,'year markers');
  const selectedTab=()=>section.locator('[role=tab][aria-selected=true]').textContent();
  const pressed=()=>timeline.locator('[aria-pressed=true]').getAttribute('data-timeline-id');
  const centred=async id=>{const s=await timeline.locator(`[data-timeline-id="${id}"]`).boundingBox(),f=await timeline.boundingBox();return Math.abs(s.x+s.width/2-(f.x+f.width/2));};
  // The newest role starts selected in both.
  assert.equal(await pressed(),'brewing');
  // A tab centres the matching stop.
  await section.getByRole('tab',{name:/PwC/}).click();await page.waitForTimeout(700);
  assert.equal(await pressed(),'pwc');assert.ok(await centred('pwc')<4,'the chosen stop is centred');
  // A stop selects the matching tab and panel.
  await timeline.locator('[data-timeline-id="osborne"]').click();await page.waitForTimeout(700);
  assert.match(await selectedTab(),/Osborne Clarke/);assert.equal(await section.getByText('Osborne Clarke',{exact:true}).last().isVisible(),true);
  // Dragging scrolls without selecting.
  const f=await timeline.boundingBox(),before=await timeline.evaluate(e=>e.scrollLeft);
  await page.mouse.move(f.x+f.width/2,f.y+f.height/2);await page.mouse.down();for(let i=1;i<=8;i++)await page.mouse.move(f.x+f.width/2+30*i,f.y+f.height/2);await page.mouse.up();
  await page.waitForTimeout(400);
  assert.ok(Math.abs(await timeline.evaluate(e=>e.scrollLeft)-before)>150,'a drag scrolls the timeline');
  assert.equal(await pressed(),'osborne','a drag does not select');
  // Arrow keys step through the roles.
  const ids=await stops.evaluateAll(es=>es.map(e=>e.dataset.timelineId)),previous=ids[ids.indexOf('osborne')-1];
  await timeline.locator('[data-timeline-id="osborne"]').focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(300);
  assert.equal(await pressed(),previous);assert.equal(await section.locator('[role=tab][aria-selected=true]').count(),1);
  // Phone width: re-centred and no horizontal page overflow.
  await page.setViewportSize({width:390,height:900});await page.waitForTimeout(500);
  assert.ok(await centred(previous)<4,'re-centred after a resize');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow');
  assert.deepEqual(errors,[]);
  console.log('Experience timeline checks passed: placement, order, durations, stacking, tab and stop sync, centring, drag, keys, mobile.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
