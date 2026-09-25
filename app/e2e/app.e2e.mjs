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

/** Largest channel delta (0-255) and pixels above 3/255 between two PNGs, decoded in the page. */
const pixelDiff = (page, a, b) => page.evaluate(async ([a64, b64]) => {
  const decode = async data => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
  };
  const [x, y] = await Promise.all([decode(a64), decode(b64)]);
  let visible = 0, maxDelta = 0;
  for (let i = 0; i < x.length; i += 4) {
    const delta = Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2]));
    maxDelta = Math.max(maxDelta, delta);
    if (delta > 3) visible++;
  }
  return { visible, maxDelta };
}, [a.toString('base64'), b.toString('base64')]);

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
  await page.waitForSelector('[data-testid=player-module][data-ready=yes]');
  await page.waitForTimeout(800);
  // Edit mode: every value change becomes a keyframe on the preview clock.
  await page.fill('[data-testid=prop-xp]', '3400');
  await page.press('[data-testid=prop-xp]', 'Enter');
  await page.waitForTimeout(1300);
  const xpShown = await page.getAttribute('[data-testid=player-module]', 'data-xp');
  await page.click('[data-testid=prop-state-compact]');
  await page.waitForTimeout(700);
  const foldedPhase = await page.getAttribute('[data-testid=player-module]', 'data-phase');
  await page.click('[data-testid=prop-hover]');
  await page.waitForTimeout(400);
  const hoverPhase = await page.getAttribute('[data-testid=player-module]', 'data-phase');
  const log = await page.$$eval('[data-testid=prop-log] li', items => items.map(item => item.textContent));
  check('EDIT: XP, layout and the hover flag animate the PLAYER and record keyframes', xpShown === '3400' && foldedPhase === 'compact' && hoverPhase === 'compact+hover' && log.length === 3, `xp ${xpShown} · ${foldedPhase} · ${hoverPhase} · ${log.join(' | ')}`);
  await page.click('[data-testid=player-mode-states]');
  await page.waitForSelector('[data-testid=player-module][data-ready=yes]');
  await page.waitForTimeout(600);
  const summary = await page.getAttribute('[data-testid=player-module]', 'data-phases');
  check('ALL STATES summarises layouts and flags', summary === 'compact,open,pinned,compact+hover,open+hover,open+disabled', summary);
  fs.writeFileSync(path.join(outDir, 'app-player-states.png'), await page.locator('[data-testid=player-preview]').screenshot());
  fs.writeFileSync(path.join(outDir, 'app-player-edit.png'), await page.screenshot());

  const phaseAt = async ms => { await page.evaluate(value => window.__kgPlayer.seek(value), ms); await page.waitForTimeout(120); return page.getAttribute('[data-testid=player-module]', 'data-phase'); };
  await phaseAt(100);
  await page.waitForSelector('[data-testid=player-module][data-ready=yes]');
  await page.waitForTimeout(300);
  const phases = [await phaseAt(100), await phaseAt(500), await phaseAt(2000), await phaseAt(4900), await phaseAt(5500), await phaseAt(8200), await phaseAt(8800)];
  check('PLAYER module follows its script at any instant', phases.join(',') === 'hidden,enter,open,compact,compact+hover,exit,hidden', phases.join(', '));
  const shot = () => page.locator('[data-testid=player-preview]').screenshot();
  const same = async ms => {
    await phaseAt(ms);
    const first = await shot();
    await phaseAt(6000);
    await phaseAt(ms);
    const diff = await pixelDiff(page, first, await shot());
    return { first, diff };
  };
  const calm = await same(3100);
  const glitching = await same(2760);
  // WebGL output: the same instant must give the same pixels, glitch included (a level or two of blur rounding allowed).
  check('seeking back to the same instant draws the same PLAYER frame, glitch included', calm.diff.visible <= 100 && glitching.diff.visible <= 100 && calm.diff.maxDelta <= 32 && glitching.diff.maxDelta <= 32, `calm ${calm.diff.visible}px/${calm.diff.maxDelta} · glitch ${glitching.diff.visible}px/${glitching.diff.maxDelta}`);
  fs.writeFileSync(path.join(outDir, 'app-player.png'), glitching.first);
  // GEAR RADIAL: a selection turns the ring step by step and lands on the item.
  await page.click('[data-testid=catalog-item-gear]');
  await page.waitForSelector('[data-testid=player-module][data-ready=yes]');
  await page.waitForTimeout(1500);
  await page.click('[data-testid=prop-jump]');
  await page.waitForTimeout(1200);
  const landed = await page.getAttribute('[data-testid=player-module]', 'data-xp');
  fs.writeFileSync(path.join(outDir, 'app-gear.png'), await page.screenshot());
  // DEMO keys a jump of three sectors at 3.3 s: scrubbing shows each step (2, 3, then 4).
  const selectedAt = async ms => { await page.evaluate(value => window.__kgPlayer.seek(value), ms); await page.waitForTimeout(150); return page.getAttribute('[data-testid=player-module]', 'data-xp'); };
  await selectedAt(3000);
  await page.waitForSelector('[data-testid=player-module][data-ready=yes]');
  await page.waitForTimeout(300);
  const steps = [await selectedAt(3300 + 100), await selectedAt(3300 + 350), await selectedAt(4200)];
  check('GEAR RADIAL turns step by step to the selected item', landed === '3' && steps.join(',') === '2,3,4', `edit landed ${landed} · demo steps ${steps.join(', ')}`);
  await page.click('[data-testid=player-mode-states]');
  await page.waitForSelector('[data-testid=player-module][data-ready=yes]');
  await page.waitForTimeout(600);
  const gearStates = await page.getAttribute('[data-testid=player-module]', 'data-phases');
  fs.writeFileSync(path.join(outDir, 'app-gear-states.png'), await page.locator('[data-testid=player-preview]').screenshot());
  check('GEAR RADIAL has the same states as every rail module', gearStates === 'compact,open,pinned,compact+hover,open+hover,open+disabled', gearStates);

  // HUD KIT: theme changes restyle every element; motion and pieces render.
  await page.click('[data-testid=catalog-section-kit]');
  await page.waitForSelector('[data-testid=kit-theme-view] [data-testid=player-module][data-ready=yes]');
  await page.waitForTimeout(700);
  const themeView = page.locator('[data-testid=kit-theme-view]');
  const before = await themeView.screenshot();
  await page.fill('[data-testid=theme-bar-stamina-to]', '#ff00ff');
  await page.fill('[data-testid=theme-red]', '#00ff66');
  await page.waitForTimeout(900);
  const after = await themeView.screenshot();
  const themeDiff = await pixelDiff(page, before, after);
  fs.writeFileSync(path.join(outDir, 'app-kit-theme.png'), await page.screenshot());
  check('changing the theme restyles the HUD elements', themeDiff.visible > 400, `${themeDiff.visible} pixels changed`);
  await page.click('[data-testid=kit-reset]');
  await page.click('[data-testid=catalog-item-motion]');
  await page.waitForSelector('[data-testid=kit-motion-view] [data-testid=player-module][data-ready=yes]');
  await page.click('[data-testid=kit-plus]');
  await page.waitForTimeout(1200);
  const sampleValue = await page.getAttribute('[data-testid=kit-motion-view] [data-testid=player-module]', 'data-xp');
  fs.writeFileSync(path.join(outDir, 'app-kit-motion.png'), await page.screenshot());
  await page.click('[data-testid=catalog-item-pieces]');
  await page.waitForSelector('[data-testid=kit-pieces-view] [data-testid=player-module][data-ready=yes]');
  await page.waitForTimeout(600);
  fs.writeFileSync(path.join(outDir, 'app-kit-pieces.png'), await page.screenshot());
  check('HUD KIT motion sample reacts to a value key and PIECES render', sampleValue === '87', `sample value ${sampleValue}`);

  await page.click('[data-testid=catalog-section-system]');
  await page.waitForSelector('[data-testid=specimen-idle]');
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
