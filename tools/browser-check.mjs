import http from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = process.cwd();
const review = path.join(root, 'review');
await mkdir(review, { recursive: true });
const result = {
  testedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || null,
  checks: [],
  errors: [],
  screenshots: []
};
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.includes('\0')) throw new Error('Invalid path');
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, {
      'content-type': mime[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
let browser;
async function check(name, task) {
  try {
    const details = await task();
    result.checks.push({ name, passed: true, ...(details ? { details } : {}) });
  } catch (error) {
    const message = String(error.stack || error);
    result.checks.push({ name, passed: false, error: message });
    result.errors.push({ name, error: message });
  }
}
async function contextPage(width, name) {
  const context = await browser.newContext({
    viewport: { width, height: width < 700 ? 844 : 960 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.on('pageerror', error => result.errors.push({ name, error: String(error.stack || error) }));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173/assets/') && response.status() >= 400) {
      result.errors.push({ name, error: 'Asset HTTP ' + response.status() + ': ' + response.url() });
    }
  });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.locator('#addToCart').waitFor();
  return { context, page };
}
async function closePromotions(page) {
  for (const selector of ['#offerClose', '#promoClose']) {
    if (await page.locator(selector).isVisible()) await page.locator(selector).click();
  }
}
async function imageLoaded(page, selector) {
  await page.waitForFunction(selector => {
    const image = document.querySelector(selector);
    return image && image.complete && image.naturalWidth > 0;
  }, selector);
  return page.locator(selector).evaluate(image => ({
    source: image.currentSrc,
    width: image.naturalWidth,
    height: image.naturalHeight
  }));
}
async function saveScreenshot(page, file, fullPage) {
  for (const quality of [70, 55, 40, 28]) {
    await page.screenshot({ path: file, fullPage, type: 'jpeg', quality });
    if ((await stat(file)).size < 950000) break;
  }
}
async function scrollPage(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top < height; top += 650) {
    await page.evaluate(y => window.scrollTo(0, y), top);
    await page.waitForTimeout(30);
  }
  await page.waitForFunction(() => [...document.images].every(image =>
    !image.getClientRects().length || (image.complete && image.naturalWidth > 0)
  ));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
}
try {
  browser = await chromium.launch();
  for (const width of [320, 390, 701, 768, 1440]) {
    const { context, page } = await contextPage(width, 'viewport-' + width);
    await check(width + 'px responsive layout and images', async () => {
      await imageLoaded(page, '.hero-photo');
      await scrollPage(page);
      await closePromotions(page);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        overflowing: [...document.querySelectorAll('body *')].filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)
            && getComputedStyle(element).position !== 'fixed';
        }).slice(0, 12).map(element => ({
          tag: element.tagName,
          id: element.id,
          className: String(element.className),
          left: element.getBoundingClientRect().left,
          right: element.getBoundingClientRect().right
        }))
      }));
      const file = 'review/storefront-' + width + '.jpg';
      await saveScreenshot(page, file, true);
      result.screenshots.push(file);
      assert(dimensions.scroll <= dimensions.viewport + 1, JSON.stringify(dimensions));
      return dimensions;
    });
    await check(width + 'px product gallery and all five enlarged images', async () => {
      const thumbs = page.locator('.gallery-thumb');
      assert.equal(await thumbs.count(), 5);
      const images = [];
      for (let i = 0; i < 5; i++) {
        await closePromotions(page);
        const thumb = thumbs.nth(i);
        await thumb.click();
        await imageLoaded(page, '#productMain');
        assert.equal(await thumb.getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('.gallery-thumb[aria-pressed="true"]').count(), 1);
        assert.equal(await page.locator('#productMain').getAttribute('src'), await thumb.getAttribute('data-image'));
        assert.equal(await page.locator('#productMain').getAttribute('alt'), await thumb.getAttribute('data-alt'));
        await page.locator('#galleryZoom').click();
        assert(await page.locator('#imageZoom').isVisible());
        const image = await imageLoaded(page, '#zoomImage');
        assert(image.width >= 1000, 'Zoom should load the high-resolution photograph');
        images.push(image);
        await page.keyboard.press('Escape');
        assert(!(await page.locator('#imageZoom').isVisible()));
        assert(await page.locator('#galleryZoom').evaluate(element => element === document.activeElement));
      }
      return images;
    });
    await context.close();
  }
  for (const [quantity, expected] of [[1, '$24.95'], [2, '$42.42'], [3, '$56.14']]) {
    const { context, page } = await contextPage(390, 'bundle-' + quantity);
    await check(quantity + '-shelf bundle cart price and unavailable checkout', async () => {
      await page.locator('.bundle[data-qty="' + quantity + '"]').click();
      assert.equal(await page.locator('#buttonPrice').textContent(), expected);
      await page.locator('#addToCart').click();
      assert(await page.locator('#cartDrawer').isVisible());
      assert.equal((await page.locator('#subtotal').textContent()).trim(), expected);
      assert.equal((await page.locator('#cartQty').textContent()).trim(), String(quantity));
      assert(await page.locator('#checkoutButton').isDisabled());
      assert.match(await page.locator('#checkoutStatus').textContent(), /opens soon|being prepared|not available|unavailable/i);
      if (quantity === 2) {
        const file = 'review/cart-390.jpg';
        await saveScreenshot(page, file, false);
        result.screenshots.push(file);
      }
      await page.keyboard.press('Escape');
      assert(!(await page.locator('#cartDrawer').isVisible()));
      assert(await page.locator('#addToCart').evaluate(element => element === document.activeElement));
      await page.locator('#cartOpen').click();
      assert(await page.locator('#cartDrawer').isVisible());
      await page.locator('#cartClose').click();
      assert(!(await page.locator('#cartDrawer').isVisible()));
      assert(await page.locator('#cartOpen').evaluate(element => element === document.activeElement));
      return { quantity, subtotal: expected, checkoutDisabled: true };
    });
    await context.close();
  }
  {
    const { context, page } = await contextPage(390, 'browsing-promotion');
    await check('Browsing promotion remains dismissible', async () => {
      await page.locator('#promoToast').waitFor({ state: 'visible', timeout: 12000 });
      await page.locator('#promoClose').click();
      assert(!(await page.locator('#promoToast').isVisible()));
    });
    await context.close();
  }
} catch (error) {
  result.errors.push({ name: 'browser-run', error: String(error.stack || error) });
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  result.passed = result.errors.length === 0 && result.checks.every(item => item.passed);
  await writeFile(path.join(review, 'results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({
    passed: result.passed,
    checks: result.checks.map(({ name, passed }) => ({ name, passed })),
    errors: result.errors
  }, null, 2));
  if (!result.passed) process.exitCode = 1;
}
