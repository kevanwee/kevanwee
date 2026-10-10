const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const {mkdir} = require('node:fs/promises');
(async () => {
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await mkdir('artifacts',{recursive:true});
  await page.goto(process.env.BASE_URL||'http://localhost:3198');
  const pc=page.getByRole('button',{name:'Open Pokémon PC',exact:true});await pc.scrollIntoViewIfNeeded();
  await page.locator('[data-eevee-base]').screenshot({path:'artifacts/pc-map.png'});
  const originals=await page.locator('[data-forest-pokemon]').evaluateAll(es=>es.map(e=>e.dataset.forestPokemon));
  await pc.click();const dialog=page.getByRole('dialog',{name:'Pokémon storage system'});
  await dialog.locator('[data-pc-slot]').first().waitFor();
  const left=await dialog.locator('.pc-left').boundingBox(),right=await dialog.locator('.pc-box').boundingBox();assert.ok(left.x+left.width<right.x);
  await dialog.screenshot({path:'artifacts/pc-desktop.png'});
  const backup=await page.evaluate(()=>localStorage.getItem('portfolio.pokemon-pc.defaults'));assert.ok(backup);
  await dialog.getByRole('button',{name:/Forest place 1/}).click();
  await dialog.getByRole('textbox',{name:'Find a Pokémon'}).fill('Squirtle');await dialog.getByRole('button',{name:'Find',exact:true}).click();
  await dialog.getByRole('button',{name:'Choose',exact:true}).click();await dialog.getByText('Squirtle is ready.',{exact:true}).waitFor();
  await page.keyboard.press('Escape');await page.reload();await pc.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-forest-pokemon]')?.dataset.forestPokemon==='squirtle');
  // Expanded and normal maps share the choice; closing one does not drop its team slot.
  await page.getByRole('button',{name:'Explore Friend Areas',exact:true}).click();
  const expanded=page.getByRole('dialog',{name:'Friend Areas',exact:true});
  await expanded.getByRole('button',{name:'Open Pokémon PC',exact:true}).click();
  await dialog.getByRole('button',{name:'Restore defaults'}).click();
  await page.keyboard.press('Escape');await expanded.getByRole('button',{name:'Close Friend Areas',exact:true}).click();
  assert.deepEqual(await page.locator('[data-forest-pokemon]').evaluateAll(es=>es.map(e=>e.dataset.forestPokemon)),originals);
  await pc.click();assert.equal(await dialog.getByRole('button',{name:/Forest place 1/}).count(),1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('portfolio.pokemon-pc.defaults')),backup);
  await dialog.getByRole('button',{name:/Cursor companion/}).click();
  await dialog.getByRole('textbox',{name:'Find a Pokémon'}).fill('Iron Valiant');await dialog.getByRole('button',{name:'Find',exact:true}).click();
  await dialog.getByRole('button',{name:'Use cursor',exact:true}).click();await dialog.getByText('Iron Valiant is ready.',{exact:true}).waitFor();
  await dialog.getByRole('button',{name:'Restore defaults'}).click();
  await page.setViewportSize({width:320,height:850});assert.ok(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth));
  await page.screenshot({path:'artifacts/pc-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PC browser checks passed: cabinet, defaults, reload, expanded map, roster left, cursor alias and mobile.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
