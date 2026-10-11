// Actual browser regression checks for the visual audit; no production writes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium, webkit } = await import(process.env.MODING_PLAYWRIGHT_MODULE || 'playwright');
const repo = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = process.env.MODING_QA_OUTPUT;
if (output) await fs.mkdir(output, { recursive: true });
const report = { pages: [], scenes: [], heroes: [], issues: [], errors: [], mutations: [], screenshots: [] };
const types = { html: 'text/html', css: 'text/css', js: 'text/javascript', png: 'image/png', svg: 'image/svg+xml', pdf: 'application/pdf' };
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(repo, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(repo + path.sep)) { res.writeHead(403); return res.end(); }
  try { const data = await fs.readFile(file); res.writeHead(200, { 'Content-Type': types[file.split('.').pop()] || 'application/octet-stream' }); res.end(data); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const local = `http://127.0.0.1:${server.address().port}`;
const base = process.env.MODING_QA_URL || 'https://moding.app';
const pages = ['index', 'about', 'brand', 'services', 'alliance', 'faq', 'download', 'notice', 'location', 'terms', 'privacy'];
const sizes = JSON.parse(process.env.MODING_QA_SIZES || '[[1440,900],[1280,720],[390,844],[320,720],[840,960],[960,540]]');
const settle = p => p.waitForTimeout(120);
const check = (condition, label, detail) => { if (!condition) report.issues.push({ label, detail }); };
async function shot(page, name) {
  if (!output || !process.env.MODING_QA_SCREENSHOTS) return;
  await page.screenshot({ path: path.join(output, name + '.png') });
  report.screenshots.push(name + '.png');
}
try {
  for (const [engine, launcher] of [['chrome', chromium], ['webkit', webkit]].filter(([name]) => !process.env.MODING_QA_ENGINE || name === process.env.MODING_QA_ENGINE)) {
    const browser = await launcher.launch(engine === 'chrome' ? { channel: 'chrome', headless: true } : { headless: true });
    try {
      for (const [width, height] of sizes) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        await context.route('**/*', async r => {
          const req = r.request();
          if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
            if (req.url().includes('consultation')) report.mutations.push(req.url());
            return r.abort();
          }
          const url = new URL(req.url());
          if (!process.env.MODING_QA_URL && url.origin === new URL(base).origin) {
            return r.fulfill({ response: await context.request.get(local + url.pathname + url.search) });
          }
          return r.continue();
        });
        const page = await context.newPage();
        page.on('pageerror', e => report.errors.push(String(e)));
        for (const name of pages) {
          const key = `${engine}-${width}-${name}`;
          const response = await page.goto(`${base}/${name}.html`, { waitUntil: 'networkidle' });
          assert.equal(response.status(), 200);
          const initial = await page.evaluate(() => {
            const box = e => e.getBoundingClientRect().toJSON();
            const h = document.querySelector('.site-header'), logo = h.querySelector('.nav-logo'), toggle = h.querySelector('.menu-toggle');
            const inquiry = document.querySelector('.preview-inquiry'), image = inquiry.querySelector('img');
            return {
              navCount: document.querySelectorAll('header .nav').length,
              header: box(h), logo: box(logo), toggle: box(toggle),
              logoRendered: getComputedStyle(logo.querySelector('img')).height,
              closeColor: getComputedStyle(document.getElementById('menuClose')).color,
              inquiry: { ...box(inquiry), font: getComputedStyle(inquiry).fontSize, logo: box(image) },
              mainY: document.querySelector('main').getBoundingClientRect().top,
              overflow: document.documentElement.scrollWidth > innerWidth + 1
            };
          });
          check(initial.navCount === 1, key + '/one-header', initial.navCount);
          check(!initial.overflow, key + '/document-width');
          check(initial.logo.top >= 0 && initial.logo.bottom <= initial.header.bottom + 1, key + '/logo-contained');
          check(initial.mainY >= initial.header.bottom - 1, key + '/main-below-header', initial.mainY);
          check(initial.inquiry.font === '12px', key + '/inquiry-text', initial.inquiry);
          check(initial.inquiry.logo.width === (width <= 820 ? 24 : 26), key + '/inquiry-symbol', initial.inquiry);
          if (width <= 820) {
            check(initial.toggle.top >= 0 && initial.toggle.bottom <= initial.header.bottom + 1, key + '/menu-contained', initial.toggle);
            await page.locator('#menuToggle').click();
            const menu = await page.locator('#mobileMenuOverlay').evaluate(e => {
              const close = e.querySelector('#menuClose'), s = getComputedStyle(close), b = close.getBoundingClientRect();
              return { color: s.color, background: getComputedStyle(e).backgroundColor, w: b.width, h: b.height, links: [...e.querySelectorAll('.mobile-menu-links a')].map(a => a.getBoundingClientRect().height) };
            });
            check(menu.color !== menu.background, key + '/menu-close-contrast', menu);
            check(menu.w >= 44 && menu.h >= 44 && menu.links.every(h => h >= 44), key + '/menu-targets', menu);
            if (name === 'index') await shot(page, key + '-menu');
            await page.locator('#menuClose').click();
            check(await page.locator('#mobileMenuOverlay').getAttribute('aria-hidden') === 'true', key + '/menu-close');
          }
          const controls = await page.locator('[data-moding-role="action"],[data-moding-role="download"]').evaluateAll(es => es.map(e => ({
            text: e.textContent.trim(), role: e.dataset.modingRole, height: e.getBoundingClientRect().height, font: getComputedStyle(e).fontSize,
            visible: !!e.getClientRects().length
          })).filter(e => e.visible));
          for (const control of controls) {
            const min = control.role === 'download' ? (width <= 820 ? 62 : 66) : 54;
            check(control.height >= min - 1, key + '/action-size', control);
          }
          const scenes = page.locator('#snapRoot > .scene');
          for (let i = 0; i < await scenes.count(); i++) {
            await scenes.nth(i).evaluate(s => s.scrollIntoView({ block: 'start', behavior: 'instant' })); await settle(page);
            const bounds = await scenes.nth(i).evaluate(s => {
              const offenders = [];
              for (const e of s.querySelectorAll('.scene-copy,.service-copy,.contact-actions,.delivery-card,.name-block,.color-band')) {
                const b = e.getBoundingClientRect();
                if (b.width && (b.left < -1 || b.right > innerWidth + 1 || e.scrollWidth > e.clientWidth + 1)) offenders.push({ cls: e.className, left: b.left, right: b.right, scroll: e.scrollWidth, client: e.clientWidth });
              }
              return offenders;
            });
            check(!bounds.length, key + '/scene-' + i + '/contained', bounds);
            const footerCovered = await page.evaluate(() => {
              const footer = document.querySelector('footer'); if (!footer) return [];
              const controls = [...document.querySelectorAll('.preview-inquiry,.site-side-nav')].map(e => e.getBoundingClientRect());
              const hits = [], walker = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT); let node;
              while ((node = walker.nextNode())) {
                if (!node.textContent.trim()) continue;
                const range = document.createRange(); range.selectNodeContents(node);
                for (const b of range.getClientRects()) if (controls.some(c => c.width && c.left < b.right && c.right > b.left && c.top < b.bottom && c.bottom > b.top)) hits.push(node.textContent.trim());
              }
              return hits;
            });
            check(!footerCovered.length, key + '/scene-' + i + '/partial-footer-uncovered', footerCovered);
            report.scenes.push({ engine, width, name, scene: i });
            if ([390,1440].includes(width)) await shot(page, key + '-scene-' + i);
          }
          if (!await scenes.count() && [390,1440].includes(width)) await shot(page, key);
          if (await page.locator('footer').count()) {
            await page.locator('footer').first().evaluate(e => e.scrollIntoView({ block: 'end', behavior: 'instant' })); await settle(page);
            const footer = await page.locator('footer').first().evaluate(f => {
              const company = f.querySelector('.footer-company'), hits = [];
              const controls = [...document.querySelectorAll('.preview-inquiry,.site-side-nav')].map(e => e.getBoundingClientRect());
              const walker = document.createTreeWalker(f, NodeFilter.SHOW_TEXT); let n;
              while ((n = walker.nextNode())) {
                if (!n.textContent.trim()) continue;
                const range = document.createRange(); range.selectNodeContents(n);
                for (const b of range.getClientRects()) {
                  if (controls.some(c => c.width && c.left < b.right && c.right > b.left && c.top < b.bottom && c.bottom > b.top)) hits.push(n.textContent.trim());
                }
              }
              const companyBox = company?.getBoundingClientRect(), footerBox = f.getBoundingClientRect();
              return { font: company && getComputedStyle(company).fontSize, centerOffset: companyBox && Math.abs((companyBox.left + companyBox.right) / 2 - (footerBox.left + footerBox.right) / 2), bottom: footerBox.bottom, hits };
            });
            check(footer.font === '12px', key + '/footer-font', footer);
            check(footer.centerOffset <= 1, key + '/footer-centered', footer);
            check(footer.bottom <= height + 1, key + '/footer-reachable', footer);
            check(!footer.hits.length, key + '/footer-uncovered', footer.hits);
            if (['index','alliance','privacy'].includes(name) && [390,1440].includes(width)) await shot(page, key + '-footer');
          }
          report.pages.push({ engine, width, height, name, initial });
        }
        await page.goto(`${base}/index.html`);
        for (let i = 0; i < 7; i++) {
          await page.evaluate(i => { window.ModingHomepage.pause(true); window.ModingHomepage.select(i); window.ModingHomepage.progress(3500); }, i); await settle(page);
          const hero = await page.evaluate(() => {
            const names = ['.native-heading h1','.native-art','.native-description p','.app-cta-hero'];
            return names.map(selector => { const e = document.querySelector(selector), b = e.getBoundingClientRect(); return { selector, x: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, scroll: e.scrollWidth, client: e.clientWidth }; });
          });
          check(hero.every(b => b.x >= -1 && b.right <= width + 1 && b.scroll <= b.client + 1), `${engine}-${width}/hero-${i}/width`, hero);
          check(hero.every((b,j) => !j || b.top >= hero[j-1].bottom - 1), `${engine}-${width}/hero-${i}/order`, hero);
          report.heroes.push({ engine, width, scene: i });
        }
        await page.locator('.preview-inquiry').click();
        await page.getByRole('button', { name: '앱 이용 문의', exact: true }).click();
        const chat = await page.locator('.preview-chat button').evaluateAll(es => es.filter(e => e.getClientRects().length).map(e => ({ text: e.textContent, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height })));
        check(chat.every(b => b.w >= 44 && b.h >= 44), `${engine}-${width}/chat-targets`, chat);
        await page.locator('[data-chat-close]').click();
        await page.waitForFunction(() => document.querySelector('.preview-chat').hidden);
        await context.unrouteAll({ behavior: 'wait' }); await context.close();
        console.log(JSON.stringify({ checked: engine, width, issues: report.issues.length }));
      }
    } finally { await browser.close(); }
  }
  check(!report.errors.length, 'page-errors', report.errors);
  check(!report.mutations.length, 'consultation-writes', report.mutations);
  report.passed = !report.issues.length;
  if (!report.passed) process.exitCode = 1;
} catch (e) { report.passed = false; report.failure = e.stack; process.exitCode = 1; }
finally {
  await new Promise(resolve => server.close(resolve));
  if (output) await fs.writeFile(path.join(output, 'presentation.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, pages: report.pages.length, scenes: report.scenes.length, heroes: report.heroes.length, screenshots: report.screenshots.length }, null, 2));
}
