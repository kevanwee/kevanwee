const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const {mkdir} = require('node:fs/promises');
(async () => {
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await mkdir('artifacts',{recursive:true});
  await page.goto(process.env.BASE_URL||'http://localhost:3198',{waitUntil:'domcontentloaded'});
  const pc=page.getByRole('button',{name:'Open Pokémon PC',exact:true});await pc.scrollIntoViewIfNeeded();
  await page.locator('[data-eevee-base]').screenshot({path:'artifacts/pc-map.png'});
  const originals=await page.locator('[data-forest-pokemon]').evaluateAll(es=>es.map(e=>e.dataset.forestPokemon));
  await pc.click();const dialog=page.getByRole('dialog',{name:'Pokémon storage system'});
  await dialog.locator('[data-pc-slot]').first().waitFor();
  assert.equal(await dialog.getByRole('heading',{name:'Kevanwee’s PC'}).count(),1);
  const left=await dialog.locator('.pc-left').boundingBox(),right=await dialog.locator('.pc-box').boundingBox();assert.ok(left.x+left.width<right.x);
  // Boxes: the cursor lineup, the forest, one per Friend Area, then free-roaming residents.
  const boxes=await dialog.locator('.pc-group-name').evaluateAll(es=>es.map(e=>e.firstChild.textContent));
  assert.deepEqual(boxes.slice(0,2),['Cursor companion','Transform Forest']);assert.equal(boxes.at(-1),'Free roaming');assert.ok(boxes.length>=5,boxes.join(', '));
  // One icon set at one integer scale.
  const icons=await dialog.locator('.pc-slots img').evaluateAll(es=>es.map(e=>({w:e.naturalWidth,h:e.naturalHeight,zoom:getComputedStyle(e).zoom})));
  assert.ok(icons.length===30&&icons.every(i=>i.w<=40&&i.h<=30&&i.zoom==='2'),JSON.stringify(icons.slice(0,3)));
  await dialog.screenshot({path:'artifacts/pc-desktop.png'});
  assert.ok(await dialog.locator('.pc-groups').evaluate(e=>e.scrollWidth<=e.clientWidth));
  assert.notEqual(await dialog.evaluate(e=>getComputedStyle(e).cursor),'none');
  assert.notEqual(await pc.evaluate(e=>getComputedStyle(e).cursor),'none');
  const backup=await page.evaluate(()=>localStorage.getItem('portfolio.pokemon-pc.defaults'));assert.ok(backup);
  await dialog.getByRole('button',{name:/^Transform Forest/}).click();await dialog.getByRole('button',{name:'Transform Forest, Eevee',exact:true}).click();
  assert.equal(await dialog.getByRole('checkbox',{name:'Usable here'}).count(),0);
  await dialog.getByRole('textbox',{name:'Find a Pokémon'}).fill('Squirtle');await dialog.getByRole('button',{name:'Find',exact:true}).click();
  await dialog.locator('[data-pc-slot="squirtle"]').click();await dialog.getByRole('button',{name:'Normal',exact:true}).click();await dialog.getByText('Squirtle is ready.',{exact:true}).waitFor();
  // A Friend Area's natives take any species with Friend Area sheets.
  await dialog.getByRole('button',{name:/^Mushroom Forest/}).click();await dialog.getByRole('button',{name:'Mushroom Forest, Paras',exact:true}).click();
  await dialog.getByRole('textbox',{name:'Find a Pokémon'}).fill('Jirachi');await dialog.getByRole('button',{name:'Find',exact:true}).click();
  await dialog.locator('[data-pc-slot="jirachi"]').click();await dialog.getByRole('button',{name:'Normal',exact:true}).click();await dialog.getByText('Jirachi is ready.',{exact:true}).waitFor();
  await dialog.locator('.pc-searchbar input:not([type=checkbox])').fill('Charmander');await dialog.getByRole('button',{name:'Find',exact:true}).click();
  await dialog.locator('[data-pc-slot="charmander"]').click();await dialog.getByRole('button',{name:'Shiny',exact:true}).click();
  await dialog.getByText('Charmander (Shiny) is ready.',{exact:true}).waitFor();
  await dialog.screenshot({path:'artifacts/pc-imported-form.png'});
  await page.keyboard.press('Escape');await page.reload({waitUntil:'domcontentloaded'});await pc.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-forest-pokemon]')?.dataset.forestPokemon==='squirtle');
  await page.getByRole('button',{name:'Next Friend Area'}).first().click();
  await page.getByRole('img',{name:/^Mushroom Forest\. Residents: Charmander Shiny/}).waitFor();
  await page.getByRole('img',{name:/^Mushroom Forest\. Residents: Charmander Shiny/}).screenshot({path:'artifacts/pc-mushroom-shiny.png'});
  await page.getByRole('button',{name:'Previous Friend Area'}).first().click();
  // Expanded and normal maps share the choice; closing one does not drop its team slot.
  await page.getByRole('button',{name:'Explore Friend Areas',exact:true}).click();
  const expanded=page.getByRole('dialog',{name:'Friend Areas',exact:true});
  await expanded.getByRole('button',{name:'Open Pokémon PC',exact:true}).click();
  await dialog.getByRole('button',{name:'Restore defaults'}).click();
  await page.keyboard.press('Escape');await expanded.getByRole('button',{name:'Close Friend Areas',exact:true}).click();
  assert.deepEqual(await page.locator('[data-forest-pokemon]').evaluateAll(es=>es.map(e=>e.dataset.forestPokemon)),originals);
  await pc.click();await dialog.getByRole('button',{name:/^Transform Forest/}).click();
  assert.equal(await dialog.locator('.pc-members .pc-member').count(),6,'the forest box is listed once');
  assert.equal(await page.evaluate(()=>localStorage.getItem('portfolio.pokemon-pc.defaults')),backup);
  await dialog.getByRole('button',{name:/^Cursor companion/}).click();await dialog.locator('.pc-members .pc-member').first().click();
  await dialog.getByRole('textbox',{name:'Find a Pokémon'}).fill('Iron Valiant');await dialog.getByRole('button',{name:'Find',exact:true}).click();
  await dialog.locator('[data-pc-slot="ironvaliant"]').click();await dialog.getByRole('button',{name:'Normal',exact:true}).click();await dialog.getByText('Iron Valiant is ready.',{exact:true}).waitFor();
  await dialog.getByRole('button',{name:'Restore defaults'}).click();
  await page.setViewportSize({width:320,height:850});assert.ok(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth));
  await page.screenshot({path:'artifacts/pc-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PC browser checks passed: boxes, uniform icons, forest and Friend Area places, reload, expanded map, cursor alias and mobile.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
