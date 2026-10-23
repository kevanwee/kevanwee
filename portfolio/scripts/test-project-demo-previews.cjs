const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch();
  const report = {
    previews: [],
    spriteFramesChanged: 0,
    spriteSheetsLoaded: 0,
    errors: [],
  };
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:8815", {
    waitUntil: "networkidle",
  });
  const ids = ["legalquants", "bart", "sal-citation-generator"];
  for (const id of ids) {
    const card = page.locator(`[data-overworld-surface="project-${id}"]`);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await card.hover();
    const tip = page.locator(".project-preview");
    await tip.waitFor();
    const video = tip.locator("video");
    await video.waitFor();
    await page.waitForFunction(() => {
      let v = document.querySelector(".project-preview video");
      return v && v.readyState >= 2 && v.currentTime > 0.5;
    });
    const meta = await video.evaluate((v) => ({
      src: v.getAttribute("src"),
      width: v.videoWidth,
      height: v.videoHeight,
      duration: v.duration,
      muted: v.muted,
      time: v.currentTime,
    }));
    assert.equal(meta.width, 1920);
    assert.equal(meta.height, 1080);
    assert.equal(meta.muted, true);
    const a = await video.evaluate((v) => v.currentTime);
    await page.waitForTimeout(250);
    assert.ok((await video.evaluate((v) => v.currentTime)) > a);
    const box = await tip.boundingBox();
    assert.ok(
      box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= 1441 &&
        box.y + box.height <= 1001,
    );
    if (process.env.CAPTURE_DEMOS)
      await page.screenshot({ path: `artifacts/demo-${id}.png` });
    report.previews.push({ id, ...meta });
    await page.keyboard.press("Escape");
    assert.equal(await tip.count(), 0);
    await page.mouse.move(0, 0);
  }
  // Sprite frames must advance using loaded native sheets, without missing assets.
  await page
    .locator('[data-overworld-surface="project-bart"]')
    .scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
  const before = await page
    .locator(".overworld-resident")
    .evaluateAll((nodes) =>
      nodes
        .map((e) => ({
          key: e.dataset.surface + "|" + e.dataset.pokemon,
          frame: e.dataset.frame,
          bg: e.querySelector(".overworld-sprite")?.style.backgroundImage,
        }))
        .filter((x) => x.bg),
    );
  await page.waitForTimeout(370);
  const after = await page
    .locator(".overworld-resident")
    .evaluateAll((nodes) =>
      nodes.map((e) => ({
        key: e.dataset.surface + "|" + e.dataset.pokemon,
        frame: e.dataset.frame,
      })),
    );
  report.spriteFramesChanged = before.filter((x) =>
    after.some((y) => x.key === y.key && x.frame !== y.frame),
  ).length;
  assert.ok(report.spriteFramesChanged > 0, "native sprite frames advance");
  const sheets = [
    ...new Set(
      before
        .map((x) => x.bg.match(/url\(["']?(.*?)["']?\)/)?.[1])
        .filter(Boolean),
    ),
  ];
  for (const src of sheets.slice(0, 12)) {
    assert.ok(
      await page.evaluate(
        (src) =>
          new Promise((resolve) => {
            const i = new Image();
            i.onload = () => resolve(i.naturalWidth > 0);
            i.onerror = () => resolve(false);
            i.src = src;
          }),
        src,
      ),
      "sprite sheet loads",
    );
    report.spriteSheetsLoaded++;
  }
  await context.close();
  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const mobile = await reduced.newPage();
  mobile.on("pageerror", (e) => report.errors.push(e.message));
  await mobile.goto(process.env.BASE_URL || "http://127.0.0.1:8815", {
    waitUntil: "networkidle",
  });
  const card = mobile.locator('[data-overworld-surface="project-legalquants"]');
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await mobile.locator(".project-preview img").waitFor();
  assert.equal(await mobile.locator(".project-preview video").count(), 0);
  assert.ok(
    await mobile
      .locator(".project-preview img")
      .evaluate((i) => i.complete && i.naturalWidth > 0),
  );
  assert.ok(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await mobile.keyboard.press("Escape");
  await card.dispatchEvent("pointerenter", { pointerType: "touch" });
  await mobile.waitForTimeout(350);
  assert.equal(await mobile.locator(".project-preview").count(), 0);
  report.reducedMotionPoster = true;
  report.touchDoesNotHover = true;
  assert.deepEqual(report.errors, []);
  if (process.env.DEMO_REPORT)
    fs.writeFileSync(process.env.DEMO_REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
