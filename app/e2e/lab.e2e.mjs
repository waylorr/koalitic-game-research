/**
 * H0 disproof tests, run in real Chromium against the production build:
 *   npm run build && npm run e2e
 * Writes screenshots and results.json to e2e/out/. Exit code 1 if a check fails.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(appDir, 'e2e', 'out');
fs.mkdirSync(outDir, { recursive: true });

const server = await preview({ root: appDir, logLevel: 'error', preview: { host: '127.0.0.1', port: 4180, strictPort: false } });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${name} · ${detail}`);
};

async function openPage(media = './test-media/backdrop-girona.jpg') {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => check('no page errors', false, error.message));
  await page.goto(new URL('lab.html', url).href);
  await page.waitForFunction(() => window.__lab?.mediaReady());
  if (!media.endsWith('backdrop-girona.jpg')) {
    await page.evaluate(([u, kind]) => window.__lab.loadMedia(u, kind), [media, media.endsWith('.webm') ? 'video' : 'image']);
    await page.waitForFunction(() => window.__lab.mediaReady());
  }
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const stageShot = async page => (await page.$('[data-testid=hud-stage]')).screenshot();

/** Pixel difference between two PNGs, decoded in the browser: count and largest channel delta (0-255). */
async function pixelDiff(page, a, b) {
  if (a.equals(b)) return { differing: 0, visible: 0, maxDelta: 0 };
  return page.evaluate(async ([a64, b64]) => {
    const decode = async b64s => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64s}`)).blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    };
    const [x, y] = await Promise.all([decode(a64), decode(b64)]);
    if (x.width !== y.width || x.height !== y.height) return { differing: -1, visible: -1, maxDelta: 255 };
    let differing = 0, visible = 0, maxDelta = 0;
    for (let i = 0; i < x.data.length; i += 4) {
      const delta = Math.max(Math.abs(x.data[i] - y.data[i]), Math.abs(x.data[i + 1] - y.data[i + 1]), Math.abs(x.data[i + 2] - y.data[i + 2]));
      if (delta) { differing++; maxDelta = Math.max(maxDelta, delta); }
      if (delta > 3) visible++;
    }
    return { differing, visible, maxDelta };
  }, [a.toString('base64'), b.toString('base64')]);
}
const hudDom = page => page.evaluate(() => document.querySelector('[data-testid=hud-layer]').outerHTML);
/**
 * Same logical frame (identical HUD DOM) and perceptually identical pixels. Chromium's
 * rasterisation of backdrop blur and antialiased diagonals can move a few levels after
 * real-time playback; allow at most 100 pixels above 3/255 and nothing above 32/255.
 */
const sameLook = diff => diff.visible >= 0 && diff.visible <= 100 && diff.maxDelta <= 32;
const describe = (sameDom, diff) => `DOM ${sameDom ? 'identical' : 'DIFFERENT'} · ${diff.differing} pixels differ (${diff.visible} above 3/255), max delta ${diff.maxDelta}/255`;

// 1 · Determinism: jumping to t must give the same picture as arriving at t frame by frame.
{
  const interruption = doc => ({
    ...doc,
    tracks: {
      ...doc.tracks,
      'left-rail.state': [...doc.tracks['left-rail.state'], { id: 'k_int', t: 20_200, v: 'Open' }].sort((a, b) => a.t - b.t),
    },
  });
  const cases = [
    { t: 20_225, label: 'mid fold transition' },
    { t: 20_330, label: 'fold interrupted by open at 00:20.20', doc: interruption },
    { t: 30_110, label: 'mid radial selection' },
    { t: 24_300, label: 'notification entering' },
    { t: 45_200, label: 'pin transition' },
    { t: 75_000, label: 'folded, stamina 90' },
    { t: 95_300, label: 'opening, stamina ramp' },
  ];
  const direct = await openPage();
  const stepped = await openPage();
  for (const c of cases) {
    for (const page of [direct, stepped]) {
      await page.evaluate(apply => { if (apply) { const doc = window.__lab.doc(); window.__lab.setDoc(eval(`(${apply})`)(doc)); } }, c.doc ? c.doc.toString() : null);
    }
    await direct.evaluate(t => window.__lab.seek(t), c.t);
    await settle(direct);
    const a = await stageShot(direct);
    // Step through the preceding 1.5 s at 30 fps, rendering every frame.
    for (let t = c.t - 1500; t < c.t; t += 1000 / 30) {
      await stepped.evaluate(t => window.__lab.seek(t), Math.round(t));
      await settle(stepped);
    }
    await stepped.evaluate(t => window.__lab.seek(t), c.t);
    await settle(stepped);
    const b = await stageShot(stepped);
    const diff = await pixelDiff(direct, a, b);
    const sameDom = (await hudDom(direct)) === (await hudDom(stepped));
    check(`seek == step-through @${c.t} ms (${c.label})`, sameDom && sameLook(diff), describe(sameDom, diff));
    for (const page of [direct, stepped]) await page.evaluate(() => window.__lab.reset());
  }
  // Real playback path: play ~1.5 s, pause, then jump a fresh page to the same instant.
  for (const from of [19_500, 44_000, 94_000]) {
    await stepped.evaluate(() => window.__lab.reset());
    await stepped.evaluate(t => window.__lab.seek(t), from);
    await stepped.evaluate(() => window.__lab.play());
    await stepped.waitForTimeout(1500);
    await stepped.evaluate(() => window.__lab.pause());
    await settle(stepped);
    const t = await stepped.evaluate(() => window.__lab.time());
    const b = await stageShot(stepped);
    const fresh = await openPage();
    await fresh.evaluate(t => window.__lab.seek(t), t);
    await settle(fresh);
    const a = await stageShot(fresh);
    const diff = await pixelDiff(fresh, a, b);
    const sameDom = (await hudDom(fresh)) === (await hudDom(stepped));
    check(`real playback == direct seek @${t} ms`, sameDom && sameLook(diff), describe(sameDom, diff));
    await fresh.close();
  }
  await direct.close();
  await stepped.close();
}

// 2 · Hidden values keep evaluating; opening shows the value of that moment.
{
  const page = await openPage();
  await page.evaluate(() => window.__lab.seek(75_000));
  await settle(page);
  const folded = await page.evaluate(() => ({ state: window.__lab.frame().leftRail.state, stamina: window.__lab.frame().stamina.value, visible: !!document.querySelector('[data-testid=stamina-value]') }));
  check('stamina 90 at 01:15 while folded', folded.state === 'Folded' && folded.stamina === 90 && !folded.visible, JSON.stringify(folded));
  await page.click('[data-testid=rail-Open]');
  await page.evaluate(() => window.__lab.seek(75_000 + 450));
  await settle(page);
  const shown = await page.textContent('[data-testid=stamina-value]');
  check('opening the rail at 01:15 shows the current value', shown?.startsWith('90') ?? false, `displayed "${shown}" at 01:15.45 (ramp continues: ${await page.evaluate(() => window.__lab.frame().stamina.value.toFixed(2))})`);
  await page.close();
}

// 3 · Radial hit areas: clicks inside each sector select exactly that sector; gaps and centre select nothing.
{
  const page = await openPage();
  await page.evaluate(() => window.__lab.seek(5_000));
  await settle(page);
  const point = (radius, deg) => page.evaluate(([radius, deg]) => {
    const svg = document.querySelector('[data-testid=gear-radial]');
    const p = svg.createSVGPoint();
    p.x = 170 + radius * Math.cos((deg * Math.PI) / 180);
    p.y = 170 + radius * Math.sin((deg * Math.PI) / 180);
    const s = p.matrixTransform(svg.getScreenCTM());
    return { x: s.x, y: s.y };
  }, [radius, deg]);
  const selectionAt5s = () => page.evaluate(() => window.__lab.doc().tracks['gear-radial.selection'].find(k => k.t === 5000)?.v ?? null);
  let ok = true;
  const log = [];
  for (let k = 0; k < 5; k++) {
    const mid = -90 + k * 72;
    for (const [radius, deg] of [[116, mid], [79, mid - 31], [153, mid + 31]]) {
      const p = await point(radius, deg);
      await page.mouse.click(p.x, p.y);
      const got = await selectionAt5s();
      if (got !== k + 1) { ok = false; log.push(`sector ${k + 1} @(${radius},${deg}°) → ${got}`); }
    }
  }
  check('each click inside a sector (centre and near both edges) selects it', ok, ok ? '15/15 clicks' : log.join('; '));
  const before = await selectionAt5s();
  for (const [radius, deg] of [[116, -54], [0, 0], [40, 100]]) {
    const p = await point(radius, deg);
    await page.mouse.click(p.x, p.y);
  }
  check('clicks in the gap between sectors and in the centre select nothing', (await selectionAt5s()) === before, `selection stays ${before}`);
  await page.close();
}

// 4 · Performance of the render path while playing (container: CPU only, no GPU).
{
  const page = await openPage();
  await page.evaluate(() => { window.__lab.seek(64_000); window.__lab.resetStats(); window.__lab.play(); });
  await page.waitForTimeout(8000);
  await page.evaluate(() => window.__lab.pause());
  const s = await page.evaluate(() => window.__lab.stats());
  const fps = s.frameGapP50 ? 1000 / s.frameGapP50 : 0;
  check('HUD JS per frame (evaluate + React render) p95 < 8 ms while playing image background',
    s.renderP95 < 8,
    `evaluate p50 ${s.evaluateP50.toFixed(3)} / p95 ${s.evaluateP95.toFixed(3)} ms · render p50 ${s.renderP50.toFixed(2)} / p95 ${s.renderP95.toFixed(2)} / max ${s.renderMax.toFixed(1)} ms · ${s.renders} renders · UI ${fps.toFixed(0)} fps (p95 gap ${s.frameGapP95.toFixed(1)} ms, software rendering)`);
  fs.writeFileSync(path.join(outDir, 'perf-image.json'), JSON.stringify(s, null, 2));
  await page.close();
}

// 5 · Video as master clock (VP9 test video; this Chromium build has no H.264).
{
  const page = await openPage('./test-media/sync-counter-1080p30.webm');
  const codecs = await page.evaluate(() => { const v = document.createElement('video'); return { h264: v.canPlayType('video/mp4; codecs="avc1.640028"'), vp9: v.canPlayType('video/webm; codecs="vp9"') }; });
  await page.evaluate(() => { window.__lab.seek(2_000); window.__lab.resetStats(); });
  await page.waitForFunction(() => { const v = document.querySelector('video'); return v && !v.seeking && v.readyState >= 2; });
  await page.evaluate(() => window.__lab.play());
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.__lab.pause());
  await settle(page);
  const sync = await page.evaluate(() => ({ hud: window.__lab.time(), video: Math.round(document.querySelector('video').currentTime * 1000), duration: window.__lab.doc().durationMs, stats: window.__lab.stats() }));
  const drift = Math.abs(sync.hud - sync.video);
  check('HUD time follows the video clock (paused drift ≤ 1 frame)', drift <= 34 && sync.hud > 6_000,
    `hud ${sync.hud} ms · video ${sync.video} ms · drift ${drift} ms · timeline duration ${sync.duration} ms from metadata · dropped frames ${sync.stats.droppedVideoFrames}`);
  check('codec support reported honestly', true, `this Chromium: H.264 "${codecs.h264 || 'no'}", VP9 "${codecs.vp9 || 'no'}"`);
  await page.evaluate(() => window.__lab.seek(12_345));
  await page.waitForFunction(() => !document.querySelector('video').seeking);
  await settle(page);
  fs.writeFileSync(path.join(outDir, 'video-seek-12345.png'), await stageShot(page));
  await page.close();
}

// 6 · Reference screenshots for review.
{
  const page = await openPage();
  await page.setViewportSize({ width: 2400, height: 1500 });
  for (const [name, t] of [['open', 5_000], ['half-folded', 20_225], ['notification', 28_000], ['pinned-radial', 47_000], ['folded', 75_000], ['critical', 112_000]]) {
    await page.evaluate(t => window.__lab.seek(t), t);
    await settle(page);
    fs.writeFileSync(path.join(outDir, `stage-${name}.png`), await stageShot(page));
  }
  await page.close();
}

fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify({ date: new Date().toISOString(), browser: browser.version(), results }, null, 2));
await browser.close();
server.httpServer.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed · Chromium ${browser.version()}`);
process.exit(failed ? 1 : 0);
