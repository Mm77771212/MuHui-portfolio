const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

const baseUrl = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8767/';
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function verify(page, id, expectedDuration) {
  await page.locator(`[data-project="${id}"]`).click();
  const dialog = page.locator('#modal');
  await dialog.waitFor({ state: 'visible' });
  const video = dialog.locator('video');
  assert.equal(await video.count(), 1);
  await video.evaluate((element) => new Promise((resolve) => {
    if (element.readyState >= 1 || element.error) return resolve();
    element.addEventListener('loadedmetadata', resolve, { once: true });
    element.addEventListener('error', resolve, { once: true });
    element.load();
  }));
  const media = await video.evaluate((element) => ({
    width: element.videoWidth,
    height: element.videoHeight,
    duration: element.duration,
    error: element.error && element.error.message,
  }));
  assert.equal(media.error, null, JSON.stringify(media));
  assert(media.width > 0 && media.height > 0, JSON.stringify(media));
  assert(Math.abs(media.duration - expectedDuration) < 1, JSON.stringify(media));
  await video.evaluate(async (element) => {
    element.muted = true;
    await element.play();
  });
  await page.waitForTimeout(300);
  assert(await video.evaluate((element) => element.currentTime > 0));
  await page.locator('#close-project').click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await dialog.locator('video').count(), 0);
  return media;
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(edge) ? edge : undefined });
  try {
    const result = {};
    for (const [name, viewport] of [
      ['desktop', { width: 1440, height: 900 }],
      ['mobile', { width: 390, height: 844 }],
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: 'load' });
      result[name] = {
        temple: await verify(page, 'p12', 426.34),
        mote: await verify(page, 'p13', 664.14),
      };
      await context.close();
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
