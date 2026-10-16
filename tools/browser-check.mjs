import http from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const repositoryRoot = process.cwd();
const root = path.join(repositoryRoot, 'dist');
const review = path.join(repositoryRoot, 'review');
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
async function saveSectionScreenshot(page, selector, file) {
  const section = page.locator(selector);
  for (const quality of [70, 55, 40, 28]) {
    await section.screenshot({ path: file, type: 'jpeg', quality });
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
    await check(width + 'px product photograph aspect ratios', async () => {
      const thumbnails = await page.locator('.gallery-thumb img').evaluateAll(images =>
        images.map(image => {
          const bounds = image.getBoundingClientRect();
          return { width: bounds.width, height: bounds.height, source: image.currentSrc };
        })
      );
      for (const image of thumbnails) {
        assert(Math.abs(image.width - image.height) <= 1, 'Thumbnail must be square: ' + JSON.stringify(image));
      }
      const storyImages = await page.locator('.photo-card img').evaluateAll(images =>
        images.map(image => {
          const bounds = image.getBoundingClientRect();
          return { width: bounds.width, height: bounds.height, source: image.currentSrc };
        })
      );
      for (const image of storyImages) {
        assert(Math.abs(image.width / image.height - 0.8) <= 0.01,
          'Editorial photograph must use a 4:5 frame: ' + JSON.stringify(image));
      }
      return { thumbnails, storyImages };
    });
    if (width === 390 || width === 1440) {
      await check(width + 'px section screenshots', async () => {
        for (const [selector, name] of [['.hero', 'hero'], ['#shop', 'shop'], ['.visual-story', 'story']]) {
          await closePromotions(page);
          const file = 'review/' + name + '-' + width + '.jpg';
          await saveSectionScreenshot(page, selector, file);
          result.screenshots.push(file);
        }
      });
    }
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
  const expectedBundles = {
    1: { subtotal: '$24.95', shipping: '$2.99', total: '$27.94' },
    2: { subtotal: '$42.42', shipping: 'Free', total: '$42.42' },
    3: { subtotal: '$56.14', shipping: 'Free', total: '$56.14' }
  };
  for (let quantity = 1; quantity <= 12; quantity++) {
    const { context, page } = await contextPage(390, 'bundle-' + quantity);
    await check(quantity + '-shelf cart and correct Stripe checkout destination', async () => {
      const selected = Math.min(quantity, 3);
      const expected = expectedBundles[quantity];
      await page.locator('.bundle[data-qty="' + selected + '"]').click();
      if (expected) assert.equal(await page.locator('#buttonPrice').textContent(), expected.subtotal);
      await page.locator('#addToCart').click();
      assert(await page.locator('#cartDrawer').isVisible());
      for (let count = selected; count < quantity; count++) await page.locator('#plus').click();
      assert.equal((await page.locator('#cartQty').textContent()).trim(), String(quantity));
      if (expected) {
        assert.equal((await page.locator('#subtotal').textContent()).trim(), expected.subtotal);
        assert.equal((await page.locator('#shippingCost').textContent()).trim(), expected.shipping);
        assert.equal((await page.locator('#orderTotal').textContent()).trim(), expected.total);
      }
      assert(await page.locator('#checkoutButton').isEnabled());
      assert(await page.locator('#stripeCredit').isVisible());
      assert.match(await page.locator('#checkoutStatus').textContent(), /Stripe/);
      if (quantity < 3) {
        await page.waitForTimeout(750);
        assert(await page.locator('#offerModal').isVisible(), 'Optional post-add bundle offer should appear');
        await page.locator('#offerClose').click();
        assert(await page.locator('#cartDrawer').isVisible());
        assert.equal((await page.locator('#cartQty').textContent()).trim(), String(quantity));
      }
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
      await page.locator('#cartOpen').click();
      const expectedUrl = await page.evaluate(quantity => window.MAGNANEST_CHECKOUT.urls[quantity], quantity);
      const destination = new URL(expectedUrl);
      assert.equal(destination.protocol, 'https:');
      assert.equal(destination.hostname, 'buy.stripe.com');
      let interceptedUrl = null;
      await page.route('https://buy.stripe.com/**', async route => {
        interceptedUrl = route.request().url();
        await route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: '<!doctype html><title>Checkout navigation safely intercepted</title><p>Browser review only. No Stripe request or payment was made.</p>'
        });
      });
      await Promise.all([
        page.waitForURL(url => url.href === expectedUrl),
        page.locator('#checkoutButton').click()
      ]);
      assert.equal(page.url(), expectedUrl);
      assert.equal(interceptedUrl, expectedUrl);
      return { quantity, ...(expected || {}), checkoutEnabled: true, destination: expectedUrl, stripeNetworkIntercepted: true };
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
