/**
 * Authoring app checks in real Chromium against the production build:
 *   npm run build && node e2e/app.e2e.mjs
 * Screenshots go to e2e/out/. Exit code 1 if a check fails.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(appDir, 'e2e', 'out');
fs.mkdirSync(outDir, { recursive: true });

const server = await preview({ root: appDir, logLevel: 'error', preview: { host: '127.0.0.1', port: 4183, strictPort: false } });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${name}${detail ? ' · ' + detail : ''}`);
};

async function open(viewport = { width: 1920, height: 1080 }, hash = '') {
  const page = await browser.newPage({ viewport });
  const problems = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('console', message => { if (message.type() === 'error') problems.push(message.text()); });
  await page.goto(url + hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => { const img = document.querySelector('[data-testid=backdrop-active]'); return img?.complete && img.naturalWidth > 0; });
  return { page, problems };
}
const state = (page, id) => page.getAttribute(`[data-testid=${id}]`, 'data-state');

// Main menu: look, selection with keyboard and mouse
{
  const { page, problems } = await open();
  await page.waitForTimeout(2600);
  fs.writeFileSync(path.join(outDir, 'app-menu.png'), await page.screenshot());
  const fonts = await page.evaluate(() => ({ michroma: document.fonts.check('48px Michroma'), rajdhani: document.fonts.check('700 27px Rajdhani') }));
  check('brand fonts loaded', fonts.michroma && fonts.rajdhani, JSON.stringify(fonts));
  check('EPISODES starts selected (red), the others idle (cyan)',
    (await state(page, 'menu-episodes')) === 'selected' && (await state(page, 'menu-configure-hud')) === 'idle' && (await state(page, 'menu-assets')) === 'idle');
  await page.keyboard.press('ArrowRight');
  check('arrow keys move the highlight', (await state(page, 'menu-configure-hud')) === 'selected' && (await state(page, 'menu-episodes')) === 'idle');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  check('QUIT GAME is part of the keyboard cycle', await page.$eval('[data-testid=menu-quit]', node => node.classList.contains('is-selected')));
  await page.keyboard.press('ArrowRight');
  check('the cycle wraps around', (await state(page, 'menu-episodes')) === 'selected');
  await page.hover('[data-testid=menu-assets]');
  check('mouse hover moves the same highlight', (await state(page, 'menu-assets')) === 'selected' && (await state(page, 'menu-episodes')) === 'idle');
  const box = await page.$eval('[data-testid=menu-assets]', node => node.getBoundingClientRect().toJSON());
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(250);
  const pressedScale = await page.$eval('[data-testid=menu-assets]', node => new DOMMatrix(getComputedStyle(node).transform).a);
  check('a pressed button shrinks slightly', pressedScale < 0.99, `scale ${pressedScale.toFixed(3)}`);

  // ASSETS → UI COMPONENTS catalog (release the press started above)
  await page.mouse.up();
  await page.waitForSelector('[data-testid=screen-assets]');
  await page.waitForTimeout(1400);
  fs.writeFileSync(path.join(outDir, 'app-assets.png'), await page.screenshot());
  const specimens = await page.$$eval('[data-testid^=specimen-]', nodes => nodes.map(node => `${node.dataset.state}${node.disabled ? ':disabled' : ''}`));
  check('catalog shows the button in every state', specimens.join(',') === 'idle,selected,pressed,disabled:disabled', specimens.join(', '));
  check('screen URL uses a plain anchor', (await page.evaluate(() => location.hash)) === '#assets');
  await page.click('[data-testid=screen-back]');
  await page.waitForSelector('[data-testid=main-menu]');
  check('BACK returns to the menu and clears the anchor', (await page.evaluate(() => location.hash)) === '');

  // Browser back button and Escape
  await page.click('[data-testid=menu-episodes]');
  await page.waitForSelector('[data-testid=screen-episodes]');
  await page.waitForTimeout(700);
  fs.writeFileSync(path.join(outDir, 'app-episodes.png'), await page.screenshot());
  await page.goBack();
  await page.waitForSelector('[data-testid=main-menu]');
  check('browser back returns to the menu', true);
  await page.click('[data-testid=menu-configure-hud]');
  await page.waitForSelector('[data-testid=screen-configure-hud]');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[data-testid=main-menu]');
  check('Escape leaves a screen', true);

  // QUIT GAME powers down; any key reboots
  await page.click('[data-testid=menu-quit]');
  await page.waitForSelector('[data-testid=system-offline]');
  await page.waitForTimeout(1100);
  fs.writeFileSync(path.join(outDir, 'app-offline.png'), await page.screenshot());
  const menuOpacity = await page.$eval('.kg-layer', node => Number(getComputedStyle(node).opacity));
  check('the menu disappears while the system is offline', menuOpacity < 0.05, `menu layer opacity ${menuOpacity}`);
  await page.keyboard.press('Space');
  await page.waitForSelector('[data-testid=system-offline]', { state: 'detached' });
  check('QUIT GAME shows SYSTEM OFFLINE and any key reboots', true);
  check('no console errors on the main path', problems.length === 0, problems.join(' | '));
  await page.close();
}

// Deep link straight into a screen
{
  const { page, problems } = await open({ width: 1920, height: 1080 }, '#configure-hud');
  check('a link to #configure-hud opens that screen', !!(await page.$('[data-testid=screen-configure-hud]')));
  check('no console errors on deep link', problems.length === 0, problems.join(' | '));
  await page.close();
}

// Scaling: the 16:9 stage fits any window without horizontal scroll
for (const viewport of [{ width: 1280, height: 720 }, { width: 1000, height: 1000 }, { width: 400, height: 860 }]) {
  const { page } = await open(viewport);
  const fit = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid=stage]').getBoundingClientRect();
    return { w: Math.round(stage.width), h: Math.round(stage.height), left: Math.round(stage.left), top: Math.round(stage.top), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  const expected = Math.min(viewport.width / 1920, viewport.height / 1080);
  const ok = Math.abs(fit.w - 1920 * expected) <= 1 && fit.left >= 0 && fit.top >= 0 && fit.overflow <= 0;
  check(`stage fits ${viewport.width}×${viewport.height}`, ok, JSON.stringify(fit));
  if (viewport.width === 400) fs.writeFileSync(path.join(outDir, 'app-phone.png'), await page.screenshot());
  await page.close();
}

fs.writeFileSync(path.join(outDir, 'app-results.json'), JSON.stringify({ date: new Date().toISOString(), browser: browser.version(), results }, null, 2));
await browser.close();
server.httpServer.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} app checks passed · Chromium ${browser.version()}`);
process.exit(failed ? 1 : 0);
