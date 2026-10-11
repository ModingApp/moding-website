// Run on the review Mac: MODING_PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node test/browser-navigation.mjs
// MODING_QA_URL optionally checks a deployed site; otherwise serve this checkout on an ephemeral local port.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium, webkit } = await import(process.env.MODING_PLAYWRIGHT_MODULE || 'playwright');
const repo = fileURLToPath(new URL('../', import.meta.url));
const report = { layouts: [], navigation: [], links: [], errors: [], mutations: [] };
const output = process.env.MODING_QA_OUTPUT;
if (output) await fs.mkdir(output, { recursive: true });
const types = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', svg: 'image/svg+xml', pdf: 'application/pdf' };
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(repo, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(repo)) { res.writeHead(403); return res.end(); }
  try { const body = await fs.readFile(file); res.writeHead(200, { 'Content-Type': types[file.split('.').pop()] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = process.env.MODING_QA_URL || `http://127.0.0.1:${server.address().port}`;
const route = name => `${base}/${name}.html`;
const marketing = ['index', 'about', 'brand', 'services', 'alliance', 'faq'];
const allPages = [...marketing, 'download', 'notice', 'location', 'terms', 'privacy'];
const sizes = [[1440, 900], [1280, 720], [390, 844], [320, 720], [840, 960], [960, 540]];
const settle = page => page.waitForTimeout(850);
async function setup(context) {
  // These checks must not send messages, create guest sessions or contaminate traffic analytics.
  await context.route('**/*', async r => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(r.request().method())) {
      if (r.request().url().includes('consultation')) report.mutations.push(r.request().url());
      return r.abort();
    }
    return r.continue();
  });
  context.on('page', p => p.on('pageerror', e => report.errors.push(String(e))));
}
async function rootState(page) {
  return page.evaluate(() => {
    const root = document.getElementById('snapRoot'), box = root.getBoundingClientRect();
    const sections = [...root.querySelectorAll(':scope > .scene')].map(s => {
      const b = s.getBoundingClientRect(); return { id: s.id, top: b.top - box.top + root.scrollTop, height: b.height };
    });
    return { top: root.scrollTop, height: root.clientHeight, max: root.scrollHeight - root.clientHeight, sections, snap: getComputedStyle(root).scrollSnapType };
  });
}
async function syntheticSwipe(page, selector, x, y, endX, endY) {
  await page.locator(selector).evaluate((target, p) => {
    for (const [type, points, changed] of [['touchstart', [{ clientX: p.x, clientY: p.y }], []], ['touchend', [], [{ clientX: p.endX, clientY: p.endY }]]]) {
      const event = new Event(type, { bubbles: true });
      Object.defineProperties(event, { touches: { value: points }, changedTouches: { value: changed } }); target.dispatchEvent(event);
    }
  }, { x, y, endX, endY });
}
try {
  for (const [engine, launcher] of [['chrome', chromium], ['webkit', webkit]]) {
    const browser = await launcher.launch(engine === 'chrome' ? { channel: 'chrome', headless: true } : { headless: true });
    try {
      for (const [width, height] of sizes) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference' });
        await setup(context); const page = await context.newPage();
        for (const name of allPages) {
          const response = await page.goto(route(name), { waitUntil: 'networkidle' });
          assert.equal(response.status(), 200, name);
          const visible = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            broken: [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
            side: [...document.querySelectorAll('.site-side-nav')].map(a => ({ visible: !!a.getClientRects().length, box: a.getBoundingClientRect().toJSON() })),
            chat: document.querySelector('.preview-inquiry')?.getBoundingClientRect().toJSON()
          }));
          assert.equal(visible.overflow, false, `${engine}/${name}/${width} overflow`);
          assert.deepEqual(visible.broken, [], `${name} broken images`);
          for (const a of visible.side) {
            assert(a.visible, `${name} hidden page arrow`);
            assert(a.box.width >= 44 && a.box.height >= 44, 'touch target');
            const c = visible.chat, b = a.box;
            assert(!c || b.right <= c.left || b.left >= c.right || b.bottom <= c.top || b.top >= c.bottom, 'arrow overlaps support');
          }
          if (marketing.includes(name)) {
            const before = await rootState(page);
            assert.equal(before.snap, 'y mandatory', `${name} snap disabled`);
            await page.mouse.move(width / 2, Math.min(height - 140, 400));
            await page.mouse.wheel(0, before.height * .85); await settle(page);
            const after = await rootState(page);
            assert(after.top > 1, `${engine}/${name}/${width} did not scroll`);
            const withinTall = after.sections.some(s => s.height > after.height + 2 && after.top >= s.top && after.top <= s.top + s.height - after.height);
            assert(withinTall || after.sections.some(s => Math.abs(s.top - after.top) <= 2) || Math.abs(after.top - after.max) <= 2, `${name} stopped between screens: ${after.top}`);
            const next = page.locator('[data-next],[data-scroll-target]').filter({ visible: true }).first();
            if (await next.count()) {
              await page.evaluate(() => document.getElementById('snapRoot').scrollTo({ top: 0, behavior: 'instant' }));
              await settle(page);
              const target = await next.getAttribute('data-next') || await next.getAttribute('data-scroll-target');
              await next.evaluate(n => n.scrollIntoView({block:'nearest',behavior:'instant'})); await page.waitForTimeout(100); const hit = await next.boundingBox(); assert(hit); await page.mouse.click(hit.x + hit.width / 2, hit.y + hit.height / 2); await settle(page);
              const state = await rootState(page), dest = state.sections.find(s => s.id === target);
              if (!await next.getAttribute('data-faq-focus')) assert(Math.abs(state.top - Math.min(dest.top, state.max)) <= 2, `${name} next arrow missed scene`);
            }
          }
          if (engine === 'chrome' && width === 1440) {
            const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => ({ href: a.getAttribute('href'), action: a.hasAttribute('data-chat') })));
            for (const link of links) {
              const dest = new URL(link.href, route(name));
              if (dest.origin === new URL(base).origin && !link.action) {
                const response = await context.request.get(dest.href.split('#')[0]);
                assert.equal(response.status(), 200, `${name} broken link ${link.href}`);
                if (dest.hash) assert((await response.text()).includes('id="' + decodeURIComponent(dest.hash.slice(1)) + '"'), `${name} broken fragment ${link.href}`);
              }
              report.links.push({ page: name, ...link });
            }
          }
          report.layouts.push({ engine, name, width, height });
        }
        await context.close(); console.log(JSON.stringify({ checked: engine, width, pages: allPages.length }));
      }
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      await setup(context); const page = await context.newPage();
      const cdp = engine === 'chrome' ? await context.newCDPSession(page) : null;
      async function swipe(left) {
        const from = left ? 320 : 70, to = left ? 70 : 320;
        if (!cdp) return syntheticSwipe(page, '#snapRoot', from, 420, to, 422);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y: 420 }] });
        for (let n = 1; n <= 6; n++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from + (to - from) * n / 6, y: 422 }] }); await page.waitForTimeout(25); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      for (let i = 0; i < marketing.length; i++) {
        for (const direction of [-1, 1]) {
          if (!marketing[i + direction]) continue;
          await page.goto(route(marketing[i]));
          const targetURL = await page.locator(direction < 0 ? '.site-side-nav.prev' : '.site-side-nav:not(.prev)').getAttribute('href');
          await Promise.all([page.waitForURL(new URL(targetURL, base).href), swipe(direction === 1)]);
          report.navigation.push({ engine, from: marketing[i], to: marketing[i + direction], gesture: cdp ? 'browser touch input' : 'DOM touch event' });
          await page.goBack(); assert(new URL(page.url()).pathname.endsWith(marketing[i] + '.html'));
        }
      }
      await page.goto(route('index')); const scene = await page.evaluate(() => window.ModingHomepage.state().index);
      for (const [selector, points] of [['#snapRoot', [15, 420, 320, 422]], ['#snapRoot', [160, 600, 165, 300]], ['.app-cta-hero', [300, 420, 70, 420]]]) {
        await syntheticSwipe(page, selector, ...points); await page.waitForTimeout(100); assert(page.url().endsWith('index.html'));
      }
      await page.locator('#menuToggle').click(); assert(await page.locator('.site-side-nav').evaluate(a => a.inert));
      await syntheticSwipe(page, '#snapRoot', 320, 420, 70, 420); assert(page.url().endsWith('index.html'));
      await page.locator('#menuClose').click();
      await page.locator('.preview-inquiry').click(); assert(await page.locator('.site-side-nav').evaluate(a => a.inert));
      await syntheticSwipe(page, '#snapRoot', 320, 420, 70, 420); assert.equal(new URL(page.url()).pathname, '/index.html');
      await page.goBack(); await page.waitForFunction(() => document.querySelector('.preview-chat').hidden);
      assert.equal(await page.evaluate(() => window.ModingHomepage.state().index), scene);
      await page.setViewportSize({ width: 840, height: 960 }); assert.equal(await page.evaluate(() => window.ModingHomepage.state().index), scene);
      for (const selector of ['.site-side-nav', '.app-cta-hero']) {
        await page.goto(route('index')); const destination = await page.locator(selector).getAttribute('href');
        await page.locator(selector).click(); await page.waitForURL(new URL(destination, base).href);
      }
      await page.goto(route('faq'));
      for (const category of ['faq-products', 'faq-mdpick', 'faq-payment', 'faq-admission']) {
        await page.locator(`[data-faq-focus="${category}"]`).click(); await settle(page);
        assert.equal(await page.evaluate(() => document.activeElement.id), category);
        const box = await page.locator('#' + category).boundingBox(); assert(box.y >= 65 && box.y < 180, `${category} not in view`);
      }
      await page.goto(route('alliance')); await page.locator('[data-chat]').first().click();
      await page.waitForFunction(() => !document.querySelector('.preview-chat').hidden);
      await page.locator('[data-chat-close]').click(); await page.waitForFunction(() => document.querySelector('.preview-chat').hidden);
      assert.equal(new URL(page.url()).pathname, '/alliance.html');
      await page.goto(route('index')); let last = await page.evaluate(() => window.ModingHomepage.state().index);
      await Promise.all([page.waitForEvent('load'), page.locator('[data-refresh-home]').click()]);
      assert.notEqual(await page.evaluate(() => window.ModingHomepage.state().index), last);
      last = await page.evaluate(() => window.ModingHomepage.state().index);
      await page.mouse.move(200, 400); await Promise.all([page.waitForEvent('load'), page.mouse.wheel(0, -180)]);
      assert.notEqual(await page.evaluate(() => window.ModingHomepage.state().index), last);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('#snapRoot').evaluate(r => getComputedStyle(r).scrollBehavior), 'auto');
      await page.locator('[data-next="connection"]').click(); await settle(page);
      assert((await rootState(page)).top > 0);
      await context.close();
    } finally { await browser.close(); }
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.mutations, []);
  report.passed = true;
} catch (error) { report.passed = false; report.failure = error.stack; process.exitCode = 1; }
finally {
  await new Promise(resolve => server.close(resolve));
  if (output) await fs.writeFile(path.join(output, 'navigation.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, layouts: report.layouts.length, navigation: report.navigation.length, links: report.links.length }, null, 2));
}
